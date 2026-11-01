import { useEffect, useRef } from 'react';

const LOG_ICONS = {
  info: '→',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

const LOG_COLORS = {
  info: 'log-info',
  success: 'log-success',
  warning: 'log-warning',
  error: 'log-error',
};

export default function DiagnosticsPanel({ logs, sdkStatus, config, connectionStatus, onClearLogs, onBrowserPrint, onLoadSDK }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isHTTPS = window.location.protocol === 'https:';
  const hasMixedContentRisk = isHTTPS && config?.protocol === 'http';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-white text-xl font-bold">Diagnostics</h2>
        <p className="text-gray-400 text-sm mt-0.5">System status and troubleshooting information</p>
      </div>

      {/* System checks */}
      <div className="card space-y-3">
        <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">System Checks</h3>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CheckItem
              label="Epson ePOS SDK"
              ok={sdkStatus.loaded}
              loading={sdkStatus.loading}
              okText="Loaded and ready"
              failText="Not loaded — see instructions below"
              detail={sdkStatus.error}
            />
          </div>
          {!sdkStatus.loaded && onLoadSDK && (
            <button
              onClick={onLoadSDK}
              disabled={sdkStatus.loading}
              className="text-xs bg-navy-700 hover:bg-navy-600 border border-navy-500 text-tms-green px-3 py-1.5 rounded-lg flex-shrink-0 ml-2 font-semibold"
            >
              {sdkStatus.loading ? 'Loading...' : 'Load SDK'}
            </button>
          )}
        </div>

        <CheckItem
          label="Page Protocol"
          ok={isHTTPS}
          okText="HTTPS ✓ (Required for deployed site)"
          failText="HTTP — OK for localhost development only"
        />

        <CheckItem
          label="Browser"
          ok={true}
          okText={`${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'} detected`}
        />

        <CheckItem
          label="Mixed Content Risk"
          ok={!hasMixedContentRisk}
          okText={config?.protocol === 'https' ? 'HTTPS printer protocol configured' : 'No mixed content risk'}
          failText="HTTPS page → HTTP printer = BLOCKED by Chrome. Switch to HTTPS + port 8043."
        />

        <CheckItem
          label="Printer IP Configured"
          ok={!!config?.ipAddress}
          okText={`Configured: ${config?.ipAddress}:${config?.port}`}
          failText="No printer IP address entered. Go to Configuration tab."
        />
      </div>

      {/* SDK Setup Instructions */}
      {!sdkStatus.loaded && (
        <div className="card border border-yellow-700/50 bg-yellow-900/10">
          <h3 className="text-yellow-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <span>⚠</span> Epson ePOS SDK Setup Required
          </h3>
          <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside">
            <li>Go to <a href="https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6917&scat=61&lang=en" target="_blank" rel="noopener noreferrer" className="text-tms-green underline">Epson Developer Downloads</a></li>
            <li>Download the <strong>ePOS SDK for JavaScript</strong> (latest version)</li>
            <li>Extract the ZIP and find <code className="font-mono text-tms-green">ePOS_SDK_JavaScript_vX.X/package/</code></li>
            <li>Copy <code className="font-mono text-tms-green">epos-2.XX.X.js</code> to your project's <code className="font-mono text-tms-green">/public/epos-sdk/epos-2.27.0.js</code></li>
            <li>Rebuild and redeploy your app</li>
          </ol>
          <p className="text-xs text-gray-500 mt-3">
            The SDK is proprietary and cannot be bundled automatically. It must be downloaded from Epson.
          </p>
        </div>
      )}

      {/* HTTPS / Certificate Guide */}
      <div className="card">
        <h3 className="text-tms-green font-semibold text-sm mb-3">HTTPS & Certificate Setup</h3>
        <div className="space-y-3 text-xs text-gray-300">
          <p className="text-gray-400">
            Chrome blocks HTTPS→HTTP requests (mixed content). To print from a deployed HTTPS site to a local printer:
          </p>
          <div className="space-y-2">
            <div className="bg-navy-900 rounded-lg p-3">
              <p className="text-white font-semibold mb-1">Option A — Printer HTTPS with CA Certificate (Recommended)</p>
              <ol className="space-y-1 list-decimal list-inside text-gray-400">
                <li>Open the printer's web interface: <code className="text-tms-green font-mono">http://[PRINTER_IP]/</code></li>
                <li>Go to <em>Security → CA-signed Certificate</em></li>
                <li>Enable Epson's <strong>Automatic Certificate Update</strong> (requires internet on printer)</li>
                <li>Epson will provision a valid TLS certificate automatically</li>
                <li>Use <code className="text-tms-green font-mono">https://[PRINTER_IP]:8043</code> in this app</li>
              </ol>
            </div>
            <div className="bg-navy-900 rounded-lg p-3">
              <p className="text-white font-semibold mb-1">Option B — Trust Self-Signed Certificate on Tablet</p>
              <ol className="space-y-1 list-decimal list-inside text-gray-400">
                <li>Open <code className="text-tms-green font-mono">https://[PRINTER_IP]:8043</code> in Chrome on your tablet</li>
                <li>Tap "Advanced" → "Proceed to [IP] (unsafe)"</li>
                <li>This grants a one-time exception for the certificate</li>
                <li>Alternatively, download the printer's cert and install it system-wide on Android</li>
              </ol>
            </div>
            <div className="bg-navy-900 rounded-lg p-3">
              <p className="text-white font-semibold mb-1">Option C — Chrome Local Network Permissions</p>
              <ol className="space-y-1 list-decimal list-inside text-gray-400">
                <li>Chrome may show "Allow [site] to access devices on your local network?"</li>
                <li>Tap <strong>Allow</strong> when prompted (requires user gesture — that's why Connect uses a button click)</li>
                <li>If Chrome never prompts, the printer may not be on the correct ePOS endpoint</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider">
            Activity Log ({logs.length})
          </h3>
          <button
            onClick={onClearLogs}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="bg-navy-900 rounded-xl p-3 max-h-72 overflow-y-auto space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-4">No activity yet. Connect the printer to see logs.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`log-entry ${LOG_COLORS[log.type] || 'text-gray-400'}`}>
                <span className="opacity-60 mr-1.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="mr-1">{LOG_ICONS[log.type]}</span>
                {log.message}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Normal / Browser Print Test */}
      <div className="card border border-cyan-700/40 bg-cyan-950/20">
        <h3 className="text-cyan-300 font-semibold text-sm mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
          </svg>
          Normal / Browser Print Test
        </h3>
        <p className="text-gray-400 text-xs mb-3">
          Triggers a clean print test using your browser/system print dialog (<code className="font-mono text-cyan-300">window.print()</code>).
          Applies a dedicated print stylesheet that isolates the receipt paper and suppresses app UI, backgrounds, and navigation.
          Useful for verifying layout, printing to PDF, or testing via system print drivers.
        </p>
        <button
          onClick={onBrowserPrint}
          className="btn-secondary w-full text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/30 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
          </svg>
          Run Normal Print Test (Browser Dialog)
        </button>
      </div>
    </div>
  );
}

function CheckItem({ label, ok, loading, okText, failText, detail }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
        loading ? 'bg-yellow-400/20 text-yellow-400' :
        ok ? 'bg-tms-green/20 text-tms-green' :
        'bg-red-500/20 text-red-400'
      }`}>
        {loading ? '⟳' : ok ? '✓' : '✕'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className={`text-xs mt-0.5 ${ok ? 'text-gray-400' : 'text-red-300'}`}>
          {ok ? okText : (failText || 'Check failed')}
        </p>
        {detail && <p className="text-red-400/70 text-xs mt-1 font-mono break-all">{detail}</p>}
      </div>
    </div>
  );
}
