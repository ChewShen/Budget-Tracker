export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string | null; // key into CATEGORY_ICON_OPTIONS; null = pick by name
}

export interface Tag {
  id: string;
  category_id: string;
  name: string;
}

export interface RecurringBill {
  id: string;
  tag_id: string;
  is_active: boolean;
  expected_amount?: number | null; // used by "Log missing bills" instead of last month's amount
  due_day?: number | null; // 1-31, clamped to the month's length
  auto_log?: boolean; // added automatically on the due day (needs expected_amount + due_day)
}

export interface Transaction {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  day?: string; // Monday, Tuesday, etc.
  category_id: string;
  category_name?: string;
  tag_id: string;
  tag_name?: string;
  amount: number;
  description?: string;
  is_one_off: boolean;
  created_at?: string;
}

export interface TransactionInput {
  date: string;
  category_id: string;
  tag_id: string;
  amount: number;
  description?: string;
  is_one_off?: boolean;
}

export interface MonthlySavings {
  id?: string;
  user_id?: string;
  month: string; // YYYY-MM-01
  main_checking: number;
  gx_bank: number;
  gx_rate: number; // e.g. 0.0355
  ryt_bank: number;
  ryt_rate: number;
  epf_locked: number;
  total_liquid?: number;
  est_interest?: number;
}

export interface UserSalaryProfile {
  default_gross_salary: number; // default RM 3,500
  epf_rate: number; // default 0.11
  socso_rate: number; // default RM 17.25
  eis_rate: number; // default RM 6.90
}

export interface MonthlyKpiSummary {
  month: string;
  totalSpend: number;
  foodSpend: number;
  dailyAverage: number;
  largestExpense: {
    amount: number;
    tag_name: string;
    category_name: string;
  } | null;
  salary: {
    gross: number;
    epf: number;
    socso: number;
    eis: number;
    netSalary: number;
    netCashSaved: number;
    savingsRate: number;
  };
  liquidAssets: {
    total: number;
    monthlyGrowth: number | null;
    estInterest: number;
    untrackedCash: number | null;
  };
  recurringStatus: {
    tag_name: string;
    isLogged: boolean;
  }[];
}
