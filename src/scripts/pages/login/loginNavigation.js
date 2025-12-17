// loginNavigation.js - Updated to match register navigation pattern
export class NavigationLoginService {
    
    // Navigate to specific route
    static navigateTo(route) {
        window.location.hash = route;
    }
    
    // Navigate to home page
    static goToHome() {
        this.navigateTo('#/');
    }
    
    // Navigate to login page
    static goToLogin() {
        this.navigateTo('#/login');
    }
    
    // Navigate to register page
    static goToRegister() {
        this.navigateTo('#/register');
    }
    
    // Navigate to dashboard
    static goToDashboard() {
        this.navigateTo('#/about');
    }
    
    // Navigate to profile
    static goToProfile() {
        this.navigateTo('#/profile');
    }
    
    // Navigate back
    static goBack() {
        window.history.back();
    }
    
    // Navigate forward
    static goForward() {
        window.history.forward();
    }
    
    // Get current route
    static getCurrentRoute() {
        return window.location.hash;
    }
    
    // Check if current route matches
    static isCurrentRoute(route) {
        return this.getCurrentRoute() === route;
    }
    
    // Navigate with delay
    static navigateWithDelay(route, delay = 1000) {
        setTimeout(() => {
            this.navigateTo(route);
        }, delay);
    }
    
    // Redirect to external URL
    static redirectToExternal(url) {
        window.location.href = url;
    }
    
    // Replace current route (no history entry)
    static replaceTo(route) {
        window.location.replace(window.location.origin + window.location.pathname + route);
    }
}