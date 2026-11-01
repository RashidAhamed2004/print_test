/**
 * Receipt Builder
 *
 * Builds ESC/POS formatted receipts using the official Epson ePOS SDK's
 * printer object methods. These methods map directly to ePOS SDK calls.
 *
 * Reference: https://reference.epson-biz.com/modules/ref_epos_sdk_js/index.php?content=ref_epos_sdk_js_api_eposprintcommon
 */

const PAPER_CHARS = {
  '80mm': 42, // ~42 characters at normal size for 80mm paper
  '58mm': 30, // ~30 characters for 58mm paper
};

export function buildTestReceipt(printer, receiptData, config = {}) {
  const paperWidth = config.paperWidth || '80mm';
  const autoCut = config.autoCut !== false;
  const lineWidth = PAPER_CHARS[paperWidth] || 42;
  const separator = '-'.repeat(lineWidth);

  const now = new Date();
  const dateStr = receiptData.date || formatDate(now);
  const timeStr = receiptData.time || formatTime(now);

  // =============================================
  // HEADER
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1); // bold
  printer.addTextSize(2, 2); // double width+height for company name
  printer.addText(receiptData.companyName || 'CARAVAN FRESH');
  printer.addText('\n');

  printer.addTextSize(1, 1);
  printer.addText('\n');
  printer.addText(receiptData.systemName || 'TRANSPORT MANAGEMENT SYSTEM');
  printer.addText('\n');

  printer.addTextStyle(false, false, false, printer.COLOR_1); // no bold
  printer.addText(receiptData.documentTitle || 'LOADING CONFIRMATION');
  printer.addText('\n');

  printer.addText(separator);
  printer.addText('\n');

  // =============================================
  // RECEIPT INFO
  // =============================================
  printer.addTextAlign(printer.ALIGN_LEFT);
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  addLabelValue(printer, 'Receipt No:', receiptData.receiptNo || 'TEST-001', lineWidth);
  addLabelValue(printer, 'Date:', dateStr, lineWidth);
  addLabelValue(printer, 'Time:', timeStr, lineWidth);
  addLabelValue(printer, 'Branch:', receiptData.branch || 'Colombo', lineWidth);
  addLabelValue(printer, 'Route:', receiptData.route || 'Route 01', lineWidth);
  addLabelValue(printer, 'Vehicle:', receiptData.vehicle || 'WP-1234', lineWidth);
  addLabelValue(printer, 'Driver:', receiptData.driver || 'Test Driver', lineWidth);

  printer.addText(separator);
  printer.addText('\n');

  // =============================================
  // PRODUCT DETAILS
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1); // bold
  printer.addText('PRODUCT DETAILS');
  printer.addText('\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);
  printer.addText(separator);
  printer.addText('\n');

  printer.addTextAlign(printer.ALIGN_LEFT);
  const items = receiptData.items || [
    { name: 'Bread', quantity: 20 },
    { name: 'Buns', quantity: 30 },
    { name: 'Cake', quantity: 10 },
  ];

  let totalItems = 0;
  for (const item of items) {
    addLabelValue(printer, `  ${item.name}`, `${item.quantity} units`, lineWidth);
    totalItems += Number(item.quantity) || 0;
  }

  printer.addText(separator);
  printer.addText('\n');

  printer.addTextStyle(false, false, true, printer.COLOR_1); // bold
  addLabelValue(printer, 'Total Items:', String(receiptData.totalItems || totalItems), lineWidth);
  addLabelValue(printer, 'Total Crates:', String(receiptData.totalCrates || 15), lineWidth);
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addText(separator);
  printer.addText('\n');

  // =============================================
  // STATUS
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addTextSize(1, 2); // double height for status
  printer.addText('Status: ' + (receiptData.status || 'CONFIRMED'));
  printer.addText('\n');
  printer.addTextSize(1, 1);
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addText(separator);
  printer.addText('\n');

  printer.addText('TEST PRINT ONLY');
  printer.addText('\n');
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addText('Powered by TMS');
  printer.addTextStyle(false, false, false, printer.COLOR_1);
  printer.addText('\n');
  printer.addText(separator);
  printer.addText('\n\n\n'); // Feed paper before cut

  // =============================================
  // AUTO CUT
  // =============================================
  if (autoCut) {
    printer.addCut(printer.CUT_FEED);
  }
}

/**
 * Helper: print a label on the left and value on the right, filling with spaces.
 */
