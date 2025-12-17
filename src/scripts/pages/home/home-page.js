import { getStoryData } from "./api_data/story_data";
import "./home_design/card.css";
import "./home_design/story_modal.css";
import "./home_design/filter.css"; // Add filter styles
import { getCityofGeocode } from "./api_data/reverseGeocoding";
import StoryModal from "./component/storyModal";
import MapComponent from "./component/mapComponent";
import FilterComponent from "./component/filterComponent";
import { tokenService } from "../../utils/tokenService/tokenService";

export default class HomePage {
  constructor() {
    this.data = null;
    this.mapComponent = null;
    this.filterComponent = null;
    this.city = [];
    this.storyModal = new StoryModal();
    this.currentFilteredData = [];
    this.isProcessingFilter = false; // Prevent recursive filter calls
    this.locationCache = new Map(); // Cache locations to avoid duplicate API calls
    this.token = tokenService.getToken();
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

    // Use cache to avoid duplicate API calls
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }
    
    try {
      const cityName = await getCityofGeocode(lon, lat);
      
      // Cache the result
      this.locationCache.set(cacheKey, cityName);
      
      // Add to city list only if not already present
      if (!this.city.includes(cityName)) {
        this.city.push(cityName);
      }
      
      return cityName;
    } catch (error) {
      console.error('Error getting location:', error);
      const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      
      // Cache the fallback too
      this.locationCache.set(cacheKey, fallback);
      
      return fallback;
    }
  }

  createStoryCard(story, locationName = 'Loading...') {
    return `
      <div class="story-card" data-story-id="${story.id || ''}" data-lat="${story.lat}" data-lon="${story.lon}" data-location-loading="true">
        <div class="card-image">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy">
          <div class="card-overlay">
            <span class="location">📍 ${locationName}</span>
          </div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${story.name}</h3>
          <p class="card-description">${story.description}</p>
          <div class="card-meta">
            <span class="card-date">🕒 ${this.formatDate(story.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  }

  async initializeMap() {
    try {
      console.log('Initializing map...');
      
      // Create map component instance
      this.mapComponent = new MapComponent('#map');
      
      // Initialize map with custom options
      await this.mapComponent.initialize({
        center: [-6.2, 106.816666],
        zoom: 6,
        locate: false,
        defaultLayer: 'openstreetmap',
        showLayerControl: true,
        customLayers: [
          {
            name: 'Custom Terrain',
            url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
            attribution: '&copy; Stamen Design, &copy; OpenStreetMap',
            subdomains: 'abcd'
          }
        ]
      });

      // Add story markers with current filtered data
      const dataToShow = this.currentFilteredData.length > 0 ? this.currentFilteredData : (this.data?.listStory || []);
      if (dataToShow.length > 0) {
        await this.mapComponent.addStoryMarkers(
          dataToShow,
          (story) => this.showStoryDetail(story)
        );
      }

      // Setup layer change listener
      this.mapComponent.setupLayerChangeListener((event) => {
        console.log('Layer changed to:', event.name);
      });

      console.log('Map initialized successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  initializeFilter() {
    try {
      
      // Don't initialize if already initialized
      if (this.filterComponent) {
        console.log('Filter already initialized, skipping...');
        return;
      }

      // Prepare data for filter (use existing location info if available)
      const storiesWithLocation = this.data.listStory.map(story => ({
        ...story,
        location: story.location || 'Loading...'  // Don't call getLocationName here
      }));

      // Create filter component
      this.filterComponent = FilterComponent.create('#filter-container', storiesWithLocation, {
        showSearch: true,
        showLocation: true,
        showDateRange: true,
        showSort: true,
        debounceTime: 300
      });

      // Mark as not fully initialized until locations are loaded
      this.filterComponent.isInitialized = false;

      // Set up filter change callback
      this.filterComponent.onFilterChangeCallback((filteredData, filters) => {
        this.handleFilterChange(filteredData, filters);
      });

      // Initialize with all data
      this.currentFilteredData = [...storiesWithLocation];
      
      console.log('Filter initialized successfully');

    } catch (error) {
      console.error('Error initializing filter:', error);
    }
  }

  async handleFilterChange(filteredData, filters) {
    // Prevent recursive calls
    if (this.isProcessingFilter) {
      console.log('Filter change already in progress, skipping...');
      return;
    }
    
    this.isProcessingFilter = true;
    
    try {
      this.currentFilteredData = filteredData;
      
      // Update story cards display
      await this.updateStoryCardsDisplay(filteredData);
      
      // Update map markers (only if map is initialized)
      if (this.mapComponent) {
        await this.mapComponent.addStoryMarkers(
          filteredData,
          (story) => this.showStoryDetail(story)
        );
      }

      // Update stats
      this.updateStatsDisplay(filteredData);
      
    } finally {
      this.isProcessingFilter = false;
    }
  }

  async updateStoryCardsDisplay(stories) {
    const storiesGrid = document.querySelector('.stories-grid');
    if (!storiesGrid) return;

    if (stories.length === 0) {
      storiesGrid.innerHTML = `
        <div class="no-results">
          <h3>No stories found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      `;
      return;
    }

    // Generate story cards
    const storyCards = stories.map(story => this.createStoryCard(story)).join('');
    storiesGrid.innerHTML = storyCards;

    // Re-setup interactions for new cards
    this.setupStoryCardInteractions();

    // Update card locations
    await this.updateCardLocations();
  }

  updateStatsDisplay(stories) {
    // Update total stories count
    const totalElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
    if (totalElement) {
      totalElement.textContent = stories.length;
    }

    // Update contributors count
    const contributorsElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
    if (contributorsElement) {
      contributorsElement.textContent = new Set(stories.map(s => s.name)).size;
    }

    // Update locations count
    const locationsElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
    if (locationsElement) {
      const uniqueLocations = new Set(stories
        .filter(s => s.location && s.location !== 'Unknown Location')
        .map(s => s.location)
      );
      locationsElement.textContent = uniqueLocations.size;
    }

    // Update map info panel
    const mapInfo = document.getElementById('current-layer-info');
    if (mapInfo && mapInfo.parentElement) {
      const storyCountInfo = mapInfo.parentElement.querySelector('div:last-child');
      if (storyCountInfo) {
        storyCountInfo.textContent = `Stories: ${stories.length} locations`;
      }
    }
  }

  async render() {
    try {
      this.token = tokenService.getToken();

      // Block story access when not authenticated
      if (!this.token) {
        this.data = null;
        this.currentFilteredData = [];
        return `
          <section class="stories-container">
            <div class="page-header">
              <h1 class="page-title">Stories</h1>
              <p class="page-subtitle">Silakan login untuk melihat cerita.</p>
            </div>
            <div class="error">
              <h3>Butuh autentikasi</h3>
              <p>Masuk terlebih dahulu untuk memuat data story.</p>
              <a class="btn" href="#/login">Login sekarang</a>
            </div>
          </section>
        `;
      }

      this.data = await getStoryData(this.token);
      
      if (!this.data || !this.data.listStory || this.data.listStory.length === 0) {
        return this.renderEmptyState();
      }

      const stories = this.data.listStory;
      this.currentFilteredData = [...stories]; // Initialize with all stories

      const storyCards = stories.map(story => this.createStoryCard(story)).join('');

      return `
        <section>
          <div class="reports-list__map__container" style="position: relative; margin-bottom: 2rem; max-width: 95vw; margin-left: auto; margin-right: auto;">
            <div id="map" class="reports-list__map" style="height: 1600px; width: 100%; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); position: relative;"></div>
            <div id="map-loading-container" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255, 255, 255, 0.9); padding: 1rem; border-radius: 8px;">
              <p style="margin: 0; color: #666;">Loading map...</p>
            </div>
            
            <!-- Map Info Panel -->
            ${this.createMapInfoPanel(stories)}
          </div>
        </section>

        <section class="stories-container">
          <div class="page-header">
            <h1 class="page-title">Stories</h1>
            <p class="page-subtitle">Discover amazing stories from our community</p>
            
            <!-- Toggle Filter Button -->
            <button class="filter-toggle-btn" type="button">
              <span class="filter-icon">🔍</span>
              Filter Stories
            </button>
          </div>
          
          <!-- Filter Container -->
          <div id="filter-container" class="filter-wrapper" style="display: none;"></div>
          
          ${this.createStatsBar(stories)}

          <div class="stories-grid">
            ${storyCards}
          </div>
        </section>
      `;
    } catch (error) {
      console.error('Error fetching data:', error);
      return this.renderErrorState(error);
    }
  }

  renderEmptyState() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map" style="height: 1600px; width: 100%; max-width: 95vw; margin: 0 auto; position: relative;"></div>
          <div id="map-loading-container" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <p>Loading map...</p>
          </div>
        </div>
      </section>
      
      <section class="stories-container">
        <div class="page-header">
          <h1 class="page-title">Stories</h1>
          <p class="page-subtitle">No stories available</p>
        </div>
      </section>
    `;
  }

  renderErrorState(error) {
    return `
      <section class="stories-container">
        <div class="page-header">
          <h1 class="page-title">Stories</h1>
        </div>
        <div class="error">
          <h3>Error Loading Stories</h3>
          <p>${error.message}</p>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      </section>
    `;
  }

  createMapInfoPanel(stories) {
    return `
      <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #666;">
        <div id="current-layer-info">Current Layer: OpenStreetMap</div>
        <div>Stories: ${stories.length} locations</div>
      </div>
    `;
  }

  createStatsBar(stories) {
    return `
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number">${stories.length}</span>
          <span class="stat-label">Total Stories</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${new Set(stories.map(s => s.name)).size}</span>
          <span class="stat-label">Contributors</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">Loading...</span>
          <span class="stat-label">Locations</span>
        </div>
      </div>
    `;
  }

  async afterRender() {
    
    // Initialize components in sequence to avoid conflicts
    try {
      if (!this.data || !this.data.listStory || this.data.listStory.length === 0) {
        return;
      }

      // 1. Initialize filter first (without location data)
      this.initializeFilter();
      
      // 2. Initialize map
      await this.initializeMap();
      
      // 3. Update card locations (this will also update filter when done)
      await this.updateCardLocations();

      // 4. Setup story card interactions
      this.setupStoryCardInteractions();

      // 5. Setup filter toggle button
      this.setupFilterToggle();
            
    } catch (error) {
      console.error('Error in afterRender:', error);
    }
  }

  setupFilterToggle() {
    const toggleBtn = document.querySelector('.filter-toggle-btn');
    const filterContainer = document.querySelector('#filter-container');

    if (toggleBtn && filterContainer) {
      toggleBtn.addEventListener('click', () => {
        const isVisible = filterContainer.style.display !== 'none';
        filterContainer.style.display = isVisible ? 'none' : 'block';
        
        // Update button text
        const icon = toggleBtn.querySelector('.filter-icon');
        if (icon) {
          icon.textContent = isVisible ? '🔍' : '✕';
        }
      });
    }
  }

  setupStoryCardInteractions() {
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach((card) => {
      // Remove existing listeners to prevent duplicates
      card.replaceWith(card.cloneNode(true));
    });

    // Re-select after cloning
    const newStoryCards = document.querySelectorAll('.story-card');
    newStoryCards.forEach((card) => {
      // Click handler
      card.addEventListener('click', () => {
        const storyId = card.dataset.storyId;
        const story = this.currentFilteredData.find(s => s.id === storyId) || 
                     this.findStoryByCard(card);
        if (story) {
          this.showStoryDetail(story);
        }
      });

      // Hover effects
      card.addEventListener('mouseenter', () => {
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        
        if (this.mapComponent && !isNaN(lat) && !isNaN(lon)) {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  // Helper method to find story by card attributes
  findStoryByCard(card) {
    const lat = parseFloat(card.dataset.lat);
    const lon = parseFloat(card.dataset.lon);
    const title = card.querySelector('.card-title')?.textContent;

    return this.currentFilteredData.find(story => 
      story.lat === lat && 
      story.lon === lon && 
      story.name === title
    );
  }

  async updateCardLocations() {
    if (!this.data || !this.data.listStory) return;

    const storyCards = document.querySelectorAll('.story-card[data-location-loading="true"]');
    const uniqueLocations = new Set();
    const locationPromises = [];

    // Process locations in batches to avoid too many concurrent calls
    for (const card of storyCards) {
      const lat = parseFloat(card.dataset.lat);
      const lon = parseFloat(card.dataset.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        const locationPromise = this.getLocationName(lat, lon)
          .then(locationName => {
            uniqueLocations.add(locationName);
            
            // Update location in card
            const locationElement = card.querySelector('.location');
            if (locationElement) {
              locationElement.textContent = `📍 ${locationName}`;
            }
            
            // Update story data with location info (find in original data)
            const story = this.data.listStory.find(s => 
              s.lat === lat && s.lon === lon
            );
            if (story) {
              story.location = locationName;
            }
            
            // Remove loading attribute
            card.removeAttribute('data-location-loading');
            
            return locationName;
          })
          .catch(error => {
            console.error('Error updating location for card:', error);
            const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            
            const locationElement = card.querySelector('.location');
            if (locationElement) {
              locationElement.textContent = `📍 ${fallback}`;
            }
            
            // Update story data with fallback location
            const story = this.data.listStory.find(s => 
              s.lat === lat && s.lon === lon
            );
            if (story) {
              story.location = fallback;
            }
            
            card.removeAttribute('data-location-loading');
            return fallback;
          });
          
        locationPromises.push(locationPromise);
      }
    }

    // Wait for all location updates to complete
    if (locationPromises.length > 0) {
      await Promise.all(locationPromises);
      
      // Update stats bar locations count ONCE
      const locationCountElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
      if (locationCountElement) {
        locationCountElement.textContent = uniqueLocations.size;
      }

      // Update filter component with location data ONCE - only if not already initialized
      if (this.filterComponent && this.data && !this.filterComponent.isInitialized) {
        const storiesWithLocation = this.data.listStory.map(story => ({
          ...story,
          location: story.location || 'Unknown Location'
        }));
        this.filterComponent.updateData(storiesWithLocation);
        this.filterComponent.isInitialized = true;
      }
    }
  }

  focusOnStory(story) {
    if (this.mapComponent) {
      this.mapComponent.focusOnStory(story);
    }
  }

  // Show story detail using StoryModal
  async showStoryDetail(story) {
    const mapInstance = this.mapComponent ? this.mapComponent.getMapInstance() : null;
    await this.storyModal.show(story, mapInstance);
  }

  // Get map information
  getMapInfo() {
    return this.mapComponent ? this.mapComponent.getMapInfo() : null;
  }

  // Switch map layer
  switchMapLayer(layerName) {
    if (this.mapComponent) {
      this.mapComponent.switchToLayer(layerName);
    }
  }

  // Get current filter state
  getCurrentFilters() {
    return this.filterComponent ? this.filterComponent.getCurrentFilters() : null;
  }

  // Set specific filter
  setFilter(filterName, value) {
    if (this.filterComponent) {
      this.filterComponent.setFilter(filterName, value);
    }
  }

  // Toggle filter visibility
  toggleFilter(show = null) {
    const filterContainer = document.querySelector('#filter-container');
    const toggleBtn = document.querySelector('.filter-toggle-btn');
    
    if (filterContainer && toggleBtn) {
      const isVisible = show !== null ? show : filterContainer.style.display === 'none';
      filterContainer.style.display = isVisible ? 'block' : 'none';
      
      // Update button icon
      const icon = toggleBtn.querySelector('.filter-icon');
      if (icon) {
        icon.textContent = isVisible ? '✕' : '🔍';
      }
    }
  }

  // Reset all filters
  resetFilters() {
    if (this.filterComponent) {
      this.filterComponent.resetFilters();
    }
  }

  // Get filtered stories
  getFilteredStories() {
    return [...this.currentFilteredData];
  }

  // Cleanup method
  cleanup() {
    // Close modal
    if (this.storyModal) {
      this.storyModal.close();
    }

    // Destroy map component
    if (this.mapComponent) {
      this.mapComponent.destroy();
      this.mapComponent = null;
    }

    // Destroy filter component
    if (this.filterComponent) {
      this.filterComponent.destroy();
      this.filterComponent = null;
    }

    // Clear data
    this.data = null;
    this.city = [];
    this.currentFilteredData = [];
  }

  // Method to refresh all components when data changes
  async refreshComponents() {
    if (this.data && this.data.listStory) {
      // Update filter component
      if (this.filterComponent) {
        const storiesWithLocation = this.data.listStory.map(story => ({
          ...story,
          location: story.location || 'Unknown Location'
        }));
        this.filterComponent.updateData(storiesWithLocation);
      }

      // Refresh map markers
      if (this.mapComponent) {
        const dataToShow = this.currentFilteredData.length > 0 ? this.currentFilteredData : this.data.listStory;
        await this.mapComponent.addStoryMarkers(
          dataToShow,
          (story) => this.showStoryDetail(story)
        );
      }
    }
  }

  // Export current view state (for bookmarking/sharing)
  exportViewState() {
    return {
      filters: this.getCurrentFilters(),
      mapInfo: this.getMapInfo(),
      totalStories: this.data?.listStory?.length || 0,
      filteredCount: this.currentFilteredData.length
    };
  }

  // Import view state (for restoring bookmarked state)
  async importViewState(state) {
    if (state.filters && this.filterComponent) {
      // Apply each filter
      Object.entries(state.filters).forEach(([key, value]) => {
        this.setFilter(key, value);
      });
    }
  }
}