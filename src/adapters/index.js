import { isNative } from './platform.js';
import WebAdapter from './web.js';

// Auto-select the right adapter based on platform
// Why: Your app code just imports 'platform' and it automatically works everywhere
let adapter;

if (isNative()) {
  // We'll create this later when we add Capacitor
  // For now, fall back to web
  adapter = new WebAdapter();
} else {
  adapter = new WebAdapter();
}

export const platform = adapter;
export { isNative, isWeb, isIOS, isAndroid } from './platform.js';