/**
 * localStorage helpers for printer configuration and app state.
 */

const STORAGE_KEY = 'tms_printer_config';

export const DEFAULT_PRINTERS = [
  { id: '1', name: 'Bay 1 (Loading)', ipAddress: '192.168.4.78', port: '8043', protocol: 'https', deviceId: 'local_printer' },
  { id: '2', name: 'Bay 2 (Loading)', ipAddress: '', port: '8043', protocol: 'https', deviceId: 'local_printer' },
  { id: '3', name: 'Dispatch Office', ipAddress: '', port: '8043', protocol: 'https', deviceId: 'local_printer' },
  { id: '4', name: 'Warehouse / Prep', ipAddress: '', port: '8043', protocol: 'https', deviceId: 'local_printer' },
  { id: '5', name: 'Main Office', ipAddress: '', port: '8043', protocol: 'https', deviceId: 'local_printer' },
];

export const DEFAULT_CONFIG = {
  ipAddress: '192.168.4.78',
  protocol: 'https',
  port: '8043',
  deviceId: 'local_printer',
  paperWidth: '80mm',
  autoCut: true,
  printerModel: 'Epson TM-m30III',
  // Multi-device sharing mode: connect on-demand, print, and immediately release
  autoRelease: true,
  // 5 configured printer slots
  printers: DEFAULT_PRINTERS,
  activePrinterId: '1',
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);

    // Merge printers array to ensure 5 slots exist
    const mergedPrinters = DEFAULT_PRINTERS.map((defP) => {
      const existing = (parsed.printers || []).find((p) => p.id === defP.id);
      return existing ? { ...defP, ...existing } : defP;
    });

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      printers: mergedPrinters,
      autoRelease: parsed.autoRelease !== undefined ? parsed.autoRelease : true,
      activePrinterId: parsed.activePrinterId || '1',
    };
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
