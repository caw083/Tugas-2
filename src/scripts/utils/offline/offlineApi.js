export class OfflineApiManager {
  constructor() {
    this.cacheName = 'api-cache';
    this.offlineQueueKey = 'offline-api-queue';
  }

  // Wrapper untuk fetch yang support offline
  async fetchWithCache(url, options = {}) {
    const cacheKey = this.createCacheKey(url, options);
    
    try {
      // Coba fetch dari network
      if (navigator.onLine) {
        const response = await fetch(url, options);
        
        if (response.ok) {
          // Cache response jika berhasil
          await this.cacheResponse(cacheKey, response.clone());
          return response;
        }
      }
      
      // Jika offline atau network gagal, coba ambil dari cache
      return await this.getCachedResponse(cacheKey);
      
    } catch (error) {
      console.error('Network error, trying cache:', error);
      
      // Fallback ke cache
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      throw error;
    }
  }

  // Khusus untuk GET requests
  async get(url, options = {}) {
    return this.fetchWithCache(url, {
      method: 'GET',
      ...options,
    });
  }

  // Untuk POST/PUT/DELETE - queue jika offline
  async post(url, data, options = {}) {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    };

    if (!navigator.onLine) {
      // Queue request untuk nanti
      await this.queueOfflineRequest(url, requestOptions);
      throw new Error('Offline: Request telah di-queue untuk sinkronisasi nanti');
    }

    try {
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      // Jika gagal, queue untuk nanti
      await this.queueOfflineRequest(url, requestOptions);
      throw error;
    }
  }

  async put(url, data, options = {}) {
    return this.post(url, data, { ...options, method: 'PUT' });
  }

  async delete(url, options = {}) {
    const requestOptions = {
      method: 'DELETE',
      ...options,
    };

    if (!navigator.onLine) {
      await this.queueOfflineRequest(url, requestOptions);
      throw new Error('Offline: Request telah di-queue untuk sinkronisasi nanti');
    }

    try {
      return await fetch(url, requestOptions);
    } catch (error) {
      await this.queueOfflineRequest(url, requestOptions);
      throw error;
    }
  }

  createCacheKey(url, options) {
    // Buat key unik berdasarkan URL dan beberapa options
    const key = {
      url,
      method: options.method || 'GET',
      // Jangan masukkan authorization header ke cache key
    };
    return JSON.stringify(key);
  }

  async cacheResponse(key, response) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const request = new Request(key);
        await cache.put(request, response);
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }
  }

  async getCachedResponse(key) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const request = new Request(key);
        const response = await cache.match(request);
        
        if (response) {
          // Tambahkan header untuk menandai ini dari cache
          const clonedResponse = response.clone();
          clonedResponse.headers.set('X-From-Cache', 'true');
          return clonedResponse;
        }
      } catch (error) {
        console.error('Error getting cached response:', error);
      }
    }
    return null;
  }

  async queueOfflineRequest(url, options) {
    const queue = this.getOfflineQueue();
    const request = {
      id: Date.now() + Math.random(),
      url,
      options,
      timestamp: Date.now(),
    };
    
    queue.push(request);
    localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    
    console.log('Request queued for offline sync:', request);
  }

  getOfflineQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.offlineQueueKey) || '[]');
    } catch {
      return [];
    }
  }

  // Proses queue ketika kembali online
  async processOfflineQueue() {
    if (!navigator.onLine) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued requests...`);
    
    const processed = [];
    const failed = [];

    for (const request of queue) {
      try {
        await fetch(request.url, request.options);
        processed.push(request.id);
        console.log('Successfully synced queued request:', request.url);
      } catch (error) {
        console.error('Failed to sync queued request:', request.url, error);
        
        // Jika sudah lebih dari 24 jam, hapus dari queue
        if (Date.now() - request.timestamp > 24 * 60 * 60 * 1000) {
          processed.push(request.id);
        } else {
          failed.push(request);
        }
      }
    }

    // Update queue dengan yang belum berhasil
    localStorage.setItem(this.offlineQueueKey, JSON.stringify(failed));
    
    if (processed.length > 0) {
      console.log(`Successfully processed ${processed.length} queued requests`);
    }
    
    return {
      processed: processed.length,
      failed: failed.length,
    };
  }

  // Clear cache (untuk debugging)
  async clearCache() {
    if ('caches' in window) {
      try {
        await caches.delete(this.cacheName);
        console.log('API cache cleared');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  }

  // Clear offline queue
  clearOfflineQueue() {
    localStorage.removeItem(this.offlineQueueKey);
    console.log('Offline queue cleared');
  }
}

// Export singleton instance
export const offlineApiManager = new OfflineApiManager();

// Utility functions
export function isFromCache(response) {
  return response && response.headers.get('X-From-Cache') === 'true';
}

export function showCacheIndicator() {
  // Tampilkan indicator bahwa data dari cache
  const indicator = document.createElement('div');
  indicator.textContent = '📱 Data dari cache';
  indicator.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: #3498db;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9998;
    opacity: 0.9;
  `;
  
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 2000);
}

// Setup auto-sync ketika online
window.addEventListener('online', () => {
  setTimeout(() => {
    offlineApiManager.processOfflineQueue();
  }, 1000);
});