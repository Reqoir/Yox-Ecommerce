/**
 * @file product-variant.entity.spec.ts
 * @layer Domain
 * 
 * Unit tests for the ProductVariant domain entity.
 */

import { ProductVariant } from '../product-variant.entity';

describe('ProductVariant Domain Entity Unit Tests', () => {
  describe('create()', () => {
    it('should create a product variant instance', () => {
      const input = {
        productId: 'prod-1',
        sku: 'SKU-123',
        title: 'Red XL',
        color: 'Red',
        size: 'XL',
        price: 50.5,
        stock: 20,
        lowStockThreshold: 5,
        images: [],
        isDefault: false,
        isActive: true,
      };

      const variant = ProductVariant.create(input);

      expect(variant.productId).toBe('prod-1');
      expect(variant.sku).toBe('SKU-123');
      expect(variant.size).toBe('XL');
      expect(variant.price).toBe(50.5);
      expect(variant.stock).toBe(20);
      expect(variant.createdAt).toBeInstanceOf(Date);
      expect(variant.updatedAt).toBeInstanceOf(Date);
      expect(variant.id).toBe('');
    });
  });

  describe('reduceStock()', () => {
    it('should reduce stock if sufficient amount is available', () => {
      const variant = ProductVariant.create({
        productId: 'prod-1',
        sku: 'SKU-123',
        title: 'Red XL',
        color: 'Red',
        price: 50,
        stock: 10,
        lowStockThreshold: 5,
        images: [],
        isDefault: false,
        isActive: true,
      });

      variant.reduceStock(4);
      expect(variant.stock).toBe(6);
    });

    it('should throw an error if reducing stock below 0', () => {
      const variant = ProductVariant.create({
        productId: 'prod-1',
        sku: 'SKU-123',
        title: 'Red XL',
        color: 'Red',
        price: 50,
        stock: 5,
        lowStockThreshold: 5,
        images: [],
        isDefault: false,
        isActive: true,
      });

      expect(() => {
        variant.reduceStock(6);
      }).toThrow('Insufficient stock');
    });
  });

  describe('increaseStock()', () => {
    it('should increase stock by the given amount', () => {
      const variant = ProductVariant.create({
        productId: 'prod-1',
        sku: 'SKU-123',
        title: 'Red XL',
        color: 'Red',
        price: 50,
        stock: 10,
        lowStockThreshold: 5,
        images: [],
        isDefault: false,
        isActive: true,
      });

      variant.increaseStock(15);
      expect(variant.stock).toBe(25);
    });
  });
});
