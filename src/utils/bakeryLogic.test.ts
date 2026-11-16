import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartSummary,
  computeOwnerAnalytics,
  filterAndSortProducts,
  filterOrdersForConsole,
} from './bakeryLogic';
import { BakerySettings, CartItem, Order, Product } from '../types/bakery';

const mockSettings: BakerySettings = {
  bakeryName: 'Indian Bakery & Cafe',
  tagline: 'Fresh Bakes',
  address: 'Widdi Centre, Mangalagiri',
  phone: '9491250264',
  secondaryPhone: '',
  currency: '₹',
  deliveryFee: 30,
  freeDeliveryThreshold: 1000,
  taxPercent: 5,
  deliverySlots: [
    {
      id: 'morning',
      label: 'Morning',
      window: '07:30 – 09:30',
      cutoffNote: 'Same day',
      spotsRemaining: 10,
    },
  ],
  deliveryZones: [
    {
      postalPrefix: '522503',
      neighborhood: 'Mangalagiri',
      etaMinutes: '25–35 min',
      fee: 30,
    },
  ],
  festivalBanner: {
    active: true,
    campaignName: 'Festive',
    headline: '15% off',
    promoCode: 'FESTIVE15',
  },
  promoCodes: [
    {
      id: 'festive-15',
      code: 'FESTIVE15',
      title: '15% Off',
      discountType: 'percent',
      value: 15,
      minOrder: 299,
      active: true,
    },
    {
      id: 'flat-50',
      code: 'IBC50',
      title: 'Flat 50 Off',
      discountType: 'flat',
      value: 50,
      minOrder: 200,
      active: true,
    },
  ],
};

const sampleCart: CartItem[] = [
  {
    cartItemId: 'cake::1',
    productId: 'cake',
    name: 'Truffle Cake',
    category: 'Cakes',
    image: '',
    optionId: '1',
    optionLabel: '500g',
    unitPrice: 500,
    quantity: 1,
  },
];

const sampleProducts: Product[] = [
  {
    id: 'p1',
    name: 'Belgian Truffle Cake',
    category: 'Cakes',
    price: 550,
    weight: '500g',
    bakeTime: '06:00',
    shortDescription: 'Rich dark chocolate sponge',
    fullDescription: 'Rich dark chocolate sponge cake',
    ingredients: ['Dark Cocoa', 'Cream'],
    allergens: 'Dairy',
    dietary: ['Vegetarian'],
    vegType: 'veg',
    isBestSeller: true,
    rating: 4.9,
    reheatTip: 'Serve chilled',
    image: '',
    inStock: true,
    options: [{ id: 'std', label: '500g', priceDelta: 0, weightLabel: '500g' }],
  },
  {
    id: 'p2',
    name: 'Paneer Masala Puff',
    category: 'Puffs & Rolls',
    price: 45,
    weight: '120g',
    bakeTime: '07:00',
    shortDescription: 'Crisp flaky puff pastry',
    fullDescription: 'Spiced cottage cheese baked puff',
    ingredients: ['Paneer', 'Butter', 'Garam Masala'],
    allergens: 'Wheat, Dairy',
    dietary: ['Vegetarian', 'Nut-Free'],
    vegType: 'veg',
    isTodaysSpecial: true,
    rating: 4.6,
    reheatTip: 'Warm 2 mins',
    image: '',
    inStock: false,
    options: [{ id: 'std', label: '1 pc', priceDelta: 0, weightLabel: '120g' }],
  },
];

