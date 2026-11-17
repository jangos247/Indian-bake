import {
  BakeryCategory,
  BakerySettings,
  CartItem,
  Order,
  Product,
  ProductCategory,
  ProductReview,
} from '../types/bakery';

export function normalizeCategory(category: ProductCategory): BakeryCategory {
  switch (category) {
    case 'Cakes':
    case 'Cakes & Tarts':
      return 'Cakes';
    case 'Pastries':
    case 'Gift & Morning Boxes':
      return 'Pastries';
    case 'Breads':
    case 'Buns & Loaves':
      return 'Breads';
    case 'Puffs & Rolls':
    case 'Puffs & Pastries':
      return 'Puffs & Rolls';
    case 'Cookies & Biscuits':
      return 'Cookies & Biscuits';
    case 'Indian Sweets':
      return 'Indian Sweets';
    case 'Savouries':
      return 'Savouries';
    case 'Beverages':
    case 'Irani Chai & Cafe':
      return 'Beverages';
    default:
      return 'Pastries';
  }
}

export type DietaryFilter = 'All' | 'Pure Veg' | 'Vegan' | 'Nut-Free';
export type SpotlightFilter = 'all' | 'best_sellers' | 'todays_special' | 'recommended';
export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating_desc';

export interface CartPricingSummary {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  taxAmount: number;
  deliveryFee: number;
  qualifiesFreeDelivery: boolean;
  remainingForFree: number;
  progressPct: number;
  bagTotal: number;
  total: number;
  appliedOfferCode: string | null;
  appliedOfferTitle: string | null;
}

export function calculateCartSummary(params: {
  items: CartItem[];
  settings: BakerySettings;
  appliedPromoCode: string;
  zoneFee: number;
  tip: number;
}): CartPricingSummary {
  const { items, settings, appliedPromoCode, zoneFee, tip } = params;
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const normalizedPromo = appliedPromoCode.trim().toUpperCase();
  const activeOffer = normalizedPromo
    ? settings.promoCodes.find(
        (offer) =>
          offer.active &&
          offer.code.toUpperCase() === normalizedPromo &&
          subtotal >= offer.minOrder
      )
    : undefined;

  const discount = activeOffer
    ? activeOffer.discountType === 'percent'
      ? Math.round((subtotal * activeOffer.value) / 100)
      : Math.min(subtotal, activeOffer.value)
    : 0;

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxPercent = settings.taxPercent ?? 5;
  const taxAmount = items.length === 0 ? 0 : Math.round((discountedSubtotal * taxPercent) / 100);
  const qualifiesFreeDelivery =
    items.length > 0 && discountedSubtotal >= settings.freeDeliveryThreshold;
  const deliveryFee = items.length === 0 ? 0 : qualifiesFreeDelivery ? 0 : zoneFee;
  const remainingForFree = Math.max(0, settings.freeDeliveryThreshold - discountedSubtotal);
  const progressPct =
    settings.freeDeliveryThreshold > 0
      ? Math.min(100, Math.round((discountedSubtotal / settings.freeDeliveryThreshold) * 100))
      : 100;
  const bagTotal = discountedSubtotal + taxAmount + deliveryFee;
  const safeTip = items.length > 0 ? Math.max(0, tip) : 0;

  return {
    subtotal,
    discount,
    discountedSubtotal,
    taxAmount,
    deliveryFee,
    qualifiesFreeDelivery,
    remainingForFree,
    progressPct,
    bagTotal,
    total: bagTotal + safeTip,
    appliedOfferCode: activeOffer?.code ?? null,
    appliedOfferTitle: activeOffer?.title ?? null,
  };
}

export function getProductRating(
  product: Product,
  productReviews: ProductReview[] = []
): { ratingValue: number; reviewCount: number } {
  if (productReviews.length === 0) {
    return {
      ratingValue: product.rating ?? 4.8,
      reviewCount: product.reviewCount ?? 12,
    };
  }
  const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  return { ratingValue: avg, reviewCount: productReviews.length };
}

export function filterAndSortProducts(params: {
  products: Product[];
  selectedCategory: 'All' | BakeryCategory;
  dietaryFilter: DietaryFilter;
  spotlightFilter?: SpotlightFilter;
  offersOnly?: boolean;
  maxPrice?: number | null;
  searchQuery: string;
  sortBy?: SortOption;
  reviewsByProduct?: Record<string, ProductReview[]>;
}): Product[] {
  const {
    products,
    selectedCategory,
    dietaryFilter,
    spotlightFilter = 'all',
    offersOnly = false,
    maxPrice = null,
    searchQuery,
    sortBy = 'featured',
    reviewsByProduct = {},
  } = params;

  const q = searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const normalized = normalizeCategory(product.category);
    const matchesCategory = selectedCategory === 'All' || normalized === selectedCategory;

    const matchesDietary =
      dietaryFilter === 'All' ||
      (dietaryFilter === 'Pure Veg'
        ? (product.vegType ?? 'veg') === 'veg'
        : product.dietary.includes(dietaryFilter));

    const matchesSpotlight =
      spotlightFilter === 'all' ||
      (spotlightFilter === 'best_sellers' && Boolean(product.isBestSeller)) ||
      (spotlightFilter === 'todays_special' && Boolean(product.isTodaysSpecial)) ||
      (spotlightFilter === 'recommended' && Boolean(product.isRecommended));

    const hasOffer =
      Boolean(product.offerLabel?.trim()) ||
      (product.originalPrice !== undefined && product.originalPrice > product.price);
    const matchesOffers = !offersOnly || hasOffer;

    const matchesMaxPrice = maxPrice === null || product.price <= maxPrice;

    const matchesSearch =
      q === '' ||
      product.name.toLowerCase().includes(q) ||
      normalized.toLowerCase().includes(q) ||
      product.shortDescription.toLowerCase().includes(q) ||
      product.ingredients.some((ing) => ing.toLowerCase().includes(q));

    return (
      matchesCategory &&
      matchesDietary &&
      matchesSpotlight &&
      matchesOffers &&
      matchesMaxPrice &&
      matchesSearch
    );
  });

  if (sortBy === 'featured') {
    return filtered;
  }

  return [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    const ratingA = getProductRating(a, reviewsByProduct[a.id]).ratingValue;
    const ratingB = getProductRating(b, reviewsByProduct[b.id]).ratingValue;
    return ratingB - ratingA;
  });
}

