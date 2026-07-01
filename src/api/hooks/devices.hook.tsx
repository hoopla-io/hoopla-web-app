import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DevicesApi, type Device } from "@/api/domains/devices";
import { useAuth } from "@/context/auth.context";

export function useDevices() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError } = useQuery<Device[]>(
    {
      queryKey: ["devices"],
      queryFn: () => DevicesApi.getList(),
      staleTime: 60000,
      enabled: isAuthenticated,
    },
    queryClient
  );

  return { devices: data ?? [], isLoading, isError };
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DevicesApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export type { Device };
