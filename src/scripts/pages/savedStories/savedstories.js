import Database from '../../database/database';

export default class savedStoryPage {
    constructor() {
        this._objectUrls = [];
    }

    render() {
        return `
            <section class="saved-stories">
                <div class="page-header">
                    <h1 class="page-title">Story Tersimpan</h1>
                    <p class="page-subtitle">Koleksi cerita yang sudah kamu simpan (tersedia offline)</p>
                </div>
                <div id="saved-stories-content" class="saved-stories__content">
                    <p>Memuat story tersimpan...</p>
                </div>
            </section>
        `;
    }

    async afterRender() {
        await this.loadSavedStories();
        this.setupEventListeners();
    }

    cleanupObjectUrls() {
        if (this._objectUrls && this._objectUrls.length) {
            this._objectUrls.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch {
                    // ignore
                }
            });
        }
        this._objectUrls = [];
    }

    async loadSavedStories() {
        const contentContainer = document.getElementById('saved-stories-content');
        
        try {
            // Revoke old object URLs before re-rendering
            this.cleanupObjectUrls();

            const savedStories = await Database.getAllStory();
            console.log("sukses");
            console.log(savedStories);
            
            // Perbaikan: Validasi data yang lebih robust
            if (!savedStories) {
                console.warn('savedStories is null or undefined');
                contentContainer.innerHTML = '<p>Gagal memuat data story</p>';
                return;
            }

            // Pastikan savedStories adalah array
            const storiesArray = Array.isArray(savedStories) ? savedStories : [];

            // Prepare image src (Blob -> objectURL, fallback to photoUrl)
            const preparedStories = storiesArray.map((story) => {
                const safeStory = { ...story };
                if (safeStory.photoBlob instanceof Blob) {
                    const objectUrl = URL.createObjectURL(safeStory.photoBlob);
                    this._objectUrls.push(objectUrl);
                    safeStory._photoSrc = objectUrl;
                } else if (typeof safeStory.photoUrl === 'string' && safeStory.photoUrl.length > 0) {
                    safeStory._photoSrc = safeStory.photoUrl;
                } else {
                    safeStory._photoSrc = null;
                }
                return safeStory;
            });
            
            if (preparedStories.length === 0) {
                contentContainer.innerHTML = this.renderEmptyState();
            } else {
                contentContainer.innerHTML = this.renderStoriesList(preparedStories);
            }
        } catch (error) {
            console.error('Error loading saved stories:', error);
            contentContainer.innerHTML = '<p>Gagal memuat data story</p>';
        }
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>Belum Ada Story Tersimpan</h3>
                <p>Story yang kamu simpan akan muncul di halaman ini.</p>
                <button class="btn" onclick="window.location.hash = '#/'">Jelajahi Story</button>
            </div>
        `;
    }

    renderStoriesList(stories) {
        const storiesHTML = stories.map(story => {
            // Validasi data story sebelum render
            const safeStory = {
                id: story.id || 'unknown',
                name: story.name || 'Nama tidak tersedia',
                description: story.description || 'Deskripsi tidak tersedia',
                lat: story.lat || null,
                lon: story.lon || null,
                createdAt: story.createdAt || new Date().toISOString(),
                photoSrc: story._photoSrc || null,
            };

            return `
                <article class="saved-story-card" data-story-id="${safeStory.id}">
                    ${safeStory.photoSrc ? `
                      <div class="saved-story-card__image">
                        <img src="${safeStory.photoSrc}" alt="${this.escapeHtml(safeStory.name)}" loading="lazy">
                      </div>
                    ` : ''}
                    <header class="saved-story-card__header">
                        <h3>${this.escapeHtml(safeStory.name)}</h3>
                        <span class="saved-story-card__date">${this.formatDate(safeStory.createdAt)}</span>
                    </header>
                    <p class="saved-story-card__description">${this.escapeHtml(safeStory.description)}</p>
                    <p class="saved-story-card__meta">Lokasi: ${safeStory.lat && safeStory.lon ? `${safeStory.lat}, ${safeStory.lon}` : 'Tidak tersedia'}</p>
                    <div class="saved-story-card__actions">
                        <button class="btn btn-outline view-detail-btn" data-story='${this.escapeHtml(JSON.stringify({
                            id: safeStory.id,
                            name: safeStory.name,
                            description: safeStory.description,
                            lat: safeStory.lat,
                            lon: safeStory.lon,
                            createdAt: safeStory.createdAt,
                        }))}'>Lihat Detail</button>
                        <button class="btn btn-secondary delete-story-btn" data-story-id="${safeStory.id}">Hapus</button>
                    </div>
                </article>
            `;
        }).join('');

        return `
            <div class="stories-container saved-stories__list">
                <p class="saved-stories__count">${stories.length} story tersimpan (tersedia offline)</p>
                ${storiesHTML}
            </div>
        `;
    }

    // Method untuk escape HTML characters
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method untuk format tanggal
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Tanggal tidak valid';
            }
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Tanggal tidak valid';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const contentContainer = document.getElementById('saved-stories-content');
        if (!contentContainer) return;

        // Event listener untuk tombol "Lihat Detail"
        contentContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-detail-btn')) {
                const storyData = e.target.getAttribute('data-story');
                if (storyData) {
                    try {
                        const story = JSON.parse(storyData);
                        this.viewStoryDetail(story);
                    } catch (error) {
                        console.error('Error parsing story data:', error);
                        alert('Gagal memuat detail story');
                    }
                }
            }
        });

        // Event listener untuk tombol "Hapus"
        contentContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-story-btn')) {
                const storyId = e.target.getAttribute('data-story-id');
                if (storyId) {
                    this.confirmDeleteStory(storyId);
                }
            }
        });
    }

    // Method untuk melihat detail story
    viewStoryDetail(story) {
        // Implementasi sesuai kebutuhan aplikasi Anda
        console.log('Viewing story detail:', story);
        // Misalnya redirect ke halaman detail
        window.location.hash = `#/story/${story.id}`;
    }

    // Method untuk konfirmasi hapus story
    async confirmDeleteStory(storyId) {
        if (confirm('Apakah Anda yakin ingin menghapus story ini?')) {
            try {
                await Database.removeStory(storyId);
                // Reload halaman setelah berhasil hapus
                await this.loadSavedStories();
                alert('Story berhasil dihapus');
            } catch (error) {
                console.error('Error deleting story:', error);
                alert('Gagal menghapus story');
            }
        }
    }
}