// Verify the financial formulas against values computed with the same formulas in Excel
// (example inputs, not real data)
import assert from "node:assert";

// 1. Salary Formula Verification
function calculateSalaryMetrics(gross = 3500, totalSpend, epfRate = 0.11, socso = 17.25, eis = 6.9) {
  const epf = Math.round(gross * epfRate * 100) / 100;
  const netSalary = Math.round((gross - epf - socso - eis) * 100) / 100;
  const netCashSaved = Math.round((netSalary - totalSpend) * 100) / 100;
  const savingsRate = netSalary > 0 ? (netCashSaved / netSalary) * 100 : 0;
  return { gross, epf, socso, eis, netSalary, netCashSaved, savingsRate: Number(savingsRate.toFixed(2)) };
}

const salary = calculateSalaryMetrics(3500, 2400.0);
console.log("Salary Check:");
console.log("  EPF:", salary.epf, "(Expected: 385.00)");
console.log("  Net Salary:", salary.netSalary, "(Expected: 3090.85)");
console.log("  Net Cash Saved:", salary.netCashSaved, "(Expected: 690.85)");
console.log("  Savings Rate:", salary.savingsRate + "%", "(Expected: 22.35%)");
assert.strictEqual(salary.netSalary, 3090.85);
assert.strictEqual(salary.netCashSaved, 690.85);
assert.strictEqual(salary.savingsRate, 22.35);

// 2. Digital Bank Interest Verification
function calculateDigitalBankInterest(balance, annualRate, daysInMonth) {
  const dailyRate = annualRate / 365;
  const interest = balance * (Math.pow(1 + dailyRate, daysInMonth) - 1);
  return Math.round(interest * 100) / 100;
}

// August has 31 days
const interest = calculateDigitalBankInterest(5000.0, 0.0355, 31);
console.log("\nInterest Check:");
console.log("  31-day GXBank Interest on RM 5,000:", interest, "(Expected: 15.10)");
assert.strictEqual(interest, 15.1);

console.log("\n All financial formulas mathematically match Excel perfectly!");
