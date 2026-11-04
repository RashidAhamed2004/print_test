import { useState } from 'react';
import { DEFAULT_CONFIG } from '../lib/storage.js';
import { CONNECTION_STATUS } from '../lib/printerService.js';

export default function ConfigPanel({
  config,
  onUpdate,
  onSave,
  onConnect,
  onDisconnect,
  onTest,
  selectPrinter,
  connectionStatus,
  isConnecting,
}) {
  const [saved, setSaved] = useState(false);

  const isConnected = connectionStatus === CONNECTION_STATUS.CONNECTED;
  const activePrinterId = config.activePrinterId || '1';
  const printers = config.printers || [];
  const currentPrinter = printers.find((p) => p.id === activePrinterId) || {
    id: activePrinterId,
    name: `Printer ${activePrinterId}`,
    ipAddress: config.ipAddress || '',
    port: config.port || '8043',
    protocol: config.protocol || 'https',
    deviceId: config.deviceId || 'local_printer',
  };

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    onUpdate(DEFAULT_CONFIG);
  };

  // Switch between 5 printer slots
  const handleSlotChange = (slotId) => {
    if (selectPrinter) {
      selectPrinter(slotId);
    } else {
      const target = printers.find((p) => p.id === slotId);
      if (target) {
        onUpdate({
          activePrinterId: slotId,
          ipAddress: target.ipAddress,
          port: target.port || '8043',
          protocol: target.protocol || 'https',
          deviceId: target.deviceId || 'local_printer',
        });
      }
    }
  };

  // Update a field for the current printer slot
  const handlePrinterFieldChange = (field, value) => {
    const updatedPrinters = printers.map((p) =>
      p.id === activePrinterId ? { ...p, [field]: value } : p
    );
    const updates = {
      printers: updatedPrinters,
      [field]: value,
    };
    onUpdate(updates);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-white text-xl font-bold">Printer Configuration</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage up to 5 printers and configure multi-device shared printing
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
          isConnected ? 'bg-tms-green/20 text-tms-green border border-tms-green/30' :
          isConnecting ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
          'bg-gray-700 text-gray-400 border border-gray-600'
        }`}>
          {isConnected ? '● ONLINE' : isConnecting ? '◐ CONNECTING' : '○ OFFLINE'}
        </div>
      </div>

      {/* 5 Printer Slots Switcher Card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Printer Profiles (Connect 5 Devices / Locations)
          </h3>
          <span className="text-xs text-gray-400">Slot {activePrinterId} of 5</span>
        </div>

        <p className="text-xs text-gray-400">
          Select which printer slot to configure or target. Each can have its own IP address and location name:
        </p>

        {/* 5 Slots Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {printers.map((p) => {
            const isSelected = p.id === activePrinterId;
            const hasIP = !!p.ipAddress;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSlotChange(p.id)}
                className={`py-2 px-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-tms-green/20 border-tms-green text-white shadow-glow-green font-bold'
                    : 'bg-navy-900/60 border-navy-700 text-gray-400 hover:border-navy-500'
                }`}
                style={{ minHeight: '56px' }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-tms-green">#{p.id}</span>
                  <span className={`w-2 h-2 rounded-full ${hasIP ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                </div>
                <span className="truncate block mt-1 text-[11px] font-medium text-white">
                  {p.name || `Printer ${p.id}`}
                </span>
                <span className="text-[10px] text-gray-500 truncate block">
                  {p.ipAddress || 'Not set'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Device Concurrency Mode Card */}
      <div className="card space-y-3 border-l-4 border-l-cyan-400 bg-cyan-950/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Shared Multi-Device Mode (Auto-Release)
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Allows 5+ tablets/phones to print to the same printer at the same time without socket lockouts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ autoRelease: !config.autoRelease })}
            className={`rounded-xl px-4 py-2 text-xs font-semibold border transition-all ${
              config.autoRelease
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
          >
            {config.autoRelease ? '✓ Enabled' : '✗ Persistent'}
          </button>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          {config.autoRelease
            ? 'When enabled, tablets connect just-in-time, print, and immediately release the printer connection so other devices can print seamlessly with zero collision.'
            : 'When disabled, one device holds the connection open until manually disconnected.'}
        </p>
      </div>

      {/* Active Printer Settings Card */}
      <div className="card space-y-4">
        <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">
          Slot {activePrinterId} Settings: {currentPrinter.name}
        </h3>

        {/* Profile Name */}
        <div>
          <label className="label" htmlFor="printer-name">Location / Printer Name</label>
          <input
            id="printer-name"
            type="text"
            className="input-field"
            placeholder="e.g. Loading Bay 1, Dispatch, Kitchen"
            value={currentPrinter.name || ''}
            onChange={(e) => handlePrinterFieldChange('name', e.target.value)}
          />
        </div>

        {/* IP Address */}
        <div>
          <label className="label" htmlFor="ip-address">Printer IP Address / Hostname *</label>
          <input
            id="ip-address"
            type="text"
            className="input-field"
            placeholder="e.g. 192.168.4.78 or printer.local"
            value={currentPrinter.ipAddress || ''}
            onChange={(e) => handlePrinterFieldChange('ipAddress', e.target.value)}
          />
          <p className="text-gray-500 text-xs mt-1">
            Enter the IP shown on your printer self-test receipt (hold Feed button on power on).
          </p>
        </div>

        {/* Protocol + Port */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="protocol">Protocol</label>
            <select
              id="protocol"
              className="input-field"
              value={currentPrinter.protocol || 'https'}
              onChange={(e) => {
                const proto = e.target.value;
                handlePrinterFieldChange('protocol', proto);
                handlePrinterFieldChange('port', proto === 'https' ? '8043' : '8008');
              }}
            >
              <option value="https">HTTPS (Recommended)</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="port">Port</label>
            <select
              id="port"
              className="input-field"
              value={currentPrinter.port || '8043'}
              onChange={(e) => handlePrinterFieldChange('port', e.target.value)}
            >
              <option value="8043">8043 (HTTPS - ePOS Default)</option>
              <option value="443">443 (HTTPS - Standard)</option>
              <option value="8008">8008 (HTTP - ePOS)</option>
              <option value="80">80 (HTTP - Standard)</option>
            </select>
          </div>
        </div>

        {/* Device ID */}
        <div>
          <label className="label" htmlFor="device-id">Device ID</label>
          <input
            id="device-id"
            type="text"
            className="input-field"
            placeholder="local_printer"
            value={currentPrinter.deviceId || 'local_printer'}
            onChange={(e) => handlePrinterFieldChange('deviceId', e.target.value)}
          />
          <p className="text-gray-500 text-xs mt-1">
            Default is <code className="font-mono text-tms-green">local_printer</code>. Check Epson ePOS settings.
          </p>
        </div>

        {/* Trust SSL Helper */}
        {currentPrinter.ipAddress && currentPrinter.protocol === 'https' && (
          <div className="bg-navy-900/80 rounded-xl p-3 border border-navy-700 flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-gray-300">
              <span className="text-cyan-400 font-semibold block">SSL Certificate Whitelist:</span>
              <span className="text-gray-400">If connecting fails, visit printer once to accept self-signed SSL.</span>
            </div>
            <a
              href={`https://${currentPrinter.ipAddress}:${currentPrinter.port || '8043'}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              Trust Certificate ↗
            </a>
          </div>
        )}
      </div>

      {/* Print Settings Card */}
      <div className="card space-y-4">
        <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">Print Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="paper-width">Paper Width</label>
            <select
              id="paper-width"
              className="input-field"
              value={config.paperWidth || '80mm'}
              onChange={(e) => onUpdate({ paperWidth: e.target.value })}
            >
              <option value="80mm">80mm (Standard)</option>
              <option value="58mm">58mm (Narrow)</option>
            </select>
          </div>
          <div>
            <label className="label">Auto Paper Cut</label>
            <button
              type="button"
              onClick={() => onUpdate({ autoCut: !config.autoCut })}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold border transition-all duration-200 ${
                config.autoCut
                  ? 'bg-tms-green/20 text-tms-green border-tms-green/50 hover:bg-tms-green/30'
                  : 'bg-navy-900 text-gray-400 border-navy-600 hover:bg-navy-700'
              }`}
              style={{ minHeight: '48px' }}
            >
              {config.autoCut ? '✓ Enabled' : '✗ Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card space-y-3">
        <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">Actions</h3>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Saved!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                Save Config
              </>
            )}
          </button>

          <button type="button" onClick={handleReset} className="btn-secondary flex items-center justify-center gap-2">
            Reset Defaults
          </button>
        </div>

        {/* Connect / Disconnect */}
        <div className="pt-2 border-t border-navy-700 grid grid-cols-2 gap-3">
          {!isConnected ? (
            <button
              type="button"
              onClick={onConnect}
              disabled={!config.ipAddress || isConnecting}
              className="btn-outline flex items-center justify-center gap-2 w-full"
            >
              {isConnecting ? (
                <><div className="spinner w-4 h-4" /> Connecting...</>
              ) : (
                'Manual Connect'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDisconnect}
              className="btn-danger flex items-center justify-center gap-2 w-full"
            >
              Disconnect
            </button>
          )}

          <button
            type="button"
            onClick={onTest}
            disabled={!isConnected}
            className="btn-secondary flex items-center justify-center gap-2 w-full"
          >
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}
