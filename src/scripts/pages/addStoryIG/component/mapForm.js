import Map from "../../../utils/map";

export default class MapForm {
  #map = null;
  #currentMarker = null;
  #mapInitialized = false;
  #onLocationChange = null;

  constructor(options = {}) {
    this.onLocationChange = options.onLocationChange || (() => {});
    this.onError = options.onError || ((error) => console.error(error));
    this.initialLatitude = options.initialLatitude || null;
    this.initialLongitude = options.initialLongitude || null;
  }

  render() {
    return `
      <div class="form-group">
        <div class="location-title">Location (Optional)</div>
        <div class="location-inputs">
          <div class="location-input">
            <label for="lat-input">Latitude</label>
            <input type="number" id="lat-input" name="latitude" placeholder="Latitude" readonly step="any" value="${this.initialLatitude || ''}" />
          </div>
          <div class="location-input">
            <label for="lon-input">Longitude</label>
            <input type="number" id="lon-input" name="longitude" placeholder="Longitude" readonly step="any" value="${this.initialLongitude || ''}" />
          </div>
        </div>
        <button type="button" id="get-location-btn" class="btn btn-outline">
          Use Current Location
        </button>
        <button type="button" id="init-map-btn" class="btn btn-secondary">
          Show Map
        </button>
        
        <div class="map-wrapper" style="margin-top: 15px;">
          <div id="map-loading-container" style="display: none;">
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 4px;">
              Loading map...
            </div>
          </div>
          <div id="map-container" style="display: none;">
            <div id="map" style="height: 350px; width: 100%; border-radius: 4px; border: 1px solid #dee2e6;"></div>
          </div>
          <div id="map-error" style="display: none;">
            <div style="text-align: center; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 4px; border: 1px solid #f5c6cb;">
              <strong>Map Error:</strong> <span id="map-error-message"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  afterRender() {
    this.#setupEventListeners();
    
    // Set initial values if provided
    if (this.initialLatitude && this.initialLongitude) {
      this.#updateLatLngInput(this.initialLatitude, this.initialLongitude);
    }
  }

  #setupEventListeners() {
    // Location button
    const locationBtn = document.getElementById('get-location-btn');
    if (locationBtn) {
      locationBtn.addEventListener('click', () => {
        this.#getCurrentLocation();
      });
    }

    // Map initialization button
    const mapBtn = document.getElementById('init-map-btn');
    if (mapBtn) {
      mapBtn.addEventListener('click', async () => {
        if (!this.#mapInitialized) {
          await this.#initializeMap();
        } else {
          this.#toggleMapVisibility();
        }
      });
    }
  }

async #initializeMap() {
    const mapBtn = document.getElementById('init-map-btn');
    const loadingContainer = document.getElementById('map-loading-container');
    const mapContainer = document.getElementById('map-container');
    const errorContainer = document.getElementById('map-error');
    
    // Show loading
    loadingContainer.style.display = 'block';
    mapContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    mapBtn.disabled = true;
    mapBtn.textContent = 'Loading Map...';
    
    try {
        console.log('Starting map initialization...');
        
        // Wait a bit for DOM to be stable
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if map element exists and is ready
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map element not found in DOM');
        }
        
        // Show map container before initialization
        mapContainer.style.display = 'block';
        loadingContainer.style.display = 'none';
        
        // Wait for container to be displayed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Building map with Map.build...');
        
        // === AWAL PERUBAHAN ===
        // Cek dulu apakah sudah ada lokasi dari tombol sebelumnya
        const currentLocation = this.getLocation();

        const mapBuildOptions = {
            zoom: 13,
        };

        if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
            // Jika sudah ada koordinat, jadikan itu sebagai pusat peta
            console.log('Using existing coordinates:', currentLocation);
            mapBuildOptions.center = [currentLocation.latitude, currentLocation.longitude];
        } else {
            // Jika belum ada koordinat, baru aktifkan fitur pencarian lokasi otomatis
            console.log('No existing coordinates found, using locate feature');
            mapBuildOptions.locate = true;
        }

        // Gunakan mapBuildOptions saat memanggil Map.build
        this.#map = await Map.build('#map', mapBuildOptions);
        // === AKHIR PERUBAHAN ===
        
        if (!this.#map) {
            throw new Error('Map.build returned null or undefined');
        }
        
        console.log('Map built successfully:', this.#map);
        
        // Sisa kode setelah ini bisa tetap sama, karena peta akan
        // diinisialisasi dengan koordinat yang benar.
        const centerCoordinate = this.#map.getCenter();
        
        if (centerCoordinate && centerCoordinate.latitude !== undefined && centerCoordinate.longitude !== undefined) {
            // Hanya update input jika menggunakan locate (koordinat baru dari peta)
            // Jika menggunakan koordinat existing, tidak perlu update input lagi
            if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
                this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
            }
            
            // Add draggable marker
            this.#currentMarker = this.#map.addMarker(
                [centerCoordinate.latitude, centerCoordinate.longitude],
                { draggable: true }
            );
            
            console.log('Marker added:', this.#currentMarker);
            
            // Add event listener using Leaflet's event system
            if (this.#currentMarker && typeof this.#currentMarker.on === 'function') {
                this.#currentMarker.on('dragend', (event) => {
                    console.log('Marker moved');
                    const coordinate = event.target.getLatLng();
                    this.#updateLatLngInput(coordinate.lat, coordinate.lng);
                });
            }
        }

        // Enable selecting coordinates by clicking on the map
        this.#setupMapClickToSelect();
        
        this.#mapInitialized = true;
        mapBtn.textContent = 'Hide Map';
        mapBtn.disabled = false;
        
        console.log('Map initialization completed successfully');
        
    } catch (error) {
        console.error('Map initialization failed:', error);
        
        // Hide map container and show error
        mapContainer.style.display = 'none';
        errorContainer.style.display = 'block';
        const errorMessageEl = document.getElementById('map-error-message');
        if (errorMessageEl) {
            errorMessageEl.textContent = error.message;
        }
        
        mapBtn.disabled = false;
        mapBtn.textContent = 'Retry Map';
        
        // Reset initialization flag so user can retry
        this.#mapInitialized = false;
        
        // Call error callback if it exists
        if (this.onError && typeof this.onError === 'function') {
            this.onError(error);
        }
        
    } finally {
        loadingContainer.style.display = 'none';
    }
}

  #setupMapClickToSelect() {
    if (!this.#map) return;

    // Leaflet map instance from our Map wrapper
    const leafletMap = typeof this.#map.getMapInstance === 'function' ? this.#map.getMapInstance() : null;
    if (!leafletMap || typeof leafletMap.on !== 'function') return;

    // Avoid duplicate listeners if init is retried
    leafletMap.off?.('click');

    leafletMap.on('click', (e) => {
      const { lat, lng } = e.latlng || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      this.#updateLatLngInput(lat, lng);

      // Move existing marker (or create it) to clicked point
      if (this.#currentMarker && typeof this.#currentMarker.setLatLng === 'function') {
        this.#currentMarker.setLatLng([lat, lng]);
      } else {
        this.#currentMarker = this.#map.addMarker([lat, lng], { draggable: true });
      }

      // Re-attach drag handler (safe even if already attached)
      if (this.#currentMarker && typeof this.#currentMarker.on === 'function') {
        this.#currentMarker.off?.('dragend');
        this.#currentMarker.on('dragend', (event) => {
          const coordinate = event.target.getLatLng();
          this.#updateLatLngInput(coordinate.lat, coordinate.lng);
        });
      }
    });
  }
  #toggleMapVisibility() {
    const mapContainer = document.getElementById('map-container');
    const mapBtn = document.getElementById('init-map-btn');
    
    if (mapContainer && mapBtn) {
      if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        mapBtn.textContent = 'Hide Map';
      } else {
        mapContainer.style.display = 'none';
        mapBtn.textContent = 'Show Map';
      }
    }
  }

  #updateLatLngInput(latitude, longitude) {
    const latInput = document.getElementById('lat-input');
    const lonInput = document.getElementById('lon-input');
    
    if (latInput && lonInput) {
      const lat = parseFloat(latitude).toFixed(6);
      const lon = parseFloat(longitude).toFixed(6);
      
      latInput.value = lat;
      lonInput.value = lon;
      
      // Trigger callback to parent component
      this.onLocationChange({ latitude: lat, longitude: lon });
    }
  }

  #getCurrentLocation() {
    if (!navigator.geolocation) {
      this.onError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const locationBtn = document.getElementById('get-location-btn');
    if (!locationBtn) return;
    
    locationBtn.disabled = true;
    locationBtn.textContent = 'Getting location...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        this.#updateLatLngInput(lat, lon);
        
        // Update map if initialized
        if (this.#mapInitialized && this.#map) {
          this.#updateMapWithLocation(lat, lon);
        }
        
        locationBtn.disabled = false;
        locationBtn.textContent = 'Use Current Location';
        
        // Success callback with location info
        this.onLocationChange({ 
          latitude: lat, 
          longitude: lon, 
          accuracy: position.coords.accuracy,
          message: `Location updated! Accuracy: ±${Math.round(position.coords.accuracy)}m`
        });
      },
      (error) => {
        locationBtn.disabled = false;
        locationBtn.textContent = 'Use Current Location';
        
        let errorMessage = 'Unable to get location: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += error.message;
        }
        
        this.onError(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  }

  #updateMapWithLocation(lat, lon) {
    if (!this.#map) return;
    
    try {
      // Update map view
      this.#map.changeCamera([lat, lon], 15);
      
      // Remove existing marker and add new one
      if (this.#currentMarker && typeof this.#currentMarker.remove === 'function') {
        this.#currentMarker.remove();
      }
      
      this.#currentMarker = this.#map.addMarker([lat, lon], { draggable: true });
      
      // Add event listener
      if (this.#currentMarker && typeof this.#currentMarker.on === 'function') {
        this.#currentMarker.on('dragend', (event) => {
          const coordinate = event.target.getLatLng();
          this.#updateLatLngInput(coordinate.lat, coordinate.lng);
        });
      }
      
      console.log('Map updated with new location:', lat, lon);
      
    } catch (error) {
      console.error('Error updating map with location:', error);
      this.onError(new Error('Failed to update map with location'));
    }
  }

  // Public methods
  getLocation() {
    const latInput = document.getElementById('lat-input');
    const lonInput = document.getElementById('lon-input');
    
    if (latInput && lonInput && latInput.value && lonInput.value) {
      return {
        latitude: parseFloat(latInput.value),
        longitude: parseFloat(lonInput.value)
      };
    }
    
    return null;
  }

  setLocation(latitude, longitude) {
    this.#updateLatLngInput(latitude, longitude);
    
    // Update map if initialized
    if (this.#mapInitialized && this.#map) {
      this.#updateMapWithLocation(latitude, longitude);
    }
  }

  resetLocation() {
    const latInput = document.getElementById('lat-input');
    const lonInput = document.getElementById('lon-input');
    
    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';

    // Reset map to initial center if initialized
    if (this.#mapInitialized && this.#map) {
      try {
        const centerCoordinate = this.#map.getCenter();
        if (centerCoordinate) {
          this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
        }
      } catch (error) {
        console.error('Error resetting map:', error);
      }
    }
  }

  isMapInitialized() {
    return this.#mapInitialized;
  }

  destroy() {
    // Clean up map instance if needed
    if (this.#map && typeof this.#map.destroy === 'function') {
      this.#map.destroy();
    }
    
    this.#map = null;
    this.#currentMarker = null;
    this.#mapInitialized = false;
  }
}