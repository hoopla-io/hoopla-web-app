import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BannersApi, type Banner } from "@/api/domains/banners";

export function useMainBanners() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Banner[]>(
    {
      queryKey: ["banners", "main"],
      queryFn: () => BannersApi.getMain(),
      staleTime: 300000,
    },
    queryClient
  );

  return {
    banners: data ?? [],
    isLoading,
    isError,
  };
}

export function usePartnerBanners(partnerId: number) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Banner[]>(
    {
      queryKey: ["banners", "partner", partnerId],
      queryFn: () => BannersApi.getByPartner(partnerId),
      staleTime: 300000,
      enabled: Boolean(partnerId),
    },
    queryClient
  );

  return {
    banners: data ?? [],
    isLoading,
    isError,
  };
}

export type { Banner };
