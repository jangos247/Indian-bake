import { FormEvent, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { Check, MessageSquare, MessageSquarePlus, Reply, Star, Trash2 } from 'lucide-react';
import { formatFriendlyFirestoreError } from '../lib/upi';
import { Product, ProductReview } from '../types/bakery';

interface CustomerFeedbackBoardProps {
  reviews: ProductReview[];
  products: Product[];
  user: User | null;
  isOwner: boolean;
  onRequestSignIn: () => void;
  onSubmitReview: (
    productId: string,
    rating: number,
    comment: string,
    headline?: string
  ) => Promise<void>;
  onReplyReview: (reviewId: string, replyText: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export function CustomerFeedbackBoard({
  reviews,
  products,
  user,
  isOwner,
  onRequestSignIn,
  onSubmitReview,
  onReplyReview,
  onDeleteReview,
}: CustomerFeedbackBoardProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('store-feedback');
  const [rating, setRating] = useState<number>(5);
  const [headline, setHeadline] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [filterMode, setFilterMode] = useState<'all' | '5star' | 'replied'>('all');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>('');
  const [replyBusy, setReplyBusy] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const productNameMap = useMemo(() => {
    const map: Record<string, string> = {
      'store-feedback': 'Indian Bakery & Cafe (Overall Experience)',
    };
    for (const p of products) {
      map[p.id] = p.name;
    }
    return map;
  }, [products]);

  const stats = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 5 star ... index 4 = 1 star
    let sum = 0;
    for (const r of reviews) {
      const clamped = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[5 - clamped] += 1;
      sum += r.rating;
    }
    const avg = reviews.length > 0 ? sum / reviews.length : 4.9;
    return {
      total: reviews.length,
      avg,
      counts,
    };
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    return reviews.filter((rev) => {
      if (filterMode === '5star') return rev.rating >= 5;
      if (filterMode === 'replied') return Boolean(rev.ownerReply);
      return true;
    });
  }, [reviews, filterMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequestSignIn();
      return;
    }
    const cleanComment = comment.trim();
    if (cleanComment.length < 2) {
      setFormFeedback({ type: 'err', text: 'Please share a few words about your experience.' });
      return;
    }
    setSubmitting(true);
    setFormFeedback(null);
    try {
      await onSubmitReview(selectedTopicId, rating, cleanComment, headline.trim() || undefined);
      setHeadline('');
      setComment('');
      setRating(5);
      setFormFeedback({
        type: 'ok',
        text: 'Thank you! Your customer feedback is now published.',
      });
    } catch (err) {
      setFormFeedback({ type: 'err', text: formatFriendlyFirestoreError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReply = async (reviewId: string) => {
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    setReplyBusy(true);
    try {
      await onReplyReview(reviewId, trimmed);
      setReplyingId(null);
      setReplyDraft('');
    } catch (err) {
      setFormFeedback({ type: 'err', text: formatFriendlyFirestoreError(err) });
    } finally {
      setReplyBusy(false);
    }
  };

  const handleConfirmDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      await onDeleteReview(reviewId);
      setConfirmDeleteId(null);
    } catch (err) {
      setFormFeedback({ type: 'err', text: formatFriendlyFirestoreError(err) });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section id="feedback" className="space-y-6 pt-8 border-t border-[#E6DDD1]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#C45512]">Customer Reviews &amp; Store Feedback</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#3B2314]">
            What Mangalagiri customers say
          </h2>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#EAE0D2] border border-[#E6DDD1] self-start">
          {(
            [
              { id: 'all', label: `All (${reviews.length})` },
              { id: '5star', label: '5 Stars' },
              { id: 'replied', label: 'With Bakery Reply' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                filterMode === tab.id
                  ? 'bg-[#FFFDF9] text-[#3B2314] shadow-xs'
                  : 'text-[#6D4C3D] hover:text-[#3B2314]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Amazon-Style Rating Breakdown + Write Feedback Form */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E6DDD1] rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Star Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(stats.avg)
                          ? 'fill-[#E06D1F] text-[#E06D1F]'
                          : 'text-[#D6C9B8]'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono-tabular text-base font-semibold text-[#3B2314]">
                  {stats.avg.toFixed(1)} out of 5
                </span>
              </div>
              <span className="font-mono-tabular text-xs text-[#6D4C3D]">
                {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star, idx) => {
                const count = stats.counts[idx];
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 text-xs">
                    <span className="w-11 font-mono-tabular text-[#6D4C3D] shrink-0">
                      {star} star
                    </span>
                    <div className="flex-1 h-2 bg-[#F3EBDF] rounded-full overflow-hidden border border-[#E6DDD1]">
                      <div
                        className="h-full bg-[#E06D1F] transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono-tabular text-[#6D4C3D] shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Feedback Composer */}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="pt-5 border-t border-[#E6DDD1] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#3B2314] inline-flex items-center gap-1.5">
                <MessageSquarePlus className="w-4 h-4 text-[#C45512]" />
                <span>Share Customer Feedback</span>
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    aria-label={`Rate ${s} stars`}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        s <= rating ? 'fill-[#E06D1F] text-[#E06D1F]' : 'text-[#CBBBA7]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="fb-topic" className="block text-[11px] font-medium text-[#6D4C3D] mb-1">
                Reviewing
              </label>
              <select
                id="fb-topic"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF5EE] border border-[#D6C9B8] rounded-xl focus:outline-none focus:border-[#C45512]"
              >
                <option value="store-feedback">Indian Bakery &amp; Cafe (Overall Delivery &amp; Taste)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fb-headline" className="block text-[11px] font-medium text-[#6D4C3D] mb-1">
                Add a Headline (Optional)
              </label>
              <input
                id="fb-headline"
                type="text"
                maxLength={100}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Soft cake & right on time!"
                className="w-full px-3 py-2 text-xs bg-[#FAF5EE] border border-[#D6C9B8] rounded-xl focus:outline-none focus:border-[#C45512]"
              />
            </div>

            <div>
              <label htmlFor="fb-comment" className="block text-[11px] font-medium text-[#6D4C3D] mb-1">
                Your Review
              </label>
              <textarea
                id="fb-comment"
                rows={3}
                maxLength={400}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  user
                    ? 'What did you enjoy about taste, packaging, or delivery?'
                    : 'Sign in with Google to leave a verified customer review...'
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF5EE] border border-[#D6C9B8] rounded-xl focus:outline-none focus:border-[#C45512]"
              />
            </div>

            {formFeedback && (
              <p
                className={`text-xs font-medium ${
                  formFeedback.type === 'ok' ? 'text-[#15803D]' : 'text-[#B91C1C]'
                }`}
              >
                {formFeedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] px-4 py-2.5 text-xs font-medium text-white bg-[#C45512] hover:bg-[#A9450C] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {!user ? 'Sign In to Post Feedback' : submitting ? 'Publishing...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {/* Right: Amazon-Style Reviews Feed with Bakery Replies & Delete */}
        <div className="lg:col-span-7 space-y-3">
          {visibleReviews.length === 0 ? (
            <div className="p-8 bg-[#FFFDF9] border border-[#E6DDD1] rounded-2xl text-center space-y-2">
              <MessageSquare className="w-6 h-6 text-[#8D7262] mx-auto" strokeWidth={1.5} />
              <p className="font-display text-lg font-semibold text-[#3B2314]">
                No reviews in this filter yet
              </p>
              <p className="text-xs text-[#6D4C3D]">
                Be the first customer to review our fresh cakes, puffs, Osmania biscuits, or Irani chai.
              </p>
            </div>
          ) : (
            visibleReviews.slice(0, 10).map((rev) => {
              const canDelete = isOwner || (Boolean(user?.uid) && user?.uid === rev.authorId);
              const topicLabel = productNameMap[rev.productId] ?? 'Bakery Item';
              return (
                <article
                  key={rev.id}
                  className="p-5 bg-[#FFFDF9] border border-[#E6DDD1] rounded-2xl space-y-2.5"
                >
                  {/* Top Metadata Line (Zero Pill Discipline) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-[#6D4C3D]">
                      <span className="font-semibold text-[#3B2314]">{rev.authorName}</span>
                      {rev.verifiedPurchase && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#15803D]">
                            <Check className="w-3 h-3" />
                            <span>Verified Order</span>
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="truncate max-w-[220px]">{topicLabel}</span>
                    </div>

                    <div className="flex items-center gap-0.5 font-mono-tabular text-[#E06D1F]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-[#E06D1F] text-[#E06D1F]' : 'text-[#E6DDD1]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.headline && (
                    <h3 className="text-sm font-semibold text-[#3B2314]">{rev.headline}</h3>
                  )}

                  <p className="text-sm text-[#6D4C3D] leading-relaxed">{rev.comment}</p>

                  {/* Official Bakery Owner Reply */}
                  {rev.ownerReply && replyingId !== rev.id && (
                    <div className="mt-2 pt-3 border-t border-[#F0E7DB] pl-3.5 space-y-1">
                      <p className="text-xs font-semibold text-[#C45512]">
                        Reply from {rev.ownerReplyBy || 'Indian Bakery & Cafe'}
                      </p>
                      <p className="text-xs text-[#3B2314] leading-relaxed">{rev.ownerReply}</p>
                    </div>
                  )}

                  {/* Inline Owner Reply Editor */}
                  {isOwner && replyingId === rev.id && (
                    <div className="pt-2 space-y-2">
                      <textarea
                        rows={2}
                        maxLength={400}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Write official Indian Bakery reply to this customer..."
                        className="w-full px-3 py-2 text-xs bg-[#FAF5EE] border border-[#D6C9B8] rounded-xl focus:outline-none focus:border-[#C45512]"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(null);
                            setReplyDraft('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#6D4C3D] hover:text-[#3B2314] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={replyBusy || !replyDraft.trim()}
                          onClick={() => void handleSaveReply(rev.id)}
                          className="px-3.5 py-1.5 text-xs font-medium bg-[#3B2314] hover:bg-[#52321E] disabled:opacity-60 text-white rounded-lg cursor-pointer"
                        >
                          {replyBusy ? 'Saving...' : 'Post Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Row (Owner Reply / Delete, or Customer Self-Delete) */}
                  {(isOwner || canDelete) && (
                    <div className="pt-2 border-t border-[#F0E7DB] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(rev.id);
                              setReplyDraft(rev.ownerReply ?? '');
                            }}
                            className="inline-flex items-center gap-1 font-medium text-[#C45512] hover:underline cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>{rev.ownerReply ? 'Edit Reply' : 'Reply'}</span>
                          </button>
                        )}
                      </div>

                      {canDelete &&
                        (confirmDeleteId === rev.id ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-[11px] text-[#991B1B]">Delete this review?</span>
                            <button
                              type="button"
                              disabled={deletingId === rev.id}
                              onClick={() => void handleConfirmDelete(rev.id)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-[#B91C1C] text-white rounded-md cursor-pointer"
                            >
                              {deletingId === rev.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] text-[#6D4C3D] hover:text-[#3B2314] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rev.id)}
                            className="inline-flex items-center gap-1 text-[#8D7262] hover:text-[#B91C1C] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
