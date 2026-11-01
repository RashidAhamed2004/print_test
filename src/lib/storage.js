/**
 * localStorage helpers for printer configuration and app state.
 */

const STORAGE_KEY = 'tms_printer_config';

export const DEFAULT_CONFIG = {
  ipAddress: '',
  protocol: 'https',
  port: '8043',
  deviceId: 'local_printer',
  paperWidth: '80mm',
  autoCut: true,
  printerModel: 'Epson TM-m30III',
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (_) {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (_) {
    return false;
  }
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
