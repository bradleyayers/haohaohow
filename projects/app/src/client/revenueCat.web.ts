import { Purchases } from "@revenuecat/purchases-js";
import type { revenueCat as baseRevenueCat } from "./revenueCat.hhh-native";

export const revenueCat: typeof baseRevenueCat = {
  configure(opts) {
    Purchases.configure(
      opts.apiKey,
      opts.userId ?? Purchases.generateRevenueCatAnonymousAppUserId(),
    );
  },
};
