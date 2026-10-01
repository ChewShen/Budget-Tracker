import { fromLegacySavings } from "./savings";
import { Budget, Category, Goal, GoalContribution, LegacyMonthlySavings, RecurringBill, Tag, Transaction } from "./types";

// Made-up demo data for guest mode and local-only mode (no Supabase).
// Generated from today's date (last two full months + this month so far) with a fixed seed,
// so every visitor sees the same believable numbers. None of it is anyone's real data.

// ---- Categories & tags (generic) ----

const TAXONOMY: Record<string, string[]> = {
  Food: ["Breakfast", "Lunch", "Dinner", "Supper", "Coffee", "Snack", "Groceries"],
  Transport: ["Petrol", "Parking", "Toll", "Grab", "Season Parking"],
  Home_Bills: ["Electric", "Water", "Internet", "Phone"],
  Subscription: ["Netflix", "Spotify", "iCloud"],
  Shopping: ["Clothes", "Household", "MacBook Air instalment"],
  Health: ["Clinic", "Pharmacy"],
  Entertainment: ["Movie", "Games"],
  Self_care: ["Haircut", "Skincare"],
  Own_Interest: ["Gym", "Books"],
  Others: ["Gifts"],
};

export const INITIAL_CATEGORIES: Category[] = Object.keys(TAXONOMY)
  .sort()
  .map((name, i) => ({ id: `cat-${i + 1}`, name, role: name === "Food" ? ("food" as const) : null }));

// Same marks as the default set for new accounts (scripts/migrations/2026-09-30_roles.sql).
const MEAL_TAGS = ["breakfast", "lunch", "snack", "dinner", "supper"] as const;
const mealRole = (category: string, tag: string) =>
  category === "Food" ? MEAL_TAGS.find((m) => m === tag.toLowerCase()) ?? null : null;

export const INITIAL_TAGS: Tag[] = INITIAL_CATEGORIES.flatMap((c) =>
  TAXONOMY[c.name].map((name) => ({
    id: `tag-${c.name}-${name}`.replace(/\s+/g, "-"),
    category_id: c.id,
    name,
    role: mealRole(c.name, name),
  }))
).sort((a, b) => a.name.localeCompare(b.name));

const tag = (name: string) => INITIAL_TAGS.find((t) => t.name === name) as Tag;
const categoryOf = (t: Tag) => INITIAL_CATEGORIES.find((c) => c.id === t.category_id) as Category;

// ---- Monthly bills: [tag, amount (null = varies), due day, auto-add] ----

const BILLS: [string, number | null, number, boolean][] = [
  ["Internet", 99, 1, true],
  ["Season Parking", 120, 1, false],
  ["Netflix", 54.9, 5, true],
  ["Phone", 38, 10, false],
  ["Spotify", 15.9, 12, true],
  ["Electric", null, 18, false],
  ["iCloud", 3.9, 20, true],
  ["Water", null, 22, false],
];

// An instalment plan: a laptop bought two months ago, RM 500 down and 12 payments on the 6th.
const PLAN = { tag: "MacBook Air instalment", price: 4999, down: 500, monthly: 374.92, payments: 12, dueDay: 6 };
const monthStart = (back: number, today = new Date()) => {
  const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const INITIAL_BILLS: RecurringBill[] = [
  ...BILLS.map(([name, amount, due, auto]) => ({
    id: `bill-${tag(name).id}`,
    tag_id: tag(name).id,
    is_active: true,
    expected_amount: amount,
    due_day: due,
    auto_log: auto,
  })),
  {
    id: "bill-plan-macbook",
    tag_id: tag(PLAN.tag).id,
    is_active: true,
    expected_amount: PLAN.monthly,
    due_day: PLAN.dueDay,
    auto_log: true,
    installment_count: PLAN.payments,
    start_month: monthStart(2),
    goal_id: "goal-macbook",
    cash_price: PLAN.price,
    down_payment: PLAN.down,
  },
];

// ---- Monthly budgets (a mix that ends up under, close to, and over) ----

const BUDGETS: [string, number][] = [
  ["Food", 1000],
  ["Transport", 450],
  ["Home_Bills", 350],
  ["Entertainment", 60],
  ["Subscription", 80],
];

export const INITIAL_BUDGETS: Budget[] = BUDGETS.map(([name, limit]) => {
  const category = INITIAL_CATEGORIES.find((c) => c.name === name) as Category;
  return { id: `budget-${category.id}`, category_id: category.id, monthly_limit: limit };
});

// ---- Transactions ----

// Small seeded PRNG (mulberry32) so the demo is the same on every load.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildTransactions(today: Date): Transaction[] {
  const txs: Transaction[] = [];
  const add = (date: Date, tagName: string, amount: number, extra: Partial<Transaction> = {}) => {
    const t = tag(tagName);
    const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    txs.push({
      id: `tx-demo-${txs.length + 1}`,
      date: iso,
      day: WEEKDAYS[date.getDay()],
      category_id: t.category_id,
      category_name: categoryOf(t).name,
      tag_id: t.id,
      tag_name: t.name,
      amount: Math.round(amount * 100) / 100,
      is_one_off: false,
      description: "",
      ...extra,
    });
  };

  for (let back = 2; back >= 0; back--) {
    const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lastDay = back === 0 ? today.getDate() : daysInMonth;
    const r = rng(first.getFullYear() * 100 + first.getMonth() + 7);
    const between = (lo: number, hi: number) => lo + r() * (hi - lo);

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d);
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;

      if (r() < 0.6) add(date, "Breakfast", between(5, 10));
      if (r() < 0.9) add(date, "Lunch", between(9, 15));
      if (r() < 0.75) add(date, "Dinner", between(10, 22), r() < 0.1 ? { description: "With friends" } : {});
      if (r() < 0.25) add(date, "Coffee", between(4, 12));
      if (r() < 0.15) add(date, "Snack", between(3, 7));
      if (weekday === 6) add(date, "Groceries", between(50, 110));
      if (d % 7 === 2) add(date, "Petrol", between(50, 65));
      if (!isWeekend && r() < 0.2) add(date, "Parking", between(2, 5));
      if (!isWeekend && r() < 0.2) add(date, "Toll", between(2.5, 6));
      if (r() < 0.05) add(date, "Grab", between(12, 22));
      if (weekday === 6 && r() < 0.35) add(date, "Movie", between(18, 30));
      if (r() < 0.04) add(date, "Household", between(15, 60));

      // Monthly items on fixed days.
      if (d === 3) add(date, "Gym", 99);
      if (d === 14) add(date, "Haircut", 25);
      if (d === 16 && r() < 0.5) add(date, "Books", between(30, 60));

      // The laptop plan: down payment the day it was bought, then one payment a month.
      if (d === PLAN.dueDay) {
        if (back === 2) add(date, "Household", PLAN.down, { is_one_off: true, description: "MacBook Air (down payment)" });
        add(date, PLAN.tag, PLAN.monthly);
      }

      // Bills on their due day.
      for (const [name, amount, due] of BILLS) {
        if (d !== due) continue;
        const value = amount ?? (name === "Electric" ? between(95, 140) : between(18, 26));
        add(date, name, value);
      }
    }

    // One irregular, one-off expense in each full month.
    if (back > 0) {
      const oneOffDay = new Date(first.getFullYear(), first.getMonth(), 9 + Math.floor(r() * 12));
      if (back === 2) add(oneOffDay, "Clothes", between(120, 260), { is_one_off: true, description: "Raya sale" });
      else add(oneOffDay, "Clinic", between(45, 90), { is_one_off: true, description: "Flu" });
    }
  }

  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

