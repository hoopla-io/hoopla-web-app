import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";

import { AuthApi } from "@/api/domains/auth";
import { useAuth } from "@/context/auth.context";

interface Props {
  onError: (error: { message: string }) => void;
}

export function useDeleteAccount(props: Props) {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { logout } = useAuth();

  const {
    mutate: deleteAccount,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: AuthApi.deleteAccount,
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate("/");
    },
    onError: (error) => {
      props.onError(error);
    },
  });

  return {
    deleteAccount,
    isError,
    isSuccess,
  };
}

export function useGetMe() {
  const { isAuthenticated } = useAuth();

  const {
    data: userInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-me"],
    queryFn: AuthApi.getUser,
    staleTime: 300000, // 5 minutes
    enabled: isAuthenticated,
  });

  return {
    userInfo,
    isLoading,
    isError,
  };
}

export function useLogOut(props: Props) {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { logout: logOut } = useAuth();

  const {
    mutate: logout,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: AuthApi.logout,
    onSuccess: () => {
      logOut();
      queryClient.clear();
      navigate("/");
    },
    onError: (error) => {
      props.onError(error);
    },
  });

  return {
    logout,
    isError,
    isSuccess,
  };
}


