"use client";

import { defaultTheme, Provider } from "@adobe/react-spectrum";

export function SpectrumProvider({ children }: { children: React.ReactNode }) {
  return <Provider theme={defaultTheme}>{children}</Provider>;
}
