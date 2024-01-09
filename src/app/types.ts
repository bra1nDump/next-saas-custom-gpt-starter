export type SubscriptionDetails = {
  currentPlan: ProductOfferingTitle | undefined;
  cancelationScheduledOn?: Date;
  // renewsOn?: Date; TODO
};

export type ProductOfferingTitle = "Free" | "Plus" | "Pro";

export interface ProductOfferingView {
  title: ProductOfferingTitle;
  price: number;
  isCurrent: boolean;

  benefits: string[];
  limitation: string[];
}
