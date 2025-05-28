import { useQuery, useQueryClient } from "@tanstack/react-query";
import PaymentApi from "@/api/domains/payment";
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
