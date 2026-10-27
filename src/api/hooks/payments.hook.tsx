import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PaymentApi, {
  type PaymentMethod,
  type RahmatTopUpRequest,
} from "@/api/domains/payment";
import { useAuth } from "@/context/auth.context";
import { AuthApi } from "../domains/auth";

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

export function usePaymentSystems() {
  const queryClient = useQueryClient();

  const {
    data: paymentSystems = [],
    isLoading,
    isError,
    error,
  } = useQuery<PaymentSystem[]>(
    {
      queryKey: ["payment-systems"],
      queryFn: () => PaymentApi.getPaymentSystems(),
      staleTime: 300000, // 5 minutes
    },
    queryClient
  );

  return {
    paymentSystems,
    isLoading,
    isError,
    error,
  };
}

interface QrCode {
  qrCode: string;
  expireAt: number;
}

interface Order {
  id: number;
  partnerName: string;
  purchasedAt: string;
  purchasedAtUnix: number;
  shopName: string;
}

export function useQr() {
  const queryClient = useQueryClient();

  const { isAuthenticated } = useAuth();

  const {
    data: qrCode,
    isLoading,
    isError,
  } = useQuery<QrCode>(
    {
      queryKey: ["qr"],
      queryFn: AuthApi.getQrCode,
      staleTime: 300000, // 5 minutes
      enabled: isAuthenticated,
    },
    queryClient
  );

  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
  } = useQuery<Order[]>(
    {
      queryKey: ["orders"],
      queryFn: AuthApi.getOrdersHistory,
      staleTime: 300000, // 5 minutes
      enabled: isAuthenticated,
    },
    queryClient
  );

  return {
    qrCode,
    isLoading,
    isError,
    orders,
    isLoadingOrders,
    isErrorOrders,
  };
}

/** Saved cards and payment apps for a cart checkout or a wallet top-up. */
export function usePaymentMethods(purpose: "order" | "top_up", enabled = true) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<PaymentMethod[]>(
    {
      queryKey: ["payment-methods", purpose],
      queryFn: () => PaymentApi.getMethods(purpose),
      staleTime: 60000,
      enabled: isAuthenticated && enabled,
    },
    queryClient
  );

  return { methods: data ?? [], isLoading };
}

export function useRahmatTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RahmatTopUpRequest) => PaymentApi.rahmatTopUp(data),
    onSuccess: (result) => {
      if (result.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["get-me"] });
      }
    },
  });
}

export function useConfirmRahmatTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, otp }: { paymentId: string; otp: string }) =>
      PaymentApi.confirmRahmatTopUp(paymentId, otp),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
    },
  });
}

export type { PaymentMethod };