function addLabelValue(printer, label, value, lineWidth) {
  const spaces = lineWidth - label.length - value.length;
  const padding = spaces > 0 ? ' '.repeat(spaces) : ' ';
  printer.addText(`${label}${padding}${value}\n`);
}

function formatDate(d) {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(d) {
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Build a receipt preview string for the on-screen receipt display.
 * This mirrors the receipt format but as plain text for the UI.
 */
export function buildReceiptPreviewText(receiptData, config = {}) {
  const paperWidth = config.paperWidth || '80mm';
  const lineWidth = PAPER_CHARS[paperWidth] || 42;
  const separator = '-'.repeat(lineWidth);

  const now = new Date();
  const dateStr = receiptData.date || formatDate(now);
  const timeStr = receiptData.time || formatTime(now);

  const center = (text) => {
    const pad = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const labelValue = (label, value) => {
    const spaces = lineWidth - label.length - value.length;
    const padding = spaces > 0 ? ' '.repeat(spaces) : ' ';
    return `${label}${padding}${value}`;
  };

  const items = receiptData.items || [
    { name: 'Bread', quantity: 20 },
    { name: 'Buns', quantity: 30 },
    { name: 'Cake', quantity: 10 },
  ];

  let totalItems = 0;
  const itemLines = items.map((item) => {
    totalItems += Number(item.quantity) || 0;
    return labelValue(`  ${item.name}`, `${item.quantity} units`);
  });

  return [
    '',
    center(receiptData.companyName || 'CARAVAN FRESH'),
    center(receiptData.systemName || 'TRANSPORT MANAGEMENT SYSTEM'),
    center(receiptData.documentTitle || 'LOADING CONFIRMATION'),
    separator,
    labelValue('Receipt No:', receiptData.receiptNo || 'TEST-001'),
    labelValue('Date:', dateStr),
    labelValue('Time:', timeStr),
    labelValue('Branch:', receiptData.branch || 'Colombo'),
    labelValue('Route:', receiptData.route || 'Route 01'),
    labelValue('Vehicle:', receiptData.vehicle || 'WP-1234'),
    labelValue('Driver:', receiptData.driver || 'Test Driver'),
    separator,
    center('PRODUCT DETAILS'),
    separator,
    ...itemLines,
    separator,
    labelValue('Total Items:', String(receiptData.totalItems || totalItems)),
    labelValue('Total Crates:', String(receiptData.totalCrates || 15)),
    separator,
    center('Status: ' + (receiptData.status || 'CONFIRMED')),
    separator,
    center('TEST PRINT ONLY'),
    center('Powered by TMS'),
    separator,
    '',
  ].join('\n');
}

/**
 * Normal Print Test (Standard diagnostic self-test slip)
 * Sends standard formatting, alignment, character set, and auto-cut tests
 * to verify normal thermal printer operation.
 */
export function buildNormalTestReceipt(printer, config = {}) {
  const paperWidth = config.paperWidth || '80mm';
  const autoCut = config.autoCut !== false;
  const lineWidth = PAPER_CHARS[paperWidth] || 42;
  const separator = '='.repeat(lineWidth);
  const subSeparator = '-'.repeat(lineWidth);

  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);

  // =============================================
  // HEADER
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addTextSize(2, 2);
  printer.addText('NORMAL PRINT TEST\n');

  printer.addTextSize(1, 1);
  printer.addTextStyle(false, false, false, printer.COLOR_1);
  printer.addText(config.printerModel || 'Epson TM-m30III');
  printer.addText('\n');
  printer.addText(separator + '\n');

  // =============================================
  // DIAGNOSTIC INFO
  // =============================================
  printer.addTextAlign(printer.ALIGN_LEFT);
  addLabelValue(printer, 'Test Mode:', 'Normal Self-Test', lineWidth);
  addLabelValue(printer, 'Date:', dateStr, lineWidth);
  addLabelValue(printer, 'Time:', timeStr, lineWidth);
  addLabelValue(printer, 'Paper Width:', paperWidth, lineWidth);
  addLabelValue(printer, 'Columns:', `${lineWidth} characters`, lineWidth);
  addLabelValue(printer, 'Device ID:', config.deviceId || 'local_printer', lineWidth);
  addLabelValue(printer, 'Result:', 'PASSED (OK)', lineWidth);

  printer.addText(subSeparator + '\n');

  // =============================================
  // FONT & TEXT STYLE TESTS
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addText('TEXT STYLES & SIZES\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addTextAlign(printer.ALIGN_LEFT);
  printer.addText('Regular:   1234567890 ABCDEF xyz\n');

  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addText('Bold:      1234567890 ABCDEF xyz\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addTextStyle(false, true, false, printer.COLOR_1);
  printer.addText('Underline: 1234567890 ABCDEF xyz\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addText(subSeparator + '\n');

  // Size variations
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextSize(2, 1);
  printer.addText('DOUBLE WIDTH\n');
  printer.addTextSize(1, 2);
  printer.addText('DOUBLE HEIGHT\n');
  printer.addTextSize(2, 2);
  printer.addText('DOUBLE 2X2\n');
  printer.addTextSize(1, 1);

  printer.addText(subSeparator + '\n');

  // Alignment test
  printer.addTextAlign(printer.ALIGN_LEFT);
  printer.addText('<< Left Aligned\n');
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addText('== Center Aligned ==\n');
  printer.addTextAlign(printer.ALIGN_RIGHT);
  printer.addText('Right Aligned >>\n');

  printer.addTextAlign(printer.ALIGN_LEFT);
  printer.addText(subSeparator + '\n');

  // =============================================
  // CHARACTER TEST
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addText('CHARACTER SET CHECK\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);

  printer.addTextAlign(printer.ALIGN_LEFT);
  printer.addText('Numbers: 0123456789\n');
  printer.addText('Upper:   ABCDEFGHIJKLMNOPQRSTUVWXYZ\n');
  printer.addText('Lower:   abcdefghijklmnopqrstuvwxyz\n');
  printer.addText('Symbols: !@#$%^&*()_+-=[]{}|;:,.<>?\n');

  printer.addText(separator + '\n');

  // =============================================
  // FOOTER & CUT
  // =============================================
  printer.addTextAlign(printer.ALIGN_CENTER);
  printer.addTextStyle(false, false, true, printer.COLOR_1);
  printer.addText('*** NORMAL TEST COMPLETE ***\n');
  printer.addTextStyle(false, false, false, printer.COLOR_1);
  printer.addText('Printer is functioning normally.\n');
  printer.addText(separator + '\n');
  printer.addText('\n\n\n');

  if (autoCut) {
    printer.addCut(printer.CUT_FEED);
  }
}

/**
 * Build a preview string for the normal print test.
 */
export function buildNormalTestPreviewText(config = {}) {
  const paperWidth = config.paperWidth || '80mm';
  const lineWidth = PAPER_CHARS[paperWidth] || 42;
  const separator = '='.repeat(lineWidth);
  const subSeparator = '-'.repeat(lineWidth);

  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);

  const center = (text) => {
    const pad = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(pad) + text;
  };

  const right = (text) => {
    const pad = Math.max(0, lineWidth - text.length);
    return ' '.repeat(pad) + text;
  };

  const labelValue = (label, value) => {
    const spaces = lineWidth - label.length - value.length;
    const padding = spaces > 0 ? ' '.repeat(spaces) : ' ';
    return `${label}${padding}${value}`;
  };

  return [
    '',
    center('NORMAL PRINT TEST'),
    center(config.printerModel || 'Epson TM-m30III'),
    separator,
    labelValue('Test Mode:', 'Normal Self-Test'),
    labelValue('Date:', dateStr),
    labelValue('Time:', timeStr),
    labelValue('Paper Width:', paperWidth),
    labelValue('Columns:', `${lineWidth} characters`),
    labelValue('Device ID:', config.deviceId || 'local_printer'),
    labelValue('Result:', 'PASSED (OK)'),
    subSeparator,
    center('TEXT STYLES & SIZES'),
    'Regular:   1234567890 ABCDEF xyz',
    'Bold:      1234567890 ABCDEF xyz',
    'Underline: 1234567890 ABCDEF xyz',
    subSeparator,
    center('DOUBLE WIDTH'),
    center('DOUBLE HEIGHT'),
    center('DOUBLE 2X2'),
    subSeparator,
    '<< Left Aligned',
    center('== Center Aligned =='),
    right('Right Aligned >>'),
    subSeparator,
    center('CHARACTER SET CHECK'),
    'Numbers: 0123456789',
    'Upper:   ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'Lower:   abcdefghijklmnopqrstuvwxyz',
    'Symbols: !@#$%^&*()_+-=[]{}|;:,.<>?',
    separator,
    center('*** NORMAL TEST COMPLETE ***'),
    center('Printer is functioning normally.'),
    separator,
    '',
  ].join('\n');
}
