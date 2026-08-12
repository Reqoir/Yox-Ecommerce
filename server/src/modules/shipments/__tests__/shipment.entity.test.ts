import { Shipment } from '../domain/entities/shipment.entity';

describe('Shipment Domain Entity Unit Tests', () => {
  it('should create a shipment instance with default PENDING status', () => {
    const shipment = Shipment.create({
      orderId: 'order-123',
    });

    expect(shipment.orderId).toBe('order-123');
    expect(shipment.status).toBe('PENDING');
  });

  it('should update shipment status correctly', () => {
    const shipment = Shipment.create({
      orderId: 'order-123',
    });

    shipment.updateStatus('SHIPPED');
    expect(shipment.status).toBe('SHIPPED');
    expect(shipment.shippedAt).toBeInstanceOf(Date);

    shipment.updateStatus('DELIVERED');
    expect(shipment.status).toBe('DELIVERED');
    expect(shipment.deliveredAt).toBeInstanceOf(Date);
  });

  it('should throw an error for invalid shipment status', () => {
    const shipment = Shipment.create({
      orderId: 'order-123',
    });

    expect(() => shipment.updateStatus('INVALID_STATUS')).toThrow('Invalid shipment status: INVALID_STATUS');
  });

  it('should set tracking details correctly', () => {
    const shipment = Shipment.create({
      orderId: 'order-123',
    });

    shipment.setTracking('TRACK12345', 'delivery-partner-1');
    expect(shipment.trackingNumber).toBe('TRACK12345');
    expect(shipment.deliveryPartnerId).toBe('delivery-partner-1');
  });
});
