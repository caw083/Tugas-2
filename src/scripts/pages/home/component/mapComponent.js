// MapComponent.js
import Map from "../../../utils/map";
import { getCityofGeocode } from "../api_data/reverseGeocoding";

export default class MapComponent {
  constructor(containerId = '#map') {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.customControls = null;
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

  async initialize(options = {}) {
    try {
      const defaultOptions = {
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
        ],
        overlays: []
      };

      const mapOptions = { ...defaultOptions, ...options };
      
      // Initialize map
      this.map = await Map.build(this.containerId, mapOptions);

      // Add custom layer controls
      this.addCustomMapControls();

      // Hide loading container
      this.hideLoadingContainer();

      console.log('Map initialized successfully');
      return this.map;

    } catch (error) {
      console.error('Error initializing map:', error);
      this.showMapError(error);
      throw error;
    }
  }

  async addStoryMarkers(stories, onMarkerClick = null) {
    if (!this.map || !stories || !Array.isArray(stories)) {
      console.warn('Map not initialized or invalid stories data');
      return;
    }

    // Clear existing markers
    this.clearMarkers();

    for (const story of stories) {
      if (story.lat && story.lon && 
          typeof story.lat === 'number' && 
          typeof story.lon === 'number') {
        
        // Get location name for marker popup
        let locationName = 'Loading location...';
        try {
          locationName = await this.getLocationName(story.lat, story.lon);
        } catch (error) {
          locationName = `${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}`;
        }
        
        const marker = this.map.addMarker(
          [story.lat, story.lon],
          {
            title: story.name
          },
          {
            content: this.createMarkerPopupContent(story, locationName)
          }
        );

        // Add click handler
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(story);
          });
        }

        // Store marker reference
        this.markers.push({
          marker,
          story,
          locationName
        });
      }
    }

    console.log(`Added ${this.markers.length} markers to map`);
  }

  createMarkerPopupContent(story, locationName) {
    return `
      <div style="text-align: center; min-width: 200px;">
        <img src="${story.photoUrl}" 
             style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" 
             alt="${story.name}">
        <h4 style="margin: 0 0 4px 0; font-size: 14px;">${story.name}</h4>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${story.description.substring(0, 100)}...</p>
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #007bff;">📍 ${locationName}</p>
        <small style="color: #888;">${this.formatDate(story.createdAt)}</small>
      </div>
    `;
  }

  addCustomMapControls() {
    if (!this.map) return;

    const mapContainer = document.querySelector(this.containerId);
    if (!mapContainer) return;

    // Remove existing controls if any
    if (this.customControls) {
      this.customControls.remove();
    }

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'map-custom-controls';
    controlsDiv.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    const availableLayers = this.map.getAvailableLayers();
    
    // Create buttons for base layers
    if (availableLayers && availableLayers.baseLayers) {
      availableLayers.baseLayers.forEach(layerName => {
        const button = this.createLayerButton(layerName, controlsDiv);
        controlsDiv.appendChild(button);
      });
    }

    mapContainer.appendChild(controlsDiv);
    this.customControls = controlsDiv;
  }

  createLayerButton(layerName, controlsContainer) {
    const button = document.createElement('button');
    button.textContent = layerName;
    button.className = 'map-layer-button';
    button.style.cssText = `
      margin: 2px;
      padding: 4px 8px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    `;
    
    button.addEventListener('click', () => {
      this.switchToLayer(layerName);
      this.updateActiveButton(controlsContainer, button);
    });
    
    // Highlight current layer
    if (this.map && layerName === this.map.getCurrentLayer()) {
      button.style.background = '#007bff';
      button.style.color = 'white';
    }
    
    return button;
  }

  switchToLayer(layerName) {
    if (this.map) {
      this.map.switchToLayer(layerName);
    }
  }

  updateActiveButton(container, activeButton) {
    // Reset all buttons
    const buttons = container.querySelectorAll('.map-layer-button');
    buttons.forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = 'black';
    });
    
    // Highlight active button
    activeButton.style.background = '#007bff';
    activeButton.style.color = 'white';
  }

  setupLayerChangeListener(callback = null) {
    if (!this.map) return;

    const mapInstance = this.map.getMapInstance();
    if (mapInstance) {
      mapInstance.on('baselayerchange', (e) => {
        // Update info panel
        const layerInfo = document.getElementById('current-layer-info');
        if (layerInfo) {
          layerInfo.textContent = `Current Layer: ${e.name}`;
        }
        
        // Call custom callback if provided
        if (callback && typeof callback === 'function') {
          callback(e);
        }
      });
    }
  }

  focusOnStory(story, zoomLevel = 12) {
    if (this.map && story.lat && story.lon) {
      this.map.changeCamera([story.lat, story.lon], zoomLevel);
    }
  }

  clearMarkers() {
    // Clear marker references
    this.markers = [];
    
    // If map has a method to clear all markers
    if (this.map && typeof this.map.clearMarkers === 'function') {
      this.map.clearMarkers();
    }
  }

  hideLoadingContainer() {
    const loadingContainer = document.getElementById('map-loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }

  showMapError(error) {
    const mapContainer = document.querySelector(this.containerId);
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
          <div style="text-align: center;">
            <h3>Unable to load map</h3>
            <p>${error.message || 'Please check your internet connection.'}</p>
            <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Retry
            </button>
          </div>
        </div>
      `;
    }
    
    this.hideLoadingContainer();
  }

  // Get current map info
  getMapInfo() {
    if (!this.map) return null;

    return {
      currentLayer: this.map.getCurrentLayer ? this.map.getCurrentLayer() : 'Unknown',
      markersCount: this.markers.length,
      availableLayers: this.map.getAvailableLayers ? this.map.getAvailableLayers() : null
    };
  }

  // Get map instance for direct access
  getMapInstance() {
    return this.map;
  }

  // Cleanup method
  destroy() {
    // Remove custom controls
    if (this.customControls) {
      this.customControls.remove();
      this.customControls = null;
    }

    // Clear markers
    this.clearMarkers();

    // Remove escape key listener if any
    if (this.currentEscapeHandler) {
      document.removeEventListener('keydown', this.currentEscapeHandler);
      this.currentEscapeHandler = null;
    }

    // Destroy map instance if it has destroy method
    if (this.map && typeof this.map.destroy === 'function') {
      this.map.destroy();
    }

    this.map = null;
  }

  // Static method for easy instantiation
  static async create(containerId, stories = [], options = {}) {
    const mapComponent = new MapComponent(containerId);
    await mapComponent.initialize(options);
    
    if (stories.length > 0) {
      await mapComponent.addStoryMarkers(stories);
    }
    
    return mapComponent;
  }
}