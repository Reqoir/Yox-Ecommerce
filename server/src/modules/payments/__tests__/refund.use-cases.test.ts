import { ProcessRefundUseCase } from '../application/use-cases/refund.use-cases';
import { Return } from '../../returns/domain/entities/return.entity';
import { Payment } from '../domain/entities/payment.entity';

describe('Refund Use Case Unit Tests', () => {
  let mockRefundRepo: any;
  let mockPaymentRepo: any;
  let mockReturnRepo: any;
  let mockOrderRepo: any;
  let mockRazorpayService: any;

  beforeEach(() => {
    mockRefundRepo = {
      save: jest.fn(async (r) => r),
      findByReturnId: jest.fn(async () => null),
      findByOrderId: jest.fn(async () => []),
      findByGatewayRefundId: jest.fn(async () => null),
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

    mockRazorpayService = {
      createRefund: jest.fn(async (paymentId: string, amountInPaise: number) => ({
        id: 'rfnd_gateway_001',
        paymentId,
        amount: amountInPaise,
        status: 'processed',
      })),
    };
  });

  it('should process a valid refund accurately via Razorpay from historical item price', async () => {
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
      paymentStatus: 'PAID',
      paymentId: 'pay_test_123456',
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

    const mockPayment = Payment.reconstitute({
      id: 'paydoc-1',
      orderId: 'ord-100',
      userId: 'user-1',
      amount: 1500,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PAID',
      transactionId: 'pay_test_123456',
      gatewayOrderId: 'order_rzp_100',
      refundedAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockReturnRepo.findById.mockResolvedValue(returnEntity);
    mockOrderRepo.findById.mockResolvedValue(mockOrder);
    mockPaymentRepo.findByOrderId.mockResolvedValue(mockPayment);

    const useCase = new ProcessRefundUseCase(
      mockRefundRepo,
      mockPaymentRepo,
      mockReturnRepo,
      mockOrderRepo,
      mockRazorpayService
    );

    const result = await useCase.execute({ returnId: 'ret-100' });

    expect(mockRazorpayService.createRefund).toHaveBeenCalledWith(
      'pay_test_123456',
      75000,
      expect.objectContaining({ orderId: 'ord-100', returnId: 'ret-100' })
    );
    expect(result.amount).toBe(750);
    expect(result.status).toBe('COMPLETED');
    expect(result.gatewayRefundId).toBe('rfnd_gateway_001');
    expect(mockReturnRepo.save).toHaveBeenCalled();
  });
});
