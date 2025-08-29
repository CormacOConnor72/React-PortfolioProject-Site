/**
 * Viewport Manager - Dynamic sizing for in-app browsers
 * Handles viewport changes and updates CSS custom properties for responsive layouts
 */

class ViewportManager {
  constructor() {
    this.init();
  }

  init() {
    // Set initial values
    this.updateViewportSize();
    
    // Event listeners with debouncing
    let resizeTimer;
    const debouncedUpdate = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.updateViewportSize(), 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', () => {
      // Extra delay for orientation changes as they can be slow
      setTimeout(() => this.updateViewportSize(), 500);
    });

    // Handle page visibility changes (helps with in-app browsers)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => this.updateViewportSize(), 200);
      }
    });
  }

  updateViewportSize() {
    // Get the most accurate viewport width
    const vw = Math.max(
      document.documentElement.clientWidth || 0, 
      window.innerWidth || 0
    );
    
    const vh = Math.max(
      document.documentElement.clientHeight || 0, 
      window.innerHeight || 0
    );

    // Calculate dynamic minimum widths for different breakpoints
    const baseMinWidth = 280;
    const dynamicMinWidth = vw < 400 ? Math.min(baseMinWidth, vw * 0.9) : baseMinWidth;
    
    // Set CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--dynamic-min-width', `${dynamicMinWidth}px`);
    root.style.setProperty('--viewport-width', `${vw}px`);
    root.style.setProperty('--viewport-height', `${vh}px`);
    
    // Add helpful classes for styling hooks
    document.body.classList.toggle('narrow-viewport', vw < 400);
    document.body.classList.toggle('very-narrow-viewport', vw < 350);
    
    // Detect potential in-app browser
    this.detectInAppBrowser();
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`Viewport Manager: ${vw}x${vh}, min-width: ${dynamicMinWidth}px`);
    }
  }

  detectInAppBrowser() {
    const userAgent = navigator.userAgent;
    const isInAppBrowser = /FBAV|FBAN|Instagram|LinkedInApp|TwitterAndroid|Line\/|WeChat|MicroMessenger/.test(userAgent);
    
    document.body.classList.toggle('in-app-browser', isInAppBrowser);
    
    if (isInAppBrowser) {
      document.documentElement.style.setProperty('--in-app-modifier', '0.85');
    } else {
      document.documentElement.style.setProperty('--in-app-modifier', '0.9');
    }
  }

  // Public method to force update (useful for manual triggers)
  forceUpdate() {
    this.updateViewportSize();
  }
}

// Create singleton instance
const viewportManager = new ViewportManager();

// Export for manual control if needed
export default viewportManager;