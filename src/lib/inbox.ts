import { format } from "date-fns";
import { foodCategory, MEAL_ROLES, mealForHour, mealTag } from "./roles";
import type { Category, Tag } from "./types";

// What an Inbox item starts as. Pure, so the rules are testable: a remembered shop first, then
// (if it's not a transfer) Food and the meal for the time it was paid, marked as a guess.

export interface RuleLike {
  pattern: string;
  category_id: string | null;
  tag_id: string | null; // null: any tag (the meal by time for Food, otherwise you choose)
}

export interface InboxDefault {
  categoryId: string;
  tagId: string;
  // How it was chosen: a remembered shop ("rule"), a remembered Food shop with the meal by time
  // ("rule-meal"), the time-of-day guess for shops it doesn't know ("guess"), or nothing.
  from: "rule" | "rule-meal" | "guess" | "none";
  note: string | null; // e.g. "meal from the payment time (9:32 am, breakfast)"
}

export const clock = (hour: number, minute: number) =>
  format(new Date(2000, 0, 1, hour, minute), minute ? "h:mm a" : "h a").toLowerCase();

// The meal for a time, as a tag: the marked meal tag, else any tag in the Food category.
function mealFor(categories: Category[], tags: Tag[], when: { hour: number; minute: number }, timeOf: "payment" | "sending") {
  const meal = mealForHour(when.hour);
  const food = foodCategory(categories);
  const tag = mealTag(categories, tags, meal) ?? (food ? tags.find((t) => t.category_id === food.id) : undefined);
  const label = MEAL_ROLES.find((m) => m.role === meal)?.label.split(" (")[0];
  return { tag, note: `${timeOf} time (${clock(when.hour, when.minute)}, ${label})` };
}

export function inboxDefault(opts: {
  rule: RuleLike | null; // the shop's rule, if it has one
  storedTagId?: string | null; // what the endpoint suggested when it arrived (used without a rule)
  storedCategoryId?: string | null;
  isTransfer: boolean;
  when: { hour: number; minute: number };
  timeOf: "payment" | "sending"; // the receipt's time, or when it was sent if the receipt had none
  categories: Category[];
  tags: Tag[];
}): InboxDefault {
  const { categories, tags, when, timeOf } = opts;
  const rule = opts.rule ?? (opts.storedTagId || opts.storedCategoryId
    ? { pattern: "", tag_id: opts.storedTagId ?? null, category_id: opts.storedCategoryId ?? null }
    : null);

  if (rule) {
    const tag = rule.tag_id ? tags.find((t) => t.id === rule.tag_id) : undefined;
    const categoryId = tag?.category_id ?? rule.category_id ?? "";
    if (categoryId && categories.some((c) => c.id === categoryId)) {
      if (tag) return { categoryId, tagId: tag.id, from: "rule", note: null };
      if (foodCategory(categories)?.id === categoryId) {
        const meal = mealFor(categories, tags, when, timeOf);
        if (meal.tag?.category_id === categoryId)
          return { categoryId, tagId: meal.tag.id, from: "rule-meal", note: `meal from the ${meal.note}` };
      }
      return { categoryId, tagId: "", from: "rule", note: null };
    }
  }

  if (opts.isTransfer) return { categoryId: "", tagId: "", from: "none", note: null };
  const meal = mealFor(categories, tags, when, timeOf);
  if (!meal.tag) return { categoryId: "", tagId: "", from: "none", note: null };
  return { categoryId: meal.tag.category_id, tagId: meal.tag.id, from: "guess", note: `guessed from the ${meal.note}` };
}
