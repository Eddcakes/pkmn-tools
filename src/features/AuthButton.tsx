"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "../components/Button";

export function AuthButton() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <Button variant="secondary" disabled>
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button variant="secondary" onClick={() => signOut()}>
        Sign out
      </Button>
    );
  }

  return (
    <Button variant="primary" onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  );
}
