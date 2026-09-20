// Verify the financial formulas directly against Excel ground truth
import assert from "node:assert";

// 1. Salary Formula Verification
function calculateSalaryMetrics(gross = 3500, totalSpend, epfRate = 0.11, socso = 17.25, eis = 6.9) {
  const epf = Math.round(gross * epfRate * 100) / 100;
  const netSalary = Math.round((gross - epf - socso - eis) * 100) / 100;
  const netCashSaved = Math.round((netSalary - totalSpend) * 100) / 100;
  const savingsRate = netSalary > 0 ? (netCashSaved / netSalary) * 100 : 0;
  return { gross, epf, socso, eis, netSalary, netCashSaved, savingsRate: Number(savingsRate.toFixed(2)) };
}

const salary = calculateSalaryMetrics(3500, 2385.06);
console.log("Salary Check:");
console.log("  EPF:", salary.epf, "(Expected: 385.00)");
console.log("  Net Salary:", salary.netSalary, "(Expected: 3090.85)");
console.log("  Net Cash Saved:", salary.netCashSaved, "(Expected: 705.79)");
console.log("  Savings Rate:", salary.savingsRate + "%", "(Expected: 22.83% or ~22.8%)");
assert.strictEqual(salary.netSalary, 3090.85);
assert.strictEqual(salary.netCashSaved, 705.79);

// 2. Digital Bank Interest Verification
function calculateDigitalBankInterest(balance, annualRate, daysInMonth) {
  const dailyRate = annualRate / 365;
  const interest = balance * (Math.pow(1 + dailyRate, daysInMonth) - 1);
  return Math.round(interest * 100) / 100;
}

// August has 31 days
const interest = calculateDigitalBankInterest(3558.62, 0.0355, 31);
console.log("\nInterest Check:");
console.log("  August GXBank Interest:", interest, "(Expected: 10.75)");
assert.strictEqual(interest, 10.75);

console.log("\n All financial formulas mathematically match Excel perfectly!");
