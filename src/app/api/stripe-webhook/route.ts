import type Stripe from "stripe";
import { env } from "~/env";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe";

/**
 * Overall the current logic is very primitive and breaks down in many cases.
 * For example when the user cancels their plan it does not encode this in the
 * database at all.
 *
 * TODO: What if user updates subscription some other way, will we still get
 * this event? For example if they update their subscription in the Stripe
 * subscription portal.
 *
 * TODO: Code below is highly duplicated - refactor.
 */

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

  // Pretty print the event.
  console.log("Stripe webhook event type", event.type);

  let subscriptionId: string | undefined;
  let customerId: string | undefined;
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      subscriptionId = getSubscriptionId(session.subscription);
      customerId = getCustomerId(session.customer);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      subscriptionId = getSubscriptionId(subscription.id);
      customerId = getCustomerId(subscription.customer);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      subscriptionId = getSubscriptionId(invoice.subscription);
      customerId = getCustomerId(invoice.customer);
      break;
    }

    default:
      // Mark the event as received. So Stripe does not retry.
      console.log("Unhandled event type", event.type);
      return new Response(JSON.stringify({ received: true }));
  }

  if (!subscriptionId || !customerId) {
    const message = "No subscription or customer id found";
    console.error(message);
    return new Response(message, { status: 400 });
  }

  // Retrieve the subscription details from Stripe.
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    const message = "No price id found";
    console.error(message);
    return new Response(message, { status: 400 });
  }

  // Update the price id and set the new period end.
  await db.user.update({
    where: {
      stripeCustomerId: customerId,
    },
    data: {
      // In case we have switched plans
      stripePriceId: priceId,

      // Make sure to update the cancelation date in case the user has canceled / resubscribed.
      stripeSubscriptionCancelationScheduledOn: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : // Use null to delete the value, undefined means don't update.
          // https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined
          null,

      stripePlanActiveUntil: new Date(subscription.current_period_end * 1000),
    },
  });

  return new Response(JSON.stringify({ received: true }));
}

function getSubscriptionId(
  subscription: Stripe.Subscription | string | null,
): string | undefined {
  if (typeof subscription === "string") return subscription;
  if (subscription === null) return undefined;
  return subscription.id;
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | undefined {
  if (typeof customer === "string") return customer;
  if (customer === null) return undefined;
  if (customer.deleted) return undefined;
  return customer.id;
}
