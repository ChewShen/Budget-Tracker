"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";

// Signed-in email (cloud mode only); null while loading or in guest/local mode.
export function useAccountEmail(enabled: boolean): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, [enabled]);
  return email;
}
