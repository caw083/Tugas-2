export class Validators {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateLoginForm(email, password) {
        const errors = [];

        if (!email || !password) {
            errors.push('Please fill in all fields');
        }

        if (email && !this.isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        if (password && password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        return errors;
    }
}