/**
 * @file stock-log.entity.spec.ts
 * @layer Domain
 * 
 * Unit tests for the StockLog domain entity.
 */

import { StockLog } from '../stock-log.entity';

describe('StockLog Domain Entity Unit Tests', () => {
  describe('create()', () => {
    it('should create a stock log instance with provided fields', () => {
      const input = {
        inventoryId: 'inv-123',
        type: 'IN' as const,
        amount: 50,
        previousStock: 100,
        newStock: 150,
        reason: 'Restock shipment',
        reference: 'PO-9988',
      };

      const stockLog = StockLog.create(input);

      // Verify basic fields are set
      expect(stockLog.inventoryId).toBe('inv-123');
      expect(stockLog.type).toBe('IN');
      expect(stockLog.amount).toBe(50);
      expect(stockLog.previousStock).toBe(100);
      expect(stockLog.newStock).toBe(150);
      expect(stockLog.reason).toBe('Restock shipment');
      expect(stockLog.reference).toBe('PO-9988');
      
      // Verify default values from BaseEntity are set
      expect(stockLog.createdAt).toBeInstanceOf(Date);
      expect(stockLog.updatedAt).toBeInstanceOf(Date);
      expect(stockLog.id).toBe('');
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a stock log instance from existing props', () => {
      const input = {
        id: 'log-999',
        inventoryId: 'inv-123',
        type: 'OUT' as const,
        amount: 10,
        previousStock: 150,
        newStock: 140,
        reason: 'Order fulfilled',
        reference: 'ORDER-123',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-01'),
      };

      const stockLog = StockLog.reconstitute(input);

      expect(stockLog.id).toBe('log-999');
      expect(stockLog.inventoryId).toBe('inv-123');
      expect(stockLog.type).toBe('OUT');
      expect(stockLog.amount).toBe(10);
      expect(stockLog.createdAt).toEqual(new Date('2026-05-01'));
    });
  });
});
