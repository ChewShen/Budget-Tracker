"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { format } from "date-fns";
import { Category, Tag, Transaction, MonthlySavings } from "./types";
import {
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  INITIAL_TRANSACTIONS,
  INITIAL_SAVINGS,
} from "./mock-data";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";

interface BudgetContextType {
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  savings: MonthlySavings[];
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  addTransaction: (tx: {
    amount: number;
    date: string;
    category_id: string;
    tag_id: string;
    description?: string;
    is_one_off: boolean;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateSavings: (savings: MonthlySavings) => Promise<void>;
  signOut: () => Promise<void>;
  isSyncedWithSupabase: boolean;
  isLoaded: boolean;
  loadError: string | null;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: "budget_tracker_transactions",
  SAVINGS: "budget_tracker_savings",
};

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

  useEffect(() => {
    setSelectedMonth(currentMonth());

    if (!isSupabaseConfigured) {
      // Local-only mode: restore the offline cache over the mock data.
      try {
        const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (savedTx) setTransactions(JSON.parse(savedTx));
        const savedSv = localStorage.getItem(STORAGE_KEYS.SAVINGS);
        if (savedSv) setSavings(JSON.parse(savedSv));
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
    ]).then(([cats, tgs, txs, svs]) => {
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
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [transactions, savings, isLoaded]);

  const addTransaction = async (txInput: {
    amount: number;
    date: string;
    category_id: string;
    tag_id: string;
    description?: string;
    is_one_off: boolean;
  }) => {
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
      } else if (data) {
        // Upgrade temporary client ID to permanent Supabase UUID
        setTransactions((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: data.id } : t))
        );
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (isSupabaseConfigured) {
      const supabase = createClient();
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete error:", error);
      }
    }
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
      }
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
