import { PaymentReportService } from '../infrastructure/services/payment-report.service';

describe('PaymentReportService Unit Tests', () => {
  let service: PaymentReportService;

  beforeEach(() => {
    service = new PaymentReportService();
  });

  describe('resolveDateRange', () => {
    it('should correctly resolve "today" preset', () => {
      const { dateFrom, dateTo } = service.resolveDateRange({ preset: 'today' });
      expect(dateFrom).toBeDefined();
      expect(dateTo).toBeDefined();
      expect(dateFrom!.getDate()).toBe(new Date().getDate());
    });

    it('should correctly resolve "last7days" preset', () => {
      const { dateFrom, dateTo } = service.resolveDateRange({ preset: 'last7days' });
      const expectedStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(dateFrom!.getDate()).toBe(expectedStart.getDate());
      expect(dateTo).toBeDefined();
    });

    it('should support custom dateFrom and dateTo strings', () => {
      const { dateFrom, dateTo } = service.resolveDateRange({
        preset: 'custom',
        dateFrom: '2026-08-01T00:00:00.000Z',
        dateTo: '2026-08-10T23:59:59.999Z',
      });
      expect(dateFrom!.toISOString()).toBe('2026-08-01T00:00:00.000Z');
      expect(dateTo!.toISOString()).toBe('2026-08-10T23:59:59.999Z');
    });
  });
});
