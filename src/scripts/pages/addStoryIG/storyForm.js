import "./formDesign/mapForm.css"
import "./formDesign/storyForm.css"
import "./formDesign/guestLogin.css"

import StoryFormValidator from "./component/storyFormValidation";
import cameraComponent from "./component/cameraComponent";
import MapForm from "./component/mapForm";
import StoryAPI from "./sendData/sendStory";

import { tokenService } from "../../utils/tokenService/tokenService";

export default class AddStoryForm {
  #form;
  #cameraComponent;
  #mapFormComponent;
  #storyAPI;

  constructor(options = {}) {
    this.isGuest = options.isGuest || false;
    this.token = options.token || tokenService.getToken();

    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || ((error) => console.error(error));
    this.onGuestModeChange = options.onGuestModeChange || (() => {});
    
    // File size limit in bytes (1MB = 1024 * 1024 bytes)
    this.maxFileSize = 1024 * 1024; // 1MB
    
    this.validator = new StoryFormValidator();
    console.log("form page", this.token);
    
    // Initialize API service
    this.#storyAPI = new StoryAPI({
      token: this.token
    });
  }

  async render() {
    return `
      <section class="container">
        <div class="add-story-form">
          <h1>Add New Story</h1>
          
          <!-- Login Mode Selection -->
          <div class="form-group login-mode-selection">
            <label for="login-mode">Login Mode</label>
            <select id="login-mode" name="login-mode" class="form-select">
              <option value="authenticated" ${!this.isGuest ? 'selected' : ''}>
                Login with Account
              </option>
              <option value="guest" ${this.isGuest ? 'selected' : ''}>
                Login as Guest
              </option>
            </select>
            <div class="login-mode-info">
              <small id="login-mode-description">
                ${this.isGuest 
                  ? 'You are posting as a guest. Your story will be public but not linked to an account.' 
                  : 'You are logged in with your account. Your story will be saved to your profile.'
                }
              </small>
            </div>
          </div>
          
          <form id="story-form" class="story-form">
            <div class="form-group">
              <label for="description" class="required">Description</label>
              <textarea 
                id="description" 
                name="description" 
                placeholder="Tell your story..." 
                required
                rows="4"
              ></textarea>
              <div class="field-info">
                <small>Minimum 10 characters, maximum 500 characters</small>
                <div class="char-counter" id="char-counter">0/500</div>
              </div>
            </div>

            <!-- Guest Information Section -->
            <div id="guest-info-section" class="form-group guest-section" ${!this.isGuest ? 'style="display: none;"' : ''}>
              <label for="guest-name">Name (Optional for Guest)</label>
              <input 
                type="text" 
                id="guest-name" 
                name="guest-name" 
                placeholder="Enter your name (optional)"
                maxlength="50"
              />
              <div class="field-info">
                <small>Optional: Add your name to be displayed with the story</small>
              </div>
            </div>

            <div id="camera-component-container"></div>

            <div id="map-form-container"></div>

            <div class="form-actions">
              <span id="submit-button-container">
                <button class="btn" type="submit">
                  ${this.isGuest ? 'Add Story as Guest' : 'Add Story'}
                </button>
              </span>
              <button type="button" class="btn btn-outline" id="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('AfterRender started');
    
    // Setup in sequence with proper waiting
    this.#setupForm();
    console.log('Form setup completed');
    
    this.#setupLoginModeSelection();
    console.log('Login mode selection setup completed');
    
    this.#setupCameraComponent();
    console.log('Camera component setup completed');
    
    this.#setupMapFormComponent();
    console.log('Map form component setup completed');
    
    console.log('AfterRender completed');
  }

  #setupForm() {
    this.#form = document.getElementById('story-form');
    
    // Form submission
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.#handleSubmit();
    });

    // Description input with character counter
    const descriptionInput = document.getElementById('description');
    const charCounter = document.getElementById('char-counter');
    
    descriptionInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCounter.textContent = `${length}/500`;
      charCounter.style.color = length > 500 ? '#dc2626' : length > 450 ? '#f59e0b' : '#6b7280';
    });

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.#resetForm();
    });
  }

  #setupLoginModeSelection() {
    const loginModeSelect = document.getElementById('login-mode');
    const loginModeDescription = document.getElementById('login-mode-description');
    const guestInfoSection = document.getElementById('guest-info-section');
    const submitButton = document.querySelector('#submit-button-container button');

    loginModeSelect.addEventListener('change', (e) => {
      const selectedMode = e.target.value;
      const wasGuest = this.isGuest;
      this.isGuest = selectedMode === 'guest';

      // Update description text
      if (this.isGuest) {
        loginModeDescription.textContent = 'You are posting as a guest. Your story will be public but not linked to an account.';
        guestInfoSection.style.display = 'block';
        if (submitButton) {
          submitButton.textContent = 'Add Story as Guest';
        }
      } else {
        loginModeDescription.textContent = 'You are logged in with your account. Your story will be saved to your profile.';
        guestInfoSection.style.display = 'none';
        if (submitButton) {
          submitButton.textContent = 'Add Story';
        }
      }

      // Update API service guest mode
      if (this.#storyAPI) {
        this.#storyAPI.setGuestMode(this.isGuest);
      }

      // Call callback if mode changed
      if (wasGuest !== this.isGuest) {
        this.onGuestModeChange(this.isGuest);
      }

      console.log('Login mode changed to:', selectedMode, 'isGuest:', this.isGuest);
    });
  }

  #setupCameraComponent() {
    this.#cameraComponent = new cameraComponent({
      onImageCapture: (file, source) => {
        this.#handleImageCapture(file, source);
      },
      onError: (error) => {
        this.#showMessage(error.message || 'Camera error occurred', 'error');
      }
    });

    // Render camera component
    const container = document.getElementById('camera-component-container');
    if (container) {
      container.innerHTML = this.#cameraComponent.render();
      this.#cameraComponent.afterRender();
    }
  }

  #setupMapFormComponent() {
    this.#mapFormComponent = new MapForm({
      onLocationChange: (locationData) => {
        this.#handleLocationChange(locationData);
      },
      onError: (error) => {
        this.#showMessage(error.message || 'Map error occurred', 'error');
      }
    });

    // Render map form component
    const container = document.getElementById('map-form-container');
    if (container) {
      container.innerHTML = this.#mapFormComponent.render();
      this.#mapFormComponent.afterRender();
    }
  }

  #handleImageCapture(file, source) {
    console.log('Image captured from:', source, file);
    
    if (source === 'removed') {
      // Image was removed
      console.log('Image removed');
    } else {
      // Image was captured/selected - validate file size using API service
      if (file) {
        const validation = StoryAPI.validateImageFile(file, this.maxFileSize);
        if (!validation.isValid) {
          this.#showMessage(validation.error, 'error');
          
          // Reset the camera component to remove the invalid file
          if (this.#cameraComponent) {
            setTimeout(() => {
              this.#cameraComponent.resetCamera();
            }, 100);
          }
        } else {
          console.log('New image selected:', file?.name || 'unknown');
        }
      }
    }
  }

  #handleLocationChange(locationData) {    
    // Show success message if location was updated with accuracy info
    if (locationData.message) {
      this.#showMessage(locationData.message, 'success');
    }
  }

  async #handleSubmit() {
    try {
      const validationResult = await this.#validateFormData();
      
      if (!validationResult.isValid) {
        this.#showMessage(this.validator.getValidationSummary(validationResult), 'error');
        return;
      }

      this.#showSubmitLoadingButton();

      // Prepare story data
      const storyData = this.#prepareStoryData();
      
      // Create FormData using API service
      const formData = StoryAPI.createFormData(storyData);
      
      // Submit using API service
      const response = await this.#storyAPI.submitStory(formData, this.isGuest);
      
      if (response.error === false) {
        const successMessage = this.isGuest 
          ? 'Story added successfully as guest!' 
          : 'Story added successfully!';
        this.#showMessage(successMessage, 'success');
        this.#resetForm();
        this.onSuccess(response);
        
        // Navigate to home page after successful submission
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to add story');
      }
    } catch (error) {
      console.error('Submission error:', error);
      this.#showMessage(this.validator.parseNetworkError ? this.validator.parseNetworkError(error) : error.message, 'error');
      this.onError(error);
    } finally {
      this.#hideSubmitLoadingButton();
    }
  }

  async #validateFormData() {
    try {
      const location = this.#mapFormComponent.getLocation();
      const capturedImage = this.#cameraComponent.getCapturedImage();
      
      // Validate file size using API service
      if (capturedImage) {
        const validation = StoryAPI.validateImageFile(capturedImage, this.maxFileSize);
        if (!validation.isValid) {
          return { isValid: false, errors: [validation.error] };
        }
      }
      
      const formData = {
        description: this.#form.elements.namedItem('description').value,
        photo: capturedImage,
        lat: location ? location.latitude : '',
        lon: location ? location.longitude : '',
        guestName: this.isGuest ? (this.#form.elements.namedItem('guest-name')?.value || '') : ''
      };

      return this.validator.validateForm(formData);
    } catch (error) {
      console.error('Form validation error:', error);
      return { isValid: false, errors: ['Form validation failed'] };
    }
  }

  #prepareStoryData() {
    const location = this.#mapFormComponent.getLocation();
    const capturedImage = this.#cameraComponent.getCapturedImage();
    
    const storyData = {
      description: this.#form.elements.namedItem('description').value,
      photo: capturedImage,
      lat: location ? location.latitude : null,
      lon: location ? location.longitude : null,
      isGuest: this.isGuest
    };

    // Add guest name if in guest mode
    if (this.isGuest) {
      const guestNameInput = this.#form.elements.namedItem('guest-name');
      storyData.guestName = guestNameInput ? guestNameInput.value.trim() : '';
    }

    return storyData;
  }

  #resetForm() {
    if (!this.#form) return;
    
    this.#form.reset();
    
    // Reset camera component
    if (this.#cameraComponent) {
      this.#cameraComponent.resetCamera();
    }
    
    // Reset map form component
    if (this.#mapFormComponent) {
      this.#mapFormComponent.resetLocation();
    }
    
    // Reset character counter
    const charCounter = document.getElementById('char-counter');
    if (charCounter) {
      charCounter.textContent = '0/500';
      charCounter.style.color = '#6b7280';
    }

    // Reset login mode to current state
    const loginModeSelect = document.getElementById('login-mode');
    if (loginModeSelect) {
      loginModeSelect.value = this.isGuest ? 'guest' : 'authenticated';
    }
  }

  #showMessage(message, type) {
    if (!this.#form) return;
    
    // Remove existing messages
    const existingMessage = this.#form.querySelector('.error-message, .success-message, .warning-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageEl = document.createElement('div');
    const className = type === 'error' ? 'error-message' : 
                     type === 'warning' ? 'warning-message' : 'success-message';
    messageEl.className = className;
    messageEl.textContent = message;
    
    // Add some basic styling
    messageEl.style.padding = '10px';
    messageEl.style.marginBottom = '15px';
    messageEl.style.borderRadius = '4px';
    messageEl.style.border = '1px solid';
    
    if (type === 'error') {
      messageEl.style.backgroundColor = '#f8d7da';
      messageEl.style.color = '#721c24';
      messageEl.style.borderColor = '#f5c6cb';
    } else if (type === 'warning') {
      messageEl.style.backgroundColor = '#fff3cd';
      messageEl.style.color = '#856404';
      messageEl.style.borderColor = '#ffeaa7';
    } else {
      messageEl.style.backgroundColor = '#d4edda';
      messageEl.style.color = '#155724';
      messageEl.style.borderColor = '#c3e6cb';
    }
    
    this.#form.appendChild(messageEl);
    
    // Auto-remove success/warning messages after 5 seconds
    if (type === 'success' || type === 'warning') {
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 5000);
    }
  }

  #showSubmitLoadingButton() {
    const container = document.getElementById('submit-button-container');
    if (container) {
      const buttonText = this.isGuest ? 'Adding Story as Guest...' : 'Adding Story...';
      container.innerHTML = `
        <button class="btn" type="submit" disabled style="opacity: 0.6;">
          ${buttonText}
        </button>
      `;
    }
  }

  #hideSubmitLoadingButton() {
    const container = document.getElementById('submit-button-container');
    if (container) {
      const buttonText = this.isGuest ? 'Add Story as Guest' : 'Add Story';
      container.innerHTML = `
        <button class="btn" type="submit">${buttonText}</button>
      `;
    }
  }

  // Public methods
  setToken(token) {
    this.token = token;
    this.isGuest = !token;
    this.#storyAPI.setToken(token);
    
    // Update UI to reflect authentication state
    this.#updateLoginModeUI();
  }

  setGuestMode(isGuest) {
    this.isGuest = isGuest;
    this.#updateLoginModeUI();
  }

  #updateLoginModeUI() {
    const loginModeSelect = document.getElementById('login-mode');
    const guestInfoSection = document.getElementById('guest-info-section');
    const submitButton = document.querySelector('#submit-button-container button');
    const loginModeDescription = document.getElementById('login-mode-description');

    if (loginModeSelect) {
      loginModeSelect.value = this.isGuest ? 'guest' : 'authenticated';
    }

    if (guestInfoSection) {
      guestInfoSection.style.display = this.isGuest ? 'block' : 'none';
    }

    if (submitButton) {
      submitButton.textContent = this.isGuest ? 'Add Story as Guest' : 'Add Story';
    }

    if (loginModeDescription) {
      loginModeDescription.textContent = this.isGuest 
        ? 'You are posting as a guest. Your story will be public but not linked to an account.'
        : 'You are logged in with your account. Your story will be saved to your profile.';
    }
  }

  setApiBaseUrl(url) {
    this.#storyAPI.setApiBaseUrl(url);
  }

  setInitialLocation(latitude, longitude) {
    if (this.#mapFormComponent) {
      this.#mapFormComponent.setLocation(latitude, longitude);
    }
  }

  getLocation() {
    return this.#mapFormComponent ? this.#mapFormComponent.getLocation() : null;
  }

  // Get current guest mode
  getGuestMode() {
    return this.isGuest;
  }

  // Get guest name if in guest mode
  getGuestName() {
    if (this.isGuest) {
      const guestNameInput = document.getElementById('guest-name');
      return guestNameInput ? guestNameInput.value.trim() : '';
    }
    return '';
  }

  // Method to set custom file size limit (optional)
  setMaxFileSize(sizeInBytes) {
    this.maxFileSize = sizeInBytes;
  }

  // Get current file size limit in MB (optional)
  getMaxFileSizeMB() {
    return (this.maxFileSize / (1024 * 1024)).toFixed(2);
  }

  // Clean up resources
  destroy() {
    if (this.#mapFormComponent) {
      this.#mapFormComponent.destroy();
    }
  }
}