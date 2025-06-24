import { httpClient } from "../http-client";

type CreateOrderParams = {
  drink_id: number;
  shop_id: number;
};

export const OrderApi = {
  createOrder: async (params: CreateOrderParams) => {
    const { drink_id, shop_id } = params;

    console.log({ drink_id, shop_id });

    const res = await httpClient.post("/user/orders/create", {
      drink_id,
      shop_id,
    });

    console.log({ res });

    return res.data;
  },
};
