import { useState } from 'react';

const DEFAULT_RECEIPT = {
  companyName: 'CARAVAN FRESH',
  systemName: 'TRANSPORT MANAGEMENT SYSTEM',
  documentTitle: 'LOADING CONFIRMATION',
  receiptNo: 'TEST-001',
  branch: 'Colombo',
  route: 'Route 01',
  vehicle: 'WP-1234',
  driver: 'Test Driver',
  totalCrates: '15',
  status: 'CONFIRMED',
  items: [
    { name: 'Bread', quantity: '20' },
    { name: 'Buns', quantity: '30' },
    { name: 'Cake', quantity: '10' },
  ],
};

export default function ReceiptEditor({ onReceiptChange }) {
  const [receipt, setReceipt] = useState(DEFAULT_RECEIPT);
  const [expanded, setExpanded] = useState(false);

  const update = (field, value) => {
    const next = { ...receipt, [field]: value };
    setReceipt(next);
    onReceiptChange?.(next);
  };

  const updateItem = (idx, field, value) => {
    const items = receipt.items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    const next = { ...receipt, items };
    setReceipt(next);
    onReceiptChange?.(next);
  };

  const addItem = () => {
    const items = [...receipt.items, { name: 'New Item', quantity: '0' }];
    const next = { ...receipt, items };
    setReceipt(next);
    onReceiptChange?.(next);
  };

  const removeItem = (idx) => {
    const items = receipt.items.filter((_, i) => i !== idx);
    const next = { ...receipt, items };
    setReceipt(next);
    onReceiptChange?.(next);
  };

  const totalItems = receipt.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  return (
    <div className="card space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-tms-green" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
          </svg>
          <h3 className="text-white font-semibold">Edit Sample Receipt</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor" viewBox="0 0 24 24"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-in border-t border-navy-600 pt-4">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Company Name</label>
              <input className="input-field" value={receipt.companyName} onChange={(e) => update('companyName', e.target.value)} />
            </div>
            <div>
              <label className="label">Document Title</label>
              <input className="input-field" value={receipt.documentTitle} onChange={(e) => update('documentTitle', e.target.value)} />
            </div>
            <div>
              <label className="label">Receipt No.</label>
              <input className="input-field" value={receipt.receiptNo} onChange={(e) => update('receiptNo', e.target.value)} />
            </div>
            <div>
              <label className="label">Branch</label>
              <input className="input-field" value={receipt.branch} onChange={(e) => update('branch', e.target.value)} />
            </div>
            <div>
              <label className="label">Route</label>
              <input className="input-field" value={receipt.route} onChange={(e) => update('route', e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle</label>
              <input className="input-field" value={receipt.vehicle} onChange={(e) => update('vehicle', e.target.value)} />
            </div>
            <div>
              <label className="label">Driver</label>
              <input className="input-field" value={receipt.driver} onChange={(e) => update('driver', e.target.value)} />
            </div>
            <div>
              <label className="label">Total Crates</label>
              <input className="input-field" type="number" value={receipt.totalCrates} onChange={(e) => update('totalCrates', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={receipt.status} onChange={(e) => update('status', e.target.value)}>
                <option>CONFIRMED</option>
                <option>PENDING</option>
                <option>DISPATCHED</option>
                <option>CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Products ({totalItems} items)</label>
              <button onClick={addItem} className="text-tms-green text-xs font-semibold hover:text-tms-green-light flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add Product
              </button>
            </div>
            <div className="space-y-2">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="input-field flex-1 text-sm py-2"
                    placeholder="Product name"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                  />
                  <input
                    className="input-field w-24 text-sm py-2 text-center"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary when collapsed */}
      {!expanded && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span className="bg-navy-700 px-2 py-1 rounded">{receipt.receiptNo}</span>
          <span className="bg-navy-700 px-2 py-1 rounded">{receipt.branch}</span>
          <span className="bg-navy-700 px-2 py-1 rounded">{receipt.vehicle}</span>
          <span className="bg-navy-700 px-2 py-1 rounded">{receipt.items.length} products</span>
          <span className="bg-tms-green/20 text-tms-green px-2 py-1 rounded">{receipt.status}</span>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_RECEIPT };
