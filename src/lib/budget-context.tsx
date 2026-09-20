"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Category, Tag, Transaction, MonthlySavings } from "./types";
import {
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  INITIAL_TRANSACTIONS,
  INITIAL_SAVINGS,
} from "./mock-data";
import { createClient } from "./supabase/client";

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
  isSyncedWithSupabase: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: "budget_tracker_transactions",
  SAVINGS: "budget_tracker_savings",
};

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [savings, setSavings] = useState<MonthlySavings[]>(INITIAL_SAVINGS);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");
  const [isSyncedWithSupabase, setIsSyncedWithSupabase] = useState(false);

  // Initialize from LocalStorage and Supabase
  useEffect(() => {
    // 1. Load LocalStorage first (for instant display)
    try {
      const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      }
      const savedSv = localStorage.getItem(STORAGE_KEYS.SAVINGS);
      if (savedSv) {
        setSavings(JSON.parse(savedSv));
      }
    } catch (e) {
      console.error("Failed to read from localStorage", e);
    }

    // 2. Load latest from Supabase cloud database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("your-project-id")) {
      const supabase = createClient();

      // Fetch Categories
      supabase
        .from("categories")
        .select("*")
        .order("name")
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setCategories(data);
          }
        });

      // Fetch Tags
      supabase
        .from("tags")
        .select("*")
        .order("name")
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setTags(data);
          }
        });

      // Fetch Transactions
      supabase
        .from("transactions")
        .select("*, categories(name), tags(name)")
        .order("date", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped: Transaction[] = data.map((d: any) => ({
              id: d.id,
              date: d.date,
              category_id: d.category_id,
              category_name: d.categories?.name,
              tag_id: d.tag_id,
              tag_name: d.tags?.name,
              amount: Number(d.amount),
              description: d.description,
              is_one_off: Boolean(d.is_one_off),
            }));
            setTransactions(mapped);
            setIsSyncedWithSupabase(true);
          }
        });

      // Fetch Savings
      supabase
        .from("monthly_savings")
        .select("*")
        .order("month", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setSavings(data);
          }
        });
    }
  }, []);

  // Sync to LocalStorage as a local offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to localStorage", e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
    } catch (e) {
      console.error("Failed to save savings to localStorage", e);
    }
  }, [savings]);

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

    // 1. Optimistic UI update immediately (< 1ms)
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Persist to Supabase in the background
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("your-project-id")) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("your-project-id")) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("your-project-id")) {
      const supabase = createClient();
      const { error } = await supabase.from("monthly_savings").upsert(
        {
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
        isSyncedWithSupabase,
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
