import CONFIG from "../../../config";

/**
 * API service for story-related operations
 * Base URL from config: https://story-api.dicoding.dev/v1
 */
export default class StoryAPI {
  constructor(options = {}) {
    this.apiBaseUrl = CONFIG.BASE_URL;
    this.token = options.token;
 ;
  }

  /**
   * Set authentication token
   * @param {string} token - Bearer token for authentication
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set API base URL
   * @param {string} url - Base URL for the API
   */
  setApiBaseUrl(url) {
    this.apiBaseUrl = url;
  }

  /**
   * Add new story with authentication
   * @param {FormData} formData - Form data containing story details
   * @param {string} formData.description - Story description
   * @param {File} formData.photo - Image file (max 1MB)
   * @param {number} [formData.lat] - Latitude (optional)
   * @param {number} [formData.lon] - Longitude (optional)
   * @returns {Promise<Object>} Response object
   */
  async addStory(formData) {
    if (!this.token) {
      throw new Error('Authentication token is required for this operation');
    }

    const url = `${this.apiBaseUrl}/stories`;
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }

  /**
   * Add new story as guest (without authentication)
   * @param {FormData} formData - Form data containing story details
   * @param {string} formData.description - Story description
   * @param {File} formData.photo - Image file (max 1MB)
   * @param {number} [formData.lat] - Latitude (optional)
   * @param {number} [formData.lon] - Longitude (optional)
   * @returns {Promise<Object>} Response object
   */
  async addStoryGuest(formData) {
    const url = `${this.apiBaseUrl}/stories/guest`;
    
    const options = {
      method: 'POST',
      body: formData
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding guest story:', error);
      throw error;
    }
  }

  /**
   * Add story - automatically chooses between authenticated or guest mode
   * @param {FormData} formData - Form data containing story details
   * @param {boolean} isGuest - Whether to add as guest or authenticated user
   * @returns {Promise<Object>} Response object
   */
  async submitStory(formData, isGuest = false) {
    if (isGuest) {
      return await this.addStoryGuest(formData);
    } else {
      return await this.addStory(formData);
    }
  }

  /**
   * Validate image file size
   * @param {File} file - Image file to validate
   * @param {number} maxSizeBytes - Maximum file size in bytes (default: 1MB)
   * @returns {Object} Validation result
   */
  static validateImageFile(file, maxSizeBytes = 1024 * 1024) {
    if (!file) {
      return { isValid: true };
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
      
      return {
        isValid: false,
        error: `File size too large: ${fileSizeMB}MB. Maximum allowed size is ${maxSizeMB}MB.`
      };
    }

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'File must be a valid image file.'
      };
    }

    return { isValid: true };
  }

  /**
   * Create FormData object for story submission
   * @param {Object} storyData - Story data object
   * @param {string} storyData.description - Story description
   * @param {File} [storyData.photo] - Image file
   * @param {number} [storyData.lat] - Latitude
   * @param {number} [storyData.lon] - Longitude
   * @returns {FormData} FormData object ready for submission
   */
  static createFormData(storyData) {
    const formData = new FormData();
    
    // Add description
    if (storyData.description) {
      formData.append('description', storyData.description);
    }
    
    // Add photo if provided
    if (storyData.photo) {
      formData.append('photo', storyData.photo);
    }
    
    // Add location if provided
    if (storyData.lat !== undefined && storyData.lat !== null && storyData.lat !== '') {
      formData.append('lat', storyData.lat);
    }
    
    if (storyData.lon !== undefined && storyData.lon !== null && storyData.lon !== '') {
      formData.append('lon', storyData.lon);
    }
    
    return formData;
  }
}