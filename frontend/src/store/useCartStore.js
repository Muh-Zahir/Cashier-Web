import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  customerType: 'regular', // 'regular' | 'reseller'
  discount: 0,
  discountType: 'percent', // 'percent' | 'fixed'
  // Shipping
  shippingEnabled: false,
  shippingCost: 0,
  shippingName: '',
  recipientName: '',
  recipientAddress: '',

  // ─── Customer Type Actions ──────────────────────────────────────
  setCustomerType: (type) => {
    const currentItems = get().items;
    const updatedItems = currentItems.map((item) => {
      const regularPrice = item.regular_price !== undefined ? item.regular_price : item.price;
      const resellerPrice = item.reseller_price || 0;
      const activePrice = type === 'reseller' && resellerPrice > 0 ? resellerPrice : regularPrice;
      return {
        ...item,
        price: activePrice,
        regular_price: regularPrice,
      };
    });
    set({ customerType: type, items: updatedItems });
  },

  // ─── Item Actions ───────────────────────────────────────────────
  addItem: (product) => {
    const { items, customerType } = get();
    const regularPrice = product.price;
    const resellerPrice = product.reseller_price || 0;
    const activePrice = customerType === 'reseller' && resellerPrice > 0 ? resellerPrice : regularPrice;

    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            ...product,
            price: activePrice,
            regular_price: regularPrice,
            reseller_price: resellerPrice,
            quantity: 1,
          },
        ],
      });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) { get().removeItem(productId); return; }
    set({ items: get().items.map((i) => i.id === productId ? { ...i, quantity } : i) });
  },

  clearCart: () => set({
    items: [],
    discount: 0,
    discountType: 'percent',
    shippingEnabled: false,
    shippingCost: 0,
    shippingName: '',
    recipientName: '',
    recipientAddress: '',
  }),

  // ─── Discount ────────────────────────────────────────────────────
  setDiscount: (discount, discountType = 'percent') => set({ discount, discountType }),

  // ─── Shipping ────────────────────────────────────────────────────
  setShipping: (data) => set((s) => ({ ...s, ...data })),
  toggleShipping: (enabled) => set({ shippingEnabled: enabled }),

  // ─── Calculations ────────────────────────────────────────────────
  getSubtotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percent') return (subtotal * discount) / 100;
    return Math.min(discount, subtotal);
  },

  getTotalCost: () =>
    get().items.reduce((sum, item) => sum + (item.cost_price || 0) * item.quantity, 0),

  getShippingCost: () =>
    get().shippingEnabled ? (get().shippingCost || 0) : 0,

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const disc = get().getDiscountAmount();
    const shipping = get().getShippingCost();
    return subtotal - disc + shipping;
  },

  getProfit: () => {
    const subtotal = get().getSubtotal();
    const disc = get().getDiscountAmount();
    const cost = get().getTotalCost();
    // Ongkir tidak dihitung laba
    return subtotal - disc - cost;
  },

  getItemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

export default useCartStore;
