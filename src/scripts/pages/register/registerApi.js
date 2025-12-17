// apiService.js
import CONFIG from "../../config";

export class ApiService {
    
    // Base API request method
    static async makeRequest(endpoint, options = {}) {
        try {
            const url = `${CONFIG.BASE_URL}${endpoint}`;
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            
            const requestOptions = { ...defaultOptions, ...options };
            
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            return {
                success: response.ok,
                data: data,
                status: response.status,
                message: data.message || (response.ok ? 'Request successful' : 'Request failed')
            };
            
        } catch (error) {
            return {
                success: false,
                data: null,
                status: 0,
                message: error.message || 'Network error occurred'
            };
        }
    }
    
    // POST request
    static async post(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // GET request
    static async get(endpoint) {
        return this.makeRequest(endpoint, {
            method: 'GET'
        });
    }
    
    // PUT request
    static async put(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // DELETE request
    static async delete(endpoint) {
        return this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }
    
    // Register user
    static async registerUser(userData) {
        const result = await this.post('/register', {
            name: userData.name,
            email: userData.email,
            password: userData.password
        });
        
        return {
            success: result.success,
            data: result.data,
            error: result.success ? null : result.message
        };
    }
    
    // Login user
    static async loginUser(credentials) {
        const result = await this.post('/login', {
            email: credentials.email,
            password: credentials.password
        });
        
        return {
            success: result.success,
            data: result.data,
            error: result.success ? null : result.message
        };
    }
    
    // Get user profile
    static async getUserProfile(token) {
        return this.makeRequest('/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    }
    
    // Update user profile
    static async updateUserProfile(userData, token) {
        return this.makeRequest('/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
    }
}