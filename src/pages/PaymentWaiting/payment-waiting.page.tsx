import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { OrdersApi, isOrderSettled } from "@/api/domains/orders";
import { startEightPayment } from "@/helpers/eight";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 3000;

// Eight's spec gives no bound on how long a payment can sit unresolved, and
// their callback to our backend isn't guaranteed to arrive at all — our backend
// reconciles those separately. This only decides how long the customer stares at
// a spinner before being offered a way out; the order is unaffected either way.
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Shown after handing a payment off to the host app's native sheet. The sheet
 * runs outside our WebView and hands control back with no result, so the only
 * way to learn the outcome is to ask our own backend — which by then has either
 * received the platform's callback or reconciled the payment itself.
 */
export const PaymentWaitingPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const numericOrderId = Number(orderId);
  const validOrderId = Number.isFinite(numericOrderId) && numericOrderId > 0;

  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef(Date.now());

  const { data, error } = useQuery({
    queryKey: ["payment-status", numericOrderId],
    queryFn: () => OrdersApi.getPaymentStatus(numericOrderId),
    enabled: validOrderId && !timedOut,
    refetchInterval: (query) =>
      isOrderSettled(query.state.data?.status) ? false : POLL_INTERVAL_MS,
    // The sheet covers the WebView, so this page is usually backgrounded while
    // the payment happens — keep polling regardless of focus.
    refetchIntervalInBackground: true,
    retry: 3,
  });

  // Only needed once we're offering a retry, so don't compete with the poll.
  const { data: order } = useQuery({
    queryKey: ["order-detail", numericOrderId],
    queryFn: () => OrdersApi.getDetail(numericOrderId),
    enabled: validOrderId && timedOut,
  });

  const status = data?.status;
  const settled = isOrderSettled(status);

  useEffect(() => {
    if (settled) {
      navigate(`/orders/${numericOrderId}`, { replace: true });
    }
  }, [settled, numericOrderId, navigate]);

  useEffect(() => {
    if (settled || timedOut) return;

    const timer = setInterval(() => {
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        setTimedOut(true);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [settled, timedOut]);

  // Re-open the sheet for an order that's still unpaid. Covers a reload or a
  // direct visit, where this page never armed the bridge in the first place,
  // and a sheet the customer dismissed by accident.
  const retryPayment = useCallback(() => {
    const bridgeOrderId = order?.bridge_order_id;
    if (!bridgeOrderId) return;

    if (startEightPayment(bridgeOrderId)) {
      startedAt.current = Date.now();
      setTimedOut(false);
      return;
    }
    toast.error(t("paymentWaiting.bridgeUnavailable"));
  }, [order?.bridge_order_id, t]);

  if (!validOrderId) {
    return (
      <Page>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("paymentWaiting.orderNotFound")}</p>
          <Button onClick={() => navigate("/orders")}>{t("paymentWaiting.allOrders")}</Button>
        </div>
      </Page>
    );
  }

  // A transient poll failure shouldn't look like a stalled payment — only treat
  // it as stalled once retries are exhausted AND we have no status at all.
  const stalled = timedOut || (Boolean(error) && !data);
  const canRetry = Boolean(order?.bridge_order_id) && order?.orderStatus === "pending_payment";

  return (
    <Page>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
        {stalled ? (
          <>
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <h1 className="text-lg font-semibold">
                {t("paymentWaiting.stillWaitingTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("paymentWaiting.stillWaitingDescription")}
              </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
              {canRetry && (
                <Button onClick={retryPayment}>{t("paymentWaiting.retryPayment")}</Button>
              )}
              <Button
                variant={canRetry ? "outline" : "default"}
                onClick={() => navigate(`/orders/${numericOrderId}`, { replace: true })}
              >
                {t("paymentWaiting.viewOrder")}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/orders")}>
                {t("paymentWaiting.allOrders")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-2">
              <h1 className="text-lg font-semibold">{t("paymentWaiting.confirmingTitle")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("paymentWaiting.confirmingDescription")}
              </p>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

/**
 * Hand an order off to the host app's payment sheet and route to the waiting
 * screen. Returns false if the bridge isn't available, so the caller can tell
 * the customer instead of stranding them on a spinner.
 */
export function beginBridgePayment(
  bridgeOrderId: string,
  orderId: number,
  navigate: (path: string, opts?: { replace?: boolean }) => void
): boolean {
  if (!startEightPayment(bridgeOrderId)) return false;

  navigate(`/orders/${orderId}/awaiting-payment`, { replace: true });
  return true;
}
