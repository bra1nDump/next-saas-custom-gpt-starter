"use client";

import { signIn } from "next-auth/react";
import { Button } from "@nextui-org/react";

export default function Authentication() {
  return (
    <div className="flex h-full grow items-center justify-center">
      <Button
        onPress={() =>
          signIn("google", {
            redirect: true,
            callbackUrl: "/account",
          })
        }
      >
        Sign in with Google
      </Button>
    </div>
  );
}
