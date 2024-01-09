import { PricingAndBilling } from "~/components/PricingAndBilling";
import { env } from "~/env";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe";
import { type ProductOfferingTitle } from "../types";

export default async function PricingPage() {
  const session = await getServerAuthSession();
  const user = session?.user;

  // If user is logged in, handle customer and subscriptions
  if (!user)
    return (
      <PricingAndBilling
        subscriptionDetails={{
          currentPlan: "Free",
        }}
      />
    );

  // Creates stripe customer if absent
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    customerId = customer.id;
  }

  // Get current plan if any
  const stripePlanId = user.stripePriceId;
  const paidUntil = user.stripePlanActiveUntil;

  // If not on a paid plan or period end is missing or in the past, show free plan
  if (!stripePlanId || !paidUntil || paidUntil.getTime() < Date.now()) {
    return <PricingAndBilling subscriptionDetails={{ currentPlan: "Free" }} />;
  }

  // Match stripe plan id to product offering title
  let currentPlan: ProductOfferingTitle;
  switch (stripePlanId) {
    case env.STRIPE_PRODUCT_ID_PLUS:
      currentPlan = "Plus";
      break;
    case env.STRIPE_PRODUCT_ID_PRO:
      currentPlan = "Pro";
      break;
    default:
      console.error(
        `Unexpected product id ${stripePlanId} for user ${user.id}, defaulting to free plan`,
      );
      currentPlan = "Free";
      break;
  }

  return (
    <PricingAndBilling
      subscriptionDetails={{
        currentPlan,
        cancelationScheduledOn: user.stripeSubscriptionCancelationScheduledOn,
      }}
    />
  );
}
