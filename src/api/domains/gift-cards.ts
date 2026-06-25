import { httpClient } from "@/api/http-client";

export interface RedeemGiftCardRequest {
  code: string;
}

/**
 * Result of redeeming a gift card. All money values are in sum — the same unit
 * the wallet balance is shown in across the app.
 */
export interface RedeemGiftCardResult {
  /** Amount this redemption added to the wallet (sum). */
  credited: number;
  /** Customer's new total wallet balance after the credit (sum). */
  balance: number;
  currency: string;
}

export const GiftCardsApi = {
  /**
   * Redeems a gift card by code, crediting its full value to the wallet.
   * One-time, final, non-reversible — the card drops to zero on redemption.
   */
  redeem: async (data: RedeemGiftCardRequest) => {
    const response: any = await httpClient.post(
      "/user/gift-cards/redeem",
      data
    );

    return (response.data ?? response) as RedeemGiftCardResult;
  },
};