export interface ReconciledCartResult {
  syncedCart: CartItem[];
  priceChangedCount: number;
  unavailableItems: CartItem[];
  hasChanges: boolean;
}

export function reconcileCartWithProducts(
  cart: CartItem[],
  products: Product[]
): ReconciledCartResult {
  if (cart.length === 0 || products.length === 0) {
    return { syncedCart: cart, priceChangedCount: 0, unavailableItems: [], hasChanges: false };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  let priceChangedCount = 0;
  let hasChanges = false;
  const unavailableItems: CartItem[] = [];

  const syncedCart = cart.map((item) => {
    const live = productMap.get(item.productId);
    if (!live || !live.inStock) {
      unavailableItems.push(item);
      return item;
    }
    const matchedOpt = live.options.find((o) => o.id === item.optionId) ?? live.options[0];
    const liveUnitPrice = live.price + (matchedOpt?.priceDelta ?? 0);
    const liveOptionLabel = matchedOpt?.label ?? item.optionLabel;

    if (liveUnitPrice !== item.unitPrice) {
      priceChangedCount += 1;
      hasChanges = true;
    }
    if (
      live.name !== item.name ||
      live.image !== item.image ||
      liveOptionLabel !== item.optionLabel
    ) {
      hasChanges = true;
    }

    return {
      ...item,
      name: live.name,
      image: live.image,
      optionLabel: liveOptionLabel,
      unitPrice: liveUnitPrice,
    };
  });

  return { syncedCart, priceChangedCount, unavailableItems, hasChanges };
}

export function getSmartCartUpsells(
  cart: CartItem[],
  products: Product[],
  limit = 3
): Product[] {
  const cartProductIds = new Set(cart.map((item) => item.productId));
  return products
    .filter(
      (p) =>
        p.inStock &&
        !cartProductIds.has(p.id) &&
        !p.isCakeCustomizable &&
        normalizeCategory(p.category) !== 'Cakes'
    )
    .sort((a, b) => {
      const scoreA =
        (a.isBestSeller ? 3 : 0) +
        (a.isRecommended ? 2 : 0) +
        (normalizeCategory(a.category) === 'Beverages' ||
        normalizeCategory(a.category) === 'Cookies & Biscuits'
          ? 2
          : 0);
      const scoreB =
        (b.isBestSeller ? 3 : 0) +
        (b.isRecommended ? 2 : 0) +
        (normalizeCategory(b.category) === 'Beverages' ||
        normalizeCategory(b.category) === 'Cookies & Biscuits'
          ? 2
          : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.price - b.price;
    })
    .slice(0, limit);
}

export function computeCartSavings(
  cart: CartItem[],
  products: Product[],
  promoDiscount: number
): { mrpSavings: number; promoSavings: number; totalSavings: number } {
  const productMap = new Map(products.map((p) => [p.id, p]));
  let mrpSavings = 0;

  for (const item of cart) {
    const prod = productMap.get(item.productId);
    if (prod && prod.originalPrice !== undefined && prod.originalPrice > prod.price) {
      mrpSavings += (prod.originalPrice - prod.price) * item.quantity;
    }
  }

  const safePromo = Math.max(0, promoDiscount);
  return {
    mrpSavings,
    promoSavings: safePromo,
    totalSavings: mrpSavings + safePromo,
  };
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export interface OwnerAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeDispatchCount: number;
  pendingUpiReviews: number;
  inStockProducts: number;
  totalProducts: number;
  inStockRatePct: number;
}

export function computeOwnerAnalytics(orders: Order[], products: Product[]): OwnerAnalytics {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const activeDispatchCount = orders.filter((o) => o.stage !== 'delivered').length;
  const pendingUpiReviews = orders.filter(
    (o) => o.paymentStatus === 'verification_pending'
  ).length;
  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.inStock).length;
  const inStockRatePct =
    totalProducts > 0 ? Math.round((inStockProducts / totalProducts) * 100) : 100;

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    activeDispatchCount,
    pendingUpiReviews,
    inStockProducts,
    totalProducts,
    inStockRatePct,
  };
}

export type OrderConsoleFilter = 'all' | 'active' | 'upi_pending' | 'delivered';

export function filterOrdersForConsole(
  orders: Order[],
  filter: OrderConsoleFilter,
  searchQuery: string
): Order[] {
  const q = searchQuery.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && order.stage !== 'delivered') ||
      (filter === 'upi_pending' && order.paymentStatus === 'verification_pending') ||
      (filter === 'delivered' && order.stage === 'delivered');

    const matchesQuery =
      q === '' ||
      order.id.toLowerCase().includes(q) ||
      order.customer.fullName.toLowerCase().includes(q) ||
      order.customer.phone.toLowerCase().includes(q) ||
      order.neighborhood.toLowerCase().includes(q);

    return matchesFilter && matchesQuery;
  });
}
