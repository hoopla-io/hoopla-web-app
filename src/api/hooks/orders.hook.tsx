import { useMutation } from "@tanstack/react-query";
import { OrderApi } from "../domains/order";

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: OrderApi.createOrder,
  });
};
