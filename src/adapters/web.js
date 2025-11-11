import PlatformAdapter from './platform.js';

// Web-specific implementations using browser APIs
// Why: Uses standard browser features that work in Chrome, Safari, Firefox, etc.
class WebAdapter extends PlatformAdapter {
  
  // Record video using browser's MediaRecorder API
  async recordVideo(options = {}) {
    const maxDuration = options.maxDuration || 300; // 5 minutes default
    
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });

      return {
        stream,
        maxDuration,
        // We'll implement the actual recording UI in a component
      };
    } catch (error) {
      throw new Error(`Camera access denied: ${error.message}`);
    }
  }

  // Upload file to server using fetch API
  async uploadFile(file, url) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response;
  }

  // Store data in browser's localStorage
  // Why: Persists data even when user closes the browser
  async saveToLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      throw new Error(`Failed to save locally: ${error.message}`);
    }
  }

  async getFromLocal(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw new Error(`Failed to read local data: ${error.message}`);
    }
  }

  async removeFromLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new Error(`Failed to remove local data: ${error.message}`);
    }
  }

  // Get user's location using browser's geolocation API
  async getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(new Error(`Location access denied: ${error.message}`));
        }
      );
    });
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export default WebAdapter;