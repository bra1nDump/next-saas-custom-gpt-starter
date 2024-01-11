import type Stripe from "stripe";
import { env } from "~/env";
import { stripe } from "~/server/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret)
      throw new Error("Webhook secret or signature not found");

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.log(`❌ Error message: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    // The strategy is instead of trying to extract the currently paid for product identifier from
    // the payload, simply with all qualifying events,
    // we fetch the subscription from the Stripe API and check if it's active. If it is,
    // we update the user's lastKnownSubscribedProductId to the product identifier of the
    // subscription.
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "checkout.session.completed":
      case "invoice.paid":
        // TODO: Actually implement this strategy.
        // I'm reverting back to the fetch based strategy + caching
        break;
      default:
        throw new Error("Unhandled relevant event!");
    }
  } catch (error) {
    console.log(error);
    return new Response(
      "Webhook handler failed. View your nextjs function logs.",
      {
        status: 400,
      },
    );
  }

  return new Response(JSON.stringify({ received: true }));
}