// ---- Savings snapshots: the two full months are recorded, this month isn't yet ----

function buildSavings(today: Date): LegacyMonthlySavings[] {
  const month = (back: number) => {
    const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  };
  return [
    { id: "sav-1", month: month(2), main_checking: 1200, gx_bank: 8000, gx_rate: 0.0355, ryt_bank: 2000, ryt_rate: 0.03, epf_locked: 18500 },
    { id: "sav-2", month: month(1), main_checking: 1450, gx_bank: 8500, gx_rate: 0.0355, ryt_bank: 2100, ryt_rate: 0.03, epf_locked: 18885 },
  ];
}

// ---- Goals: an upgrade with a trade-in, and a trip ----

function buildGoals(today: Date): { goals: Goal[]; contributions: GoalContribution[] } {
  const day = (monthsFromNow: number, d: number) => {
    const x = new Date(today.getFullYear(), today.getMonth() + monthsFromNow, d);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  };
  const goals: Goal[] = [
    {
      id: "goal-phone",
      name: "iPhone 17 Pro",
      target_amount: 5499,
      trade_in_name: "iPhone 13",
      trade_in_value: 1200,
      trade_in_updated: day(-1, 15),
      discounts: [
        { id: "disc-voucher", label: "11.11 voucher", kind: "amount", value: 200, expires_on: day(2, 11) },
        { id: "disc-cashback", label: "Card cashback", kind: "percent", value: 5 },
      ],
      target_date: day(6, 1),
      link: null,
      priority: 0,
      status: "active",
    },
    {
      id: "goal-macbook",
      name: "MacBook Air",
      target_amount: PLAN.price,
      trade_in_value: 0,
      discounts: [],
      target_date: null,
      link: null,
      priority: 2,
      status: "bought",
      bought_at: day(-2, PLAN.dueDay),
    },
    {
      id: "goal-japan",
      name: "Japan trip",
      target_amount: 6000,
      trade_in_value: 0,
      discounts: [],
      target_date: day(10, 1),
      link: null,
      priority: 1,
      status: "active",
    },
  ];
  const contributions: GoalContribution[] = [
    { id: "gc-1", goal_id: "goal-phone", amount: 600, date: day(-2, 26) },
    { id: "gc-2", goal_id: "goal-phone", amount: 600, date: day(-1, 26) },
    { id: "gc-3", goal_id: "goal-phone", amount: 450, date: day(0, 5), note: "Bonus from overtime" },
    { id: "gc-4", goal_id: "goal-japan", amount: 300, date: day(-1, 26) },
    { id: "gc-5", goal_id: "goal-japan", amount: 300, date: day(0, 1) },
  ];
  return { goals, contributions };
}

const TODAY = new Date();
export const INITIAL_TRANSACTIONS: Transaction[] = buildTransactions(TODAY);
// Built in the old fixed-column shape and converted, the same way a real account's history is.
const DEMO_SAVINGS = fromLegacySavings(buildSavings(TODAY));
export const INITIAL_SAVINGS_ACCOUNTS = DEMO_SAVINGS.accounts;
export const INITIAL_SAVINGS_BALANCES = DEMO_SAVINGS.balances;
const DEMO_GOALS = buildGoals(TODAY);
export const INITIAL_GOALS: Goal[] = DEMO_GOALS.goals;
export const INITIAL_GOAL_CONTRIBUTIONS: GoalContribution[] = DEMO_GOALS.contributions;
