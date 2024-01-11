import Stripe from "stripe";
import { env } from "~/env";
import { db } from "./db";
import { type $Enums, type Prisma } from "@prisma/client";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2023-10-16",
});

/**
 * Overview:
 * - Product IDs in env
 * - Create pricing plans from static data
 *
 * - When checking if a user is on paid plan or not - simply call an API on the
 * backend :D
 * - [optional] Maybe to simplify querying?
 *     When a user signs up, create a customer in stripe
 */

export interface ProductOfferingView {
  stripeProductId?: string;
  title: string;
  price: number;

  benefits: string[];
  limitation: string[];
}

// Create a function to return an active subscription for this user
export async function findStripeProductIdForActiveSubscription(
  userId: string,
): Promise<string | undefined> {
  const customer = await db.customer.findUnique({
    where: { id: userId },
  });
  if (!customer) return undefined;

  // It might be a bad idea to query the database, probably better to go directly to stripe.
  // More code to write, we can cach it with fetch on Vercel. Won a user clicks cancel,
  // we can set a flag to invalidate the cache. Or we can use the webhook to invalidate the cache.
  // Damn it seems like a waste of lines of code to do this.
  // Shit
  const subscription = await db.subscription.findFirst({
    where: {
      user: { id: userId },
      status: { in: ["active", "trialing"] },
    },
    orderBy: { created: "desc" },
    include: { price: true },
  });

  return subscription?.price?.productId;
}

/**
 * Currently only works for monthly payments, but can easily be extended.
 * In addition to products found on stripe, will also include a free product.
 */
export async function allMonthlyProductOfferings(): Promise<
  ProductOfferingView[]
> {
  const defaultFreeProduct = {
    title: "Free",
    price: 0,
    benefits: ["Free"],
    limitation: ["No support"],
  };

  const paidForProducts = await db.product.findMany({
    include: {
      Price: true,
    },
  });

  const paidForProductsViews = paidForProducts.map((product) => {
    const price = product.Price.filter(
      (price) =>
        price.type === "recurring" &&
        price.active &&
        price.interval === "month",
    )[0];

    if (!price) throw new Error("No price found");

    // TODO: Add a list of benefits here. Probably even better is to move this product view to the
    // UI layer.

    return {
      stripeProductId: product.id,
      title: product.name,
      price: price.unitAmount / 100,
      benefits: ["Support"],
      limitation: ["No refunds"],
    };
  });

  if (paidForProductsViews.length === 0) {
    throw new Error(
      "No paid for products found, have you run the stripe fixtures script?",
    );
  }

  return [defaultFreeProduct, ...paidForProductsViews];
}

// TRANSLATED FROM https://github.com/vercel/nextjs-subscription-payments/blob/main/utils/supabase-admin.ts

// TODO: If the webhook is missed, one can manually trigger it - https://stackoverflow.com/questions/54349378/how-to-make-stripe-manually-resend-an-event-to-webhook

export async function upsertProductRecord(product: Stripe.Product) {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  } satisfies Prisma.ProductCreateInput;

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