const sampleOrders: Order[] = [
  {
    id: 'IBC-1001',
    customerId: 'u1',
    createdAtLabel: '10:00 AM',
    deliveryDay: 'Today',
    deliveryWindow: '07:30 – 09:30',
    neighborhood: 'Mangalagiri',
    customer: {
      fullName: 'Aarav Rao',
      phone: '9876543210',
      streetAddress: 'Main Road',
      apartment: '',
      postalCode: '522503',
      instructions: '',
    },
    paymentMethod: 'upi_prepaid',
    paymentStatus: 'verification_pending',
    items: sampleCart,
    subtotal: 500,
    deliveryFee: 30,
    tip: 0,
    total: 555,
    stage: 'confirmed',
    courierName: 'Assigned upon dispatch',
  },
  {
    id: 'IBC-1002',
    customerId: 'u2',
    createdAtLabel: '11:00 AM',
    deliveryDay: 'Today',
    deliveryWindow: '12:00 – 14:00',
    neighborhood: 'Tadepalli',
    customer: {
      fullName: 'Meera Devi',
      phone: '9123456780',
      streetAddress: 'Bypass Rd',
      apartment: '',
      postalCode: '522501',
      instructions: '',
    },
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'paid',
    items: sampleCart,
    subtotal: 1200,
    deliveryFee: 0,
    tip: 20,
    total: 1280,
    stage: 'delivered',
    courierName: 'Imran S.',
  },
];

test('calculateCartSummary computes promo discount, tax, delivery fee, and tip accurately', () => {
  const result = calculateCartSummary({
    items: sampleCart,
    settings: mockSettings,
    appliedPromoCode: 'festive15',
    zoneFee: 30,
    tip: 20,
  });

  assert.equal(result.subtotal, 500);
  assert.equal(result.discount, 75);
  assert.equal(result.discountedSubtotal, 425);
  assert.equal(result.taxAmount, 21); // round(425 * 0.05)
  assert.equal(result.deliveryFee, 30);
  assert.equal(result.qualifiesFreeDelivery, false);
  assert.equal(result.total, 425 + 21 + 30 + 20);
  assert.equal(result.appliedOfferCode, 'FESTIVE15');
});

test('calculateCartSummary unlocks free delivery when discounted subtotal meets threshold', () => {
  const bigCart: CartItem[] = [{ ...sampleCart[0], unitPrice: 600, quantity: 2 }];
  const result = calculateCartSummary({
    items: bigCart,
    settings: mockSettings,
    appliedPromoCode: 'IBC50',
    zoneFee: 30,
    tip: 0,
  });

  assert.equal(result.subtotal, 1200);
  assert.equal(result.discount, 50);
  assert.equal(result.discountedSubtotal, 1150);
  assert.equal(result.qualifiesFreeDelivery, true);
  assert.equal(result.deliveryFee, 0);
  assert.equal(result.progressPct, 100);
});

test('filterAndSortProducts filters by category, spotlight, search, and sorts by price', () => {
  const sortedAsc = filterAndSortProducts({
    products: sampleProducts,
    selectedCategory: 'All',
    dietaryFilter: 'All',
    searchQuery: '',
    sortBy: 'price_asc',
  });
  assert.deepEqual(
    sortedAsc.map((p) => p.id),
    ['p2', 'p1']
  );

  const specials = filterAndSortProducts({
    products: sampleProducts,
    selectedCategory: 'All',
    dietaryFilter: 'All',
    spotlightFilter: 'todays_special',
    searchQuery: '',
  });
  assert.deepEqual(
    specials.map((p) => p.id),
    ['p2']
  );

  const ingredientMatch = filterAndSortProducts({
    products: sampleProducts,
    selectedCategory: 'All',
    dietaryFilter: 'Nut-Free',
    searchQuery: 'garam masala',
  });
  assert.deepEqual(
    ingredientMatch.map((p) => p.id),
    ['p2']
  );
});

test('computeOwnerAnalytics & filterOrdersForConsole aggregate real order and stock metrics', () => {
  const analytics = computeOwnerAnalytics(sampleOrders, sampleProducts);
  assert.equal(analytics.totalOrders, 2);
  assert.equal(analytics.totalRevenue, 1835);
  assert.equal(analytics.averageOrderValue, 918);
  assert.equal(analytics.activeDispatchCount, 1);
  assert.equal(analytics.pendingUpiReviews, 1);
  assert.equal(analytics.inStockRatePct, 50);

  const upiPending = filterOrdersForConsole(sampleOrders, 'upi_pending', '');
  assert.deepEqual(
    upiPending.map((o) => o.id),
    ['IBC-1001']
  );

  const searchTadepalli = filterOrdersForConsole(sampleOrders, 'all', 'meera');
  assert.deepEqual(
    searchTadepalli.map((o) => o.id),
    ['IBC-1002']
  );
});
