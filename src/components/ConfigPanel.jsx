import { useState } from 'react';
import { DEFAULT_CONFIG } from '../lib/storage.js';
import { CONNECTION_STATUS } from '../lib/printerService.js';

export default function ConfigPanel({ config, onUpdate, onSave, onConnect, onDisconnect, onTest, connectionStatus, isConnecting }) {
  const [saved, setSaved] = useState(false);

  const isConnected = connectionStatus === CONNECTION_STATUS.CONNECTED;

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    onUpdate(DEFAULT_CONFIG);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Printer Configuration</h2>
          <p className="text-gray-400 text-sm mt-0.5">Configure your Epson TM-m30III connection settings</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
          isConnected ? 'bg-tms-green/20 text-tms-green border border-tms-green/30' :
          isConnecting ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
          'bg-gray-700 text-gray-400 border border-gray-600'
        }`}>
          {isConnected ? '● ONLINE' : isConnecting ? '◐ CONNECTING' : '○ OFFLINE'}
        </div>
      </div>

      {/* Connection Settings Card */}
      <div className="card space-y-4">
        <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">Connection Settings</h3>

        {/* Printer Model (display only) */}
        <div>
          <label className="label">Printer Model</label>
          <div className="input-field flex items-center gap-2 opacity-70">
            <svg className="w-4 h-4 text-tms-green flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7H6zm0 11v-5H2V8h20v7h-4v5H6zm12-11a1 1 0 100 2 1 1 0 000-2zM8 4v5h8V4H8zm0 14v-3h8v3H8z"/>
            </svg>
            <span className="text-white text-sm">{config.printerModel}</span>
          </div>
        </div>

        {/* IP Address */}
        <div>
          <label className="label" htmlFor="ip-address">Printer IP Address / Hostname *</label>
          <input
            id="ip-address"
            type="text"
            className="input-field"
            placeholder="e.g. 192.168.1.120 or printer.local"
            value={config.ipAddress}
            onChange={(e) => onUpdate({ ipAddress: e.target.value })}
          />
          <p className="text-gray-500 text-xs mt-1">Enter the IP address shown on the printer's network test print.</p>
        </div>

        {/* Device ID */}
        <div>
          <label className="label" htmlFor="device-id">Device ID</label>
          <input
            id="device-id"
            type="text"
            className="input-field"
            placeholder="local_printer"
            value={config.deviceId}
            onChange={(e) => onUpdate({ deviceId: e.target.value })}
          />
          <p className="text-gray-500 text-xs mt-1">Default is <code className="font-mono text-tms-green">local_printer</code>. Check Epson ePOS settings.</p>
        </div>

        {/* Protocol + Port */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="protocol">Protocol</label>
            <select
              id="protocol"
              className="input-field"
              value={config.protocol}
              onChange={(e) => {
                const proto = e.target.value;
                onUpdate({ protocol: proto, port: proto === 'https' ? '8043' : '8008' });
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
              value={config.port}
              onChange={(e) => onUpdate({ port: e.target.value })}
            >
              <option value="8043">8043 (HTTPS)</option>
              <option value="8008">8008 (HTTP)</option>
            </select>
          </div>
        </div>

        {/* HTTPS warning */}
        {config.protocol === 'http' && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <p className="text-red-400 font-semibold text-sm">HTTP Not Recommended</p>
                <p className="text-red-300/80 text-xs mt-1">
                  When deployed on HTTPS (Netlify/Vercel), Chrome will block HTTP requests to the printer (mixed content policy).
                  Use <strong>HTTPS + port 8043</strong> and configure the printer's TLS certificate. See the Diagnostics tab for guidance.
                </p>
              </div>
            </div>
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
              value={config.paperWidth}
              onChange={(e) => onUpdate({ paperWidth: e.target.value })}
            >
              <option value="80mm">80mm (Standard)</option>
              <option value="58mm">58mm (Narrow)</option>
            </select>
          </div>
          <div>
            <label className="label">Auto Paper Cut</label>
            <button
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
          <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
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

          <button onClick={handleReset} className="btn-secondary flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={!config.ipAddress || isConnecting}
              className="btn-primary col-span-2 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                  Connect Printer
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={onTest}
                className="btn-outline flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                Test Connection
              </button>
              <button
                onClick={onDisconnect}
                className="btn-danger flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Connection help */}
      <div className="card">
        <h3 className="text-gray-300 font-semibold text-sm mb-3">Quick Setup Guide</h3>
        <ol className="space-y-2 text-xs text-gray-400 list-decimal list-inside">
          <li>Connect Epson TM-m30III to your LAN via Ethernet or Wi-Fi.</li>
          <li>Print a network test page (hold Feed button on startup) to find the printer IP.</li>
          <li>On the printer's web interface, enable <em>ePOS-Print</em> under Device Settings.</li>
          <li>For HTTPS: Use port <code className="text-tms-green font-mono">8043</code> and install Epson's certificate on your tablet.</li>
          <li>Enter the IP above and click <strong className="text-white">Connect Printer</strong>.</li>
        </ol>
      </div>
    </div>
  );
}
