import { CONNECTION_STATUS } from '../lib/printerService.js';

export default function StatusBar({ connectionStatus, config, sdkStatus }) {
  const statusConfig = {
    [CONNECTION_STATUS.IDLE]: { dot: 'bg-gray-500', label: 'Not Connected', color: 'text-gray-400' },
    [CONNECTION_STATUS.LOADING_SDK]: { dot: 'bg-yellow-400 animate-pulse', label: 'Loading SDK...', color: 'text-yellow-400' },
    [CONNECTION_STATUS.CONNECTING]: { dot: 'bg-yellow-400 animate-pulse', label: 'Connecting...', color: 'text-yellow-400' },
    [CONNECTION_STATUS.CONNECTED]: { dot: 'bg-tms-green shadow-glow-green animate-pulse-slow', label: 'Connected', color: 'text-tms-green' },
    [CONNECTION_STATUS.DISCONNECTED]: { dot: 'bg-red-500', label: 'Disconnected', color: 'text-red-400' },
    [CONNECTION_STATUS.ERROR]: { dot: 'bg-red-500', label: 'Connection Error', color: 'text-red-400' },
  };

  const s = statusConfig[connectionStatus] || statusConfig[CONNECTION_STATUS.IDLE];

  return (
    <div className="bg-navy-800 border-b border-navy-600 px-4 py-2 flex items-center justify-between">
      {/* Left: App title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-tms-green rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-navy-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 9V2h12v7H6zm0 11v-5H2V8h20v7h-4v5H6zm12-11a1 1 0 100 2 1 1 0 000-2zM8 4v5h8V4H8zm0 14v-3h8v3H8z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">TMS Printer Test</h1>
          <p className="text-gray-500 text-xs">{config.printerModel}</p>
        </div>
      </div>

      {/* Right: Connection status + IP */}
      <div className="flex items-center gap-4">
        {/* SDK indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${sdkStatus.loaded ? 'bg-tms-green' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-500">SDK</span>
        </div>

        {/* IP */}
        {config.ipAddress && (
          <div className="hidden sm:block">
            <span className="text-xs font-mono text-gray-400">{config.ipAddress}:{config.port}</span>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${s.dot}`} />
          <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
        </div>
      </div>
    </div>
  );
}
