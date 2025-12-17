// StoryModal.js
import { getCityofGeocode } from "../api_data/reverseGeocoding";
import Database from "../../../database/database";

export default class StoryModal {
  constructor() {
    this.currentModal = null;
    this.currentEscapeHandler = null;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async getLocationName(lat, lon) {
    if (lat == null || lon == null || typeof lat !== 'number' || typeof lon !== 'number') {
      return "Unknown Location";
    }    
    try {
      const cityName = await getCityofGeocode(lon, lat); // lon, lat (longitude dulu)
      return cityName;
    } catch (error) {
      console.error('Error getting location:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  async checkIfStorySaved(storyId) {
    try {
      const savedStory = await Database.getStoryById(storyId);
      return savedStory !== undefined;
    } catch (error) {
      console.error('Error checking saved story:', error);
      return false;
    }
  }

  async saveStory(story) {
    try {
      // Ensure offline availability: persist image as Blob (when possible)
      const storyToSave = { ...story };
      if (!storyToSave.photoBlob && storyToSave.photoUrl) {
        try {
          const res = await fetch(storyToSave.photoUrl, { cache: 'force-cache' });
          if (res.ok) {
            const blob = await res.blob();
            if (blob && blob.size > 0) {
              storyToSave.photoBlob = blob;
              storyToSave.photoMime = blob.type || null;
            }
          }
        } catch (e) {
          // Fallback: keep remote photoUrl only
          console.warn('Failed to cache story image for offline use:', e);
        }
      }

      await Database.putStory(storyToSave);
      return true;
    } catch (error) {
      console.error('Error saving story:', error);
      return false;
    }
  }

  async unsaveStory(storyId) {
    try {
      await Database.removeStory(storyId);
      return true;
    } catch (error) {
      console.error('Error removing story:', error);
      return false;
    }
  }

  async updateSaveButton(saveBtn, story) {
    const isSaved = await this.checkIfStorySaved(story.id);
    
    if (isSaved) {
      saveBtn.innerHTML = 'Hapus dari Tersimpan <i class="fas fa-bookmark"></i>';
      saveBtn.classList.remove('btn-transparent');
      saveBtn.classList.add('btn-success');
      saveBtn.dataset.saved = 'true';
    } else {
      saveBtn.innerHTML = 'Simpan Story <i class="far fa-bookmark"></i>';
      saveBtn.classList.remove('btn-success');
      saveBtn.classList.add('btn-transparent');
      saveBtn.dataset.saved = 'false';
    }
  }

  async show(story, mapInstance = null) {
    // Close existing modal if any
    this.close();

    // Validate story object
    if (!story || !story.id) {
      console.error('Story object must have an id property');
      return null;
    }

    // Get location name untuk modal
    let locationName = 'Loading location...';
    if (story.lat && story.lon) {
      try {
        locationName = await this.getLocationName(story.lat, story.lon);
      } catch (error) {
        locationName = `${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}`;
      }
    }

    // Create modal with CSS classes
    const modal = document.createElement('div');
    modal.className = 'story-modal-overlay';
    
    modal.innerHTML = `
      <div class="story-modal-content">
        <div class="story-modal-image-container">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-modal-image">
          <button class="story-modal-close-btn" type="button">×</button>
        </div>
        <div class="story-modal-body">
          <h2 class="story-modal-title">${story.name}</h2>
          <p class="story-modal-description">${story.description}</p>
          <div class="story-modal-divider">
            <div class="story-modal-meta">
              <span class="story-modal-meta-icon">📍</span>
              <span>${locationName}</span>
            </div>
            <div class="story-modal-meta">
              <span class="story-modal-meta-icon">🕒</span>
              <span>${this.formatDate(story.createdAt)}</span>
            </div>
            <button id="story-detail-save" class="btn btn-transparent" data-saved="false">
                Simpan Story <i class="far fa-bookmark"></i>
            </button>

            ${story.lat && story.lon && mapInstance ? `
              <div class="story-modal-actions">
                <button class="story-modal-btn story-modal-btn--primary" data-action="show-on-map" type="button">
                  Show on Map
                </button>
                <button class="story-modal-btn story-modal-btn--success" data-action="satellite-view" type="button">
                  Satellite View
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Store reference to current modal
    this.currentModal = modal;
    
    // Add event listeners
    await this.setupEventListeners(modal, story, mapInstance);
    
    // Add to DOM
    document.body.appendChild(modal);

    // Add fade-in animation
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
    });

    return modal;
  }

  async setupEventListeners(modal, story, mapInstance) {
    // Close button
    const closeBtn = modal.querySelector('.story-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Save/Unsave button
    const saveBtn = modal.querySelector('#story-detail-save');
    if (saveBtn) {
      // Update save button state based on current saved status
      await this.updateSaveButton(saveBtn, story);

      saveBtn.addEventListener('click', async () => {
        const isSaved = saveBtn.dataset.saved === 'true';
        
        // Disable button during operation
        saveBtn.disabled = true;
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = 'Loading... <i class="fas fa-spinner fa-spin"></i>';

        try {
          let success = false;
          
          if (isSaved) {
            // Unsave the story
            success = await this.unsaveStory(story.id);
            if (success) {
              this.showToast('Story berhasil dihapus dari tersimpan', 'success');
            } else {
              this.showToast('Gagal menghapus story dari tersimpan', 'error');
            }
          } else {
            // Save the story
            success = await this.saveStory(story);
            if (success) {
              this.showToast('Story berhasil disimpan', 'success');
            } else {
              this.showToast('Gagal menyimpan story', 'error');
            }
          }

          // Update button state
          if (success) {
            await this.updateSaveButton(saveBtn, story);
          } else {
            saveBtn.innerHTML = originalText;
          }
        } catch (error) {
          console.error('Error handling save/unsave:', error);
          this.showToast('Terjadi kesalahan', 'error');
          saveBtn.innerHTML = originalText;
        } finally {
          saveBtn.disabled = false;
        }
      });
    }

    // Action buttons
    const showOnMapBtn = modal.querySelector('[data-action="show-on-map"]');
    const satelliteBtn = modal.querySelector('[data-action="satellite-view"]');

    if (showOnMapBtn && mapInstance) {
      showOnMapBtn.addEventListener('click', () => {
        this.focusOnStory(story, mapInstance);
        this.close();
      });
    }

    if (satelliteBtn && mapInstance) {
      satelliteBtn.addEventListener('click', () => {
        mapInstance.switchToLayer('Satellite');
        this.focusOnStory(story, mapInstance);
        this.close();
      });
    }

    // Escape key handler
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEscapeKey);
      }
    };
    document.addEventListener('keydown', handleEscapeKey);

    // Store the escape handler for cleanup
    this.currentEscapeHandler = handleEscapeKey;
  }

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 4px;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  focusOnStory(story, mapInstance) {
    if (mapInstance && story.lat && story.lon) {
      mapInstance.changeCamera([story.lat, story.lon], 12);
    }
  }

  close() {
    if (this.currentModal) {
      // Add fade-out animation
      this.currentModal.style.opacity = '0';
      
      // Remove after animation
      setTimeout(() => {
        if (this.currentModal && this.currentModal.parentNode) {
          this.currentModal.parentNode.removeChild(this.currentModal);
        }
        this.currentModal = null;
      }, 300);

      // Clean up escape key listener
      if (this.currentEscapeHandler) {
        document.removeEventListener('keydown', this.currentEscapeHandler);
        this.currentEscapeHandler = null;
      }
    }
  }

  // Static method untuk quick access
  static async showStory(story, mapInstance = null) {
    const modal = new StoryModal();
    return await modal.show(story, mapInstance);
  }
}