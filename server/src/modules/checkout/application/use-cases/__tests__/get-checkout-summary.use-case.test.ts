import { GetCheckoutSummaryUseCase } from '../get-checkout-summary.use-case';
import { ICartRepository } from '../../../../cart/domain/repositories/cart.repository.interface';
import { Cart } from '../../../../cart/domain/entities/cart.entity';

describe('GetCheckoutSummaryUseCase', () => {
  let useCase: GetCheckoutSummaryUseCase;
  let mockCartRepo: jest.Mocked<ICartRepository>;

  beforeEach(() => {
    mockCartRepo = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ICartRepository>;

    useCase = new GetCheckoutSummaryUseCase(mockCartRepo);
  });

  it('should throw an error if cart is not found or empty', async () => {
    mockCartRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toThrow('Cannot generate checkout summary for an empty cart');
  });

  it('should apply 100% free shipping and tax-inclusive totals for orders under 500', async () => {
    const mockCart = Cart.create({
      userId: 'user-1',
      items: [],
    });
    mockCart.addItem({ variantId: 'v-1', quantity: 2, price: 100 }); // subtotal = 200

    mockCartRepo.findByUserId.mockResolvedValue(mockCart);

    const summary = await useCase.execute('user-1');

    expect(summary.subtotal).toBe(200);
    expect(summary.discountAmount).toBe(0);
    expect(summary.shippingAmount).toBe(0); // 100% Free Shipping nationwide
    expect(summary.taxAmount).toBe(0); // Default isTaxInclusive = true
    expect(summary.total).toBe(200);
  });

  it('should apply 100% free shipping and tax-inclusive totals for orders 500 or more', async () => {
    const mockCart = Cart.create({
      userId: 'user-1',
      items: [],
    });
    mockCart.addItem({ variantId: 'v-1', quantity: 5, price: 100 }); // subtotal = 500

    mockCartRepo.findByUserId.mockResolvedValue(mockCart);

    const summary = await useCase.execute('user-1');

    expect(summary.subtotal).toBe(500);
    expect(summary.shippingAmount).toBe(0);
    expect(summary.taxAmount).toBe(0);
    expect(summary.total).toBe(500);
  });

  it('should clamp discountAmount to subtotal when calculating totals', async () => {
    const mockCart = Cart.create({
      userId: 'user-1',
      items: [],
    });
    mockCart.addItem({ variantId: 'v-1', quantity: 6, price: 100 }); // subtotal = 600
    mockCart.applyCoupon('coupon-1', 100); // discount = 100

    mockCartRepo.findByUserId.mockResolvedValue(mockCart);

    const summary = await useCase.execute('user-1');

    expect(summary.subtotal).toBe(600);
    expect(summary.discountAmount).toBe(100);
    expect(summary.shippingAmount).toBe(0);
    expect(summary.taxAmount).toBe(0);
    expect(summary.total).toBe(500); // 600 - 100
  });
});
