import { useState, useRef } from 'react';
import { buildTestReceipt, buildNormalTestReceipt } from '../lib/receiptBuilder.js';
import { CONNECTION_STATUS } from '../lib/printerService.js';
import ReceiptEditor, { DEFAULT_RECEIPT } from './ReceiptEditor.jsx';
import ReceiptPreview from './ReceiptPreview.jsx';

export default function PrintPanel({
  isConnected,
  connectionStatus,
  isPrinting,
  lastPrintResult,
  config,
  onPrint,
  onBrowserPrint,
  selectPrinter,
  testType: propTestType,
  setTestType: propSetTestType,
  receiptData: propReceiptData,
  setReceiptData: propSetReceiptData,
}) {
  const [localTestType, setLocalTestType] = useState('normal'); // 'normal' | 'receipt'
  const [localReceiptData, setLocalReceiptData] = useState({ ...DEFAULT_RECEIPT });
  const printLockRef = useRef(false);

  const testType = propTestType !== undefined ? propTestType : localTestType;
  const setTestType = propSetTestType || setLocalTestType;
  const receiptData = propReceiptData !== undefined ? propReceiptData : localReceiptData;
  const setReceiptData = propSetReceiptData || setLocalReceiptData;

  const isDisconnected = connectionStatus !== CONNECTION_STATUS.CONNECTED;
  const canDirectPrint = isConnected || (config.autoRelease && !!config.ipAddress);

  const handleDirectPrint = async () => {
    if (printLockRef.current || isPrinting) return;
    printLockRef.current = true;

    try {
      await onPrint((printer) => {
        if (testType === 'normal') {
          buildNormalTestReceipt(printer, config);
        } else {
          buildTestReceipt(printer, receiptData, config);
        }
      });
    } finally {
      printLockRef.current = false;
    }
  };

  const handleNormalPrint = () => {
    if (onBrowserPrint) {
      onBrowserPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-white text-xl font-bold">Print & Test Panel</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          Run normal system print tests or direct thermal print to Epson TM-m30III
        </p>
      </div>

      {/* Target Printer Selector (Up to 5 Printers) */}
      <div className="bg-navy-800 p-3 rounded-2xl border border-navy-600 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <svg className="w-4 h-4 text-tms-green flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
          </svg>
          <span className="text-xs text-gray-300 font-semibold">Target Printer:</span>
          <select
            value={config.activePrinterId || '1'}
            onChange={(e) => selectPrinter && selectPrinter(e.target.value)}
            className="bg-navy-900 border border-navy-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:border-tms-green outline-none"
          >
            {(config.printers || []).map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id}: {p.name || `Printer ${p.id}`} {p.ipAddress ? `(${p.ipAddress})` : '(No IP)'}
              </option>
            ))}
          </select>
        </div>

        {config.autoRelease ? (
          <span className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            5-Device Shared Queue Active
          </span>
        ) : (
          <span className="text-[11px] text-gray-400 bg-navy-900 border border-navy-700 px-2 py-0.5 rounded-full">
            Persistent Mode
          </span>
        )}
      </div>

      {/* Test Type Selector */}
      <div className="bg-navy-800 p-1.5 rounded-2xl border border-navy-600 flex gap-2">
        <button
          id="select-normal-test-tab"
          type="button"
          onClick={() => setTestType('normal')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            testType === 'normal'
              ? 'bg-tms-green text-navy-900 shadow-md font-bold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
          </svg>
          Normal Print Test (Self-Test Slip)
        </button>

        <button
          id="select-receipt-test-tab"
          type="button"
          onClick={() => setTestType('receipt')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            testType === 'receipt'
              ? 'bg-tms-green text-navy-900 shadow-md font-bold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
          </svg>
          Delivery Receipt Test
        </button>
      </div>

      {/* Dual Print Action Card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
            Choose Print Method for: <strong className="text-white">{testType === 'normal' ? 'Normal Test Slip' : 'Delivery Receipt'}</strong>
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isConnected ? 'bg-tms-green/20 text-tms-green' : config.autoRelease ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-700 text-gray-400'
          }`}>
            {isConnected ? '● ePOS Connected' : config.autoRelease ? '● Ready (Auto-Connect)' : '○ ePOS Offline'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Normal Browser / OS Print Button */}
          <button
            id="btn-normal-browser-print"
            type="button"
            onClick={handleNormalPrint}
            className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border-2 border-cyan-500/40 bg-navy-900/60 hover:bg-cyan-950/40 hover:border-cyan-400 text-white transition-all duration-200 active:scale-98 select-none group shadow-lg"
            style={{ minHeight: '120px' }}
          >
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
              </svg>
            </div>
            <div className="text-center">
              <span className="block font-bold text-base text-cyan-300">NORMAL PRINT TEST</span>
              <span className="text-xs text-gray-400">System / Browser Dialog (window.print)</span>
            </div>
            <span className="text-[11px] text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-700/40">
              ✓ Works with any printer / PDF
            </span>
          </button>

          {/* 2. Direct ePOS Print Button */}
          <button
            id="btn-direct-epos-print"
            type="button"
            onClick={handleDirectPrint}
            disabled={!canDirectPrint || isPrinting}
            className={`
              flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl font-bold text-base transition-all duration-200
              select-none shadow-lg
              ${!canDirectPrint || isPrinting
                ? 'bg-navy-900/40 text-gray-500 border border-navy-700 cursor-not-allowed opacity-60'
                : 'bg-tms-green text-navy-900 hover:bg-tms-green-light shadow-glow-green active:scale-98'}
            `}
            style={{ minHeight: '120px' }}
          >
            {isPrinting ? (
              <>
                <div className="spinner w-8 h-8" style={{ borderWidth: '3px' }} />
                <span>Printing via SDK...</span>
                <span className="text-xs font-normal opacity-75">Sending ESC/POS payload</span>
              </>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  !canDirectPrint ? 'bg-gray-800 text-gray-500' : 'bg-navy-900/20 text-navy-900'
                }`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.66-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-base">DIRECT EPOS PRINT</span>
                  <span className="text-xs opacity-75">
                    {config.autoRelease ? 'Auto-Connect & Release (5 Devices)' : 'Direct to Epson TM-m30III'}
                  </span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                  !canDirectPrint ? 'bg-gray-800 text-gray-500' : 'bg-navy-900/10 text-navy-900 font-semibold'
                }`}>
                  {config.autoRelease ? '⚡ 1-Click Multi-Tablet Print' : 'Direct Socket Ready'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Informational warning if IP missing */}
        {!config.ipAddress && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-yellow-300/80">
            <span className="text-yellow-400 text-base leading-none">ℹ</span>
            <p>
              No printer IP is set for this slot. Please enter the printer IP in the <strong>Configuration</strong> tab, or use <strong>Normal Print Test</strong> to print via the browser.
            </p>
          </div>
        )}

        {/* Last Direct Print Result */}
        {lastPrintResult && (
          <div className={`w-full rounded-xl p-4 border text-sm mt-3 ${
            lastPrintResult.success
              ? 'bg-tms-green/10 border-tms-green/30 text-tms-green'
              : 'bg-red-900/20 border-red-700/30 text-red-400'
          }`}>
            <div className="flex items-start gap-2">
              <span className="font-bold text-base flex-shrink-0">
                {lastPrintResult.success ? '✓' : '✕'}
              </span>
              <div>
                <p className="font-semibold">{lastPrintResult.success ? 'Direct Print Succeeded' : 'Direct Print Failed'}</p>
                <p className="text-xs opacity-80 mt-1 break-words">{lastPrintResult.message}</p>
                {lastPrintResult.response && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer opacity-60">SDK Response Details</summary>
                    <pre className="text-xs mt-1 font-mono opacity-70 break-all whitespace-pre-wrap">
                      {JSON.stringify(lastPrintResult.response, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test details / spec if Normal Test is selected */}
      {testType === 'normal' ? (
        <div className="card space-y-3">
          <h3 className="text-tms-green font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Normal Print Test Specification
          </h3>
          <p className="text-gray-400 text-xs">
            The normal print test sends a standardized diagnostic self-test slip to verify essential printer capabilities:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-300 pt-1">
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700">
              <span className="text-tms-green font-semibold block mb-0.5">1. Text Formatting & Styles</span>
              <span className="text-gray-400">Regular, bold, underline, and size scaling (double width, height, 2x2).</span>
            </div>
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700">
              <span className="text-tms-green font-semibold block mb-0.5">2. Text Alignment</span>
              <span className="text-gray-400">Validates left, center, and right text alignment across column widths.</span>
            </div>
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700">
              <span className="text-tms-green font-semibold block mb-0.5">3. Character Set Integrity</span>
              <span className="text-gray-400">Full alphanumeric check (0-9, A-Z, a-z) and POS symbols.</span>
            </div>
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700">
              <span className="text-tms-green font-semibold block mb-0.5">4. Cutter & Feed Action</span>
              <span className="text-gray-400">Executes feed spacing and automatic full paper cut.</span>
            </div>
          </div>
        </div>
      ) : (
        <ReceiptEditor onReceiptChange={setReceiptData} />
      )}

      {/* On-screen Preview */}
      <ReceiptPreview
        receiptData={receiptData}
        config={config}
        testType={testType}
        onBrowserPrint={handleNormalPrint}
      />
    </div>
  );
}
