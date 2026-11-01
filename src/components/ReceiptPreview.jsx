import { useRef } from 'react';
import { buildReceiptPreviewText, buildNormalTestPreviewText } from '../lib/receiptBuilder.js';

export default function ReceiptPreview({ receiptData, config, testType = 'normal', onBrowserPrint }) {
  const previewRef = useRef(null);
  const previewText = testType === 'normal'
    ? buildNormalTestPreviewText(config)
    : buildReceiptPreviewText(receiptData, config);
  const paperWidthPx = config?.paperWidth === '58mm' ? 240 : 320;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-tms-green" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13zM7 15h10v2H7zm0-4h10v2H7zm0-4h7v2H7z"/>
          </svg>
          {testType === 'normal' ? 'Normal Print Test Preview' : 'Delivery Receipt Preview'}
        </h3>
        <div className="flex items-center gap-2">
          {onBrowserPrint && (
            <button
              onClick={onBrowserPrint}
              className="text-xs text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/40 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors"
              title="Print this preview using browser print dialog"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
              </svg>
              Print via Browser
            </button>
          )}
          <span className="text-xs text-gray-500">{config?.paperWidth || '80mm'} paper</span>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <div
          className="receipt-paper"
          style={{ width: `${paperWidthPx}px`, minWidth: `${paperWidthPx}px` }}
        >
          <div className="px-4 py-3">
            <pre
              ref={previewRef}
              className="text-xs leading-relaxed whitespace-pre overflow-x-auto"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '11px',
                lineHeight: '1.5',
                color: '#1a1a1a',
              }}
            >
              {previewText}
            </pre>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs mt-3">
        Visual approximation — actual print may differ slightly
      </p>
    </div>
  );
}
