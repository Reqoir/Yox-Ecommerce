/**
 * Utility to generate and print executive PDF reports for the Yox Admin.
 * Opens an isolated print window with tailored styles for "Save as PDF".
 */

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  kpis?: { label: string; value: string; helper?: string }[];
  sections: {
    heading: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
}

export function exportReportToPDF(options: PDFExportOptions) {
  const { title, subtitle, dateRange, kpis = [], sections = [] } = options;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - YOX Store Report</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
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
      padding: 20px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0;
    }
    .brand-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .report-title-bar {
      margin-bottom: 20px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .report-period {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .kpi-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
    }
    .kpi-helper {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 10px;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">YOX E-COMMERCE</h1>
      <div class="brand-tag">Administration & Financial Analytics</div>
    </div>
    <div class="meta-box">
      <div>Generated on: <strong>${generatedDate}</strong></div>
      ${dateRange ? `<div>Reporting Period: <strong>${dateRange}</strong></div>` : ''}
    </div>
  </div>

  <div class="report-title-bar">
    <div class="report-title">${title}</div>
    ${subtitle ? `<div class="report-period">${subtitle}</div>` : ''}
  </div>

  ${
    kpis.length > 0
      ? `<div class="kpi-grid">
      ${kpis
        .map(
          (k) => `
        <div class="kpi-card">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
          ${k.helper ? `<div class="kpi-helper">${k.helper}</div>` : ''}
        </div>
      `
        )
        .join('')}
    </div>`
      : ''
  }

  ${sections
    .map(
      (sec) => `
    <div class="section">
      <div class="section-title">${sec.heading}</div>
      <table>
        <thead>
          <tr>
            ${sec.headers
              .map((h, idx) => {
                const isNum =
                  h.toLowerCase().includes('amount') ||
                  h.toLowerCase().includes('revenue') ||
                  h.toLowerCase().includes('price') ||
                  h.toLowerCase().includes('total') ||
                  h.toLowerCase().includes('count') ||
                  h.toLowerCase().includes('units') ||
                  h.toLowerCase().includes('rate');
                return `<th class="${isNum ? 'text-right' : ''}">${h}</th>`;
              })
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${
            sec.rows.length === 0
              ? `<tr><td colspan="${sec.headers.length}" style="text-align:center; padding: 16px; color: #94a3b8;">No records to display.</td></tr>`
              : sec.rows
                  .map(
                    (row) => `
              <tr>
                ${row
                  .map((cell, idx) => {
                    const h = sec.headers[idx] || '';
                    const isNum =
                      h.toLowerCase().includes('amount') ||
                      h.toLowerCase().includes('revenue') ||
                      h.toLowerCase().includes('price') ||
                      h.toLowerCase().includes('total') ||
                      h.toLowerCase().includes('count') ||
                      h.toLowerCase().includes('units') ||
                      h.toLowerCase().includes('rate');
                    return `<td class="${isNum ? 'text-right' : ''}">${cell}</td>`;
                  })
                  .join('')}
              </tr>
            `
                  )
                  .join('')
          }
        </tbody>
      </table>
    </div>
  `
    )
    .join('')}

  <div class="footer">
    <div>Confidential - Internal Store Management Document</div>
    <div>YOX Enterprise Management</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
