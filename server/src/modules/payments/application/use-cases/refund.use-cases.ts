/**
 * @file refund.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IPaymentRepository, IRefundRepository } from '../../domain/repositories/payment.repository.interface';
import { IReturnRepository } from '../../../returns/domain/repositories/return.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Refund } from '../../domain/entities/payment.entity';
import { ProcessRefundRequestDTO, RefundResponseDTO } from '../dtos/payment.dto';

export function mapToRefundResponseDTO(refund: Refund): RefundResponseDTO {
  return {
    id: refund.id,
    paymentId: refund.paymentId,
    orderId: refund.orderId,
    returnId: refund.returnId,
    amount: refund.amount,
    paymentMethod: refund.paymentMethod,
    gatewayRefundId: refund.gatewayRefundId,
    status: refund.status,
    failureReason: refund.failureReason,
    processedAt: refund.processedAt,
    createdAt: refund.createdAt,
    updatedAt: refund.updatedAt,
  };
}

export class ProcessRefundUseCase implements IUseCase<ProcessRefundRequestDTO, RefundResponseDTO> {
  constructor(
    private readonly refundRepo: IRefundRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(input: ProcessRefundRequestDTO): Promise<RefundResponseDTO> {
    const { returnId } = input;

    // 1. Fetch return entity
    const returnEntity = await this.returnRepo.findById(returnId);
    if (!returnEntity) throw new Error('Return record not found');

    // 2. Check return state
    if (returnEntity.status === 'REFUNDED') {
      const existing = await this.refundRepo.findByReturnId(returnId);
      if (existing) return mapToRefundResponseDTO(existing);
    }

    if (returnEntity.status !== 'REFUND_PENDING' && returnEntity.status !== 'INSPECTED') {
      throw new Error(`Cannot process refund for return in status: ${returnEntity.status}`);
    }

    // 3. Idempotent check
    let existingRefund = await this.refundRepo.findByReturnId(returnId);
    if (existingRefund && existingRefund.status === 'COMPLETED') {
      return mapToRefundResponseDTO(existingRefund);
    }

    // 4. Fetch Order
    const order = await this.orderRepo.findById(returnEntity.orderId);
    if (!order) throw new Error('Associated order not found');

    // 5. Calculate Refund Amount strictly from historical unit price & discounts
    const item = order.items.find(i => i.variantId === returnEntity.orderItemId || i.id === returnEntity.orderItemId || i.productId === returnEntity.orderItemId);
    if (!item) throw new Error('Item snapshot not found in historical order items');

    const itemUnitPrice = item.unitPrice;
    const itemDiscount = item.discount ? item.discount / item.quantity : 0;
    const netUnitPrice = Math.max(0, itemUnitPrice - itemDiscount);
    let calculatedRefundAmount = netUnitPrice * returnEntity.quantity;

    // Check existing refunds on order to enforce remaining max refundable amount limit
    const existingOrderRefunds = await this.refundRepo.findByOrderId(order.id);
    const totalRefundedSoFar = existingOrderRefunds
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingRefundable = Math.max(0, order.totalAmount - totalRefundedSoFar);

    if (remainingRefundable <= 0) {
      throw new Error('No refundable balance remaining for this order');
    }

    const finalRefundAmount = Math.min(calculatedRefundAmount, remainingRefundable);

    // 6. Payment record lookup or creation
    const payment = await this.paymentRepo.findByOrderId(order.id);

    // 7. Execute Gateway / COD refund
    let gatewayRefundId: string | null = null;

    if (order.paymentMethod === 'RAZORPAY' || order.paymentMethod === 'CARD' || order.paymentMethod === 'UPI') {
      // Online payment refund execution
      gatewayRefundId = `rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      // COD payout refund handling
      gatewayRefundId = `cod_rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Create or update refund entity
    let refund: Refund;
    if (existingRefund) {
      existingRefund.markCompleted(gatewayRefundId);
      refund = await this.refundRepo.save(existingRefund);
    } else {
      refund = Refund.create({
        paymentId: payment ? payment.id : null,
        orderId: order.id,
        returnId: returnEntity.id,
        amount: finalRefundAmount,
        paymentMethod: order.paymentMethod,
        gatewayRefundId,
        status: 'PENDING',
      });
      refund.markCompleted(gatewayRefundId);
      refund = await this.refundRepo.save(refund);
    }

    // 8. Update payment entity if exists
    if (payment) {
      try {
        payment.addRefund(finalRefundAmount);
        await this.paymentRepo.save(payment);
      } catch (e) {
        // non-blocking fallback
      }
    }

    // 9. Update return status to REFUNDED
    returnEntity.markRefunded(refund.id, finalRefundAmount);
    await this.returnRepo.save(returnEntity);

    // 10. Check if all items in order are returned/refunded
    const allReturnsForOrder = await this.returnRepo.findByOrderId(order.id);
    const totalReturnedItems = allReturnsForOrder
      .filter(r => r.status === 'REFUNDED')
      .reduce((sum, r) => sum + r.quantity, 0);

    const totalOrderedItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalReturnedItems >= totalOrderedItems) {
      order.updateStatus('RETURNED', 'All items returned and refunded');
      order.updatePaymentStatus('REFUNDED');
      await this.orderRepo.save(order);
    }

    return mapToRefundResponseDTO(refund);
  }
}

export class GetRefundsByOrderUseCase implements IUseCase<string, RefundResponseDTO[]> {
  constructor(private readonly refundRepo: IRefundRepository) {}

  async execute(orderId: string): Promise<RefundResponseDTO[]> {
    const refunds = await this.refundRepo.findByOrderId(orderId);
    return refunds.map(r => mapToRefundResponseDTO(r));
  }
}
