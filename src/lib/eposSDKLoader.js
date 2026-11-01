/**
 * Epson ePOS SDK Loader
 *
 * The official Epson ePOS SDK for JavaScript is a proprietary library that must
 * be loaded from Epson's CDN or included locally. This module dynamically loads
 * the SDK and provides a promise-based wrapper.
 *
 * SDK Source:
 *   https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6917&scat=61&lang=en
 *
 * We load it from the official Epson ePOS-Print CDN endpoint. Alternatively,
 * download 'epos-2.27.0.js' from Epson's developer site and place it in /public/.
 *
 * ePOS SDK Documentation:
 *   https://reference.epson-biz.com/modules/ref_epos_sdk_js/index.php
 */

const EPOS_SDK_URL = '/epos-sdk/epos-2.27.0.js';
const EPOS_SDK_CDN_FALLBACK = 'https://cdnjs.cloudflare.com/ajax/libs/epson-pos-sdk/2.27.0/epos-2.27.0.min.js';

let sdkLoadPromise = null;
let sdkLoaded = false;

/**
 * Load the Epson ePOS SDK script into the document.
 * Returns a promise that resolves when the SDK is ready.
 */
export function loadEposSDK() {
  if (sdkLoaded && window.epson && window.epson.ePOSDevice) {
    return Promise.resolve(true);
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    // First attempt: local copy in /public/epos-sdk/
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = EPOS_SDK_URL;

    script.onload = () => {
      if (window.epson && window.epson.ePOSDevice) {
        sdkLoaded = true;
        resolve(true);
      } else {
        // Script loaded but epson namespace not found — try CDN fallback
        tryFallback(resolve, reject);
      }
    };

    script.onerror = () => {
      // Local copy not found, try CDN fallback
      tryFallback(resolve, reject);
    };

    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

function tryFallback(resolve, reject) {
  const fallback = document.createElement('script');
  fallback.type = 'text/javascript';
  fallback.src = EPOS_SDK_CDN_FALLBACK;

  fallback.onload = () => {
    if (window.epson && window.epson.ePOSDevice) {
      sdkLoaded = true;
      resolve(true);
    } else {
      reject(new Error(
        'Epson ePOS SDK loaded but epson.ePOSDevice not found. ' +
        'Please download the official SDK from Epson and place epos-2.27.0.js in /public/epos-sdk/.'
      ));
    }
  };

  fallback.onerror = () => {
    reject(new Error(
      'Failed to load Epson ePOS SDK from both local and CDN sources. ' +
      'Download the official SDK from:\n' +
      'https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6917&scat=61&lang=en\n' +
      'Place epos-2.27.0.js in the /public/epos-sdk/ folder.'
    ));
  };

  document.head.appendChild(fallback);
}

/**
 * Check if the ePOS SDK is currently available in the window scope.
 */
export function isEposSDKAvailable() {
  return !!(window.epson && window.epson.ePOSDevice);
}

/**
 * Get SDK version info if available.
 */
export function getSDKInfo() {
  if (!isEposSDKAvailable()) {
    return { loaded: false, version: null };
  }
  return {
    loaded: true,
    version: window.epson?.ePOSDevice?.version || 'unknown',
  };
}
