import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Link,
} from "@nextui-org/react";

export default function PricingPage() {
  // TODO: Query current plan
  // Assuming pricingData is an array of pricing plans

  // TODO
  const currentUser = "";

  const pricingData = [
    {
      title: "Starter",
      prices: {
        monthly: 0,
        yearly: 0,
      },
      benefits: ["1 user", "1 GB storage", "Email support"],
    },
    {
      title: "Pro",
      prices: {
        monthly: 10,
      },
      benefits: ["5 users", "10 GB storage", "Priority email support"],
    },
    {
      title: "Enterprise",
      prices: {
        monthly: 100,
      },
      benefits: [
        "Unlimited users",
        "100 GB storage",
        "Phone and email support",
      ],
    },
  ];

  // Possible states for each plan card
  // - we are signed in and don't have any plan (we are on the free plan -> subscribe button)
  // - we are signed in and have this plan (current plan pill + manage subscription button)
  // - we are signed in on a different plan (upgrade button)
  // - we are not signed in -> try

  return (
    <div className="container mx-auto px-4 text-center">
      <h2 className="my-10 text-3xl md:text-5xl">Start at full speed !</h2>

      <div className="grid gap-5 md:grid-cols-3">
        {pricingData.map((offer) => (
          <Card key={offer.title} className="flex flex-col">
            <CardHeader>
              <p className="text-lg font-bold">{offer.title}</p>
            </CardHeader>
            <CardBody>
              <div>
                <p>${offer.prices.monthly}</p>
                <span>/mo</span>
              </div>
              {offer.benefits.map((feature) => (
                <p key={feature}>{feature}</p>
              ))}
            </CardBody>
            <CardFooter></CardFooter>
          </Card>
        ))}
      </div>

      <p className="mt-3 text-base">
        Email{" "}
        <Link href="mailto:support@saas-starter.com">
          support@saas-starter.com
        </Link>{" "}
        for support.
        <br />
        <strong>You can test the subscriptions and wont be charged.</strong>
      </p>
    </div>
  );
}
