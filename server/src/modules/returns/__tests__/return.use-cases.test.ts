import {
  CreateReturnUseCase,
  InspectReturnUseCase,
} from '../application/use-cases/return.use-cases';
import { Return } from '../domain/entities/return.entity';
import { Order } from '../../orders/domain/entities/order.entity';
jest.mock('../../notifications/application/services/notification.service', () => ({
  NotificationService: {
    getInstance: jest.fn(() => ({
      notify: jest.fn(async () => {}),
    })),
  },
}));

jest.mock('../../users/infrastructure/models/user.model', () => ({
  UserModel: {
    findById: jest.fn(() => ({
      select: jest.fn(() => ({
        lean: jest.fn(async () => ({ fullName: 'Test Customer', email: 'test@example.com' })),
      })),
    })),
  },
}));

describe('Return Flow Unit & Integration Tests', () => {
  let mockReturnRepo: any;
  let mockOrderRepo: any;
  let mockVariantRepo: any;
  let mockInventoryRepo: any;
  let mockStockLogRepo: any;

  beforeEach(() => {
    mockReturnRepo = {
      save: jest.fn(async (r) => r),
      findById: jest.fn(),
      findByOrderId: jest.fn(async () => []),
      findByOrderItemId: jest.fn(async () => []),
      findByUserId: jest.fn(async () => []),
      findAllReturns: jest.fn(async () => ({ data: [], total: 0 })),
    };

    mockOrderRepo = {
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      save: jest.fn(async (o) => o),
    };

    mockVariantRepo = {
      findById: jest.fn(),
      save: jest.fn(async (v) => v),
    };

    mockInventoryRepo = {
      findByVariantId: jest.fn(),
      save: jest.fn(async (i) => i),
    };

    mockStockLogRepo = {
      save: jest.fn(async (s) => s),
    };
  });

  it('should prevent return request if order is not DELIVERED', async () => {
    const order = Order.create({
      orderNumber: 'YOX-2026-1001',
      userId: 'user-1',
      subtotal: 1000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1000,
      paymentMethod: 'COD',
      shippingAddress: {
        fullName: 'Test User',
        phone: '9999999999',
        streetAddress: 'Street 1',
        city: 'City',
        state: 'State',
        country: 'India',
        postalCode: '100001',
      },
      items: [
        {
          productId: 'p-1',
          variantId: 'v-1',
          productName: 'Test Product',
          sku: 'SKU1',
          quantity: 2,
          unitPrice: 500,
          discount: 0,
          subtotal: 1000,
        },
      ],
    });

    mockOrderRepo.findById.mockResolvedValue(order);

    const useCase = new CreateReturnUseCase(mockReturnRepo, mockOrderRepo);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          orderId: order.id,
          orderItemId: 'v-1',
          quantity: 1,
          reason: 'WRONG_SIZE',
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
        },
      })
    ).rejects.toThrow(/Cannot request return for order in status: PLACED/);
  });

  it('should prevent return request if order delivered more than 7 days ago', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const order = Order.reconstitute({
      id: 'order-expired',
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
      placedAt: eightDaysAgo,
      deliveredAt: eightDaysAgo,
      orderNumber: 'YOX-2026-EXPIRED',
      userId: 'user-1',
      subtotal: 1000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      shippingAddress: {
        fullName: 'Test User',
        phone: '9999999999',
        streetAddress: 'Street 1',
        city: 'City',
        state: 'State',
        country: 'India',
        postalCode: '100001',
      },
      items: [
        {
          productId: 'p-1',
          variantId: 'v-1',
          productName: 'Test Product',
          sku: 'SKU1',
          quantity: 2,
          unitPrice: 500,
          discount: 0,
          subtotal: 1000,
        },
      ],
    });

    mockOrderRepo.findById.mockResolvedValue(order);

    const useCase = new CreateReturnUseCase(mockReturnRepo, mockOrderRepo);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          orderId: 'order-expired',
          orderItemId: 'v-1',
          quantity: 1,
          reason: 'WRONG_SIZE',
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
        },
      })
    ).rejects.toThrow(/Return window expired: The 7-day return policy for this order expired/);
  });

  it('should prevent return request if fewer than 3 images are provided', async () => {
    const order = Order.reconstitute({
      id: 'order-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      placedAt: new Date(),
      deliveredAt: new Date(),
      orderNumber: 'YOX-2026-1001',
      userId: 'user-1',
      subtotal: 1000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      shippingAddress: {
        fullName: 'Test User',
        phone: '9999999999',
        streetAddress: 'Street 1',
        city: 'City',
        state: 'State',
        country: 'India',
        postalCode: '100001',
      },
      items: [
        {
          productId: 'p-1',
          variantId: 'v-1',
          productName: 'Test Product',
          sku: 'SKU1',
          quantity: 2,
          unitPrice: 500,
          discount: 0,
          subtotal: 1000,
        },
      ],
    });

    mockOrderRepo.findById.mockResolvedValue(order);

    const useCase = new CreateReturnUseCase(mockReturnRepo, mockOrderRepo);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          orderId: 'order-1',
          orderItemId: 'v-1',
          quantity: 1,
          reason: 'WRONG_SIZE',
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        },
      })
    ).rejects.toThrow(/At least 3 photos of the item are mandatory/);
  });

  it('should allow return request for DELIVERED order item within 7 days and with 3+ images', async () => {
    const order = Order.reconstitute({
      id: 'order-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      placedAt: new Date(),
      deliveredAt: new Date(),
      orderNumber: 'YOX-2026-1001',
      userId: 'user-1',
      subtotal: 1000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      shippingAddress: {
        fullName: 'Test User',
        phone: '9999999999',
        streetAddress: 'Street 1',
        city: 'City',
        state: 'State',
        country: 'India',
        postalCode: '100001',
      },
      items: [
        {
          productId: 'p-1',
          variantId: 'v-1',
          productName: 'Test Product',
          sku: 'SKU1',
          quantity: 2,
          unitPrice: 500,
          discount: 0,
          subtotal: 1000,
        },
      ],
    });

    mockOrderRepo.findById.mockResolvedValue(order);

    const useCase = new CreateReturnUseCase(mockReturnRepo, mockOrderRepo);

    const result = await useCase.execute({
      userId: 'user-1',
      data: {
        orderId: 'order-1',
        orderItemId: 'v-1',
        quantity: 1,
        reason: 'WRONG_SIZE',
        images: [
          'https://example.com/front.jpg',
          'https://example.com/back.jpg',
          'https://example.com/tag.jpg',
        ],
      },
    });

    expect(result.status).toBe('REQUESTED');
    expect(result.quantity).toBe(1);
    expect(result.reason).toBe('WRONG_SIZE');
    expect(result.images).toHaveLength(3);
  });

  it('should increase availableStock when inspection is RESELLABLE', async () => {
    const returnEntity = Return.reconstitute({
      id: 'ret-1',
      orderId: 'order-1',
      orderItemId: 'v-1',
      userId: 'user-1',
      quantity: 1,
      reason: 'WRONG_SIZE',
      status: 'RECEIVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockReturnRepo.findById.mockResolvedValue(returnEntity);
    mockOrderRepo.findById.mockResolvedValue({ orderNumber: 'YOX-100' });
    mockVariantRepo.findById.mockResolvedValue({
      id: 'v-1',
      increaseStock: jest.fn(),
    });
    mockInventoryRepo.findByVariantId.mockResolvedValue({
      availableStock: 10,
      toJSON: () => ({ availableStock: 10 }),
    });

    const useCase = new InspectReturnUseCase(
      mockReturnRepo,
      mockOrderRepo,
      mockVariantRepo,
      mockInventoryRepo,
      mockStockLogRepo
    );

    const result = await useCase.execute({
      id: 'ret-1',
      data: {
        inspectionResult: 'RESELLABLE',
      },
    });

    expect(result.status).toBe('REFUND_PENDING');
    expect(result.inspectionResult).toBe('RESELLABLE');
    expect(mockInventoryRepo.save).toHaveBeenCalled();
    expect(mockStockLogRepo.save).toHaveBeenCalled();
  });
});
