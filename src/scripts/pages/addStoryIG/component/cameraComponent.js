import "../formDesign/camera.css";
import Camera from "../../../utils/camera";
import { convertBase64ToBlob } from "../../../utils";

export default class cameraComponent {
  #camera;
  #isCameraOpen = false;
  #capturedImage = null;
  #onImageCapture;
  #onError;

  constructor(options = {}) {
    this.onImageCapture = options.onImageCapture || (() => {});
    this.onError = options.onError || ((error) => console.error(error));
  }

  render() {
    return `
      <div class="form-group">'
        <label class="required" for="photo-input">Photo</label>
        <div class="file-input-wrapper">
          <div class="file-input-options">
            <button id="photo-input-button" class="btn btn-outline" type="button">
              Upload from Device
            </button>
            <input 
              id="photo-input" 
              name="photo" 
              type="file" 
              accept="image/*"
              hidden="hidden"
            />
            <label for="photo-input" class="visually-hidden">Upload photo</label>
            <button id="open-camera-button" class="btn btn-outline" type="button">
              Take Photo
            </button>
          </div>
          
          <div id="camera-container" class="camera-container">
            <video id="camera-video" class="camera-video">
              Video stream not available.
            </video>
            <canvas id="camera-canvas" class="camera-canvas"></canvas>
            
            <div class="camera-tools">
              <label for="camera-select" class="visually-hidden">Choose camera</label>
              <select id="camera-select"></select>
              <div class="camera-tools-buttons">
                <button id="camera-take-button" class="btn" type="button">
                  Take Photo
                </button>
              </div>
            </div>
          </div>
          
          <div id="image-preview" class="image-preview" style="display: none;">
            <img id="preview-img" alt="Preview" />
            <div class="preview-actions">
              <button type="button" class="btn btn-secondary" id="remove-image-btn">
                Remove
              </button>
            </div>
          </div>
          
          <small class="file-info">Max size: 1MB. Supported formats: JPG, PNG, GIF</small>
        </div>
      </div>
    `;
  }

  afterRender() {
    this.#setupCamera();
    this.#setupFileInput();
    this.#setupImagePreview();
  }

  #setupCamera() {
    try {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });

      this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
        try {
          const image = await this.#camera.takePicture();
          await this.#handleCameraCapture(image);
        } catch (error) {
          console.error('Camera capture error:', error);
          this.#showMessage('Failed to take picture: ' + error.message, 'error');
        }
      });

      // Camera toggle button
      const cameraContainer = document.getElementById('camera-container');
      const openCameraBtn = document.getElementById('open-camera-button');
      
      openCameraBtn.addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Close Camera';
          try {
            await this.#camera.launch();
          } catch (error) {
            console.error('Camera launch error:', error);
            this.#showMessage('Failed to start camera: ' + error.message, 'error');
            this.#isCameraOpen = false;
            cameraContainer.classList.remove('open');
            event.currentTarget.textContent = 'Take Photo';
          }
        } else {
          event.currentTarget.textContent = 'Take Photo';
          this.#camera.stop();
        }
      });

    } catch (error) {
      console.error('Camera setup error:', error);
      this.#showMessage('Camera setup failed. Upload from device is still available.', 'warning');
    }
  }

  #setupFileInput() {
    // File input button
    document.getElementById('photo-input-button').addEventListener('click', () => {
      document.getElementById('photo-input').click();
    });

    // File input change
    document.getElementById('photo-input').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        await this.#handleFileSelect(file);
      }
    });
  }

  #setupImagePreview() {
    // Image preview removal
    document.getElementById('remove-image-btn').addEventListener('click', () => {
      this.#removeImage();
    });
  }

  async #handleFileSelect(file) {
    try {
      // Basic validation can be added here or delegated to parent
      this.#capturedImage = file;
      this.#showImagePreview(URL.createObjectURL(file));
      this.onImageCapture(file, 'file');
    } catch (error) {
      console.error('File validation error:', error);
      this.onError(error);
    }
  }

  async #handleCameraCapture(image) {
    try {
      let blob = image;
      if (typeof image === 'string') {
        blob = await convertBase64ToBlob(image, 'image/png');
      }
      
      this.#capturedImage = new File([blob], `camera-${Date.now()}.png`, { type: 'image/png' });
      this.#showImagePreview(URL.createObjectURL(blob));
      
      // Close camera after capture
      document.getElementById('camera-container').classList.remove('open');
      document.getElementById('open-camera-button').textContent = 'Take Photo';
      this.#camera.stop();
      this.#isCameraOpen = false;

      this.onImageCapture(this.#capturedImage, 'camera');
    } catch (error) {
      console.error('Camera capture processing error:', error);
      this.onError(error);
    }
  }

  #showImagePreview(src) {
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');
    
    if (preview && img) {
      img.src = src;
      preview.style.display = 'block';
    }
  }

  #removeImage() {
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');
    const fileInput = document.getElementById('photo-input');
    
    if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    
    if (img) img.src = '';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    
    this.#capturedImage = null;
    this.onImageCapture(null, 'removed');
  }

  #showMessage(message, type) {
    // Create a simple message display
    // This could be improved by using a parent container or event system
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
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '9999';
    messageEl.style.maxWidth = '300px';
    
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
    
    document.body.appendChild(messageEl);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }

  // Public methods
  getCapturedImage() {
    return this.#capturedImage;
  }

  resetCamera() {
    this.#removeImage();
    
    // Close camera if open
    if (this.#isCameraOpen) {
      const cameraContainer = document.getElementById('camera-container');
      const cameraBtn = document.getElementById('open-camera-button');
      
      if (cameraContainer) cameraContainer.classList.remove('open');
      if (cameraBtn) cameraBtn.textContent = 'Take Photo';
      
      if (this.#camera) this.#camera.stop();
      this.#isCameraOpen = false;
    }
  }

  isCameraOpen() {
    return this.#isCameraOpen;
  }

  stopCamera() {
    if (this.#camera) {
      this.#camera.stop();
    }
  }
}