import { describe, expect, it } from "vitest";
import {
  amountFromText,
  looksLikeTransfer,
  merchantFromText,
  merchantKey,
  parseAmount,
  parseCapture,
  parseDate,
  referenceFromText,
  suggestTagId,
  timeFromText,
} from "@/lib/ingest";

// Text as an iPhone reads it off payment screens (Shortcut: Take Screenshot → Extract Text).
// Shop names, people, accounts and references are made up.

const TODAY = "2026-10-03";

// TnG eWallet → Activity → a payment. The name in Payment Details wraps onto a second line.
const TNG_RECEIPT = `9:41
Transaction Details
-RM10.00
Payment Successful
Transaction Type
Payment
Merchant
ASIAN FOOD AND DESSERT
Payment Details
Payment - ASIAN FOOD AND
DESSERT
Date/Time
03/10/2026 12:41:07
Wallet Ref
20261003101100000012345678
Status
Successful`;

// The screen right after paying with DuitNow QR, with a logo letter read as text.
const QR_SUCCESS = `D
Payment successful
RM 8.50
Paid to
99 SPEEDMART 1234 TAMAN CONTOH
DuitNow Ref No.
20261003TNGDMYNB030OQR12345
3 Oct 2026, 7:15 PM
Done`;

// A transfer: labels first, then their values (how screen reading lists two columns).
const TRANSFER = `Transferred
RM 50.00
Transfer to
Recipient Bank/ E-Wallet
Account Number
DuitNow Ref No.
Date & Time
ALI BIN ABU
Example Bank
1234567890123
20261003EXMPMYKL0101234567
03/10/2026 09:32:00`;

describe("reading a payment screen", () => {
  it("reads a TnG receipt", () => {
    expect(parseCapture({ text: TNG_RECEIPT }, TODAY)).toEqual({
      amount: 10,
      merchant: "ASIAN FOOD AND DESSERT",
      date: "2026-10-03",
      isTransfer: false,
    });
    expect(timeFromText(TNG_RECEIPT)).toEqual({ hour: 12, minute: 41 });
  });

  it("reads a QR payment's success screen", () => {
    expect(parseCapture({ text: QR_SUCCESS }, TODAY)).toEqual({
      amount: 8.5,
      merchant: "99 SPEEDMART 1234 TAMAN CONTOH",
      date: "2026-10-03",
      isTransfer: false,
    });
    expect(timeFromText(QR_SUCCESS)).toEqual({ hour: 19, minute: 15 });
  });

  it("reads a transfer and flags it", () => {
    expect(parseCapture({ text: TRANSFER }, TODAY)).toEqual({
      amount: 50,
      merchant: "ALI BIN ABU",
      date: "2026-10-03",
      isTransfer: true,
    });
  });

  it("keeps a receipt whose amount is hidden (e.g. under a banner)", () => {
    const covered = TNG_RECEIPT.replace("-RM10.00\n", "");
    const c = parseCapture({ text: covered }, TODAY);
    expect(c.amount).toBeNull();
    expect(c.merchant).toBe("ASIAN FOOD AND DESSERT");
  });

  it("finds nothing on a screen that isn't a payment", () => {
    const home = "1:09\nMessages\nPhotos\nSettings";
    expect(parseCapture({ text: home }, TODAY)).toEqual({ amount: null, merchant: null, date: null, isTransfer: false });
    expect(referenceFromText(home)).toBeNull();
    expect(timeFromText(home)).toBeNull(); // the phone's clock isn't a payment time
  });

  it("prefers fields sent by Apple Pay or Siri over the text", () => {
    expect(parseCapture({ amount: "RM12.30", merchant: "  Test Cafe ", date: "2026-10-02" }, TODAY)).toEqual({
      amount: 12.3,
      merchant: "Test Cafe",
      date: "2026-10-02",
      isTransfer: false,
    });
  });
});

describe("amounts", () => {
  it.each([
    ["RM12.50", 12.5],
    ["MYR 1,234.5", 1234.5],
    ["12", 12],
    [12.345, 12.35],
    [0, null],
    [-5, null],
    ["free", null],
    [null, null],
  ])("parseAmount(%j) = %j", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it("takes the paid amount, not balances, cashback or rewards", () => {
    expect(amountFromText("Balance RM 120.00\nCashback RM 0.50\nTotal Amount\nRM 15.90")).toBe(15.9);
    expect(amountFromText("Wallet balance: RM 88.00\nRM 7.00")).toBe(7);
  });

  it("doesn't take the label 'Total Amount' for a payee", () => {
    expect(merchantFromText("Total Amount\nRM 15.90\nMerchant\nKEDAI CONTOH")).toBe("KEDAI CONTOH");
  });
});

describe("dates", () => {
  it.each([
    ["03/10/2026", "2026-10-03"],
    ["3-10-2026", "2026-10-03"],
    ["2026-10-01", "2026-10-01"],
    ["1 Oct 2026, 8:00 AM", "2026-10-01"],
    ["Oct 2, 2026", "2026-10-02"],
    ["04/10/2026", null], // tomorrow: not a payment date
    ["sometime", null],
  ])("parseDate(%j) = %j", (input, expected) => {
    expect(parseDate(input, TODAY)).toBe(expected);
  });

  it("reads 12 AM and 12 PM", () => {
    expect(timeFromText("3 Oct 2026, 12:05 AM")).toEqual({ hour: 0, minute: 5 });
    expect(timeFromText("3 Oct 2026, 12:05 PM")).toEqual({ hour: 12, minute: 5 });
  });
});

describe("duplicates and transfers", () => {
  it("gives the same reference for the same receipt, whatever the order", () => {
    const ref = referenceFromText(TNG_RECEIPT);
    expect(ref).toBe("20261003101100000012345678");
    expect(referenceFromText("A 20261003TNGDMYNB030OQR12345\nB 20261003101100000012345678")).toBe(
      referenceFromText("B 20261003101100000012345678\nA 20261003TNGDMYNB030OQR12345")
    );
  });

  it("spots transfer screens", () => {
    expect(looksLikeTransfer(TRANSFER)).toBe(true);
    expect(looksLikeTransfer("DuitNow Transfer\nRM 5.00")).toBe(true);
    expect(looksLikeTransfer(QR_SUCCESS)).toBe(false);
  });
});

describe("merchant rules", () => {
  it("remembers a shop by its first distinctive word", () => {
    expect(merchantKey("GRAB* A-1234 KL")).toBe("GRAB");
    expect(merchantKey("Tealive @ Sunway Pyramid")).toBe("TEALIVE");
    expect(merchantKey("The Kedai Restaurant Contoh Sdn Bhd")).toBe("CONTOH");
    expect(merchantKey("99 & 7")).toBeNull();
  });

  it("suggests the tag of the longest matching rule, on whole words", () => {
    const rules = [
      { pattern: "GRAB", tag_id: "ride" },
      { pattern: "GRAB FOOD", tag_id: "food" },
      { pattern: "TEA", tag_id: "drinks" },
    ];
    expect(suggestTagId("GRAB* A-1234", rules)).toBe("ride");
    expect(suggestTagId("Grab Food KL", rules)).toBe("food");
    expect(suggestTagId("TEALIVE", rules)).toBeNull(); // "TEA" isn't a whole word here
    expect(suggestTagId(null, rules)).toBeNull();
  });
});
