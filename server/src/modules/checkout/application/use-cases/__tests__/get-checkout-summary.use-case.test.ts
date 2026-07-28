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

  it('should calculate shipping and tax correctly when subtotal is under $500', async () => {
    const mockCart = Cart.create({
      userId: 'user-1',
      items: [],
    });
    mockCart.addItem({ variantId: 'v-1', quantity: 2, price: 100 }); // subtotal = 200

    mockCartRepo.findByUserId.mockResolvedValue(mockCart);

    const summary = await useCase.execute('user-1');

    expect(summary.subtotal).toBe(200);
    expect(summary.discountAmount).toBe(0);
    expect(summary.shippingAmount).toBe(50); // Under 500 so $50 shipping
    expect(summary.taxAmount).toBe(20); // 10% tax on $200
    expect(summary.total).toBe(270); // 200 + 50 + 20
  });

  it('should calculate free shipping correctly when subtotal is $500 or more', async () => {
    const mockCart = Cart.create({
      userId: 'user-1',
      items: [],
    });
    mockCart.addItem({ variantId: 'v-1', quantity: 5, price: 100 }); // subtotal = 500

    mockCartRepo.findByUserId.mockResolvedValue(mockCart);

    const summary = await useCase.execute('user-1');

    expect(summary.subtotal).toBe(500);
    expect(summary.shippingAmount).toBe(0); // Free shipping
    expect(summary.taxAmount).toBe(50); // 10% tax on $500
    expect(summary.total).toBe(550); // 500 + 0 + 50
  });

  it('should account for discountAmount when calculating tax and totals', async () => {
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
    expect(summary.shippingAmount).toBe(0); // subtotal >= 500
    expect(summary.taxAmount).toBe(50); // 10% on (600 - 100 = 500)
    expect(summary.total).toBe(550); // 500 (discounted) + 0 + 50
  });
});
