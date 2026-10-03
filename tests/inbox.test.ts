import { describe, expect, it } from "vitest";
import { inboxDefault } from "@/lib/inbox";
import type { Category, Tag } from "@/lib/types";

// What an Inbox item starts as: a remembered shop first, then the time-of-day guess.

const categories: Category[] = [
  { id: "food", name: "Food", role: "food" },
  { id: "transport", name: "Transport" },
  { id: "shopping", name: "Shopping" },
];
const tags: Tag[] = [
  { id: "breakfast", category_id: "food", name: "Breakfast", role: "breakfast" },
  { id: "lunch", category_id: "food", name: "Lunch", role: "lunch" },
  { id: "dinner", category_id: "food", name: "Dinner", role: "dinner" },
  { id: "coffee", category_id: "food", name: "Coffee" },
  { id: "grab", category_id: "transport", name: "Grab" },
  { id: "clothes", category_id: "shopping", name: "Clothes" },
];
const at = (hour: number, minute = 0) => ({ hour, minute });
const base = { isTransfer: false, when: at(13, 5), timeOf: "payment" as const, categories, tags };

describe("an Inbox item's category and tag", () => {
  it("uses a remembered shop's tag", () => {
    expect(inboxDefault({ ...base, rule: { pattern: "TEALIVE", category_id: "food", tag_id: "coffee" } })).toEqual({
      categoryId: "food",
      tagId: "coffee",
      from: "rule",
      note: null,
    });
  });

  it("gives a shop remembered as Food the meal for when you paid", () => {
    const rule = { pattern: "MAMAK", category_id: "food", tag_id: null };
    expect(inboxDefault({ ...base, rule })).toMatchObject({ tagId: "lunch", from: "rule-meal", note: "meal from the payment time (1:05 pm, lunch)" });
    expect(inboxDefault({ ...base, rule, when: at(8, 30) }).tagId).toBe("breakfast");
    expect(inboxDefault({ ...base, rule, when: at(20) })).toMatchObject({ tagId: "dinner", note: "meal from the payment time (8 pm, dinner)" });
  });

  it("files a shop remembered as another category alone there, leaving the tag to you", () => {
    expect(inboxDefault({ ...base, rule: { pattern: "UNIQLO", category_id: "shopping", tag_id: null } })).toEqual({
      categoryId: "shopping",
      tagId: "",
      from: "rule",
      note: null,
    });
  });

  it("still applies a remembered shop to transfers", () => {
    const rule = { pattern: "ALI", category_id: "transport", tag_id: "grab" };
    expect(inboxDefault({ ...base, isTransfer: true, rule }).tagId).toBe("grab");
  });

  it("guesses Food and the meal for shops it doesn't know, but not for transfers", () => {
    expect(inboxDefault({ ...base, rule: null })).toMatchObject({ tagId: "lunch", from: "guess", note: "guessed from the payment time (1:05 pm, lunch)" });
    expect(inboxDefault({ ...base, rule: null, timeOf: "sending" }).note).toBe("guessed from the sending time (1:05 pm, lunch)");
    expect(inboxDefault({ ...base, rule: null, isTransfer: true })).toEqual({ categoryId: "", tagId: "", from: "none", note: null });
  });

  it("uses what the endpoint suggested when no rule matches now", () => {
    expect(inboxDefault({ ...base, rule: null, storedTagId: "grab", storedCategoryId: "transport" })).toMatchObject({
      categoryId: "transport",
      tagId: "grab",
      from: "rule",
    });
  });

  it("ignores a rule whose category or tag no longer exists", () => {
    expect(inboxDefault({ ...base, rule: { pattern: "X", category_id: "gone", tag_id: null } }).from).toBe("guess");
  });
});
