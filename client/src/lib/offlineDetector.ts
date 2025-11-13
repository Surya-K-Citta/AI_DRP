/**
 * Offline Detection Utility
 * Detects network connectivity and provides offline mode support
 */

export class OfflineDetector {
  private static isOnline: boolean = navigator.onLine;
  private static listeners: Array<(online: boolean) => void> = [];
  private static isInitialized: boolean = false;

  static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Set initial status based on navigator.onLine
    this.isOnline = navigator.onLine;
    
    // Listen to online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Browser online event detected');
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Browser offline event detected');
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Check connectivity immediately and periodically
    this.checkConnectivity();
    setInterval(() => this.checkConnectivity(), 10000); // Check every 10 seconds
  }

  static async checkConnectivity(): Promise<boolean> {
    // First check navigator.onLine (synchronous, immediate)
    const navigatorOnline = navigator.onLine;
    
    // If navigator says offline, trust it immediately
    if (!navigatorOnline) {
      if (this.isOnline !== false) {
        console.log('📴 Navigator reports offline');
        this.isOnline = false;
        this.notifyListeners(false);
      }
      return false;
    }
    
    // If navigator says online, verify with a quick fetch
    try {
      // Try to fetch a small resource with cache-busting and short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `${window.location.origin}/favicon.ico?t=${Date.now()}`,
        { 
          method: 'HEAD', 
          cache: 'no-cache', 
          signal: controller.signal 
        }
      );
      
      clearTimeout(timeoutId);
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        console.log(`🌐 Connectivity changed: ${this.isOnline ? 'online' : 'offline'}`);
        this.notifyListeners(this.isOnline);
      }
    } catch (error: any) {
      // Any error means we're offline
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline !== false) {
        console.log('📴 Connectivity check failed, marking as offline:', error.message || error);
        this.notifyListeners(false);
      }
    }
    
    return this.isOnline;
  }

  static getStatus(): boolean {
    // Always check navigator.onLine first (synchronous check)
    const navigatorStatus = navigator.onLine;
    
    // If navigator says offline, trust it immediately
    if (!navigatorStatus) {
      if (this.isOnline !== false) {
        console.log('📴 Navigator reports offline, updating status');
        this.isOnline = false;
      }
      return false;
    }
    
    // Return cached status (will be updated by async checks)
    return this.isOnline;
  }

  static addListener(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    // Check for network-related error codes
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_INTERNET_DISCONNECTED' ||
        error.code === 'ERR_CONNECTION_REFUSED') {
      return true;
    }

    // Check for axios network errors
    if (error.message?.includes('Network Error') || 
        error.message?.includes('timeout') ||
        error.message?.includes('ERR_NETWORK') ||
        error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('fetch failed')) {
      return true;
    }

    // Check for fetch errors
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return true;
    }

    // Check if response is undefined (network issue)
    // This is a key indicator - if there's a request but no response, it's likely a network issue
    if (!error.response && error.request) {
      return true;
    }

    // Check if error is about connection
    if (error.message?.toLowerCase().includes('connection') ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('offline')) {
      return true;
    }

    return false;
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  OfflineDetector.init();
}

