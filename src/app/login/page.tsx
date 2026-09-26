"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Email + password only. There is no sign-up: the single user is created in the
// Supabase dashboard (Authentication -> Users -> Add user).
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsBusy(true);
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setIsBusy(false);
      setError(
        error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "Wrong email or password."
      );
      return;
    }
    // Full navigation so the middleware sees the new session cookie.
    window.location.replace("/");
  };

  return (
    <div className="flex min-h-[80dvh] items-center justify-center">
      <form onSubmit={signIn} className="w-full max-w-sm space-y-4">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
            RM
          </span>
          <span className="text-lg font-semibold tracking-tight">Budget</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

        <input
          type="email"
          required
          autoFocus
          autoComplete="username"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground transition hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isBusy || !email || !password}
          className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          {isBusy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
