// validation.js
export class ValidationService {
    // Validate required fields
    static validateRequired(fields) {
        for (let field in fields) {
            if (!fields[field] || fields[field].trim() === '') {
                return {
                    isValid: false,
                    message: `${field} is required`
                };
            }
        }
        return { isValid: true };
    }
    
    // Validate email format
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address'
            };
        }
        return { isValid: true };
    }
    
    // Validate password strength
    static validatePassword(password, minLength = 8) {
        if (password.length < minLength) {
            return {
                isValid: false,
                message: `Password must be at least ${minLength} characters long`
            };
        }
        return { isValid: true };
    }
    
    // Validate user registration data
    static validateRegisterData(userData) {
        // Check required fields
        const requiredValidation = this.validateRequired({
            name: userData.name,
            email: userData.email,
            password: userData.password
        });
        
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
        
        // Validate email
        const emailValidation = this.validateEmail(userData.email);
        if (!emailValidation.isValid) {
            return emailValidation;
        }
        
        // Validate password
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
            return passwordValidation;
        }
        
        return { isValid: true, message: 'Validation successful' };
    }
}