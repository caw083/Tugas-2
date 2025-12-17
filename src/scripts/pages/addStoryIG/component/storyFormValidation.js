export default class StoryFormValidator {
    constructor() {
      this.validationRules = {
        description: {
          required: true,
          minLength: 10,
          maxLength: 500,
          pattern: null // Can be added if needed
        },
        photo: {
          required: true,
          maxSize: 1024 * 1024, // 1MB
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
        },
        location: {
          required: false,
          latRange: [-90, 90],
          lonRange: [-180, 180]
        }
      };
      
      this.errorMessages = {
        description: {
          required: 'Description is required',
          minLength: 'Description should be at least 10 characters long',
          maxLength: 'Description should not exceed 500 characters',
          invalid: 'Description contains invalid characters'
        },
        photo: {
          required: 'Photo is required - please upload a file or take a photo with camera',
          invalidType: 'Please select a valid image file (JPG, PNG, GIF)',
          tooLarge: 'File size must be less than 1MB',
          corrupted: 'The selected file appears to be corrupted'
        },
        location: {
          invalidLat: 'Latitude must be between -90 and 90',
          invalidLon: 'Longitude must be between -180 and 180',
          invalidCoordinates: 'Invalid coordinates provided'
        },
        general: {
          networkError: 'Network error occurred. Please check your connection and try again.',
          serverError: 'Server error occurred. Please try again later.',
          unauthorized: 'Authentication failed. Please log in again.',
          fileTooLarge: 'File too large. Please choose a smaller image.',
          tooManyRequests: 'Too many requests. Please wait a moment and try again.',
          unknownError: 'An unexpected error occurred. Please try again.'
        }
      };
    }
  
    /**
     * Validate description field
     * @param {string} description - The description text
     * @returns {Object} - Validation result with isValid and errors
     */
    validateDescription(description) {
      const errors = [];
      const rules = this.validationRules.description;
      const messages = this.errorMessages.description;
  
      // Trim whitespace
      const trimmedDescription = description ? description.trim() : '';
  
      // Required validation
      if (rules.required && !trimmedDescription) {
        errors.push(messages.required);
      }
  
      // Length validations (only if description is not empty)
      if (trimmedDescription) {
        if (rules.minLength && trimmedDescription.length < rules.minLength) {
          errors.push(messages.minLength);
        }
  
        if (rules.maxLength && trimmedDescription.length > rules.maxLength) {
          errors.push(messages.maxLength);
        }
  
        // Pattern validation (if specified)
        if (rules.pattern && !rules.pattern.test(trimmedDescription)) {
          errors.push(messages.invalid);
        }
      }
  
      return {
        isValid: errors.length === 0,
        errors,
        value: trimmedDescription
      };
    }
  
    /**
     * Validate photo/file
     * @param {File} file - The file object
     * @returns {Object} - Validation result with isValid and errors
     */
    validatePhoto(file) {
      const errors = [];
      const rules = this.validationRules.photo;
      const messages = this.errorMessages.photo;
  
      // Required validation
      if (rules.required && !file) {
        errors.push(messages.required);
        return { isValid: false, errors, value: null };
      }
  
      // If file is not required and not provided, it's valid
      if (!rules.required && !file) {
        return { isValid: true, errors: [], value: null };
      }
  
      // File type validation
      if (file && !rules.allowedTypes.includes(file.type)) {
        errors.push(messages.invalidType);
      }
  
      // File size validation
      if (file && rules.maxSize && file.size > rules.maxSize) {
        errors.push(messages.tooLarge);
      }
  
      // File extension validation (additional check)
      if (file && file.name) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!rules.allowedExtensions.includes(extension)) {
          errors.push(messages.invalidType);
        }
      }
  
      // Basic file integrity check
      if (file && file.size === 0) {
        errors.push(messages.corrupted);
      }
  
      return {
        isValid: errors.length === 0,
        errors,
        value: file
      };
    }
  
    /**
     * Validate location coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} - Validation result with isValid and errors
     */
    validateLocation(lat, lon) {
      const errors = [];
      const rules = this.validationRules.location;
      const messages = this.errorMessages.location;
  
      // If both are empty and location is not required, it's valid
      if (!rules.required && (lat === '' || lat === null || lat === undefined) && 
          (lon === '' || lon === null || lon === undefined)) {
        return { isValid: true, errors: [], value: null };
      }
  
      // If only one coordinate is provided
      if ((lat !== '' && lat !== null && lat !== undefined) !== 
          (lon !== '' && lon !== null && lon !== undefined)) {
        errors.push(messages.invalidCoordinates);
      }
  
      // Validate latitude range
      if (lat !== '' && lat !== null && lat !== undefined) {
        const latNum = parseFloat(lat);
        if (isNaN(latNum) || latNum < rules.latRange[0] || latNum > rules.latRange[1]) {
          errors.push(messages.invalidLat);
        }
      }
  
      // Validate longitude range
      if (lon !== '' && lon !== null && lon !== undefined) {
        const lonNum = parseFloat(lon);
        if (isNaN(lonNum) || lonNum < rules.lonRange[0] || lonNum > rules.lonRange[1]) {
          errors.push(messages.invalidLon);
        }
      }
  
      return {
        isValid: errors.length === 0,
        errors,
        value: (lat !== '' && lat !== null && lat !== undefined && 
                lon !== '' && lon !== null && lon !== undefined) 
               ? { lat: parseFloat(lat), lon: parseFloat(lon) } 
               : null
      };
    }
  
    /**
     * Validate entire form
     * @param {Object} formData - Object containing form field values
     * @returns {Object} - Comprehensive validation result
     */
    validateForm(formData) {
      const results = {
        isValid: true,
        errors: {},
        fieldErrors: [],
        values: {}
      };
  
      // Validate description
      const descriptionResult = this.validateDescription(formData.description);
      results.errors.description = descriptionResult.errors;
      results.values.description = descriptionResult.value;
      if (!descriptionResult.isValid) {
        results.isValid = false;
        results.fieldErrors.push(...descriptionResult.errors);
      }
  
      // Validate photo
      const photoResult = this.validatePhoto(formData.photo);
      results.errors.photo = photoResult.errors;
      results.values.photo = photoResult.value;
      if (!photoResult.isValid) {
        results.isValid = false;
        results.fieldErrors.push(...photoResult.errors);
      }
  
      // Validate location
      const locationResult = this.validateLocation(formData.lat, formData.lon);
      results.errors.location = locationResult.errors;
      results.values.location = locationResult.value;
      if (!locationResult.isValid) {
        results.isValid = false;
        results.fieldErrors.push(...locationResult.errors);
      }
  
      return results;
    }
  
    /**
     * Real-time validation for specific field
     * @param {string} fieldName - Name of the field to validate
     * @param {*} value - Value to validate
     * @returns {Object} - Validation result for the specific field
     */
    validateField(fieldName, value) {
      switch (fieldName) {
        case 'description':
          return this.validateDescription(value);
        case 'photo':
          return this.validatePhoto(value);
        case 'location':
          // For location, value should be an object with lat and lon
          return this.validateLocation(value?.lat, value?.lon);
        default:
          return { isValid: true, errors: [], value };
      }
    }
  
    /**
     * Get validation rules for a specific field
     * @param {string} fieldName - Name of the field
     * @returns {Object} - Validation rules for the field
     */
    getFieldRules(fieldName) {
      return this.validationRules[fieldName] || {};
    }
  
    /**
     * Get error messages for a specific field
     * @param {string} fieldName - Name of the field
     * @returns {Object} - Error messages for the field
     */
    getFieldMessages(fieldName) {
      return this.errorMessages[fieldName] || {};
    }
  
    /**
     * Check if field is required
     * @param {string} fieldName - Name of the field
     * @returns {boolean} - Whether the field is required
     */
    isFieldRequired(fieldName) {
      return this.validationRules[fieldName]?.required || false;
    }
  
    /**
     * Get human-readable file size
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    /**
     * Parse and categorize network/HTTP errors
     * @param {Error} error - The error object
     * @returns {string} - User-friendly error message
     */
    parseNetworkError(error) {
      const messages = this.errorMessages.general;
      
      if (!error) return messages.unknownError;
      
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return messages.networkError;
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return messages.unauthorized;
      }
      
      if (errorMessage.includes('413') || errorMessage.includes('Payload Too Large')) {
        return messages.fileTooLarge;
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        return messages.tooManyRequests;
      }
      
      if (errorMessage.includes('500') || errorMessage.includes('502') || 
          errorMessage.includes('503') || errorMessage.includes('504')) {
        return messages.serverError;
      }
      
      return error.message || messages.unknownError;
    }
  
    /**
     * Update validation rules
     * @param {string} fieldName - Field to update rules for
     * @param {Object} newRules - New rules to merge
     */
    updateValidationRules(fieldName, newRules) {
      if (this.validationRules[fieldName]) {
        this.validationRules[fieldName] = {
          ...this.validationRules[fieldName],
          ...newRules
        };
      } else {
        this.validationRules[fieldName] = newRules;
      }
    }
  
    /**
     * Update error messages
     * @param {string} fieldName - Field to update messages for
     * @param {Object} newMessages - New messages to merge
     */
    updateErrorMessages(fieldName, newMessages) {
      if (this.errorMessages[fieldName]) {
        this.errorMessages[fieldName] = {
          ...this.errorMessages[fieldName],
          ...newMessages
        };
      } else {
        this.errorMessages[fieldName] = newMessages;
      }
    }
  
    /**
     * Validate file MIME type more strictly
     * @param {File} file - File to validate
     * @returns {Promise<boolean>} - Whether file type is valid
     */
    async validateFileTypeStrict(file) {
      if (!file) return false;
  
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const arr = new Uint8Array(e.target.result).subarray(0, 4);
          let header = '';
          for (let i = 0; i < arr.length; i++) {
            header += arr[i].toString(16);
          }
  
          // Check file signatures (magic numbers)
          const signatures = {
            '89504e47': 'image/png',
            'ffd8ffe0': 'image/jpeg',
            'ffd8ffe1': 'image/jpeg',
            'ffd8ffe2': 'image/jpeg',
            '47494638': 'image/gif'
          };
  
          const detectedType = signatures[header];
          const isValid = detectedType && this.validationRules.photo.allowedTypes.includes(detectedType);
          resolve(isValid);
        };
  
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 4));
      });
    }
  
    /**
     * Sanitize input to prevent XSS
     * @param {string} input - Input string to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeInput(input) {
      if (typeof input !== 'string') return input;
      
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
  
    /**
     * Get validation summary
     * @param {Object} validationResult - Result from validateForm
     * @returns {string} - Summary message
     */
    getValidationSummary(validationResult) {
      if (validationResult.isValid) {
        return 'All fields are valid';
      }
  
      const errorCount = validationResult.fieldErrors.length;
      return `Found ${errorCount} validation error${errorCount > 1 ? 's' : ''}`;
    }
  }