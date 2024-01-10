import Stripe from "stripe";
import { env } from "~/env";
import { db } from "./db";
import { type $Enums, type Prisma } from "@prisma/client";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2023-10-16",
});

// TRANSLATED FROM https://github.com/vercel/nextjs-subscription-payments/blob/main/utils/supabase-admin.ts

export async function upsertProductRecord(product: Stripe.Product) {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  try {
    await db.product.upsert({
      where: { id: product.id },
      update: productData,
      create: productData,
    });
    console.log(`Product inserted/updated: ${product.id}`);
  } catch (error) {
    throw error;
  }
}

function toPrismaPriceType(type: Stripe.Price.Type): $Enums.PricingType {
  switch (type) {
    case "one_time":
      return "oneTime";
    case "recurring":
      return "recurring";
  }
}

export async function upsertPriceRecord(price: Stripe.Price) {
  const unitAmount = price.unit_amount;
  const interval = price.recurring?.interval;
  const intervalCount = price.recurring?.interval_count;
  const trialPeriodDays = price.recurring?.trial_period_days;
  const stripeProductId = price.product;

  if (
    !unitAmount ||
    !interval ||
    !intervalCount ||
    typeof stripeProductId !== "string"
  ) {
    throw new Error("Invalid price data");
  }

  const priceData = {
    id: price.id,
    product: { connect: { id: stripeProductId } },
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: toPrismaPriceType(price.type),
    unitAmount: unitAmount,
    interval: interval,
    intervalCount: intervalCount,
    trialPeriodDays: trialPeriodDays ?? null,
    metadata: price.metadata,
  } satisfies Prisma.PriceCreateInput;

  try {
    await db.price.upsert({
      where: { id: price.id },
      // TODO: Is it fine that both update and create are used?
      update: priceData, // Do I need to create a were statement for the update to work?
      create: priceData,
    });
    console.log(`Price inserted/updated: ${price.id}`);
  } catch (error) {
    throw error;
  }
}

export async function createOrRetrieveCustomer({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) {
  let customer = await db.customer.findUnique({ where: { id: uuid } });

  if (!customer) {
    const customerData = {
      email,
      metadata: {
        userId: uuid,
      },
    };
    const stripeCustomer = await stripe.customers.create(customerData);
    customer = await db.customer.create({
      data: { id: uuid, stripeCustomerId: stripeCustomer.id },
    });
    console.log(`New customer created and inserted for ${uuid}.`);
  }

  return customer.stripeCustomerId;
}

function toPrismaStatus(
  status: Stripe.Subscription.Status,
): $Enums.SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incompleteExpired";
    case "past_due":
      return "pastDue";
    case "trialing":
      return "trialing";
    case "unpaid":
      return "unpaid";
    case "paused":
      return "paused";
  }
}

export async function manageSubscriptionStatusChange(
  subscriptionId: string,
  customerId: string,
) {
  const customer = await db.customer.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!customer) throw new Error("No customer found");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) throw new Error("No price found");

  const quantity = subscription.items.data[0]?.quantity;
  if (!quantity) throw new Error("No quantity found");

  const subscriptionData = {
    id: subscription.id,
    user: { connect: { id: customer.id } },
    metadata: subscription.metadata,
    quantity: quantity,
    status: toPrismaStatus(subscription.status),
    price: { connect: { id: priceId } },
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    created: new Date(subscription.created * 1000),
    endedAt: subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : null,
    trialStart: subscription.trial_start
      ? new Date(subscription.trial_start * 1000)
      : null,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
  } satisfies Prisma.SubscriptionCreateInput;

  try {
    await db.subscription.upsert({
      where: { id: subscription.id },
      update: subscriptionData,
      create: subscriptionData,
    });
    console.log(
      `Inserted/updated subscription [${subscription.id}] for user [${customer.id}]`,
    );
  } catch (error) {
    throw error;
  }
}
