import { useState, useCallback } from 'react';
import { usePrinter } from './hooks/usePrinter.js';
import StatusBar from './components/StatusBar.jsx';
import ConfigPanel from './components/ConfigPanel.jsx';
import PrintPanel from './components/PrintPanel.jsx';
import DiagnosticsPanel from './components/DiagnosticsPanel.jsx';
import { DEFAULT_RECEIPT } from './components/ReceiptEditor.jsx';
import { buildReceiptPreviewText, buildNormalTestPreviewText } from './lib/receiptBuilder.js';

const TABS = [
  {
    id: 'print',
    label: 'Print',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
      </svg>
    ),
  },
  {
    id: 'config',
    label: 'Config',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    ),
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('print');
  const [testType, setTestType] = useState('normal'); // 'normal' | 'receipt'
  const [receiptData, setReceiptData] = useState({ ...DEFAULT_RECEIPT });

  const {
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
  } = usePrinter();

  // Handle connect from any tab — must be from user gesture
  const handleConnect = useCallback(async () => {
    persistConfig();
    // Prefetch SDK first (also triggered by user gesture)
    await prefetchSDK();
    await connect();
  }, [persistConfig, prefetchSDK, connect]);

  const handleBrowserPrint = useCallback(() => {
    window.print();
  }, []);

  const printableText = testType === 'normal'
    ? buildNormalTestPreviewText(config)
    : buildReceiptPreviewText(receiptData, config);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Top status bar (hidden in print) */}
      <header className="no-print">
        <StatusBar
          connectionStatus={connectionStatus}
          config={config}
          sdkStatus={sdkStatus}
        />
      </header>

      {/* Tab Navigation (hidden in print) */}
      <nav className="bg-navy-800 border-b border-navy-600 px-4 no-print">
        <div className="flex gap-1 max-w-3xl mx-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px relative ${
                  isActive
                    ? 'text-tms-green border-tms-green'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Dot indicators */}
                {tab.id === 'diagnostics' && logs.some(l => l.type === 'error') && (
                  <div className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content (hidden in print) */}
      <main className="flex-1 overflow-y-auto no-print">
        <div className="max-w-3xl mx-auto px-4 py-5">

          {activeTab === 'print' && (
            <PrintPanel
              isConnected={isConnected}
              connectionStatus={connectionStatus}
              isPrinting={isPrinting}
              lastPrintResult={lastPrintResult}
              config={config}
              onPrint={print}
              onBrowserPrint={handleBrowserPrint}
              selectPrinter={selectPrinter}
              testType={testType}
              setTestType={setTestType}
              receiptData={receiptData}
              setReceiptData={setReceiptData}
            />
          )}

          {activeTab === 'config' && (
            <ConfigPanel
              config={config}
              onUpdate={updateConfig}
              onSave={persistConfig}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onTest={testConnection}
              selectPrinter={selectPrinter}
              connectionStatus={connectionStatus}
              isConnecting={isConnecting}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsPanel
              logs={logs}
              sdkStatus={sdkStatus}
              config={config}
              connectionStatus={connectionStatus}
              onClearLogs={clearLogs}
              onBrowserPrint={handleBrowserPrint}
              onLoadSDK={prefetchSDK}
            />
          )}

        </div>
      </main>

      {/* Bottom Quick Action Bar (tablet-friendly, hidden in print) */}
      <footer className="bg-navy-800 border-t border-navy-600 px-4 py-3 safe-bottom no-print">
        <div className="max-w-3xl mx-auto flex items-center gap-3 overflow-x-auto">
          {/* Quick Normal Browser Print Button */}
          <button
            onClick={handleBrowserPrint}
            className="btn-secondary flex-shrink-0 flex items-center gap-2 py-3 px-4 text-sm text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/30"
            title="Open standard system print dialog"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Normal Print Test
          </button>

          {!isConnected ? (
            <button
              onClick={() => { setActiveTab('config'); handleConnect(); }}
              disabled={!config.ipAddress || isConnecting}
              className="btn-primary flex-shrink-0 flex items-center gap-2 py-3 px-5 text-sm"
            >
              {isConnecting ? (
                <><div className="spinner w-4 h-4" /> Connecting...</>
              ) : (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg> Connect ePOS</>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => { setActiveTab('print'); }}
                disabled={isPrinting}
                className="btn-primary flex-shrink-0 flex items-center gap-2 py-3 px-5 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                Direct ePOS Print
              </button>
              <button
                onClick={testConnection}
                className="btn-outline flex-shrink-0 flex items-center gap-2 py-3 px-4 text-sm"
              >
                Test
              </button>
              <button
                onClick={disconnect}
                className="btn-danger flex-shrink-0 flex items-center gap-2 py-3 px-4 text-sm"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </footer>

      {/* Dedicated Print-only View (rendered exclusively when printing) */}
      <div className="print-only-container" aria-hidden="true">
        <div
          className="print-receipt-paper"
          style={{ width: config?.paperWidth === '58mm' ? '240px' : '320px' }}
        >
          <pre className="print-receipt-text">
            {printableText}
          </pre>
        </div>
      </div>
    </div>
  );
}