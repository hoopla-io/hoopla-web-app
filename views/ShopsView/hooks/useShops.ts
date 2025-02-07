import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ShopsApi } from "@/lib/domains/shops";

type Module = {
  moduleId: number;
  name: "Lite" | "Pro";
  colour: string;
};

interface Shop {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  modules: Module[];
}

type Params = {
  lat: number;
  lng: number;
  name?: string;
};

export function useShops(params: Params) {
  const { lat, lng, name = "" } = params;
  const queryClient = useQueryClient();

  const {
    data: shops = [],
    isLoading,
    isError,
  } = useQuery<Shop[]>(
    {
      queryKey: ["shops"],
      queryFn: () => ShopsApi.getShops(lat, lng, name),
      staleTime: 300000, // 5 minutes
    },
    queryClient
  );

  return {
    shops,
    isLoading,
    isError,
  };
}
