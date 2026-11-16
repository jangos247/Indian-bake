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
  searchQuery: string;
  sortBy?: SortOption;
  reviewsByProduct?: Record<string, ProductReview[]>;
}): Product[] {
  const {
    products,
    selectedCategory,
    dietaryFilter,
    spotlightFilter = 'all',
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

    const matchesSearch =
      q === '' ||
      product.name.toLowerCase().includes(q) ||
      normalized.toLowerCase().includes(q) ||
      product.shortDescription.toLowerCase().includes(q) ||
      product.ingredients.some((ing) => ing.toLowerCase().includes(q));

    return matchesCategory && matchesDietary && matchesSpotlight && matchesSearch;
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
