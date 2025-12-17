// Update src/scripts/pages/login/loginAuth.js
import CONFIG from "../../config";
import { tokenService } from "../../utils/tokenService/tokenService";

const ENDPOINTS = {
    BASE_URL: CONFIG.BASE_URL,
    LOGIN: '/login'
};

export class AuthService {
    static async loginUser(email, password) {
        const url = `${ENDPOINTS.BASE_URL}${ENDPOINTS.LOGIN}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            
            // Save token using TokenService
            if (data.loginResult && data.loginResult.token) {
                tokenService.saveToken(data.loginResult.token);
            }
            
            return data;
        } catch (error) {
            throw new Error(`Login error: ${error.message}`);
        }
    }

    static saveToken(token) {
        return tokenService.saveToken(token);
    }

    static getToken() {
        return tokenService.getToken();
    }

    static removeToken() {
        return tokenService.removeToken();
    }
    
    static isAuthenticated() {
        return tokenService.isAuthenticated();
    }
    
    static logout() {
        tokenService.clearAuthData();
    }
}