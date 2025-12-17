import { map, tileLayer, Icon, icon, marker, popup, latLng, control } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default class Map {
  #zoom = 5;
  #map = null;
  #baseLayers = {};
  #overlayLayers = {};
  #layerControl = null;

  // Predefined tile layer configurations
  static LAYER_CONFIGS = {
    openstreetmap: {
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.arcgis.com/" target="_blank">ArcGIS</a>',
      maxZoom: 18
    },
    dark: {
      name: 'Dark Mode',
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 20
    },
    cartodb: {
      name: 'CartoDB Positron',
      url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>, &copy; <a href="https://cartodb.com/attributions" target="_blank">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }
  };

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }

    const jakartaCoordinate = [-6.2, 106.816666];

    // Using Geolocation API
    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];

        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error('build: error:', error);

        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }

    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }

  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;

    // Initialize base layers
    this.#initializeBaseLayers();

    // Get default layer
    const defaultLayerKey = options.defaultLayer || 'openstreetmap';
    const defaultLayer = this.#baseLayers[defaultLayerKey] || Object.values(this.#baseLayers)[0];

    // Filter out custom options that shouldn't be passed to Leaflet map
    const mapOptions = { ...options };
    delete mapOptions.defaultLayer;
    delete mapOptions.showLayerControl;
    delete mapOptions.overlays;

    // Create map with default layer
    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      layers: [defaultLayer],
      ...mapOptions,
    });

    // Add layer control if more than one layer is available
    if (Object.keys(this.#baseLayers).length > 1 || options.showLayerControl !== false) {
      this.#addLayerControl();
    }

    // Add overlay layers if provided
    if (options.overlays) {
      this.#initializeOverlayLayers(options.overlays);
    }
  }

  #initializeBaseLayers() {
    // Add default layers (removed terrain)
    const defaultLayers = [
      {
        key: 'openstreetmap',
        name: 'OpenStreetMap',
        config: Map.LAYER_CONFIGS.openstreetmap
      },
      {
        key: 'satellite',
        name: 'Satellite',
        config: Map.LAYER_CONFIGS.satellite
      },
      {
        key: 'dark',
        name: 'Dark Mode',
        config: Map.LAYER_CONFIGS.dark
      },
      {
        key: 'cartodb',
        name: 'CartoDB Positron',
        config: Map.LAYER_CONFIGS.cartodb
      }
    ];
    
    defaultLayers.forEach(({ name, config }) => {
      this.#baseLayers[name] = tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
        subdomains: config.subdomains || ''
      });
    });
  }

  #initializeOverlayLayers(overlays) {
    overlays.forEach(overlayConfig => {
      this.#overlayLayers[overlayConfig.name] = tileLayer(overlayConfig.url, {
        attribution: overlayConfig.attribution,
        maxZoom: overlayConfig.maxZoom || 18,
        opacity: overlayConfig.opacity || 0.7,
        subdomains: overlayConfig.subdomains || ''
      });
    });
  }

  #addLayerControl() {
    this.#layerControl = control.layers(this.#baseLayers, this.#overlayLayers, {
      position: 'topright',
      collapsed: true
    });
    this.#layerControl.addTo(this.#map);
  }

  // Add a new base layer dynamically
  addBaseLayer(name, url, options = {}) {
    const newLayer = tileLayer(url, {
      attribution: options.attribution || '',
      maxZoom: options.maxZoom || 18,
      subdomains: options.subdomains || '',
      ...options
    });

    this.#baseLayers[name] = newLayer;

    // Update layer control if it exists
    if (this.#layerControl) {
      this.#layerControl.addBaseLayer(newLayer, name);
    }

    return newLayer;
  }

  // Add a new overlay layer dynamically
  addOverlayLayer(name, url, options = {}) {
    const newLayer = tileLayer(url, {
      attribution: options.attribution || '',
      maxZoom: options.maxZoom || 18,
      opacity: options.opacity || 0.7,
      subdomains: options.subdomains || '',
      ...options
    });

    this.#overlayLayers[name] = newLayer;

    // Update layer control if it exists
    if (this.#layerControl) {
      this.#layerControl.addOverlay(newLayer, name);
    }

    return newLayer;
  }

  // Switch to a specific base layer
  switchToLayer(layerName) {
    const layer = this.#baseLayers[layerName];
    if (layer) {
      // Remove all current base layers
      Object.values(this.#baseLayers).forEach(baseLayer => {
        this.#map.removeLayer(baseLayer);
      });
      
      // Add the selected layer
      layer.addTo(this.#map);
    } else {
      console.warn(`Layer "${layerName}" not found`);
    }
  }

  // Toggle an overlay layer
  toggleOverlay(overlayName) {
    const overlay = this.#overlayLayers[overlayName];
    if (overlay) {
      if (this.#map.hasLayer(overlay)) {
        this.#map.removeLayer(overlay);
      } else {
        overlay.addTo(this.#map);
      }
    } else {
      console.warn(`Overlay "${overlayName}" not found`);
    }
  }

  // Get available layers
  getAvailableLayers() {
    return {
      baseLayers: Object.keys(this.#baseLayers),
      overlayLayers: Object.keys(this.#overlayLayers)
    };
  }

  // Remove a layer
  removeLayer(layerName, isOverlay = false) {
    const layers = isOverlay ? this.#overlayLayers : this.#baseLayers;
    const layer = layers[layerName];
    
    if (layer) {
      this.#map.removeLayer(layer);
      delete layers[layerName];
      
      // Update layer control
      if (this.#layerControl) {
        this.#layerControl.removeLayer(layer);
      }
    }
  }

  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }
    
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
    
    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }
      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }
      const newPopup = popup(coordinates, popupOptions);
      newMarker.bindPopup(newPopup);
    }
    
    newMarker.addTo(this.#map);
    return newMarker;
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return {
      latitude: lat,
      longitude: lng,
    };
  }

  // Get the internal Leaflet map instance (for advanced usage)
  getMapInstance() {
    return this.#map;
  }

  // Get the current active base layer
  getCurrentLayer() {
    for (const [name, layer] of Object.entries(this.#baseLayers)) {
      if (this.#map.hasLayer(layer)) {
        return name;
      }
    }
    return null;
  }

  // Get active overlay layers
  getActiveOverlays() {
    const activeOverlays = [];
    for (const [name, layer] of Object.entries(this.#overlayLayers)) {
      if (this.#map.hasLayer(layer)) {
        activeOverlays.push(name);
      }
    }
    return activeOverlays;
  }
}