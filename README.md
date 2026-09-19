# 💰 Personal Monthly Budget & Wealth Tracker (Web & Mobile PWA)

A full-stack, mobile-first personal finance application built to replace traditional Excel budget sheets (`Monthly Budget.xlsm`) with a real-time, cross-device web experience.

Hosted $100\%$ free on **Vercel** and **Supabase (PostgreSQL)** with no expiring trial periods or server costs.

---

## 📱 Highlights & Features

- **⚡ 5-Second Mobile Quick-Add (PWA)**: Large tactile numpad, category-to-tag cascading picker, and "One-off?" toggle. Installable directly to iOS/Android home screens.
- **📊 Dynamic Monthly Cockpit**: Replaces Excel Timeline Slicers with a responsive month selector that recalculates KPIs in real time:
  - **Total Spend & Food Burn Rate**
  - **Daily Average Spend**: Automatically excludes one-off spike expenses (`is_one_off = true`).
  - **Peak Expense Spotlight**: Automatically detects and badges your highest monthly expense.
- **🇲🇾 Malaysian Salary & Deductions Engine**:
  - Automatically calculates **EPF (11%)**, **SOCSO**, and **EIS** from Gross Salary.
  - Computes exact **Net Salary**, **Net Cash Saved**, and **Savings Rate %**.
- **📈 Digital Bank Compound Interest Engine**:
  - Tracks **GXBank (3.55% p.a.)**, **Rize/RYT Bank**, and checking accounts.
  - Automatically calculates exact daily compounded interest based on calendar month days (`28–31`).
  - **Untracked Cash Detector**: Reconciles net cash saved against real asset growth to identify unlogged cash leaks.
- **🛡️ Recurring Bills Sentinel**:
  - Monitors recurring expenses (*Netflix, iCloud, Cuckoo, Water, Electric, Season Parking*).
  - Flags each as **`Logged`** or **`MISSING`** for the active month.
- **🔄 Two-Way Data Portability**:
  - Ingests all historical transactions and savings from `Monthly Budget.xlsm`.
  - 1-click export back to Excel (`.xlsx`) or CSV at any time.

---

## 🛠️ Tech Stack

- **Frontend & App Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Charts & Visualizations**: [Recharts](https://recharts.org/) (Category Donut & Tag Bar Charts)
- **Database & Authentication**: [Supabase (PostgreSQL 16)](https://supabase.com/) with Row-Level Security (RLS)
- **PWA Integration**: `@ducanh2912/next-pwa` (Service Worker + Web App Manifest)
- **Hosting**: [Vercel](https://vercel.com/) (Serverless Edge, 100% Free Hobby Tier)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  📱 Mobile PWA (Add to Home Screen)  |  💻 Desktop Browser  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                  APPLICATION TIER (VERCEL)                  │
│  • Next.js Server Actions (No cold starts, 0 server cost)   │
│  • Salary, Interest & Daily Burn Rate Math Engines         │
│  • Excel Ingestion & Export Engine                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticated Client
┌──────────────────────────────▼──────────────────────────────┐
│                  DATABASE TIER (SUPABASE)                   │
│  • PostgreSQL 16 Relational Engine                          │
│  • Row-Level Security (RLS) & JWT User Authentication       │
│  • Automated Cloud Backups                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

Execute the following SQL in your **Supabase SQL Editor**:

```sql
-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles & Salary Defaults
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  default_gross_salary numeric(10, 2) default 3500.00,
  epf_rate numeric(5, 4) default 0.1100,
  socso_rate numeric(10, 2) default 17.25,
  eis_rate numeric(10, 2) default 6.90,
  created_at timestamptz default now()
);

-- 3. Categories Taxonomy
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text default '#3b82f6'
);

-- 4. Tags Taxonomy (Linked to Categories)
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete cascade not null,
  name text not null,
  unique(category_id, name)
);

-- 5. Transactions Ledger
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  category_id uuid references public.categories(id) not null,
  tag_id uuid references public.tags(id) not null,
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  is_one_off boolean not null default false,
  created_at timestamptz default now()
);

create index idx_transactions_user_date on public.transactions(user_id, date);

-- 6. Monthly Savings Snapshots
create table public.monthly_savings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  month date not null, -- Stored as YYYY-MM-01
  main_checking numeric(12, 2) default 0.00,
  gx_bank numeric(12, 2) default 0.00,
  gx_rate numeric(5, 4) default 0.0355,
  ryt_bank numeric(12, 2) default 0.00,
  ryt_rate numeric(5, 4) default 0.0000,
  epf_locked numeric(12, 2) default 0.00,
  unique(user_id, month)
);

-- 7. Recurring Bills Sentinel Configuration
create table public.recurring_sentinel (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  tag_id uuid references public.tags(id) not null,
  is_active boolean default true
);

-- 8. Enable Row-Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.monthly_savings enable row level security;
alter table public.recurring_sentinel enable row level security;

create policy "Users can view and edit their profile" on public.user_profiles
  for all using (auth.uid() = id);

create policy "Users can manage their own transactions" on public.transactions
  for all using (auth.uid() = user_id);

create policy "Users can manage their monthly savings" on public.monthly_savings
  for all using (auth.uid() = user_id);

create policy "Users can manage their recurring sentinel" on public.recurring_sentinel
  for all using (auth.uid() = user_id);

create policy "Categories and tags are viewable by authenticated users" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "Tags are viewable by authenticated users" on public.tags
  for select using (auth.role() = 'authenticated');
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Git**
- A free account on [Supabase](https://supabase.com)
- A free account on [Vercel](https://vercel.com)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/budget-tracker.git
cd budget-tracker
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Seed Data from `Monthly Budget.xlsm`
Run the migration script to populate your database with existing lookups, categories, tags, and all 172 transactions:

```bash
npm run seed:excel
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Mobile PWA Installation Guide

1. Deploy your app to **Vercel** (connect your GitHub repository $\to$ click **Deploy**).
2. Open your Vercel URL on your mobile phone:
   - **iOS (Safari)**: Tap the **Share** button $\to$ tap **"Add to Home Screen"**.
   - **Android (Chrome)**: Tap the **Three Dots Menu** $\to$ tap **"Install App"** or **"Add to Home screen"**.
3. Launch from your home screen. It will open full-screen without browser bars, exactly like a native app.

---

## 📐 Core Financial Formulas

| Metric | Formula |
| :--- | :--- |
| **Net Salary** | $\text{Gross} - (\text{Gross} \times 0.11) - 17.25 - 6.90$ |
| **Net Cash Saved** | $\text{Net Salary} - \text{Total Spend}$ |
| **Savings Rate** | $\frac{\text{Net Cash Saved}}{\text{Net Salary}} \times 100\%$ |
| **Daily Average** | $\frac{\sum \text{Spend (where is\_one\_off = false)}}{\min(\text{DaysInMonth}, \text{CurrentDay})}$ |
| **GXBank Monthly Interest** | $\text{Balance} \times \left( \left(1 + \frac{0.0355}{365}\right)^{\text{DaysInMonth}} - 1 \right)$ |
| **Untracked Cash** | $(\text{Total Liquid}_{\text{curr}} - \text{Total Liquid}_{\text{prev}}) - \text{Net Cash Saved}$ |

---

## 📄 License
MIT License. Created for personal financial tracking.
