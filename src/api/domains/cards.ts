import { httpClient } from "@/api/http-client";

/**
 * A bank card bound through Rahmat, as returned by GET /user/cards (newest
 * first). The card token never leaves the backend; `id` is what
 * DELETE /user/cards/{id} takes.
 */
export interface BankCard {
  id: number;
  /** Masked number, e.g. "986027******1519". */
  cardPan: string;
  /** Payment system: uzcard | humo | visa | mastercard | unionpay. */
  ps: string;
  holderName: string;
  /** Unix seconds; 0 when unknown. */
  addedOn: number;
}

export interface BindCardSession {
  sessionId: string;
  /** Rahmat's card form; valid for 15 minutes. */
  formUrl: string;
}

export interface BindCardStatus {
  sessionId: string;
  /** pending until the card is entered, then active. */
  status: "pending" | "active" | "deleted" | "expired";
  card: BankCard | null;
}

export const CardsApi = {
  getList: async () => {
    const response: any = await httpClient.get("/user/cards");
    return (response.data ?? []) as BankCard[];
  },

  bind: async () => {
    const response: any = await httpClient.post("/user/cards/bind");
    return response.data as BindCardSession;
  },

  getBindStatus: async (sessionId: string) => {
    const response: any = await httpClient.get(
      `/user/cards/bind/${encodeURIComponent(sessionId)}`
    );
    return response.data as BindCardStatus;
  },

  remove: async (id: number) => {
    const response: any = await httpClient.delete(`/user/cards/${id}`);
    return response.data;
  },
};
