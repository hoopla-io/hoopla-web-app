import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ShopsApi } from "@/lib/domains/shops";
import useLocation from "@/hooks/useLocation";

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

  const { location } = useLocation();

  const {
    data: shops = [],
    isLoading,
    isError,
  } = useQuery<Shop[]>(
    {
      queryKey: ["shops", lat, lng, name],
      queryFn: () =>
        ShopsApi.getShops(
          location?.latitude || lat,
          location?.longitude || lng,
          name
        ),
      staleTime: 300000, // 5 minutes
      enabled: Boolean(location?.latitude && location?.longitude),
    },
    queryClient
  );

  return {
    shops,
    isLoading,
    isError,
  };
}
