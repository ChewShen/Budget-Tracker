import { Transaction, MonthlySavings, UserSalaryProfile } from "./types";

/**
 * Calculates daily average spend, excluding one-off irregular spikes.
 * Matches Excel formula:
 * SUMIFS(Amount, One-off?,"<>Y", Date, ">=B2", Date, "<EDATE(B2,1)") / (MIN(EOMONTH(B2,0), TODAY()) - B2 + 1)
 */
export function calculateDailyAverage(
  transactions: Transaction[],
  monthStr: string, // YYYY-MM
  referenceDate: Date = new Date()
): number {
  const [yearStr, mStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10); // 1-indexed

  // Total days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  // If current month, use elapsed days up to referenceDate, else full month
  const isCurrentMonth =
    referenceDate.getFullYear() === year && referenceDate.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth
    ? Math.min(daysInMonth, Math.max(1, referenceDate.getDate()))
    : daysInMonth;

  // Filter out one-off expenses
  const regularExpenses = transactions.filter((t) => !t.is_one_off);
  const totalRegularSpend = regularExpenses.reduce((sum, t) => sum + t.amount, 0);

  return Number((totalRegularSpend / daysElapsed).toFixed(2));
}

/**
 * Calculates Malaysian statutory salary deductions and cash saved.
 * Gross -> EPF (11%) -> SOCSO -> EIS -> Net Salary -> Net Cash Saved -> Savings Rate %
 */
export function calculateSalaryMetrics(
  gross: number = 3500,
  totalSpend: number,
  profile: Partial<UserSalaryProfile> = {}
) {
  const epfRate = profile.epf_rate ?? 0.11;
  const socso = profile.socso_rate ?? 17.25;
  const eis = profile.eis_rate ?? 6.9;

  const epf = Math.round(gross * epfRate * 100) / 100;
  const netSalary = Math.round((gross - epf - socso - eis) * 100) / 100;
  const netCashSaved = Math.round((netSalary - totalSpend) * 100) / 100;
  const savingsRate = netSalary > 0 ? (netCashSaved / netSalary) * 100 : 0;

  return {
    gross,
    epf,
    socso,
    eis,
    netSalary,
    netCashSaved,
    savingsRate: Number(savingsRate.toFixed(2)),
  };
}

/**
 * Calculates exact daily compounding monthly interest for digital bank savings (GXBank / Rize).
 * Matches Excel formula:
 * ROUND(Balance * ((1 + Rate/365)^DAY(EOMONTH(Month, 0)) - 1), 2)
 */
export function calculateDigitalBankInterest(
  gxBalance: number,
  gxRate: number = 0.0355,
  rytBalance: number = 0,
  rytRate: number = 0,
  monthStr: string // YYYY-MM
): number {
  const [yearStr, mStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const gxInterest =
    gxBalance > 0
      ? gxBalance * (Math.pow(1 + gxRate / 365, daysInMonth) - 1)
      : 0;

  const rytInterest =
    rytBalance > 0
      ? rytBalance * (Math.pow(1 + rytRate / 365, daysInMonth) - 1)
      : 0;

  return Math.round((gxInterest + rytInterest) * 100) / 100;
}

/**
 * Calculates untracked cash leakage between months.
 * Untracked = (Total Liquid Current - Total Liquid Previous) - Net Cash Saved
 */
export function calculateUntrackedCash(
  currentLiquid: number,
  prevLiquid: number | null,
  netCashSaved: number
): number | null {
  if (prevLiquid === null || prevLiquid === 0) return null;
  const monthlyGrowth = currentLiquid - prevLiquid;
  return Math.round((monthlyGrowth - netCashSaved) * 100) / 100;
}
