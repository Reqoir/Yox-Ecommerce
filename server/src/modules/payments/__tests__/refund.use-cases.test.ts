import { ProcessRefundUseCase } from '../application/use-cases/refund.use-cases';
import { Return } from '../../returns/domain/entities/return.entity';

describe('Refund Use Case Unit Tests', () => {
  let mockRefundRepo: any;
  let mockPaymentRepo: any;
  let mockReturnRepo: any;
  let mockOrderRepo: any;

  beforeEach(() => {
    mockRefundRepo = {
      save: jest.fn(async (r) => r),
      findByReturnId: jest.fn(async () => null),
      findByOrderId: jest.fn(async () => []),
    };

    mockPaymentRepo = {
      findByOrderId: jest.fn(async () => null),
      save: jest.fn(async (p) => p),
    };

    mockReturnRepo = {
      findById: jest.fn(),
      save: jest.fn(async (r) => r),
      findByOrderId: jest.fn(async () => []),
    };

    mockOrderRepo = {
      findById: jest.fn(),
      save: jest.fn(async (o) => o),
    };
  });

  it('should process a valid refund accurately from historical item price', async () => {
    const returnEntity = Return.reconstitute({
      id: 'ret-100',
      orderId: 'ord-100',
      orderItemId: 'v-100',
      userId: 'user-1',
      quantity: 1,
      reason: 'DEFECTIVE',
      status: 'REFUND_PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockOrder = {
      id: 'ord-100',
      orderNumber: 'YOX-2026-999',
      totalAmount: 1500,
      paymentMethod: 'RAZORPAY',
      items: [
        {
          productId: 'p-1',
          variantId: 'v-100',
          quantity: 2,
          unitPrice: 750,
          discount: 0,
        },
      ],
      updateStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };

    mockReturnRepo.findById.mockResolvedValue(returnEntity);
    mockOrderRepo.findById.mockResolvedValue(mockOrder);

    const useCase = new ProcessRefundUseCase(
      mockRefundRepo,
      mockPaymentRepo,
      mockReturnRepo,
      mockOrderRepo
    );

    const result = await useCase.execute({ returnId: 'ret-100' });

    expect(result.amount).toBe(750);
    expect(result.status).toBe('COMPLETED');
    expect(result.gatewayRefundId).toMatch(/^rfnd_/);
    expect(mockReturnRepo.save).toHaveBeenCalled();
  });
});
