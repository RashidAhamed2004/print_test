import { useState, useEffect, useCallback } from 'react';
import { printerService, CONNECTION_STATUS, PRINT_STATUS } from '../lib/printerService.js';
import { loadConfig, saveConfig } from '../lib/storage.js';
import { loadEposSDK, isEposSDKAvailable } from '../lib/eposSDKLoader.js';

export function usePrinter() {
  const [config, setConfig] = useState(loadConfig);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.IDLE);
  const [printStatus, setPrintStatus] = useState(PRINT_STATUS.IDLE);
  const [logs, setLogs] = useState([]);
  const [lastPrintResult, setLastPrintResult] = useState(null);
  const [sdkStatus, setSdkStatus] = useState({ loaded: false, loading: false, error: null });

  const addLog = useCallback((entry) => {
    setLogs((prev) => [...prev.slice(-199), { id: Date.now() + Math.random(), ...entry }]);
  }, []);

  // Register printer service status callback
  useEffect(() => {
    printerService.onStatusUpdate((entry) => {
      addLog(entry);
    });
  }, [addLog]);

  // Define prefetchSDK before useEffect to avoid Temporal Dead Zone (TDZ) ReferenceError
  const prefetchSDK = useCallback(async () => {
    if (sdkStatus.loaded) return;
    setSdkStatus((s) => ({ ...s, loading: true, error: null }));
    addLog({ type: 'info', message: 'Pre-loading Epson ePOS SDK...', timestamp: new Date().toISOString() });
    try {
      await loadEposSDK();
      setSdkStatus({ loaded: true, loading: false, error: null });
      addLog({ type: 'success', message: 'Epson ePOS SDK loaded successfully.', timestamp: new Date().toISOString() });
    } catch (err) {
      setSdkStatus({ loaded: false, loading: false, error: err.message });
      addLog({ type: 'error', message: `SDK load failed: ${err.message}`, timestamp: new Date().toISOString() });
    }
  }, [sdkStatus.loaded, addLog]);

  // Check and auto-load SDK on mount
  useEffect(() => {
    if (isEposSDKAvailable()) {
      setSdkStatus({ loaded: true, loading: false, error: null });
    } else {
      prefetchSDK();
    }
  }, [prefetchSDK]);

  const updateConfig = useCallback((updates) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });
  }, []);

  const persistConfig = useCallback((cfg) => {
    const c = cfg || config;
    saveConfig(c);
    addLog({ type: 'info', message: 'Configuration saved to local storage.', timestamp: new Date().toISOString() });
    return true;
  }, [config, addLog]);

  // Switch between any of the 5 printer slots
  const selectPrinter = useCallback((printerId) => {
    setConfig((prev) => {
      const target = (prev.printers || []).find((p) => p.id === printerId);
      if (!target) return prev;
      if (printerService.isConnected()) {
        printerService.disconnect();
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      }
      const next = {
        ...prev,
        activePrinterId: printerId,
        ipAddress: target.ipAddress,
        port: target.port || '8043',
        protocol: target.protocol || 'https',
        deviceId: target.deviceId || 'local_printer',
      };
      saveConfig(next);
      return next;
    });
    addLog({ type: 'info', message: `Active printer switched to Slot ${printerId}.`, timestamp: new Date().toISOString() });
  }, [addLog]);

  const connect = useCallback(async () => {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    addLog({ type: 'info', message: `Initiating connection to ${config.protocol}://${config.ipAddress}:${config.port}`, timestamp: new Date().toISOString() });

    const result = await printerService.connect(config);

    if (result.success) {
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    } else {
      setConnectionStatus(CONNECTION_STATUS.ERROR);
    }

    return result;
  }, [config, addLog]);

  const disconnect = useCallback(() => {
    const result = printerService.disconnect();
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setPrintStatus(PRINT_STATUS.IDLE);
    return result;
  }, []);

  const testConnection = useCallback(async () => {
    addLog({ type: 'info', message: 'Testing connection...', timestamp: new Date().toISOString() });
    const result = await printerService.testConnection();
    addLog({
      type: result.success ? 'success' : 'error',
      message: result.message,
      timestamp: new Date().toISOString(),
    });
    return result;
  }, [addLog]);

  // Robust print handling with Auto-Connect and Multi-Device Auto-Release
  const print = useCallback(async (buildFn) => {
    if (printStatus === PRINT_STATUS.PRINTING) return { success: false, message: 'Already printing.' };
    setPrintStatus(PRINT_STATUS.PRINTING);
    setLastPrintResult(null);

    // Multi-device handling: Auto-connect if not currently connected
    let autoConnected = false;
    if (!printerService.isConnected()) {
      if (!config.ipAddress) {
        setPrintStatus(PRINT_STATUS.ERROR);
        const errResult = { success: false, message: 'Printer IP is not configured.' };
        setLastPrintResult(errResult);
        return errResult;
      }

      addLog({ type: 'info', message: `Auto-connecting to ${config.ipAddress}:${config.port} for print...`, timestamp: new Date().toISOString() });
      let conn = await printerService.connect(config);

      // Retry once if busy (e.g. another tablet was finishing a print)
      if (!conn.success) {
        addLog({ type: 'warning', message: 'Printer busy or waiting. Retrying in 1s...', timestamp: new Date().toISOString() });
        await new Promise((r) => setTimeout(r, 1000));
        conn = await printerService.connect(config);
      }

      if (!conn.success) {
        setPrintStatus(PRINT_STATUS.ERROR);
        const errResult = { success: false, message: `Auto-connect failed: ${conn.message}` };
        setLastPrintResult(errResult);
        return errResult;
      }
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      autoConnected = true;
    }

    const result = await printerService.print(buildFn);

    // If autoRelease is enabled (recommended for multiple devices sharing 1 printer):
    // Disconnect socket immediately so other tablets/phones can print without waiting
    if (config.autoRelease || autoConnected) {
      printerService.disconnect();
      setConnectionStatus(CONNECTION_STATUS.IDLE);
      addLog({ type: 'info', message: '✓ Connection released — ready for next device/tablet.', timestamp: new Date().toISOString() });
    }

    setPrintStatus(result.success ? PRINT_STATUS.SUCCESS : PRINT_STATUS.ERROR);
    setLastPrintResult(result);
    return result;
  }, [printStatus, config, addLog]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const isConnected = connectionStatus === CONNECTION_STATUS.CONNECTED;
  const isConnecting = connectionStatus === CONNECTION_STATUS.CONNECTING;
  const isPrinting = printStatus === PRINT_STATUS.PRINTING;

  return {
    config,
    updateConfig,
    persistConfig,
    selectPrinter,
    connectionStatus,
    printStatus,
    isConnected,
    isConnecting,
    isPrinting,
    connect,
    disconnect,
    testConnection,
    print,
    logs,
    clearLogs,
    lastPrintResult,
    sdkStatus,
    prefetchSDK,
  };
}
