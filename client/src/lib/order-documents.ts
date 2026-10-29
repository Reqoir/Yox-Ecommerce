import { BackendOrder } from './api/orders';
import { BackendShipment } from './api/shipments';

/**
 * Formats a currency amount into Indian Rupee style.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Generate and print an isolated, professional GST Tax Invoice for an order.
 * Works seamlessly across both Admin and Customer sides.
 */
export function printTaxInvoice(order: BackendOrder, shipment?: BackendShipment | null) {
  // If Shiprocket official invoice URL already exists, open it directly
  const officialInvoice = shipment?.invoiceUrl || order.invoiceUrl;
  if (officialInvoice && officialInvoice.startsWith('http')) {
    window.open(officialInvoice, '_blank');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=950,height=800');
  if (!printWindow) {
    alert('Please allow popups to view and print the invoice.');
    return;
  }

  const invoiceNumber = `INV-${order.orderNumber}`;
  const orderDate = new Date(order.placedAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const invoiceDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const courierName = shipment?.courierName || order.deliveryPartnerId || 'Shiprocket Logistics Partner';
  const awbCode = shipment?.awbCode || shipment?.trackingNumber || order.trackingNumber || 'Pending Courier Scan';
  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || 'Valued Customer';
  const customerPhone = order.customer?.phone || order.shippingAddress?.phone || 'N/A';
  const customerEmail = order.customer?.email || 'N/A';

  const itemsHtml = (order.items || [])
    .map((item, idx) => {
      const variantDetails = [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
        .filter(Boolean)
        .join(' • ');

      return `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${item.productName}</div>
            ${item.sku ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</div>` : ''}
            ${variantDetails ? `<div style="font-size: 11px; color: #475569;">${variantDetails}</div>` : ''}
          </td>
          <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right; color: #059669;">${item.discount ? `-${formatCurrency(item.discount)}` : '—'}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${order.orderNumber} - YOX</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 850px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 32px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -1px;
      color: #0f172a;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .company-details {
      font-size: 11px;
      color: #475569;
      margin-top: 8px;
      line-height: 1.4;
    }
    .invoice-badge-block {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      padding: 6px 16px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .meta-table {
      margin-top: 10px;
      font-size: 11px;
      text-align: right;
    }
    .meta-table td {
      padding: 2px 0 2px 14px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 600;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
    }
    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
    }
    .address-box h4 {
      margin: 0 0 6px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 800;
    }
    .address-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .address-line {
      font-size: 11px;
      color: #334155;
      line-height: 1.4;
    }
    .logistics-bar {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      padding: 10px 16px;
      border-left: 4px solid #2563eb;
      font-size: 11px;
      margin-bottom: 24px;
      border-radius: 2px;
    }
    .logistics-item {
      display: flex;
      gap: 6px;
    }
    .logistics-label {
      color: #64748b;
      font-weight: 600;
    }
    .logistics-val {
      color: #0f172a;
      font-weight: 700;
    }
    .table-container {
      margin-bottom: 24px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table.items-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.items-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      margin-bottom: 30px;
    }
    .terms-box {
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.5;
    }
    .terms-box h5 {
      font-size: 11px;
      color: #0f172a;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      font-weight: 800;
    }
    .financials-table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
    }
    .financials-table td {
      padding: 6px 0;
    }
    .financials-table .fin-label {
      color: #64748b;
    }
    .financials-table .fin-val {
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }
    .financials-table tr.total-row td {
      padding-top: 10px;
      border-top: 2px solid #0f172a;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10.5px;
      color: #94a3b8;
    }
    .print-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0f172a;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        border: none;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions" onclick="window.print()">
    🖨️ Print / Save as PDF
  </div>

  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1 class="brand-title">YOX STORE</h1>
        <div class="brand-subtitle">Official Merchandise & Fashion</div>
        <div class="company-details">
          <strong>YOX E-Commerce Private Limited</strong><br>
          Central Distribution Hub, Kannur Warehouse Complex<br>
          Kerala - 670001, India<br>
          GSTIN: <strong>32AABCY9876Q1Z8</strong> | Support: support@yox.com
        </div>
      </div>

      <div class="invoice-badge-block">
        <div class="invoice-badge">Tax Invoice</div>
        <table class="meta-table">
          <tr>
            <td class="meta-label">Invoice No:</td>
            <td class="meta-val">${invoiceNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Invoice Date:</td>
            <td class="meta-val">${invoiceDate}</td>
          </tr>
          <tr>
            <td class="meta-label">Order ID:</td>
            <td class="meta-val">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Order Date:</td>
            <td class="meta-val">${orderDate}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Logistics Summary Bar -->
    <div class="logistics-bar">
      <div class="logistics-item">
        <span class="logistics-label">Payment:</span>
        <span class="logistics-val">${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PREPAID'} (${order.paymentStatus})</span>
      </div>
      <div class="logistics-item">
        <span class="logistics-label">Courier Partner:</span>
        <span class="logistics-val">${courierName}</span>
      </div>
      <div class="logistics-item">
        <span class="logistics-label">AWB Tracking:</span>
        <span class="logistics-val" style="font-family: monospace;">${awbCode}</span>
      </div>
    </div>

    <!-- Billing & Shipping Addresses -->
    <div class="address-grid">
      <div class="address-box">
        <h4>Sold / Billed To</h4>
        <div class="address-name">${customerName}</div>
        <div class="address-line">Phone: ${customerPhone}</div>
        <div class="address-line">Email: ${customerEmail}</div>
        <div class="address-line">Customer ID: #${order.userId?.slice(-8) || 'GUEST'}</div>
      </div>

      <div class="address-box">
        <h4>Shipping Destination</h4>
        <div class="address-name">${order.shippingAddress?.fullName || customerName}</div>
        <div class="address-line">${order.shippingAddress?.streetAddress || ''}</div>
        ${order.shippingAddress?.landmark ? `<div class="address-line">Landmark: ${order.shippingAddress.landmark}</div>` : ''}
        <div class="address-line font-bold">
          ${[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')} - ${order.shippingAddress?.postalCode || ''}
        </div>
        <div class="address-line">${order.shippingAddress?.country || 'India'}</div>
        <div class="address-line">Contact: ${order.shippingAddress?.phone || customerPhone}</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: left;">Product Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Unit Price</th>
            <th style="width: 90px; text-align: right;">Discount</th>
            <th style="width: 110px; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Financial Summary & Terms -->
    <div class="summary-grid">
      <div class="terms-box">
        <h5>Terms & Conditions</h5>
        <p>1. All products sold are genuine and inspected prior to dispatch.</p>
        <p>2. Returns / Replacements are accepted within 7 days of delivery subject to original condition and tags intact.</p>
        <p>3. This is a computer-generated tax invoice and requires no physical signature.</p>
      </div>

      <div>
        <table class="financials-table">
          <tr>
            <td class="fin-label">Items Subtotal:</td>
            <td class="fin-val">${formatCurrency(order.subtotal || 0)}</td>
          </tr>
          ${order.discount > 0 ? `
            <tr>
              <td class="fin-label" style="color: #059669;">Promotional Discount:</td>
              <td class="fin-val" style="color: #059669;">-${formatCurrency(order.discount)}</td>
            </tr>
          ` : ''}
          <tr>
            <td class="fin-label">Shipping & Handling:</td>
            <td class="fin-val">${order.shippingCharge > 0 ? formatCurrency(order.shippingCharge) : 'FREE'}</td>
          </tr>
          <tr>
            <td class="fin-label">Estimated Taxes (GST Included):</td>
            <td class="fin-val">${formatCurrency(order.tax || 0)}</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total:</td>
            <td class="fin-val">${formatCurrency(order.totalAmount || 0)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <div>Authorized Signatory for YOX Store</div>
      <div>Thank you for shopping with YOX! Visit us at www.yoxstore.com</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate and print an isolated, thermal 4x6 inch Courier Shipping Label for Yox Admin.
 */
export function printShippingLabel(order: BackendOrder, shipment?: BackendShipment | null) {
  // If order has not been booked with Shiprocket or is cancelled, do not generate a shipping label
  if (order.orderStatus === 'PLACED') {
    alert("Cannot print shipping label: This order has not been accepted or booked with Shiprocket yet.\n\nPlease click 'Accept & Book Shiprocket' first to generate courier booking and official AWB.");
    return;
  }
  if (order.orderStatus === 'CANCELLED') {
    alert("Cannot print shipping label for a cancelled order.");
    return;
  }

  // Real AWB tracking code assigned by courier
  const awbCode = shipment?.awbCode || shipment?.trackingNumber || order.trackingNumber;
  if (!awbCode) {
    alert("No courier AWB tracking code assigned yet.\n\nPlease click 'Accept & Book Shiprocket' first.");
    return;
  }

  // If official Shiprocket PDF label is already generated, open it directly
  const officialLabel = shipment?.labelUrl || order.labelUrl;
  if (officialLabel && officialLabel.startsWith('http')) {
    window.open(officialLabel, '_blank');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=650,height=800');
  if (!printWindow) {
    alert('Please allow popups to print the shipping label.');
    return;
  }

  const courierName = (shipment?.courierName || order.deliveryPartnerId || 'SHIPROCKET EXPRESS').toUpperCase();
  const isCOD = order.paymentMethod?.toUpperCase() === 'COD';
  const totalAmount = order.totalAmount || 0;
  const destinationCity = (order.shippingAddress?.city || 'DESTINATION').toUpperCase();
  const destinationPincode = order.shippingAddress?.postalCode || '000000';

  const itemsList = (order.items || [])
    .map((item) => `<div>• ${item.productName} (Qty: ${item.quantity}${item.size ? `, ${item.size}` : ''})</div>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label - ${order.orderNumber} - ${awbCode}</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.3;
    }
    .label-box {
      border: 3px solid #000000;
      padding: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
    }
    .courier-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .routing-code {
      font-size: 16px;
      font-weight: 900;
      background: #000000;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 2px;
    }
    .barcode-section {
      text-align: center;
      padding: 12px 0 8px 0;
      border-bottom: 2px solid #000000;
    }
    .simulated-barcode {
      height: 48px;
      background: repeating-linear-gradient(
        90deg,
        #000 0,
        #000 2px,
        #fff 2px,
        #fff 5px,
        #000 5px,
        #000 9px,
        #fff 9px,
        #fff 11px
      );
      width: 80%;
      margin: 0 auto;
    }
    .awb-text {
      font-family: monospace;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 2px;
      margin-top: 6px;
    }
    .deliver-to-box {
      border-bottom: 2px solid #000000;
      padding: 10px 0;
    }
    .to-tag {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .customer-name {
      font-size: 16px;
      font-weight: 900;
      margin: 2px 0;
    }
    .customer-address {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.35;
    }
    .customer-pin {
      font-size: 18px;
      font-weight: 900;
      margin-top: 4px;
    }
    .customer-phone {
      font-size: 13px;
      font-weight: 800;
      margin-top: 2px;
    }
    .payment-strip {
      border-bottom: 2px solid #000000;
      padding: 8px;
      text-align: center;
      margin: 6px 0;
      background: ${isCOD ? '#000000' : '#f1f5f9'};
      color: ${isCOD ? '#ffffff' : '#000000'};
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.5px;
    }
    .dispatch-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #000000;
    }
    .items-summary {
      font-size: 9.5px;
      color: #333333;
      padding-top: 6px;
      line-height: 1.3;
    }
    .print-actions {
      position: fixed;
      bottom: 15px;
      right: 15px;
      background: #000000;
      color: #ffffff;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .print-actions {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions" onclick="window.print()">
    🖨️ Print Label
  </div>

  <div class="label-box">
    <!-- Header -->
    <div class="label-header">
      <div>
        <div class="courier-title">${courierName}</div>
        <div style="font-size: 10px; font-weight: bold;">STANDARD SURFACE / AIR CARGO</div>
      </div>
      <div class="routing-code">${destinationCity} ${destinationPincode}</div>
    </div>

    <!-- Barcode & AWB -->
    <div class="barcode-section">
      <div class="simulated-barcode"></div>
      <div class="awb-text">AWB: ${awbCode}</div>
      <div style="font-size: 10px; font-weight: bold;">ORDER REF: #${order.orderNumber}</div>
    </div>

    <!-- Payment Badge -->
    <div class="payment-strip">
      ${isCOD ? `COLLECT CASH ON DELIVERY: ${formatCurrency(totalAmount)}` : 'PREPAID — DO NOT COLLECT CASH'}
    </div>

    <!-- Deliver To -->
    <div class="deliver-to-box">
      <div class="to-tag">DELIVER TO:</div>
      <div class="customer-name">${order.shippingAddress?.fullName || 'RECIPIENT'}</div>
      <div class="customer-address">
        ${order.shippingAddress?.streetAddress || ''}
        ${order.shippingAddress?.landmark ? `<br>Landmark: ${order.shippingAddress.landmark}` : ''}
        <br>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}
      </div>
      <div class="customer-pin">PINCODE: ${destinationPincode}</div>
      <div class="customer-phone">📞 TEL: ${order.shippingAddress?.phone || 'N/A'}</div>
    </div>

    <!-- Return / Dispatch Address -->
    <div class="dispatch-info">
      <div>
        <strong>RETURN / DISPATCH FROM:</strong><br>
        YOX Hub, Kannur Warehouse<br>
        Kerala - 670001, India<br>
        Phone: +91 98765 43210
      </div>
      <div style="text-align: right;">
        <strong>DIMENSIONS & WT:</strong><br>
        Approx: 0.50 KG<br>
        Date: ${new Date().toLocaleDateString('en-IN')}<br>
        Pieces: ${order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1}
      </div>
    </div>

    <!-- Items Preview -->
    <div class="items-summary">
      <strong>PACKAGE CONTAINS:</strong><br>
      ${itemsList}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
