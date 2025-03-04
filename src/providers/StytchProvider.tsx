"use client";

import React from "react";
import { StytchProvider as BaseStytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";

// Initialize Stytch client
const stytchClient = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
);

export function StytchProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseStytchProvider stytch={stytchClient}>{children}</BaseStytchProvider>
  );
}
