export class MessageHandler {
    static showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;

        // Insert after the form
        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(messageDiv, form.nextSibling);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}
