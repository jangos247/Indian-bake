import { FormEvent, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Bike, Check, Clock, Flame, PackageCheck, Printer, RotateCcw, Search, X } from 'lucide-react';
import { formatMoney } from '../data/bakeryData';
import { CurrencySymbol, Order, OrderStage } from '../types/bakery';

export const ORDER_STAGES: { key: OrderStage; label: string; detail: string; icon: typeof Check }[] = [
  {
    key: 'confirmed',
    label: 'Order Placed',
    detail: 'Ticket received at Indian Bakery & Cafe',
    icon: Clock,
  },
  {
    key: 'baking',
    label: 'Preparing Your Order',
    detail: 'Freshly baked & customized for your delivery window',
    icon: Flame,
  },
  {
    key: 'packed',
    label: 'Ready for Delivery',
    detail: 'Sealed warm in ventilated bakery packaging',
    icon: PackageCheck,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    detail: 'En route with our neighborhood rider',
    icon: Bike,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    detail: 'Handed off safely at your doorstep',
    icon: Check,
  },
];

const PAYMENT_LABELS: Record<Order['paymentMethod'], string> = {
  upi_prepaid: 'UPI (GPay / PhonePe / Paytm)',
  card_on_delivery: 'UPI / Card on Delivery',
  cash_on_delivery: 'Cash on Delivery (COD)',
  online_card: 'Credit / Debit Card',
};

const PAYMENT_STATUS_LABELS: Record<NonNullable<Order['paymentStatus']>, string> = {
  pending: 'Pay upon delivery',
  verification_pending: 'Awaiting bakery UPI verification',
  verified: 'UPI payment verified',
  paid: 'Paid in full',
};

interface OrderTrackerContentProps {
  user: User | null;
  isOwner: boolean;
  currency: CurrencySymbol;
  orders: Order[];
  activeOrderId: string;
  onSelectOrder: (orderId: string) => void;
  onAdvanceStage: (orderId: string) => void;
  onReorder: (order: Order) => void;
  onRequestSignIn: () => void;
  onAfterReorder?: () => void;
}

