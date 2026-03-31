import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Coffee,
  Receipt,
  Star,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { useOrderDetail } from "@/api/hooks/orders.hook";
import { OrdersApi } from "@/api/domains/orders";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatBalance } from "@/helpers/utils";

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
};

export const OrderDetailPage: FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { order, isLoading } = useOrderDetail(Number(orderId));

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<{ rating: number; comment: string } | null>(null);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    OrdersApi.getFeedback(Number(orderId)).then((fb) => {
      if (fb) {
        setExistingFeedback(fb);
      }
      setFeedbackLoaded(true);
    });
  }, [orderId]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await OrdersApi.leaveFeedback(Number(orderId), rating, comment);
      toast.success("Feedback submitted!");
      setExistingFeedback({ rating, comment });
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !order) {
    return (
      <LoadingScreen header="Loading order" description="Please wait..." />
    );
  }

  const status = statusConfig[order.orderStatus] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-28">
        {/* Hero image */}
        <div className="relative">
          <AspectRatio ratio={480 / 320}>
            <img
              src={order.drinkImageUrl}
              alt={order.drinkName}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div
            className={`absolute top-4 right-4 inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${status.bg} ${status.color}`}
          >
            <StatusIcon size={16} />
            {status.label}
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {/* Title & date */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {order.drinkName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(order.purchasedAt), "MMMM d, yyyy · HH:mm")}
            </p>
          </div>

          {/* Shop info */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                <Store size={18} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cafe</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.shopName}
                </p>
              </div>
            </div>
          </div>

          {/* Order items */}
          {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Items
            </h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                      <Coffee size={16} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatBalance(item.price)} UZS
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Payment summary */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Payment
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium text-gray-900">
                  {formatBalance(order.productPrice)} UZS
                </span>
              </div>
              {order.cashback_used > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cashback used</span>
                  <span className="font-medium text-green-600">
                    -{formatBalance(order.cashback_used)} UZS
                  </span>
                </div>
              )}
              {order.cashback_earned > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cashback earned</span>
                  <span className="font-medium text-[var(--color-primary)]">
                    +{formatBalance(order.cashback_earned)} UZS
                  </span>
                </div>
              )}
              {order.fiscalLink && (
                <div className="pt-2 border-t">
                  <a
                    href={order.fiscalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    <Receipt size={14} />
                    View fiscal receipt
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {order.orderStatus === "completed" && feedbackLoaded && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Feedback
              </h2>
              {existingFeedback ? (
                <div className="py-2">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={24}
                        className={
                          s <= existingFeedback.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  {existingFeedback.comment && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      "{existingFeedback.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      How was your order?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(s)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={
                              s <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Leave a comment (optional)"
                    rows={3}
                    className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                  <Button
                    className="w-full h-11 rounded-xl text-white"
                    disabled={submitting || rating === 0}
                    onClick={handleSubmitFeedback}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
