/**
 * Epson ePOS Printer Service
 *
 * Wraps the official Epson ePOS SDK (epson.ePOSDevice) to provide
 * promise-based printer connectivity and printing for the Epson TM-m30III.
 *
 * Official SDK Reference:
 *   https://reference.epson-biz.com/modules/ref_epos_sdk_js/index.php
 *
 * Important notes about HTTPS / Mixed Content:
 *   - When your website is deployed on HTTPS (e.g. Netlify), the browser will
 *     BLOCK connections to an HTTP printer IP (mixed content).
 *   - To fix this, use the printer's HTTPS endpoint (port 8043) with TLS.
 *   - The Epson TM-m30III supports automatic certificate update via Epson's CA.
 *   - Alternatively, install Epson's self-signed certificate as trusted on your tablet.
 *   - See README.md for full setup instructions.
 *
 *   Chrome Local Network Access:
 *   - Chrome may show a permission dialog for private IP access from HTTPS pages.
 *   - Always trigger connection from a user click (never automatically on page load).
 */

import { loadEposSDK, isEposSDKAvailable } from './eposSDKLoader.js';

export const CONNECTION_STATUS = {
  IDLE: 'idle',
  LOADING_SDK: 'loading_sdk',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

export const PRINT_STATUS = {
  IDLE: 'idle',
  PRINTING: 'printing',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Epson ePOS SDK result codes
const RESULT_CODES = {
  OK: 'OK',
  ERROR: 'ERROR',
  ERROR_TIMEOUT: 'ERROR_TIMEOUT',
  ERROR_STOP: 'ERROR_STOP',
  ERROR_RECOVERY: 'ERROR_RECOVERY',
  ERROR_COVER_OPEN: 'ERROR_COVER_OPEN',
  ERROR_PAPER: 'ERROR_PAPER',
  ERROR_PAPER_FEED: 'ERROR_PAPER_FEED',
  ERROR_AUTOCUTTER: 'ERROR_PAPER_CUTTER',
  ERROR_MECHANICAL: 'ERROR_MECHANICAL',
  ERROR_ELECTRONIC: 'ERROR_ELECTRONIC',
  ERROR_EMPTY: 'ERROR_EMPTY',
  ERROR_NOT_FOUND: 'ERROR_NOT_FOUND',
  ERROR_SYSTEM: 'ERROR_SYSTEM',
  ERROR_PORT: 'ERROR_PORT',
  ERROR_RESET: 'ERROR_RESET',
  ERROR_BATTERY_LOW: 'ERROR_BATTERY_LOW',
};

export function describeResultCode(code) {
  const map = {
    OK: 'Print job accepted successfully.',
    ERROR: 'An unspecified error occurred.',
    ERROR_TIMEOUT: 'Connection timed out. Check printer IP and network.',
    ERROR_STOP: 'Printer stopped (paper jam or other mechanical issue).',
    ERROR_RECOVERY: 'Printer recovered from error.',
    ERROR_COVER_OPEN: 'Printer cover is open. Please close the cover.',
    ERROR_PAPER: 'Paper error. Check paper roll.',
    ERROR_PAPER_FEED: 'Paper feed error.',
    ERROR_AUTOCUTTER: 'Auto-cutter error.',
    ERROR_MECHANICAL: 'Mechanical error. Contact service.',
    ERROR_ELECTRONIC: 'Electronic error. Contact service.',
    ERROR_EMPTY: 'Paper roll is empty. Please replace the paper.',
    ERROR_NOT_FOUND: 'Printer not found at this address.',
    ERROR_SYSTEM: 'System error in ePOS SDK.',
    ERROR_PORT: 'Port error. Check port number.',
    ERROR_RESET: 'Printer was reset.',
    ERROR_BATTERY_LOW: 'Battery low.',
  };
  return map[code] || `Unknown result code: ${code}`;
}

export function describeConnectionError(code) {
  const map = {
    SSL_CONNECT_ERROR: 'TLS/SSL connection failed. The printer certificate may not be trusted. See README for certificate setup.',
    BROWSER_INCOMPATIBLE: 'Browser is not compatible with Epson ePOS SDK.',
    TIMEOUT: 'Connection timed out. Verify printer IP and port.',
    NETWORK_UNREACHABLE: 'Printer is unreachable on the network. Check LAN/Wi-Fi connection.',
    CERTIFICATE_ERROR: 'Certificate verification failed. See README for certificate trust instructions.',
    MIXED_CONTENT: 'Mixed content blocked. Your HTTPS site cannot reach an HTTP printer. Use HTTPS port 8043 on the printer.',
    CORS: 'CORS error. The printer rejected the cross-origin request. Ensure ePOS-Print is enabled on the printer.',
    DEVICE_NOT_FOUND: 'Device ID not found on the printer. Check the Device ID setting.',
  };
  return map[code] || `Connection error: ${code}`;
}

class PrinterService {
  constructor() {
    this.eposDevice = null;
    this.printer = null;
    this.config = null;
    this._isPrinting = false;
    this._statusCallback = null;
  }

  /**
   * Set a callback to receive status updates from the printer.
   * Called with { type, message, data } objects.
   */
  onStatusUpdate(cb) {
    this._statusCallback = cb;
  }

  _emit(type, message, data = {}) {
    if (this._statusCallback) {
      this._statusCallback({ type, message, data, timestamp: new Date().toISOString() });
    }
  }

  /**
   * Connect to the Epson printer via ePOS SDK.
   * Must be called from a user gesture (click handler) to satisfy Chrome's
   * local network access policy.
   *
   * @param {Object} config - Printer configuration from localStorage
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async connect(config) {
    this.config = config;

    // Step 1: Load SDK
    this._emit('info', 'Loading Epson ePOS SDK...');
    try {
      await loadEposSDK();
    } catch (err) {
      this._emit('error', `SDK load failed: ${err.message}`);
      return { success: false, message: err.message };
    }

    if (!isEposSDKAvailable()) {
      const msg = 'Epson ePOS SDK is not available. See diagnostics for SDK setup instructions.';
      this._emit('error', msg);
      return { success: false, message: msg };
    }

    this._emit('success', 'Epson ePOS SDK loaded successfully.');

    // Step 2: Disconnect any existing connection
    if (this.eposDevice) {
      try {
        this.eposDevice.disconnect();
      } catch (_) {}
      this.eposDevice = null;
      this.printer = null;
    }

    // Step 3: Build connection URL
    const { ipAddress, protocol, port, deviceId } = config;
    const address = ipAddress?.trim();

    if (!address) {
      return { success: false, message: 'Printer IP address is not set.' };
    }

    this._emit('info', `Connecting to ${protocol}://${address}:${port} (DeviceID: ${deviceId})...`);

    // Detect mixed-content risk
    if (window.location.protocol === 'https:' && protocol === 'http') {
      const warning =
        'WARNING: Your page is on HTTPS but the printer uses HTTP. ' +
        'Chrome will block this (mixed content). Switch to HTTPS port 8043 and trust the printer certificate.';
      this._emit('warning', warning);
    }

    return new Promise((resolve) => {
      try {
        const device = new window.epson.ePOSDevice();
        this.eposDevice = device;

        const connectionTimeout = setTimeout(() => {
          this._emit('error', 'Connection timed out after 15 seconds.');
          resolve({
            success: false,
            message: 'Connection timed out. Verify printer IP, port, and that ePOS-Print is enabled on the printer.',
          });
        }, 15000);

        device.connect(address, port, (resultCode) => {
          clearTimeout(connectionTimeout);

          if (resultCode === 'OK' || resultCode === 'SSL_CONNECT_OK') {
            this._emit('info', `ePOSDevice connected (${resultCode}). Getting printer object...`);

            const options = resultCode === 'SSL_CONNECT_OK' ? { crypto: true, buffer: false } : { crypto: false, buffer: false };

            device.createDevice(
              deviceId || 'local_printer',
              device.DEVICE_TYPE_PRINTER,
              options,
              (printerObj, errorCode) => {
                if (printerObj) {
                  this.printer = printerObj;

                  // Set up printer status event listener
                  printerObj.onreceive = (res) => {
                    this._handlePrinterResponse(res);
                  };

                  printerObj.onerror = (err) => {
                    this._emit('error', `Printer error event: ${JSON.stringify(err)}`);
                  };

                  printerObj.onstatuschange = (status) => {
                    this._emit('info', `Printer status changed: ${JSON.stringify(status)}`);
                  };

                  printerObj.ononline = () => {
                    this._emit('success', 'Printer is online.');
                  };

                  printerObj.onoffline = () => {
                    this._emit('warning', 'Printer went offline.');
                  };

                  printerObj.onpaperempty = () => {
                    this._emit('warning', 'Paper empty! Please replace the paper roll.');
                  };

                  printerObj.onpapernearempty = () => {
                    this._emit('warning', 'Paper is running low. Replace soon.');
                  };

                  printerObj.oncoveropen = () => {
                    this._emit('warning', 'Printer cover opened.');
                  };

                  this._emit('success', `Printer connected successfully! Device: ${deviceId}`);
                  resolve({ success: true, message: 'Printer connected successfully!' });
                } else {
                  const errDesc = describeConnectionError(errorCode);
                  this._emit('error', `createDevice failed: ${errorCode} — ${errDesc}`);
                  resolve({
                    success: false,
                    message: `Failed to create printer device: [${errorCode}] ${errDesc}`,
                  });
                }
              }
            );
          } else {
            const errDesc = describeConnectionError(resultCode);
            this._emit('error', `ePOSDevice.connect failed: ${resultCode} — ${errDesc}`);
            resolve({
              success: false,
              message: `Connection failed: [${resultCode}] ${errDesc}`,
            });
          }
        });
      } catch (err) {
        this._emit('error', `Exception during connect: ${err.message}`);
        resolve({
          success: false,
          message: `Exception: ${err.message}`,
        });
      }
    });
  }

  /**
   * Disconnect from the printer.
   */
  disconnect() {
    if (this.printer) {
      try {
        this.printer.disconnect?.();
      } catch (_) {}
      this.printer = null;
    }
    if (this.eposDevice) {
      try {
        this.eposDevice.disconnect();
      } catch (_) {}
      this.eposDevice = null;
    }
    this._emit('info', 'Printer disconnected.');
    return { success: true, message: 'Disconnected.' };
  }

  /**
   * Check if currently connected to the printer.
   */
  isConnected() {
    return !!(this.printer && this.eposDevice);
  }

  /**
   * Send a print job to the Epson TM-m30III.
   *
   * @param {Function} buildReceiptFn - Function that receives (printer) and
   *   adds ESC/POS commands using the Epson SDK's builder methods.
   * @returns {Promise<{ success: boolean, message: string, response: any }>}
   */
  async print(buildReceiptFn) {
    if (this._isPrinting) {
      return { success: false, message: 'A print job is already in progress. Please wait.' };
    }

    if (!this.isConnected()) {
      return { success: false, message: 'Printer is not connected. Please connect first.' };
    }

    this._isPrinting = true;
    this._emit('info', 'Building print job...');

    return new Promise((resolve) => {
      try {
        const printer = this.printer;

        // Reset printer builder state
        printer.addTextLang('en');
        printer.addTextSmooth(true);

        // Let the caller build the receipt
        buildReceiptFn(printer);

        // Set up one-time receive handler for this job
        const originalOnReceive = printer.onreceive;
        const printTimeout = setTimeout(() => {
          printer.onreceive = originalOnReceive;
          this._isPrinting = false;
          const msg = 'Print job timed out waiting for printer response.';
          this._emit('error', msg);
          resolve({ success: false, message: msg, response: null });
        }, 30000);

        printer.onreceive = (res) => {
          clearTimeout(printTimeout);
          printer.onreceive = originalOnReceive;
          this._isPrinting = false;
          this._handlePrinterResponse(res, resolve);
        };

        this._emit('info', 'Sending print job to printer...');
        printer.send();
      } catch (err) {
        this._isPrinting = false;
        const msg = `Exception during print: ${err.message}`;
        this._emit('error', msg);
        resolve({ success: false, message: msg, response: null });
      }
    });
  }

  _handlePrinterResponse(res, resolve = null) {
    const success = res.success;
    const resultCode = res.result;
    const errorCode = res.code;
    const status = res.status;

    const statusDetails = this._parseStatus(status);

    if (success) {
      const msg = `Print job completed. Result: ${resultCode}`;
      this._emit('success', msg, { result: resultCode, status: statusDetails });
      if (resolve) resolve({ success: true, message: msg, response: res });
    } else {
      const resultDesc = describeResultCode(resultCode);
      const msg = `Print job failed. Result: ${resultCode} — ${resultDesc}${errorCode ? ` (Error: ${errorCode})` : ''}`;
      this._emit('error', msg, { result: resultCode, errorCode, status: statusDetails });
      if (resolve) resolve({ success: false, message: msg, response: res });
    }

    // Log paper/cover status
    if (statusDetails.paperEmpty) this._emit('warning', 'Paper is empty!');
    if (statusDetails.paperNearEmpty) this._emit('warning', 'Paper is near empty.');
    if (statusDetails.coverOpen) this._emit('warning', 'Printer cover is open!');
    if (statusDetails.offline) this._emit('warning', 'Printer is offline.');
  }

  _parseStatus(status) {
    if (!status) return {};
    return {
      online: !!(status & 0x08),
      offline: !!(status & 0x08) === false,
      coverOpen: !!(status & 0x04),
      paperFeed: !!(status & 0x02),
      paperNearEmpty: !!(status & 0x0C00),
      paperEmpty: !!(status & 0x0060),
    };
  }

  /**
   * Send a test status request to check if printer is reachable.
   */
  async testConnection() {
    if (!this.isConnected()) {
      return { success: false, message: 'Not connected. Please connect first.' };
    }

    return new Promise((resolve) => {
      try {
        const printer = this.printer;
        const timeout = setTimeout(() => {
          resolve({ success: false, message: 'Status request timed out.' });
        }, 10000);

        // Use addPulse as a minimal no-op to test connection
        printer.addPulse(printer.DRAWER_1, printer.PULSE_100);

        const original = printer.onreceive;
        printer.onreceive = (res) => {
          clearTimeout(timeout);
          printer.onreceive = original;
          resolve({
            success: res.success,
            message: res.success
              ? 'Printer is responding correctly.'
              : `Printer responded with: ${res.result}`,
            response: res,
          });
        };

        printer.send();
      } catch (err) {
        resolve({ success: false, message: `Test failed: ${err.message}` });
      }
    });
  }
}

// Export a singleton instance
export const printerService = new PrinterService();
