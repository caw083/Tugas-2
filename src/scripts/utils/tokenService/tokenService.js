// src/scripts/utils/tokenService.js
export class tokenService {
    static TOKEN_KEY = 'authToken';
    
    // Save token to localStorage
    static saveToken(token) {
        try {
            localStorage.setItem(this.TOKEN_KEY, token);
            return true;
        } catch (error) {
            console.error('Error saving token:', error);
            return false;
        }
    }
    
    // Get token from localStorage
    static getToken() {
        try {
            const token = localStorage.getItem(this.TOKEN_KEY);
            if (token === 'null' || token === 'undefined' || !token) {
                return null;
            }
            return token;
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }
    
    // Remove token from localStorage
    static removeToken() {
        try {
            localStorage.removeItem(this.TOKEN_KEY);
            return true;
        } catch (error) {
            console.error('Error removing token:', error);
            return false;
        }
    }
    
    // Check if user is authenticated
    static isAuthenticated() {
        const token = this.getToken();
        return token !== null;
    }
    
    // Clear all auth data
    static clearAuthData() {
        this.removeToken();
    }
}