export function OrderTrackerContent({
  user,
  isOwner,
  currency,
  orders,
  activeOrderId,
  onSelectOrder,
  onAdvanceStage,
  onReorder,
  onRequestSignIn,
  onAfterReorder,
}: OrderTrackerContentProps) {
  const [lookupInput, setLookupInput] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  const activeOrder = orders.find((o) => o.id === activeOrderId) ?? orders[0];
  const currentStageIdx = activeOrder
    ? ORDER_STAGES.findIndex((s) => s.key === activeOrder.stage)
    : 0;

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = lookupInput.trim().toUpperCase();
    if (!cleaned) return;
    const found = orders.find((o) => o.id.toUpperCase() === cleaned);
    if (found) {
      onSelectOrder(found.id);
      setLookupMessage('');
    } else {
      setLookupMessage(`No order found matching "${cleaned}".`);
    }
  };

  if (!user) {
    return (
      <div className="py-12 px-6 bg-[#FFFFFF] border border-[#E4DFD5] rounded-2xl text-center space-y-3">
        <p className="font-display text-xl font-semibold text-[#1C1917]">
          Sign in to track your orders
        </p>
        <p className="text-xs text-[#57534E] max-w-sm mx-auto leading-relaxed">
          Sign in with your Customer account to follow live bakery preparation, rider status, and 1-tap reorder history.
        </p>
        <button
          type="button"
          onClick={onRequestSignIn}
          className="mt-2 px-5 py-2.5 bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-medium rounded-xl cursor-pointer"
        >
          Customer Sign In
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 px-6 bg-[#FFFFFF] border border-[#E4DFD5] rounded-2xl text-center space-y-2">
        <p className="font-display text-xl font-semibold text-[#1C1917]">
          No orders placed yet
        </p>
        <p className="text-xs text-[#57534E] max-w-sm mx-auto">
          Once you order cakes, puffs, sweets, or chai combos, live status from Order Placed to Delivered will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lookup & Order History Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <form onSubmit={handleLookup} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Find Order ID (e.g. IBC-1054)"
              className="w-full pl-9 pr-3 py-2 text-sm font-mono-tabular bg-[#FFFFFF] border border-[#D6D0C4] rounded-xl focus:outline-none focus:border-[#9A3412]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium bg-[#1C1917] text-white rounded-xl hover:bg-[#33302D] transition-colors cursor-pointer whitespace-nowrap"
          >
            Find
          </button>
        </form>

        {orders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-[#57534E] shrink-0">Recent:</span>
            {orders.slice(0, 6).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => onSelectOrder(ord.id)}
                className={`px-2.5 py-1.5 text-xs font-mono-tabular rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  ord.id === activeOrder?.id
                    ? 'border-[#9A3412] bg-[#9A3412] text-white'
                    : 'border-[#E4DFD5] bg-[#FFFFFF] text-[#57534E] hover:border-[#D6D0C4]'
                }`}
              >
                {ord.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {lookupMessage && (
        <p className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 rounded-xl">
          {lookupMessage}
        </p>
      )}

      {activeOrder && (
        <>
          {/* Formal Invoice Header (Visible on Print) */}
          <div className="hidden print:block pb-4 border-b border-[#E4DFD5]">
            <p className="font-display text-2xl font-bold text-[#1C1917]">
              Indian Bakery &amp; Cafe
            </p>
            <p className="text-xs text-[#57534E]">
              Widdi Centre, Mangalagiri · Tax Invoice &amp; Dispatch Receipt
            </p>
          </div>

          {/* Active Order Summary Banner */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center flex-wrap gap-2 text-xs text-[#57534E]">
                <span className="font-mono-tabular font-semibold text-[#1C1917]">
                  Order #{activeOrder.id}
                </span>
                <span aria-hidden="true">·</span>
                <span>Placed {activeOrder.createdAtLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{activeOrder.neighborhood}</span>
              </div>
              <p className="mt-1 font-display text-lg font-semibold text-[#1C1917]">
                {ORDER_STAGES[currentStageIdx]?.label}
              </p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                Scheduled: {activeOrder.deliveryDay}, {activeOrder.deliveryWindow} · Rider:{' '}
                {activeOrder.courierName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
              {isOwner && activeOrder.stage !== 'delivered' && (
                <button
                  type="button"
                  onClick={() => onAdvanceStage(activeOrder.id)}
                  className="px-3.5 py-2 text-xs font-medium border border-[#9A3412] text-[#9A3412] hover:bg-[#9A3412] hover:text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Advance Stage
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#D6D0C4] bg-white hover:border-[#1C1917] text-[#1C1917] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onReorder(activeOrder);
                  onAfterReorder?.();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#F2EFE9] hover:bg-[#E4DFD5] text-[#1C1917] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reorder</span>
              </button>
            </div>
          </div>

          {/* 5-Stage Progress Timeline */}
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] no-print">
            <ol className="space-y-4">
              {ORDER_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const Icon = stage.icon;
                return (
                  <li key={stage.key} className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                        isCurrent
                          ? 'bg-[#9A3412] border-[#9A3412] text-white'
                          : isCompleted
                            ? 'bg-[#9A3412]/10 border-[#9A3412]/35 text-[#9A3412]'
                            : 'bg-[#F2EFE9] border-[#E4DFD5] text-[#57534E]'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            isCurrent || isCompleted ? 'text-[#1C1917]' : 'text-[#57534E]'
                          }`}
                        >
                          {stage.label}
                        </p>
                        <span className="text-xs text-[#57534E]">
                          {isCurrent ? 'In progress' : isCompleted ? 'Done' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] mt-0.5">{stage.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Delivery Details & Itemized Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] space-y-2 text-sm">
              <h3 className="text-xs font-medium text-[#57534E]">Delivery Destination</h3>
              <p className="font-medium text-[#1C1917]">{activeOrder.customer.fullName}</p>
              <p className="text-[#57534E]">
                {activeOrder.customer.streetAddress}
                {activeOrder.customer.apartment ? `, ${activeOrder.customer.apartment}` : ''}
              </p>
              <p className="font-mono-tabular text-xs text-[#57534E]">
                {activeOrder.customer.postalCode} · {activeOrder.customer.phone}
              </p>
              {activeOrder.customer.instructions && (
                <p className="pt-2 border-t border-[#E4DFD5] text-xs text-[#57534E]">
                  Note: {activeOrder.customer.instructions}
                </p>
              )}
              <div className="pt-1 text-xs text-[#57534E] space-y-0.5">
                <p>
                  Payment:{' '}
                  <span className="text-[#1C1917] font-medium">
                    {PAYMENT_LABELS[activeOrder.paymentMethod]}
                  </span>
                </p>
                {activeOrder.paymentStatus && (
                  <p>
                    Status:{' '}
                    <span
                      className={
                        activeOrder.paymentStatus === 'verified' ||
                        activeOrder.paymentStatus === 'paid'
                          ? 'text-[#15803D] font-medium'
                          : 'text-[#92400E] font-medium'
                      }
                    >
                      {PAYMENT_STATUS_LABELS[activeOrder.paymentStatus]}
                    </span>
                  </p>
                )}
                {activeOrder.upiReference && (
                  <p className="font-mono-tabular">UTR Ref: {activeOrder.upiReference}</p>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] space-y-2.5 text-sm">
              <h3 className="text-xs font-medium text-[#57534E]">Order Summary</h3>
              <ul className="space-y-1.5 text-xs text-[#57534E]">
                {activeOrder.items.map((item) => (
                  <li key={item.cartItemId} className="space-y-0.5">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-[#1C1917]">
                        <span className="font-mono-tabular">{item.quantity}×</span> {item.name}
                      </span>
                      <span className="font-mono-tabular shrink-0 text-[#1C1917]">
                        {formatMoney(item.unitPrice * item.quantity, currency)}
                      </span>
                    </div>
                    {item.customizationSummary && (
                      <p className="text-[11px] text-[#9A3412]">{item.customizationSummary}</p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-[#E4DFD5] space-y-1 text-xs">
                {activeOrder.discount && activeOrder.discount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Coupon ({activeOrder.promoCode})</span>
                    <span className="font-mono-tabular">
                      -{formatMoney(activeOrder.discount, currency)}
                    </span>
                  </div>
                )}
                {activeOrder.tax && activeOrder.tax > 0 && (
                  <div className="flex justify-between text-[#57534E]">
                    <span>Taxes &amp; Packaging</span>
                    <span className="font-mono-tabular">
                      {formatMoney(activeOrder.tax, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#57534E]">
                  <span>Delivery</span>
                  <span className="font-mono-tabular">
                    {activeOrder.deliveryFee === 0
                      ? 'Free'
                      : formatMoney(activeOrder.deliveryFee, currency)}
                  </span>
                </div>
                {activeOrder.tip > 0 && (
                  <div className="flex justify-between text-[#57534E]">
                    <span>Rider Tip</span>
                    <span className="font-mono-tabular">
                      {formatMoney(activeOrder.tip, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-sm text-[#1C1917] pt-1">
                  <span>Total</span>
                  <span className="font-mono-tabular">
                    {formatMoney(activeOrder.total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface OrderTrackerModalProps extends OrderTrackerContentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackerModal({
  isOpen,
  onClose,
  ...rest
}: OrderTrackerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/55 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracker-heading"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FAFAF7] border border-[#E4DFD5] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E4DFD5] bg-[#FFFFFF] flex items-center justify-between gap-4 no-print">
          <div>
            <h2 id="tracker-heading" className="font-display text-xl font-semibold text-[#1C1917]">
              Live Order Tracking
            </h2>
            <p className="text-xs text-[#57534E]">
              Order Placed → Preparing Your Order → Ready for Delivery → Out for Delivery → Delivered
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order tracker"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <OrderTrackerContent
            {...rest}
            onRequestSignIn={() => {
              onClose();
              rest.onRequestSignIn();
            }}
            onAfterReorder={onClose}
          />
        </div>
      </div>
    </div>
  );
}
