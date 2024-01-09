"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Divider,
} from "@nextui-org/react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createCheckoutSessionUrl,
  createCustomerPortalUrlForExistingSubscribers,
} from "~/server/stripe-actions";
import {
  type SubscriptionDetails,
  type ProductOfferingView,
} from "~/app/types";

export function PricingAndBilling(props: {
  subscriptionDetails: SubscriptionDetails;
}) {
  const router = useRouter();
  // Possible states for each plan card
  // - we are signed in and don't have any plan (we are on the free plan -> subscribe button)
  // - we are signed in and have this plan (current plan pill + manage subscription button)
  // - we are signed in on a different plan (upgrade button)
  // - we are not signed in -> try

  const { currentPlan, cancelationScheduledOn } = props.subscriptionDetails;

  const productOfferings: ProductOfferingView[] = [
    {
      title: "Free",
      price: 0,
      isCurrent: currentPlan === "Free",
      benefits: ["1 user", "1 GB storage", "Email support"],
      limitation: ["Limited to 5 projects"],
    },
    {
      title: "Plus",
      price: 10,
      isCurrent: currentPlan === "Plus",
      benefits: ["5 users", "10 GB storage", "Priority email support"],
      limitation: ["Limited to 5 projects"],
    },
    {
      title: "Pro",
      price: 100,
      isCurrent: currentPlan === "Pro",
      benefits: [
        "Unlimited users",
        "100 GB storage",
        "Phone and email support",
      ],
      limitation: ["Limited to 5 projects"],
    },
  ];

  const isUserOnPaidPlan = currentPlan !== "Free";

  return (
    <div className="container mx-auto flex max-w-screen-lg flex-col px-4 text-center">
      <h2 className="my-10 text-3xl md:text-5xl">Start at full speed !</h2>

      <div className="grid w-full justify-items-center gap-5 md:grid-cols-3">
        {productOfferings.map((product, index) => {
          const indexOfCurrentPlan = productOfferings.findIndex(
            (p) => p.isCurrent,
          )!;
          let label: "Manage" | "Upgrade" | "Downgrade";
          if (indexOfCurrentPlan === index) {
            label = "Manage";
          } else if (indexOfCurrentPlan < index) {
            label = "Upgrade";
          } else {
            label = "Downgrade";
          }

          return (
            <Card
              key={product.title}
              className={`flex min-h-[150px] w-full max-w-[500px] flex-col border border-divider`}
            >
              <CardHeader className="flex flex-col items-start gap-4 p-6 font-normal">
                {/* Plan title: STARTER / PRO / ENTERPRISE */}
                <p className="flex items-baseline text-sm uppercase tracking-wider text-foreground-400">
                  {product.title}
                  {product.isCurrent && !cancelationScheduledOn && (
                    <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                      Active
                    </span>
                  )}
                  {product.isCurrent && cancelationScheduledOn && (
                    <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                      Active, cancels on{" "}
                      {cancelationScheduledOn.toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </span>
                  )}
                </p>
                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <p className="flex text-left text-3xl leading-6">
                    ${product.price}
                  </p>
                  <span>/mo</span>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="p-6">
                {/* Benefits */}
                {product.benefits.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check size={16} />
                    <p>{feature}</p>
                  </div>
                ))}

                {/* Limitations */}
                {product.limitation.map((limit) => (
                  <div
                    key={limit}
                    className="flex items-center gap-2 text-foreground-400"
                  >
                    <X size={16} />
                    <p>{limit}</p>
                  </div>
                ))}
              </CardBody>

              {!(product.isCurrent && product.title === "Free") && (
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button
                    color="secondary"
                    className="w-full bg-secondary"
                    onPress={async () => {
                      if (isUserOnPaidPlan) {
                        // If user is on a paid plan,
                        // redirect to customer portal where they can manage their subscription
                        const customerPortalUrl =
                          await createCustomerPortalUrlForExistingSubscribers();
                        router.push(customerPortalUrl);
                      } else {
                        // Otherwise create a checkout session
                        const checkoutUrl = await createCheckoutSessionUrl(
                          product.title,
                        );
                        router.push(checkoutUrl);
                      }
                    }}
                  >
                    {label}
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
