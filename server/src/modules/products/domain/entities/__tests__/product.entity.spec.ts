/**
 * @file product.entity.spec.ts
 * @layer Domain
 * 
 * Unit tests for the Product domain entity.
 */

import { Product } from '../product.entity';
import { ProductVariant } from '../product-variant.entity';

describe('Product Domain Entity Unit Tests', () => {
  describe('create()', () => {
    it('should create a product instance with default fields', () => {
      const input = {
        name: 'Test Product',
        slug: 'test-product',
        isFeatured: false,
        isActive: true,
      };

      const product = Product.create(input);

      // Verify basic fields are set
      expect(product.name).toBe('Test Product');
      expect(product.slug).toBe('test-product');
      expect(product.isFeatured).toBe(false);
      expect(product.isActive).toBe(true);
      
      // Verify default values are set
      expect(product.salesCount).toBe(0);
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
      expect(product.id).toBe('');
    });
  });

  describe('attachVariants()', () => {
    it('should attach variants to the product', () => {
      const product = Product.create({
        name: 'Test Product',
        slug: 'test-product',
        isFeatured: false,
        isActive: true,
      });

      const variant = ProductVariant.create({
        productId: 'prod-1',
        sku: 'SKU-1',
        title: 'Variant 1',
        color: 'Red',
        price: 100,
        stock: 10,
        lowStockThreshold: 5,
        images: [],
        isDefault: true,
        isActive: true,
      });

      expect(product.variants).toBeUndefined();

      product.attachVariants([variant]);

      expect(product.variants).toBeDefined();
      expect(product.variants?.length).toBe(1);
      expect(product.variants?.[0].sku).toBe('SKU-1');
    });
  });

  describe('incrementSales()', () => {
    it('should increment sales count by default amount (1)', () => {
      const product = Product.create({
        name: 'Test Product',
        slug: 'test-product',
        isFeatured: false,
        isActive: true,
      });

      expect(product.salesCount).toBe(0);
      
      product.incrementSales();
      expect(product.salesCount).toBe(1);
      
      product.incrementSales(5);
      expect(product.salesCount).toBe(6);
    });
  });
});
