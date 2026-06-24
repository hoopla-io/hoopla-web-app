import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Store,
  Coffee,
  Receipt,
  Star,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { useOrderDetail, useCancelOrder } from "@/api/hooks/orders.hook";
import { OrdersApi } from "@/api/domains/orders";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatBalance } from "@/helpers/utils";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
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
  pending_payment: {
    label: "Awaiting Payment",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  pending: {
    label: "Preparing",
    icon: Coffee,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

export const OrderDetailPage: FC = () => {
  const { orderId } = useParams();

  const { order, isLoading } = useOrderDetail(Number(orderId));
  const cancelOrder = useCancelOrder();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<{ rating: number; comment: string } | null>(null);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // Lightbox: close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!imageOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImageOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageOpen]);

  useEffect(() => {
    if (!orderId || !order || order.orderStatus !== "completed") return;
    OrdersApi.getFeedback(Number(orderId)).then((fb) => {
      if (fb) {
        setExistingFeedback(fb);
      }
      setFeedbackLoaded(true);
    });
  }, [orderId, order]);

  const handleCancelOrder = () => {
    cancelOrder.mutate(Number(orderId), {
      onSuccess: () => toast.success("Order cancelled"),
      onError: () => toast.error("Failed to cancel order"),
    });
  };

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

  const status = statusConfig[order.orderStatus] ?? statusConfig.pending_payment;
  const StatusIcon = status.icon;

  return (
    <Page>
      <div className="max-w-lg mx-auto px-2 pt-4 pb-28">
        <div className="space-y-4">
          {/* Order card — image header, cafe, items and payment all combined
              into a single card, separated by subtle internal dividers. */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header — tappable thumbnail beside the title, date and status */}
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={() => setImageOpen(true)}
                aria-label="View image"
                className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/[0.04] transition-transform active:scale-[0.97]"
              >
                <img
                  src={order.drinkImageUrl}
                  alt={order.drinkName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-lg bg-black/45 text-white backdrop-blur-sm">
                  <Maximize2 size={13} />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold leading-tight text-gray-900 line-clamp-2">
                  {order.drinkName}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {format(new Date(order.purchasedAt), "MMMM d, yyyy · HH:mm")}
                </p>
                <span
                  className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}
                >
                  <StatusIcon size={13} />
                  {status.label}
                </span>
              </div>
            </div>

            {/* Cafe */}
            <div className="flex items-center gap-3 p-4 border-t border-gray-100">
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

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="p-4 border-t border-gray-100">
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

            {/* Note to barista */}
            {order.comment && (
              <div className="p-4 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Note to barista
                </h2>
                <p className="text-sm text-gray-700">{order.comment}</p>
              </div>
            )}

            {/* Payment */}
            <div className="p-4 border-t border-gray-100">
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
                {order.promoCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Promocode{" "}
                      <span className="font-medium text-gray-700">
                        {order.promoCode}
                      </span>
                    </span>
                    {order.promoDiscount ? (
                      <span className="font-medium text-green-600">
                        -{formatBalance(order.promoDiscount)} UZS
                      </span>
                    ) : null}
                  </div>
                )}
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
          </div>

          {/* Cancel order */}
          {order.orderStatus === "pending_payment" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full h-11 rounded-xl"
                  disabled={cancelOrder.isPending}
                >
                  {cancelOrder.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Cancel Order"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your order will be cancelled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Go back</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                    onClick={handleCancelOrder}
                  >
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

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

      {/* Fullscreen image lightbox */}
      {imageOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setImageOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm duration-200 animate-in fade-in"
        >
          <button
            onClick={() => setImageOpen(false)}
            aria-label="Close image"
            className="absolute right-4 top-[calc(1rem+var(--tg-top-inset,0px))] grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-90"
          >
            <X size={22} />
          </button>
          <img
            src={order.drinkImageUrl}
            alt={order.drinkName}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl duration-200 animate-in zoom-in-95"
          />
        </div>
      )}
    </Page>
  );
};
