"use server";

import { getServerAuthSession } from "./auth";
import { headers } from "next/headers";
import { stripe } from "./stripe";
import { env } from "~/env";
import { type ProductOfferingTitle } from "~/app/types";

async function getCurrentCustomerId() {
  const session = await getServerAuthSession();
  const customerId = session?.user?.stripeCustomerId;

  if (!customerId) {
    throw new Error("User does not have a stripe customer ID");
  }
  return customerId;
}

// TODO: We can suggest to update to a specific product offering https://stripe.com/docs/customer-management/portal-deep-links#create-a-flow
export async function createCustomerPortalUrlForExistingSubscribers(): Promise<string> {
  const customerId = await getCurrentCustomerId();

  const origin = getOriginFromHeaders();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/pricing`,
  });

  return portalSession.url;
}

export async function createCheckoutSessionUrl(
  productOfferingTitle: ProductOfferingTitle,
): Promise<string> {
  const customerId = await getCurrentCustomerId();

  let priceId: string;
  switch (productOfferingTitle) {
    case "Plus":
      priceId = env.STRIPE_PRODUCT_ID_PLUS;
      break;
    case "Pro":
      priceId = env.STRIPE_PRODUCT_ID_PRO;
      break;
    default:
      throw new Error(
        "Invalid product offering title - cannot upgrade to free",
      );
  }

  const origin = getOriginFromHeaders();
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${origin}/pricing?checkout_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  if (!checkoutSession.url) {
    throw new Error("Checkout session does not have a URL");
  }

  return checkoutSession.url;
}

function getOriginFromHeaders() {
  const requestHeaders = headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");

  return `${protocol}://${host}`;
}
