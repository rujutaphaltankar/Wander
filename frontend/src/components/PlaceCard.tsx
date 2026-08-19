import { useState } from "react";
import {
  Star, Clock, Heart, UtensilsCrossed, Landmark, Sparkles, MapPin, X,
  MessageSquare, Send, Loader2, Users, DollarSign
} from "lucide-react";
import { Place } from "../types";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

export function PlaceCard({
  place: initialPlace,
  isFavorite,
  onToggleFavorite,
}: {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const [place, setPlace] = useState<Place>(initialPlace);
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const user = useAuthStore((s) => s.user);

  const isFood = place.type === "RESTAURANT";

  async function openDetails() {
    setShowModal(true);
    setReviewsLoading(true);
    try {
      const res = await api.get(`/places/${place.id}`);
      if (res.data.place) {
        setPlace(res.data.place);
        setReviews(res.data.place.reviews ?? []);
      }
    } catch {
      // Keep existing place info
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmittingReview(true);
    setReviewMsg("");
    try {
      const res = await api.post(`/places/${place.id}/reviews`, {
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      if (res.data.review) {
        setReviews([res.data.review, ...reviews]);
        if (res.data.place) {
          setPlace(res.data.place);
        }
        setCommentInput("");
        setReviewMsg("Review submitted successfully!");
        setTimeout(() => setReviewMsg(""), 3000);
      }
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <>
      <div
        onClick={openDetails}
        className="card p-3 flex gap-3 cursor-pointer hover:shadow-md transition-all hover:border-green/40 group"
      >
        <div className={`rounded-2xl shrink-0 flex items-center justify-center w-16 h-16 transition-transform group-hover:scale-105 ${
          isFood ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-soft text-blue"
        }`}>
          {isFood ? <UtensilsCrossed size={24} /> : <Landmark size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold leading-tight truncate group-hover:text-green transition-colors">
              {place.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(place.id);
              }}
              aria-label="Toggle favorite"
              className="p-1 hover:scale-110 transition-transform"
            >
              <Heart
                size={16}
                className={isFavorite ? "text-orange fill-orange" : "text-muted hover:text-orange"}
              />
            </button>
          </div>
          <div className="text-[11px] mt-0.5 text-muted truncate">
            {place.category}
            {isFood && place.cuisine ? ` · ${place.cuisine}` : ""}
            {place.tag && ` · ${place.tag}`}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
            <span className="flex items-center gap-1 font-medium">
              <Star size={11} className="text-yellow fill-[#FFC94D]" />
              {place.rating > 0 ? place.rating.toFixed(1) : "New"}
              {place.ratingCount > 0 && <span className="text-[10px] text-muted">({place.ratingCount})</span>}
            </span>
            {isFood && place.avgCostInr != null && (
              <span className="font-mono text-green font-medium">₹{place.avgCostInr} avg</span>
            )}
            {!isFood && place.entryFeeInr != null && (
              <span className="font-mono text-blue font-medium">
                {place.entryFeeInr === 0 ? "Free entry" : `₹${place.entryFeeInr}`}
              </span>
            )}
            {!isFood && place.visitDuration && (
              <span className="flex items-center gap-1 text-muted">
                <Clock size={11} /> {place.visitDuration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details & Reviews Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="card bg-white dark:bg-[#0E1A22] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative border border-line dark:border-[#22333A]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-cloud dark:hover:bg-[#1A2C37] text-muted hover:text-ink dark:hover:text-[#EAF3EF] transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 pr-8 mb-4">
              <div className={`p-3 rounded-2xl ${
                isFood ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-blue-soft text-blue"
              }`}>
                {isFood ? <UtensilsCrossed size={24} /> : <Landmark size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-ink dark:text-[#EAF3EF]">{place.name}</h3>
                  {place.tag && (
                    <span className="text-[10px] bg-green/10 text-green font-semibold px-2 py-0.5 rounded-full">
                      {place.tag}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <span>{place.category}</span>
                  {place.cuisine && <span>· {place.cuisine}</span>}
                  {place.isVegFriendly && <span className="text-emerald-500 font-medium">· 🥦 Veg Friendly</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            {place.description && (
              <p className="text-xs text-ink/80 dark:text-[#EAF3EF]/80 leading-relaxed mb-4 p-3 rounded-2xl bg-cloud dark:bg-[#122029]">
                {place.description}
              </p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5 text-xs">
              <div className="card p-2.5 rounded-xl bg-cloud dark:bg-[#122029] border-0">
                <div className="text-muted text-[10px]">Rating</div>
                <div className="flex items-center gap-1 font-bold text-ink dark:text-[#EAF3EF] mt-0.5">
                  <Star size={12} className="text-yellow fill-[#FFC94D]" />
                  {place.rating > 0 ? `${place.rating.toFixed(1)} / 5` : "Unrated"}
                </div>
              </div>
              <div className="card p-2.5 rounded-xl bg-cloud dark:bg-[#122029] border-0">
                <div className="text-muted text-[10px]">{isFood ? "Avg Cost" : "Entry Fee"}</div>
                <div className="font-bold text-ink dark:text-[#EAF3EF] mt-0.5">
                  {isFood
                    ? `₹${place.avgCostInr ?? "N/A"}`
                    : place.entryFeeInr === 0
                    ? "Free"
                    : `₹${place.entryFeeInr ?? "N/A"}`}
                </div>
              </div>
              {place.visitDuration && (
                <div className="card p-2.5 rounded-xl bg-cloud dark:bg-[#122029] border-0">
                  <div className="text-muted text-[10px]">Duration</div>
                  <div className="font-bold text-ink dark:text-[#EAF3EF] mt-0.5">{place.visitDuration}</div>
                </div>
              )}
              {place.crowdLevel && (
                <div className="card p-2.5 rounded-xl bg-cloud dark:bg-[#122029] border-0">
                  <div className="text-muted text-[10px]">Crowd Level</div>
                  <div className="font-bold text-ink dark:text-[#EAF3EF] mt-0.5">{place.crowdLevel}</div>
                </div>
              )}
              {place.openingHours && (
                <div className="card p-2.5 rounded-xl bg-cloud dark:bg-[#122029] border-0 col-span-2">
                  <div className="text-muted text-[10px]">Hours</div>
                  <div className="font-semibold text-ink dark:text-[#EAF3EF] mt-0.5 truncate">{place.openingHours}</div>
                </div>
              )}
            </div>

            {/* Address */}
            {place.address && (
              <div className="flex items-center gap-2 text-xs text-muted mb-5">
                <MapPin size={13} className="shrink-0 text-green" />
                <span className="truncate">{place.address}</span>
              </div>
            )}

            {/* Reviews Section */}
            <div className="border-t border-line dark:border-[#22333A] pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-sm text-ink dark:text-[#EAF3EF] flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-green" /> Traveler Reviews
                </h4>
                <span className="text-xs text-muted">{reviews.length} reviews</span>
              </div>

              {/* Review input form */}
              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-4 p-3 rounded-2xl bg-cloud dark:bg-[#122029] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted font-medium">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRatingInput(s)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star
                            size={16}
                            className={s <= ratingInput ? "text-yellow fill-[#FFC94D]" : "text-muted"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Share your travel tips or experience here..."
                    className="w-full text-xs p-2.5 rounded-xl border border-line dark:border-[#22333A] bg-white dark:bg-[#0E1A22] text-ink dark:text-[#EAF3EF] focus:outline-none focus:ring-1 focus:ring-green resize-none h-16"
                  />
                  {reviewMsg && (
                    <div className={`text-xs ${reviewMsg.includes("success") ? "text-green" : "text-red-500"}`}>
                      {reviewMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview || !commentInput.trim()}
                    className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="text-xs text-muted p-3 bg-cloud dark:bg-[#122029] rounded-2xl mb-4 text-center">
                  Log in to leave a review and rating for this place.
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-green" /> Loading reviews…
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-cloud/60 dark:bg-[#122029]/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-ink dark:text-[#EAF3EF]">
                          {r.user?.name || "Traveler"}
                        </span>
                        <div className="flex items-center gap-0.5 text-yellow">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} size={10} fill="#FFC94D" />
                          ))}
                        </div>
                      </div>
                      <p className="text-ink/80 dark:text-[#EAF3EF]/80 text-[11px] leading-relaxed">
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted py-3 text-center">
                  No reviews yet. Be the first traveler to review!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
