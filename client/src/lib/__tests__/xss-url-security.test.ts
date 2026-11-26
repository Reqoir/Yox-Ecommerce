/**
 * @file xss-url-security.test.ts
 * @description Automated Phase 4 Frontend XSS, URL Sanitization & Document Escaping Tests
 *
 * Run with: npx --prefix server tsx client/src/lib/__tests__/xss-url-security.test.ts
 */

import assert from 'node:assert/strict';
import { escapeHtml, openSafeExternalUrl, sanitizeHttpUrl } from '../html-escape';
import { printShippingLabel, printTaxInvoice } from '../order-documents';
import { exportReportToPDF } from '../report-pdf';

function runTest(name: string, fn: () => void) {
  fn();
  console.log(`PASS: ${name}`);
}

runTest('escapeHtml neutralizes HTML, script, and attribute breakout payloads', () => {
  const payload = `<script>alert('xss')</script>" onmouseover="alert(2)" & 'test'`;
  const escaped = escapeHtml(payload);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(!escaped.includes('>'));
  assert.ok(!escaped.includes('"'));
  assert.ok(!escaped.includes("'"));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('&amp;'));
  assert.ok(escaped.includes('&quot;'));
  assert.ok(escaped.includes('&#39;'));
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

runTest('sanitizeHttpUrl allows safe http/https URLs and blocks dangerous schemes', () => {
  assert.equal(sanitizeHttpUrl('https://yoxfashion.com/path?a=1'), 'https://yoxfashion.com/path?a=1');
  assert.equal(sanitizeHttpUrl('http://example.com/item'), 'http://example.com/item');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeHttpUrl('JaVaScRiPt:alert(1)'), null);
  assert.equal(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(sanitizeHttpUrl('vbscript:msgbox(1)'), null);
  assert.equal(sanitizeHttpUrl('//evil.example.com/phish'), null);
  assert.equal(sanitizeHttpUrl('/uploads/banner.jpg', { allowRelative: true }), '/uploads/banner.jpg');
  assert.equal(sanitizeHttpUrl('/uploads/banner.jpg'), null);
});

runTest('openSafeExternalUrl enforces noopener,noreferrer and blocks javascript: URLs', () => {
  const calls: Array<{ url: string; target: string; features: string }> = [];
  const fakeWindow = {
    open(url: string, target: string, features: string) {
      calls.push({ url, target, features });
      return { opener: { dangerous: true } };
    },
  };
  (globalThis as unknown as { window?: unknown }).window = fakeWindow;

  assert.equal(openSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(calls.length, 0);

  assert.equal(openSafeExternalUrl('https://shiprocket.co/tracking/123'), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://shiprocket.co/tracking/123');
  assert.equal(calls[0].target, '_blank');
  assert.equal(calls[0].features, 'noopener,noreferrer');
});

runTest('printTaxInvoice & printShippingLabel escape XSS in customer/order/product fields', () => {
  let writtenHtml = '';
  const fakePopup = {
    opener: { secret: true } as unknown,
    document: {
      open() {},
      write(html: string) {
        writtenHtml = html;
      },
      close() {},
    },
    focus() {},
    print() {},
  };
  (globalThis as unknown as { window?: unknown }).window = {
    open() {
      return fakePopup;
    },
  };

  const xssName = `Bob<script>alert('name')</script>`;
  const xssCity = `Kochi"><img src=x onerror=alert(1)>`;
  const xssProduct = `Shirt<svg onload=alert(2)>`;

  printTaxInvoice({
    id: 'ord-1',
    userId: 'usr-1',
    orderNumber: 'ORD-<script>1</script>',
    placedAt: '2026-11-26T00:00:00Z',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'PAID',
    orderStatus: 'CONFIRMED',
    shippingAddress: {
      fullName: xssName,
      phone: '9999999999',
      streetAddress: '123 Street <script>bad()</script>',
      city: xssCity,
      state: 'KL',
      postalCode: '682001',
      country: 'India',
    },
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1',
        productName: xssProduct,
        sku: 'SKU-<1>',
        size: 'M',
        color: 'Black',
        quantity: 1,
        unitPrice: 999,
        subtotal: 999,
      },
    ],
    subtotal: 999,
    discount: 0,
    shippingCharge: 0,
    tax: 0,
    totalAmount: 999,
  });

  assert.ok(!writtenHtml.includes("<script>alert('name')</script>"), 'raw <script> payload leaked');
  assert.ok(!writtenHtml.includes('<script>1</script>'), 'raw <script>1</script> leaked');
  assert.ok(!writtenHtml.includes('<script>bad()</script>'), 'raw <script>bad()</script> leaked');
  assert.ok(!writtenHtml.includes('<img src=x onerror=alert(1)>'), 'raw <img> leaked');
  assert.ok(!writtenHtml.includes('<svg onload=alert(2)>'), 'raw <svg> leaked');
  assert.ok(writtenHtml.includes('Bob&lt;script&gt;alert(&#39;name&#39;)&lt;/script&gt;'), `missing escaped Bob`);

  writtenHtml = '';
  printShippingLabel({
    id: 'ord-2',
    userId: 'usr-1',
    orderNumber: 'ORD-2<script>alert(9)</script>',
    trackingNumber: 'AWB123456',
    placedAt: '2026-11-26T00:00:00Z',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'PACKED',
    shippingAddress: {
      fullName: xssName,
      phone: '8888888888',
      streetAddress: 'Line 1',
      city: xssCity,
      state: 'KL',
      postalCode: '682001',
      country: 'India',
    },
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1',
        productName: xssProduct,
        sku: 'SKU-2',
        quantity: 2,
        unitPrice: 999,
        subtotal: 1998,
      },
    ],
    subtotal: 1998,
    discount: 0,
    shippingCharge: 0,
    tax: 0,
    totalAmount: 1998,
  });

  assert.ok(!writtenHtml.includes('<script>alert(9)</script>'));
  assert.ok(!writtenHtml.includes('<svg onload=alert(2)>'));
  assert.ok(writtenHtml.includes('ORD-2&lt;script&gt;alert(9)&lt;/script&gt;'));
});

runTest('exportReportToPDF escapes title, KPI values, and table cells', () => {
  let writtenHtml = '';
  const fakePopup = {
    opener: { secret: true } as unknown,
    document: {
      open() {},
      write(html: string) {
        writtenHtml = html;
      },
      close() {},
    },
    focus() {},
    print() {},
  };
  (globalThis as unknown as { window?: unknown }).window = {
    open() {
      return fakePopup;
    },
  };

  exportReportToPDF({
    title: 'Sales Report <script>alert(1)</script>',
    subtitle: 'Sub <img src=x onerror=alert(2)>',
    dateRange: '2026-11-01 to 2026-11-26',
    kpis: [{ label: 'Rev <script>', value: '$100<img src=x>' }],
    sections: [
      {
        heading: 'Top <svg onload=alert(3)>',
        headers: ['Product<script>', 'Count'],
        rows: [['Tee <script>alert(4)</script>', 10]],
      },
    ],
  });

  assert.ok(!writtenHtml.includes('<script>alert(1)</script>'));
  assert.ok(!writtenHtml.includes('<script>alert(4)</script>'));
  assert.ok(!writtenHtml.includes('<img src=x'));
  assert.ok(!writtenHtml.includes('<svg onload=alert(3)>'));
  assert.ok(writtenHtml.includes('Sales Report &lt;script&gt;alert(1)&lt;/script&gt;'));
});

console.log('ALL FRONTEND XSS & URL SECURITY TESTS PASSED');
