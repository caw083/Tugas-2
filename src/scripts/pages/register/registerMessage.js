// messageService.js
export class MessageService {
    
    // Show success/error/info messages
    static showMessage(message, type = 'info', containerId = 'registerForm') {
        // Remove existing messages
        this.clearMessages();
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message message`;
        
        // Add icon based on message type
        const icon = this.getMessageIcon(type);
        messageDiv.textContent = icon + message;
        
        // Insert message after specified container
        const container = document.getElementById(containerId);
        if (container) {
            container.parentNode.insertBefore(messageDiv, container.nextSibling);
        }
        
        // Auto-remove message after appropriate time
        const timeout = this.getMessageTimeout(type);
        setTimeout(() => {
            this.removeMessage(messageDiv);
        }, timeout);
    }
    
    // Clear all existing messages
    static clearMessages() {
        const existingMessages = document.querySelectorAll('.message, .success-message, .error-message, .info-message');
        existingMessages.forEach(msg => msg.remove());
    }
    
    // Get icon for message type
    static getMessageIcon(type) {
        const icons = {
            'success': '✅ ',
            'error': '❌ ',
            'info': 'ℹ️ ',
            'warning': '⚠️ '
        };
        return icons[type] || '';
    }
    
    // Get timeout duration for message type
    static getMessageTimeout(type) {
        const timeouts = {
            'success': 3000,
            'error': 5000,
            'info': 4000,
            'warning': 4000
        };
        return timeouts[type] || 3000;
    }
    
    // Remove specific message
    static removeMessage(messageElement) {
        if (messageElement && messageElement.parentNode) {
            messageElement.remove();
        }
    }
    
    // Show loading message
    static showLoading(message = 'Processing...', containerId = 'registerForm') {
        this.showMessage(message, 'info', containerId);
    }
    
    // Show success message
    static showSuccess(message, containerId = 'registerForm') {
        this.showMessage(message, 'success', containerId);
    }
    
    // Show error message
    static showError(message, containerId = 'registerForm') {
        this.showMessage(message, 'error', containerId);
    }
}