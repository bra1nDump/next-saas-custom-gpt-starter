// app/pricing.page.tsx
import { usePathname } from "next/navigation";
import React from "react";
import { PricingAndBilling } from "~/components/PricingAndBilling";
import { getServerAuthSession } from "~/server/auth";
import { type ProductOfferingView } from "~/server/stripe";
import { getUserInfo, getOrCreateCustomerId } from "~/server/user";

// https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
export default async function PricingPage({
  searchParams,
}: {
  searchParams: object;
}) {
  const session = await getServerAuthSession();
  const user = session?.user;

  const allProducts = [];
  let currentStripeProductId = null;

  try {
    // Fetch the list of all Stripe products & prices with caching
    const pricesResponse = await fetch(`https://api.stripe.com/v1/prices`, {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!pricesResponse.ok) {
      throw new Error("Failed to fetch Stripe prices");
    }

    const pricingData = [
      {
        title: "Starter",
        price: 0,
        stripeProductId: undefined,
        benefits: ["1 user", "1 GB storage", "Email support"],
        limitation: ["Limited to 5 projects"],
      },
      {
        title: "Pro",
        price: 10,
        benefits: ["5 users", "10 GB storage", "Priority email support"],
        limitation: ["Limited to 5 projects"],
      },
      {
        title: "Enterprise",
        price: 100,
        benefits: [
          "Unlimited users",
          "100 GB storage",
          "Phone and email support",
        ],
        limitation: ["Limited to 5 projects"],
      },
    ] satisfies ProductOfferingView[];

    // If user is logged in, handle customer and subscriptions
    if (user) {
      if (user.id)
        const subscriptionsResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
            next: {
              revalidate: 3600, // Invalidate and revalidate when user state changes
            },
          },
        );

      if (!subscriptionsResponse.ok) {
        throw new Error("Failed to fetch Stripe subscriptions");
      }

      const { data: subscriptionsData } = await subscriptionsResponse.json();
      const activeSubscription = subscriptionsData[0]; // Assuming one active subscription

      if (activeSubscription) {
        currentStripeProductId = activeSubscription.items.data[0].price.product;
      }
    }
  } catch (error) {
    console.error("Failed to load pricing data", error);
  }

  return (
    <PricingAndBilling
      allProducts={allProducts}
      currentStripeProductId={currentStripeProductId}
    />
  );
}
