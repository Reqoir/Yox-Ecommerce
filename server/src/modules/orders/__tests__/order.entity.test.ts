import { Order } from '../domain/entities/order.entity';

describe('Order Domain Entity - State Machine & Invariants', () => {
  const mockShippingAddress = {
    fullName: 'John Doe',
    phone: '9876543210',
    streetAddress: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
  };

  const mockOrderItems = [
    {
      productId: 'prod-1',
      variantId: 'var-1',
      productName: 'Wireless Noise Canceling Headphones - Black',
      sku: 'WHP-BLK-001',
      quantity: 2,
      unitPrice: 1999,
      discount: 0,
      subtotal: 3998,
    },
  ];

  const validOrderProps = {
    orderNumber: 'YOX-2026-100001',
    userId: 'user-123',
    subtotal: 3998,
    discount: 0,
    shippingCharge: 0,
    tax: 0,
    totalAmount: 3998,
    paymentMethod: 'COD',
    shippingAddress: mockShippingAddress,
    items: mockOrderItems,
  };

  it('1. Creates an Order successfully with default status PLACED and payment PENDING for COD', () => {
    const order = Order.create(validOrderProps);

    expect(order.orderNumber).toBe('YOX-2026-100001');
    expect(order.orderStatus).toBe('PLACED');
    expect(order.paymentStatus).toBe('PENDING');
    expect(order.items).toHaveLength(1);
  });

  it('2. Progresses cleanly through standard fulfillment lifecycle: PLACED -> CONFIRMED -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED', () => {
    const order = Order.create(validOrderProps);

    order.confirm();
    expect(order.orderStatus).toBe('CONFIRMED');
    expect(order.confirmedAt).toBeDefined();

    order.pack();
    expect(order.orderStatus).toBe('PACKED');
    expect(order.packedAt).toBeDefined();

    order.ship('BLUEDART-8899', 'partner-bd');
    expect(order.orderStatus).toBe('SHIPPED');
    expect(order.trackingNumber).toBe('BLUEDART-8899');
    expect(order.shippedAt).toBeDefined();

    order.outForDelivery();
    expect(order.orderStatus).toBe('OUT_FOR_DELIVERY');

    order.deliver();
    expect(order.orderStatus).toBe('DELIVERED');
    expect(order.paymentStatus).toBe('PAID'); // COD payment status automatically flips to PAID on delivery
    expect(order.deliveredAt).toBeDefined();
  });

  it('3. Blocks illegal state transitions (e.g. attempting to mark Out for Delivery directly from PLACED)', () => {
    const order = Order.create(validOrderProps);
    expect(() => order.outForDelivery()).toThrow('Cannot mark order out for delivery from status: PLACED');
    expect(() => order.deliver()).toThrow('Cannot deliver order from status: PLACED');
  });

  it('4. Enforces cancellation protection: User cannot cancel an order once SHIPPED', () => {
    const order = Order.create(validOrderProps);
    order.confirm();
    order.pack();
    order.ship('TRK-999');

    expect(() => order.cancel('User changed mind', false)).toThrow(
      'Cannot cancel order from current status: SHIPPED'
    );
  });

  it('5. Allows Admin override to cancel an order even after shipping if necessary', () => {
    const order = Order.create(validOrderProps);
    order.confirm();
    order.pack();
    order.ship('TRK-999');

    order.cancel('Damaged duringtransit - admin override', true);
    expect(order.orderStatus).toBe('CANCELLED');
    expect(order.cancelledReason).toContain('admin override');
  });

  it('6. Guarantees Shipping Address and Purchased Items remain immutable snapshots', () => {
    const mutableAddress = { ...mockShippingAddress };
    const order = Order.create({ ...validOrderProps, shippingAddress: mutableAddress });

    // Try mutating external address object after order is generated
    mutableAddress.city = 'Modified City';
    expect(order.shippingAddress.city).toBe('Mumbai');

    // Try mutating returned address object from getter
    const retrievedAddress = order.shippingAddress;
    retrievedAddress.streetAddress = 'Hacked Street';
    expect(order.shippingAddress.streetAddress).toBe('123 Main Street');
  });
});
