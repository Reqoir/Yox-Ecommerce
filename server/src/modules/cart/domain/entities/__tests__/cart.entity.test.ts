import { Cart } from '../cart.entity';

describe('Cart Entity', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = Cart.create({
      userId: 'user-1',
      items: [],
    });
  });

  it('should initialize with 0 totals', () => {
    expect(cart.totalItems).toBe(0);
    expect(cart.totalAmount).toBe(0);
    expect(cart.finalAmount).toBe(0);
    expect(cart.items).toHaveLength(0);
  });

  it('should calculate totals correctly when adding items', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    
    expect(cart.totalItems).toBe(2);
    expect(cart.totalAmount).toBe(200);
    expect(cart.finalAmount).toBe(200);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].subtotal).toBe(200);

    cart.addItem({ variantId: 'v2', quantity: 1, price: 50 });
    
    expect(cart.totalItems).toBe(3);
    expect(cart.totalAmount).toBe(250);
    expect(cart.finalAmount).toBe(250);
    expect(cart.items).toHaveLength(2);
  });

  it('should update quantity of an existing item', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.addItem({ variantId: 'v1', quantity: 3, price: 100 }); // Same variant

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.totalItems).toBe(5);
    expect(cart.totalAmount).toBe(500);
  });

  it('should update price of an existing item if it changes on re-add', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.addItem({ variantId: 'v1', quantity: 1, price: 150 }); 

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[0].price).toBe(150);
    expect(cart.items[0].subtotal).toBe(450);
    expect(cart.totalAmount).toBe(450);
  });

  it('should set quantity explicitly', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.updateItemQuantity('v1', 5);

    expect(cart.items[0].quantity).toBe(5);
    expect(cart.items[0].subtotal).toBe(500);
    expect(cart.totalAmount).toBe(500);
  });

  it('should remove item when quantity is set to 0', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.updateItemQuantity('v1', 0);

    expect(cart.items).toHaveLength(0);
    expect(cart.totalItems).toBe(0);
    expect(cart.totalAmount).toBe(0);
  });

  it('should remove item explicitly', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.addItem({ variantId: 'v2', quantity: 1, price: 50 });
    
    cart.removeItem('v1');

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].variantId).toBe('v2');
    expect(cart.totalItems).toBe(1);
    expect(cart.totalAmount).toBe(50);
  });

  it('should clear cart', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.clear();

    expect(cart.items).toHaveLength(0);
    expect(cart.totalItems).toBe(0);
    expect(cart.totalAmount).toBe(0);
  });

  it('should apply and remove coupon', () => {
    cart.addItem({ variantId: 'v1', quantity: 2, price: 100 });
    cart.applyCoupon('coupon-1', 50);

    expect(cart.couponId).toBe('coupon-1');
    expect(cart.discountAmount).toBe(50);
    expect(cart.totalAmount).toBe(200);
    expect(cart.finalAmount).toBe(150);

    cart.removeCoupon();

    expect(cart.couponId).toBeNull();
    expect(cart.discountAmount).toBe(0);
    expect(cart.finalAmount).toBe(200);
  });
  
  it('should not allow negative finalAmount', () => {
    cart.addItem({ variantId: 'v1', quantity: 1, price: 100 });
    cart.applyCoupon('coupon-1', 150);

    expect(cart.totalAmount).toBe(100);
    expect(cart.finalAmount).toBe(0);
  });
});
