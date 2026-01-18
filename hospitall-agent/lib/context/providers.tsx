"use client";

import { ReactNode } from "react";
import { AppProvider } from "./app-context";

/**
 * Client-side wrapper component for all app providers.
 * This component is used in the root layout to wrap the app with
 * necessary context providers while keeping the layout as a server component.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
