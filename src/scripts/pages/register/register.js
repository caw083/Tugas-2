// register.js
import "./register.css";
import { ValidationService } from "./registerValidator";
import { MessageService } from "./registerMessage";
import { NavigationService } from "./registerNavigaton";
import { ApiService } from "./registerApi";

export default class Register {
    async render() {
      return `
        <section class="container">
          <h1>Register</h1>
          
          <form id="registerForm" class="register-form">
            <div class="form-group">
              <label for="name">Nama:</label>
              <input type="text" id="name" name="name" class="name" required>
            </div>
            
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="register-btn">Register</button>
              <button type="button" id="backToHome" class="back-btn">Back to Home</button>
            </div>
          </form>
        </section>
      `;
    }
  
    async afterRender() {
      this.bindEvents();
    }
    
    bindEvents() {
      const form = document.getElementById('registerForm');
      const backBtn = document.getElementById('backToHome');
      
      // Handle form submission
      if (form) {
        form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
      
      // Handle back button
      if (backBtn) {
        backBtn.addEventListener('click', () => NavigationService.goToHome());
      }
    }
    
    async handleSubmit(e) {
      e.preventDefault();
      
      const form = e.target;
      
      // Add loading state
      form.classList.add('loading');
      
      try {
        // Get form data
        const userData = this.getFormData(form);
        
        // Validate data
        const validation = ValidationService.validateRegisterData(userData);
        if (!validation.isValid) {
          MessageService.showError(validation.message);
          return;
        }
        
        // Send to server
        const result = await ApiService.registerUser(userData);
        
        if (result.success) {
          MessageService.showSuccess(`Registration successful! Welcome ${userData.name}! Please check your email for verification.`);
          
          // Reset form and navigate after delay
          setTimeout(() => {
            form.reset();
            MessageService.showMessage('Redirecting to login page...', 'info');
            NavigationService.navigateWithDelay('#/login', 1000);
          }, 2000);
        } else {
          MessageService.showError('Registration failed: ' + result.error);
        }
        
      } catch (error) {
        MessageService.showError('Registration failed: ' + error.message);
      } finally {
        // Remove loading state
        form.classList.remove('loading');
      }
    }
    
    getFormData(form) {
      const formData = new FormData(form);
      return {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        password: formData.get('password')
      };
    }
}