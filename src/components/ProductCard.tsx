import { memo } from 'react';
import { Check, Heart, Minus, Plus, Sparkles, Star } from 'lucide-react';
import { formatMoney, normalizeCategory } from '../data/bakeryData';
import { CurrencySymbol, Product } from '../types/bakery';
import { ResilientImage } from './ResilientImage';
import { VegIndicator } from './VegIndicator';

interface ProductCardProps {
  product: Product;
  currency: CurrencySymbol;
  isWishlisted: boolean;
  isJustAdded: boolean;
  cartQuantity?: number;
  ratingValue?: number;
  reviewCount?: number;
  onOpenProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onStepCartQuantity?: (product: Product, delta: number) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  currency,
  isWishlisted,
  isJustAdded,
  cartQuantity = 0,
  ratingValue,
  reviewCount,
  onOpenProduct,
  onQuickAdd,
  onStepCartQuantity,
  onToggleWishlist,
}: ProductCardProps) {
  const displayCategory = normalizeCategory(product.category);
  const hasOffer =
    product.originalPrice !== undefined && product.originalPrice > product.price;
  const rating = ratingValue ?? product.rating ?? 4.8;
  const reviews = reviewCount ?? product.reviewCount ?? 12;
  const isCake = product.isCakeCustomizable || displayCategory === 'Cakes';

  return (
    <article
      className={`group bg-white border border-[#E4DFD5] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(28,25,23,0.07)] ${
        !product.inStock ? 'opacity-80' : ''
      }`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpenProduct(product)}
          className="block w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
        >
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#F2EFE9]">
            <ResilientImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from favourites`
              : `Save ${product.name} to favourites`
          }
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/92 border border-[#E4DFD5] flex items-center justify-center text-[#1C1917] hover:border-[#9A3412] transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? 'fill-[#9A3412] text-[#9A3412]' : 'text-[#57534E]'
            }`}
          />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#57534E]">
            <VegIndicator type={product.vegType ?? 'veg'} />
            <span>{displayCategory}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{product.weight}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5 font-mono-tabular text-[#1C1917] font-medium">
              <Star className="w-3 h-3 fill-[#B45309] text-[#B45309]" />
              {rating.toFixed(1)}
              <span className="text-[#78716C]">({reviews})</span>
            </span>
            {!product.inStock ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#B91C1C]">Sold Out</span>
              </>
            ) : product.offerLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#9A3412]">{product.offerLabel}</span>
              </>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-3">
            <h3 className="text-[16px] font-semibold text-[#1C1917] leading-snug">
              <button
                type="button"
                onClick={() => onOpenProduct(product)}
                className="text-left hover:text-[#9A3412] transition-colors cursor-pointer"
              >
                {product.name}
              </button>
            </h3>
            <div className="flex items-baseline gap-1.5 shrink-0">
              {hasOffer && product.originalPrice && (
                <span className="font-mono-tabular text-xs text-[#78716C] line-through">
                  {formatMoney(product.originalPrice, currency)}
                </span>
              )}
              <span className="font-mono-tabular text-[15px] font-semibold text-[#1C1917]">
                {formatMoney(product.price, currency)}
              </span>
            </div>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-[#57534E] line-clamp-2">
            {product.shortDescription}
          </p>

          {isCake && (
            <p className="mt-2 text-xs font-medium text-[#1B4332]">
              Custom flavor, eggless &amp; plaque message available
            </p>
          )}
        </div>

        <div className="pt-3.5 border-t border-[#EFECE5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenProduct(product)}
            className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            {isCake ? 'Customize & Details' : 'Details & Reviews'}
          </button>

          {product.inStock && !isCake && cartQuantity > 0 && onStepCartQuantity ? (
            <div className="inline-flex items-center rounded-xl border border-[#9A3412] bg-[#FFF7ED] overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => onStepCartQuantity(product, -1)}
                aria-label={`Decrease quantity of ${product.name}`}
                className="w-8 h-8 flex items-center justify-center text-[#9A3412] hover:bg-[#9A3412] hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                aria-label={`${product.name} quantity in cart`}
                className="min-w-[26px] text-center font-mono-tabular text-xs font-bold text-[#9A3412]"
              >
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onStepCartQuantity(product, 1)}
                aria-label={`Increase quantity of ${product.name}`}
                className="w-8 h-8 flex items-center justify-center text-[#9A3412] hover:bg-[#9A3412] hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => (isCake ? onOpenProduct(product) : onQuickAdd(product))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:bg-[#9CA3AF] disabled:cursor-not-allowed ${
                isJustAdded
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#9A3412] hover:bg-[#7C2D12] text-white'
              }`}
            >
              {!product.inStock ? (
                <span>Sold Out</span>
              ) : isJustAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : isCake ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customize Cake</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
