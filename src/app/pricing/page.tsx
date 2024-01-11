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
import { type ProductOfferingView } from "~/server/stripe";

// TODO: Make this into a component and inject the initial state from the server side page (get
// user, plan, all plans)
export default function PricingPage(props: {
  allProducts: ProductOfferingView[];
  currentStripeProductId?: string;
}) {
  // Possible states for each plan card
  // - we are signed in and don't have any plan (we are on the free plan -> subscribe button)
  // - we are signed in and have this plan (current plan pill + manage subscription button)
  // - we are signed in on a different plan (upgrade button)
  // - we are not signed in -> try

  return (
    <div className="container mx-auto flex max-w-screen-lg flex-col px-4 text-center">
      <h2 className="my-10 text-3xl md:text-5xl">Start at full speed !</h2>

      <div className="grid w-full justify-items-center gap-5 md:grid-cols-3">
        {props.allProducts.map((product) => (
          <Card
            key={product.title}
            className="flex min-h-[150px] w-full max-w-[500px] flex-col border border-divider"
          >
            <CardHeader className="flex flex-col items-start gap-4 p-6 font-normal">
              {/* Plan title: STARTER / PRO / ENTERPRISE */}
              <p className="flex text-sm uppercase tracking-wider text-foreground-400">
                {product.title}
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

            <CardFooter className="px-6 pb-6 pt-0">
              <Button
                color="secondary"
                className="w-full"
                onPress={() => {
                  console.log("TODO: subscribe to plan");
                }}
              >
                Subscribe
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
