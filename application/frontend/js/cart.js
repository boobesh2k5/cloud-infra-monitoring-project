// Cart State & Calculations Manager

const CART_STORAGE_KEY = 'nova_luxe_cart_v1';
const COUPON_STORAGE_KEY = 'nova_luxe_applied_coupon';

// Valid promo coupons configuration
const PROMO_COUPONS = {
  'WELCOME10': {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrder: 500,
    description: '10% OFF on orders above ₹500'
  },
  'SAVE20': {
    code: 'SAVE20',
    type: 'percent',
    value: 20,
    minOrder: 2000,
    description: '20% OFF on orders above ₹2,000'
  },
  'FESTIVE500': {
    code: 'FESTIVE500',
    type: 'flat',
    value: 500,
    minOrder: 3000,
    description: 'Flat ₹500 OFF on orders above ₹3,000'
  }
};

class CartManager {
  constructor() {
    this.items = this.loadCart();
    this.appliedCoupon = this.loadCoupon();
    this.freeShippingThreshold = 999;
    this.standardShippingFee = 99;
    this.gstRate = 0.18; // 18% standard GST
  }

  loadCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading cart from storage', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }

  loadCoupon() {
    try {
      const code = localStorage.getItem(COUPON_STORAGE_KEY);
      return code && PROMO_COUPONS[code] ? PROMO_COUPONS[code] : null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon(coupon) {
    if (coupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, coupon.code);
      this.appliedCoupon = coupon;
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
      this.appliedCoupon = null;
    }
    this.notifyUpdate();
  }

  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.getSummary() }));
  }

  addItem(productId, quantity = 1) {
    const existing = this.items.find(item => item.id === productId);
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > 10) existing.quantity = 10;
    } else {
      this.items.push({ id: productId, quantity: Math.min(quantity, 10) });
    }
    this.saveCart();
  }

  updateQuantity(productId, quantity) {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.min(qty, 10);
      this.saveCart();
    }
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
  }

  clearCart() {
    this.items = [];
    this.appliedCoupon = null;
    localStorage.removeItem(COUPON_STORAGE_KEY);
    this.saveCart();
  }

  getTotalCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const coupon = PROMO_COUPONS[cleanCode];
    if (!coupon) {
      return { 
        success: false, 
        message: `Invalid coupon "${cleanCode}". Try WELCOME10, SAVE20, or FESTIVE500.` 
      };
    }

    const summary = this.getSummary(false);
    if (summary.subtotal < coupon.minOrder) {
      return {
        success: false,
        message: `Minimum order of ${formatINR(coupon.minOrder)} required for coupon ${coupon.code}. Your subtotal is ${formatINR(summary.subtotal)}.`
      };
    }

    this.saveCoupon(coupon);
    return {
      success: true,
      message: `Coupon "${coupon.code}" applied successfully! You saved ${formatINR(this.calculateDiscount(summary.subtotal, coupon))}.`
    };
  }

  removeCoupon() {
    this.saveCoupon(null);
    return { success: true, message: 'Coupon removed.' };
  }

  calculateDiscount(subtotal, coupon = this.appliedCoupon) {
    if (!coupon || subtotal < coupon.minOrder) return 0;
    if (coupon.type === 'percent') {
      return Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'flat') {
      return Math.min(coupon.value, subtotal);
    }
    return 0;
  }

  getSummary(includeCoupon = true) {
    let subtotal = 0;
    const populatedItems = [];

    this.items.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.id);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;
        populatedItems.push({
          ...product,
          quantity: cartItem.quantity,
          itemTotal
        });
      }
    });

    let discount = 0;
    let validCoupon = null;
    if (includeCoupon && this.appliedCoupon) {
      if (subtotal >= this.appliedCoupon.minOrder) {
        validCoupon = this.appliedCoupon;
        discount = this.calculateDiscount(subtotal, validCoupon);
      }
    }

    const shipping = (subtotal === 0 || subtotal >= this.freeShippingThreshold) ? 0 : this.standardShippingFee;
    const tax = Math.round(subtotal * this.gstRate);
    const finalTotal = Math.max(0, subtotal - discount + tax + shipping);
    const freeShippingGap = Math.max(0, this.freeShippingThreshold - subtotal);

    return {
      items: populatedItems,
      totalCount: this.getTotalCount(),
      subtotal,
      discount,
      tax,
      shipping,
      freeShippingThreshold: this.freeShippingThreshold,
      freeShippingGap,
      appliedCoupon: validCoupon,
      finalTotal
    };
  }
}

const cartManager = new CartManager();
