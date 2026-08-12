import {
  CreateReturnUseCase,
  InspectReturnUseCase,
} from '../application/use-cases/return.use-cases';
import { Return } from '../domain/entities/return.entity';
import { Order } from '../../orders/domain/entities/order.entity';

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
        },
      })
    ).rejects.toThrow(/Cannot request return for order in status: PLACED/);
  });

  it('should allow return request for DELIVERED order item within valid quantity', async () => {
    const order = Order.reconstitute({
      id: 'order-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      placedAt: new Date(),
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
      },
    });

    expect(result.status).toBe('REQUESTED');
    expect(result.quantity).toBe(1);
    expect(result.reason).toBe('WRONG_SIZE');
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
