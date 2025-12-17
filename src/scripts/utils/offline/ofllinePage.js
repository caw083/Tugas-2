// src/scripts/utils/offline/offlineUtils.js

export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
    this.setupOfflineIndicator();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineStatus();
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineStatus();
    });
  }

  setupOfflineIndicator() {
    // Buat indicator offline
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.innerHTML = `
      <div class="offline-message">
        📶 Anda sedang offline. Beberapa fitur mungkin terbatas.
      </div>
    `;
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f39c12;
      color: white;
      text-align: center;
      padding: 10px;
      z-index: 9999;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(indicator);
  }

  showOfflineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.transform = 'translateY(0)';
    }
    
    // Tambahkan class offline ke body
    document.body.classList.add('offline-mode');
  }

  showOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.transform = 'translateY(-100%)';
    }
    
    // Hapus class offline dari body
    document.body.classList.remove('offline-mode');
    
    // Show success message briefly
    this.showToast('🌐 Kembali online!', 'success');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#27ae60' : '#3498db'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Simpan data untuk sync nanti ketika online
  savePendingData(key, data) {
    const pendingData = this.getPendingData();
    pendingData[key] = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem('pendingOfflineData', JSON.stringify(pendingData));
  }

  getPendingData() {
    try {
      return JSON.parse(localStorage.getItem('pendingOfflineData') || '{}');
    } catch {
      return {};
    }
  }

  async syncPendingData() {
    const pendingData = this.getPendingData();
    const keys = Object.keys(pendingData);
    
    if (keys.length === 0) return;
    
    this.showToast('🔄 Menyinkronkan data...', 'info');
    
    let syncCount = 0;
    
    for (const key of keys) {
      try {
        // Di sini Anda bisa menambahkan logic untuk sync berbagai jenis data
        // Contoh: await this.syncStoryData(key, pendingData[key].data);
        syncCount++;
        delete pendingData[key];
      } catch (error) {
        console.error(`Gagal sync data ${key}:`, error);
      }
    }
    
    localStorage.setItem('pendingOfflineData', JSON.stringify(pendingData));
    
    if (syncCount > 0) {
      this.showToast(`✅ ${syncCount} data berhasil disinkronkan`, 'success');
    }
  }

  // Check jika ada cached version dari halaman
  async getCachedContent(url) {
    if ('caches' in window) {
      try {
        const cache = await caches.open('html-cache');
        const response = await cache.match(url);
        return response ? await response.text() : null;
      } catch (error) {
        console.error('Error getting cached content:', error);
        return null;
      }
    }
    return null;
  }
}

// Utility untuk cek apakah request berhasil
export function isRequestSuccessful(response) {
  return response && response.ok && response.status >= 200 && response.status < 300;
}

// Utility untuk create offline fallback content
export function createOfflinePage() {
  return `
    <div class="offline-page">
      <div class="offline-content">
        <h2>📱 Mode Offline</h2>
        <p>Anda sedang offline, tapi masih bisa mengakses konten yang sudah di-cache.</p>
        <div class="offline-actions">
          <button onclick="window.location.reload()" class="btn-reload">
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    </div>
  `;
}