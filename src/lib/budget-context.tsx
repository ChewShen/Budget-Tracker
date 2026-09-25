"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Category, Tag, Transaction, MonthlySavings, UserSalaryProfile } from "./types";
import {
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  INITIAL_TRANSACTIONS,
  INITIAL_SAVINGS,
} from "./mock-data";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";

type NewTransaction = {
  amount: number;
  date: string;
  category_id: string;
  tag_id: string;
  description?: string;
  is_one_off: boolean;
};

export interface Toast {
  id: number;
  message: string;
  tone: "default" | "error";
  action?: { label: string; onClick: () => void };
}

export const DEFAULT_PROFILE: UserSalaryProfile = {
  default_gross_salary: 3500,
  epf_rate: 0.11,
  socso_rate: 17.25,
  eis_rate: 6.9,
};

interface BudgetContextType {
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  savings: MonthlySavings[];
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  addTransaction: (tx: NewTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateSavings: (savings: MonthlySavings) => Promise<void>;
  profile: UserSalaryProfile;
  updateProfile: (profile: UserSalaryProfile) => Promise<void>;
  toast: Toast | null;
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: () => void;
  signOut: () => Promise<void>;
  isSyncedWithSupabase: boolean;
  isLoaded: boolean;
  loadError: string | null;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: "budget_tracker_transactions",
  SAVINGS: "budget_tracker_savings",
  PROFILE: "budget_tracker_profile",
};

const UNDO_MS = 5000;

const currentMonth = () => format(new Date(), "yyyy-MM");

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  // With Supabase, start empty and fill from the database; the mock data is only for local-only mode.
  const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [] : INITIAL_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(isSupabaseConfigured ? [] : INITIAL_TAGS);
  const [transactions, setTransactions] = useState<Transaction[]>(
    isSupabaseConfigured ? [] : INITIAL_TRANSACTIONS
  );
  const [savings, setSavings] = useState<MonthlySavings[]>(isSupabaseConfigured ? [] : INITIAL_SAVINGS);
  // Real month is set on mount; using new Date() here would bake the build date into the prerendered HTML.
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-01");
  const [isSyncedWithSupabase, setIsSyncedWithSupabase] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserSalaryProfile>(DEFAULT_PROFILE);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), t.tone === "error" ? 8000 : UNDO_MS);
  }, []);

  useEffect(() => {
    setSelectedMonth(currentMonth());

    if (!isSupabaseConfigured) {
      // Local-only mode: restore the offline cache over the mock data.
      try {
        const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (savedTx) setTransactions(JSON.parse(savedTx));
        const savedSv = localStorage.getItem(STORAGE_KEYS.SAVINGS);
        if (savedSv) setSavings(JSON.parse(savedSv));
        const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (savedProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
      } catch (e) {
        console.error("Failed to read from localStorage", e);
      }
      setIsLoaded(true);
      return;
    }

    // Drop any cache left over from local-only mode so it never mixes with (or outlives) account data.
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.SAVINGS);
    } catch {
      // Storage unavailable; nothing to clear.
    }

    const supabase = createClient();
    Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("tags").select("*").order("name"),
      supabase
        .from("transactions")
        .select("*, categories(name), tags(name)")
        .order("date", { ascending: false }),
      supabase.from("monthly_savings").select("*").order("month", { ascending: true }),
      supabase
        .from("user_profiles")
        .select("default_gross_salary, epf_rate, socso_rate, eis_rate")
        .maybeSingle(),
    ]).then(([cats, tgs, txs, svs, prof]) => {
      const error = cats.error || tgs.error || txs.error || svs.error;
      if (error) {
        console.error("Supabase load error:", error);
        setLoadError("Couldn't load your data. Check your connection and refresh.");
        setIsLoaded(true);
        return;
      }

      setCategories(cats.data || []);
      setTags(tgs.data || []);
      setTransactions(
        (txs.data || []).map((d: any) => ({
          id: d.id,
          date: d.date,
          category_id: d.category_id,
          category_name: d.categories?.name,
          tag_id: d.tag_id,
          tag_name: d.tags?.name,
          amount: Number(d.amount),
          description: d.description,
          is_one_off: Boolean(d.is_one_off),
        }))
      );
      setSavings(svs.data || []);
      if (prof.data) {
        setProfile({
          default_gross_salary: Number(prof.data.default_gross_salary ?? DEFAULT_PROFILE.default_gross_salary),
          epf_rate: Number(prof.data.epf_rate ?? DEFAULT_PROFILE.epf_rate),
          socso_rate: Number(prof.data.socso_rate ?? DEFAULT_PROFILE.socso_rate),
          eis_rate: Number(prof.data.eis_rate ?? DEFAULT_PROFILE.eis_rate),
        });
      }
      setIsSyncedWithSupabase(true);
      setIsLoaded(true);
    });
  }, []);

  // Offline cache for local-only mode.
  useEffect(() => {
    if (isSupabaseConfigured || !isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [transactions, savings, profile, isLoaded]);

  const addTransaction = async (txInput: NewTransaction) => {
    const cat = categories.find((c) => c.id === txInput.category_id);
    const tag = tags.find((t) => t.id === txInput.tag_id);

    // Optimistic temporary ID
    const tempId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      id: tempId,
      date: txInput.date,
      category_id: txInput.category_id,
      category_name: cat?.name || "Unknown",
      tag_id: txInput.tag_id,
      tag_name: tag?.name || "Unknown",
      amount: txInput.amount,
      description: txInput.description,
      is_one_off: txInput.is_one_off,
    };

    // 1. Optimistic UI update, and show the month the expense landed in
    setTransactions((prev) => [newTx, ...prev]);
    setSelectedMonth(txInput.date.slice(0, 7));

    // 2. Persist to Supabase in the background (user_id defaults to auth.uid() in the database)
    if (isSupabaseConfigured) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          date: txInput.date,
          category_id: txInput.category_id,
          tag_id: txInput.tag_id,
          amount: txInput.amount,
          description: txInput.description,
          is_one_off: txInput.is_one_off,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        // Roll back the optimistic row so the screen never shows data the database doesn't have.
        setTransactions((prev) => prev.filter((t) => t.id !== tempId));
        showToast({
          tone: "error",
          message: `Couldn't save ${newTx.tag_name} (RM ${txInput.amount.toFixed(2)})`,
          action: { label: "Retry", onClick: () => addTransaction(txInput) },
        });
      } else if (data) {
        // Upgrade temporary client ID to permanent Supabase UUID
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: data.id } : t))
        );
      }
    }
  };

  // Deletes are delayed by UNDO_MS so the Undo toast can cancel them before they reach the database.
  const pendingDelete = useRef<{ tx: Transaction; timer: ReturnType<typeof setTimeout> } | null>(null);

  const commitDelete = useCallback(
    async (tx: Transaction) => {
      // Temp ids ("tx-...") were never saved remotely; local-only mode has nothing to delete remotely.
      if (!isSupabaseConfigured || tx.id.startsWith("tx-")) return;
      const { error } = await createClient().from("transactions").delete().eq("id", tx.id);
      if (error) {
        console.error("Supabase delete error:", error);
        setTransactions((prev) => [tx, ...prev]);
        showToast({ tone: "error", message: `Couldn't delete ${tx.tag_name}. It has been restored.` });
      }
    },
    [showToast]
  );

  const flushPendingDelete = useCallback(() => {
    const pending = pendingDelete.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingDelete.current = null;
    commitDelete(pending.tx);
  }, [commitDelete]);

  // Don't lose a pending delete when the app is backgrounded or closed.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flushPendingDelete();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flushPendingDelete]);

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    flushPendingDelete();

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const timer = setTimeout(() => {
      pendingDelete.current = null;
      commitDelete(tx);
    }, UNDO_MS);
    pendingDelete.current = { tx, timer };

    showToast({
      tone: "default",
      message: `Deleted ${tx.tag_name} · RM ${tx.amount.toFixed(2)}`,
      action: {
        label: "Undo",
        onClick: () => {
          if (pendingDelete.current?.tx.id !== id) return;
          clearTimeout(pendingDelete.current.timer);
          pendingDelete.current = null;
          setTransactions((prev) => [tx, ...prev]);
          dismissToast();
        },
      },
    });
  };

  const updateSavings = async (updated: MonthlySavings) => {
    setSavings((prev) => {
      const idx = prev.findIndex((s) => s.month.startsWith(updated.month.slice(0, 7)));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });

    if (isSupabaseConfigured) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("monthly_savings").upsert(
        {
          user_id: user.id,
          month: updated.month,
          main_checking: updated.main_checking,
          gx_bank: updated.gx_bank,
          gx_rate: updated.gx_rate,
          ryt_bank: updated.ryt_bank,
          ryt_rate: updated.ryt_rate,
          epf_locked: updated.epf_locked,
        },
        { onConflict: "user_id,month" }
      );
      if (error) {
        console.error("Supabase savings upsert error:", error);
        showToast({
          tone: "error",
          message: "Couldn't save balances",
          action: { label: "Retry", onClick: () => updateSavings(updated) },
        });
      }
    }
  };

  const updateProfile = async (next: UserSalaryProfile) => {
    const previous = profile;
    setProfile(next);
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id, email: user.email, ...next }, { onConflict: "id" });
    if (error) {
      console.error("Supabase profile upsert error:", error);
      setProfile(previous);
      showToast({
        tone: "error",
        message: "Couldn't save salary settings",
        action: { label: "Retry", onClick: () => updateProfile(next) },
      });
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await createClient().auth.signOut();
    window.location.replace("/login");
  };

  return (
    <BudgetContext.Provider
      value={{
        categories,
        tags,
        transactions,
        savings,
        selectedMonth,
        setSelectedMonth,
        addTransaction,
        deleteTransaction,
        updateSavings,
        profile,
        updateProfile,
        toast,
        showToast,
        dismissToast,
        signOut,
        isSyncedWithSupabase,
        isLoaded,
        loadError,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return ctx;
}
