import { PricingAndBilling } from "~/components/PricingAndBilling";
import { env } from "~/env";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { type ProductOfferingView, stripe } from "~/server/stripe";

// https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
export default async function PricingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const session = await getServerAuthSession();
  const user = session?.user;

  // TODO: Move to the client component as this has more to do with the UI
  const pricingData = [
    {
      title: "Starter",
      price: 0,
      stripeProductId: undefined,
      benefits: ["1 user", "1 GB storage", "Email support"],
      limitation: ["Limited to 5 projects"],
    },
    {
      title: "Plus",
      price: 10,
      stripeProductId: env.STRIPE_PRODUCT_ID_PLUS,
      benefits: ["5 users", "10 GB storage", "Priority email support"],
      limitation: ["Limited to 5 projects"],
    },
    {
      title: "Pro",
      price: 100,
      stripeProductId: env.STRIPE_PRODUCT_ID_PRO,
      benefits: [
        "Unlimited users",
        "100 GB storage",
        "Phone and email support",
      ],
      limitation: ["Limited to 5 projects"],
    },
  ] satisfies ProductOfferingView[];

  // If user is logged in, handle customer and subscriptions
  if (!user) {
    return <PricingAndBilling allProducts={pricingData} />;
  }

  // Creates stripe customer if absent
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  // Query product id for current subscription OR extract checkout_session_id from searchParams,
  // this will be passed if this page was redirected to from a checkout session
  const isLoadingAfterCheckoutCompleted =
    typeof searchParams.checkout_session_id === "string";
  if (isLoadingAfterCheckoutCompleted && !user.lastKnownSubscribedProductId) {
    // TODO: Was not instantly apparent on how to extract the product id the user has subscribed to
    // from the checkout session, well will just log the fact that we have the checkout session,
    // and make sure the last known product was updated in the database by the webhook
    console.error(
      "Checkout session completed, but product was not set on the user record: ",
      searchParams.checkout_session_id,
    );
  }

  return (
    <PricingAndBilling
      allProducts={pricingData}
      currentStripeProductId={user.lastKnownSubscribedProductId}
    />
  );
}
