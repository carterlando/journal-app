// Platform detection
// Why: Checks if we're running in a Capacitor native app or regular browser
export const isNative = () => {
  return window.Capacitor !== undefined;
};

export const isIOS = () => {
  return isNative() && window.Capacitor.getPlatform() === 'ios';
};

export const isAndroid = () => {
  return isNative() && window.Capacitor.getPlatform() === 'android';
};

export const isWeb = () => {
  return !isNative();
};

// Platform adapter interface
// Why: Single place to call platform features - automatically uses web or native version
class PlatformAdapter {
  async recordVideo(options = {}) {
    throw new Error('recordVideo not implemented');
  }

  async uploadFile(file, url) {
    throw new Error('uploadFile not implemented');
  }

  async saveToLocal(key, data) {
    throw new Error('saveToLocal not implemented');
  }

  async getFromLocal(key) {
    throw new Error('getFromLocal not implemented');
  }

  async removeFromLocal(key) {
    throw new Error('removeFromLocal not implemented');
  }

  async getLocation() {
    throw new Error('getLocation not implemented');
  }

  async requestNotificationPermission() {
    throw new Error('requestNotificationPermission not implemented');
  }
}

export default PlatformAdapter;