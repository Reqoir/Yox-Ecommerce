/**
 * @file inventory.entity.spec.ts
 * @layer Domain
 * 
 * Unit tests for the Inventory domain entity.
 */

import { Inventory } from '../inventory.entity';

describe('Inventory Domain Entity Unit Tests', () => {
  describe('create()', () => {
    it('should create an inventory instance with provided fields', () => {
      const input = {
        variantId: 'var-123',
        availableStock: 100,
        reservedStock: 10,
        damagedStock: 2,
        warehouseLocation: 'Aisle-4-B',
      };

      const inventory = Inventory.create(input);

      // Verify basic fields are set
      expect(inventory.variantId).toBe('var-123');
      expect(inventory.availableStock).toBe(100);
      expect(inventory.reservedStock).toBe(10);
      expect(inventory.damagedStock).toBe(2);
      expect(inventory.warehouseLocation).toBe('Aisle-4-B');
      
      // Verify default values from BaseEntity are set
      expect(inventory.createdAt).toBeInstanceOf(Date);
      expect(inventory.updatedAt).toBeInstanceOf(Date);
      expect(inventory.id).toBe('');
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute an inventory instance from existing props', () => {
      const input = {
        id: 'inv-456',
        variantId: 'var-123',
        availableStock: 50,
        reservedStock: 5,
        damagedStock: 0,
        warehouseLocation: 'Warehouse-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const inventory = Inventory.reconstitute(input);

      expect(inventory.id).toBe('inv-456');
      expect(inventory.variantId).toBe('var-123');
      expect(inventory.availableStock).toBe(50);
      expect(inventory.createdAt).toEqual(new Date('2026-01-01'));
      expect(inventory.updatedAt).toEqual(new Date('2026-01-02'));
    });
  });

  describe('adjustStock()', () => {
    it('should correctly increment available stock when adjusting with positive amount', () => {
      const inventory = Inventory.create({
        variantId: 'var-123',
        availableStock: 100,
        reservedStock: 0,
        damagedStock: 0,
      });

      expect(inventory.availableStock).toBe(100);
      
      inventory.adjustStock(50);
      expect(inventory.availableStock).toBe(150);
    });

    it('should correctly decrement available stock when adjusting with negative amount', () => {
      const inventory = Inventory.create({
        variantId: 'var-123',
        availableStock: 100,
        reservedStock: 0,
        damagedStock: 0,
      });

      expect(inventory.availableStock).toBe(100);
      
      inventory.adjustStock(-30);
      expect(inventory.availableStock).toBe(70);
    });
  });
});
