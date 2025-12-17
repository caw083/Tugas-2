// components/Login.js - Updated to use consistent NavigationService
import "./login_Design/login.css";
import { LoginHandler } from "./loginApi";
import { NavigationLoginService } from "./loginNavigation";

export default class Login {
    constructor() {
        this.loginHandler = new LoginHandler();
    }

    async render() {
        return `
            <section class="container">
                <h1>Login</h1>
                
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label for="loginEmail">Email:</label>
                        <input type="email" id="loginEmail" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Password:</label>
                        <input type="password" id="loginPassword" name="password" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="login-btn">Login</button>
                        <button type="button" id="backToHomeFromLogin" class="back-btn">Back to Home</button>
                    </div>
                    
                    <div class="form-links">
                        <button type="button" id="goToRegister" class="link-btn">Don't have an account? Register here</button>
                    </div>
                </form>
            </section>
        `;
    }

    async afterRender() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Handle form submission
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                this.loginHandler.handleFormSubmission(e);
            });
        }
        
        // Handle navigation buttons using NavigationService
        const backBtn = document.getElementById('backToHomeFromLogin');
        if (backBtn) {
            backBtn.addEventListener('click', () => NavigationLoginService.goToHome());
        }
        
        const registerBtn = document.getElementById('goToRegister');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => NavigationLoginService.goToRegister());
        }
    }

    // Set callback for successful login
    setOnLoginSuccess(callback) {
        this.loginHandler.setOnLoginSuccess(callback);
    }
    
    // Method to navigate to dashboard after successful login
    navigateToDashboard() {
        NavigationLoginService.goToHome();
    }
    
    // Method to navigate with delay (useful for success messages)
    navigateWithDelay(route, delay = 1000) {
        NavigationLoginService.navigateWithDelay(route, delay);
    }
}