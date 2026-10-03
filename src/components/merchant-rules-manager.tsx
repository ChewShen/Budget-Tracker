"use client";

import { useState } from "react";
import { Plus, Store, Trash2 } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { categoryLabel } from "@/lib/categories";
import { useMerchantRules, type MerchantRule } from "@/lib/automation";
import { normalizeMerchant } from "@/lib/ingest";
import { foodCategory } from "@/lib/roles";

// Settings → Automation → Shops it remembers: the merchant rules the Inbox uses. A rule is a
// category, optionally with a tag; Food on its own keeps the meal following the payment time.

function CategoryTagPicker({
  categoryId,
  tagId,
  onChange,
  categoryOnly,
  idPrefix,
}: {
  categoryId: string;
  tagId: string | null;
  onChange: (categoryId: string, tagId: string | null) => void;
  categoryOnly: boolean; // a blank tag is allowed (after the 2026-10-04 migration)
  idPrefix: string;
}) {
  const { categories, tags } = useBudget();
  const isFood = Boolean(categoryId) && foodCategory(categories)?.id === categoryId;
  const categoryTags = tags.filter((t) => t.category_id === categoryId);
  return (
    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
      <select
        value={categoryId}
        onChange={(e) =>
          onChange(e.target.value, categoryOnly ? null : (tags.find((t) => t.category_id === e.target.value)?.id ?? null))
        }
        className="field py-1.5 text-sm"
        aria-label={`${idPrefix} category`}
      >
        <option value="" disabled>
          Category
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {categoryLabel(c.name)}
          </option>
        ))}
      </select>
      <select
        value={tagId ?? ""}
        onChange={(e) => onChange(categoryId, e.target.value || null)}
        disabled={!categoryId}
        className="field py-1.5 text-sm"
        aria-label={`${idPrefix} tag`}
      >
        {categoryOnly ? (
          <option value="">{isFood ? "Meal by time" : "Any tag"}</option>
        ) : (
          <option value="" disabled>
            Tag
          </option>
        )}
        {categoryTags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function RuleRow({ rule, onSave, onRemove, categoryOnly }: {
  rule: MerchantRule;
  onSave: (categoryId: string, tagId: string | null) => void;
  onRemove: () => void;
  categoryOnly: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:w-40 sm:shrink-0">
        <span className="truncate font-mono text-[13px] font-semibold" title={rule.pattern}>
          {rule.pattern}
        </span>
        <button
          onClick={onRemove}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-danger/10 hover:text-danger sm:hidden"
          aria-label={`Forget ${rule.pattern}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <CategoryTagPicker
        categoryId={rule.category_id ?? ""}
        tagId={rule.tag_id}
        onChange={onSave}
        categoryOnly={categoryOnly}
        idPrefix={rule.pattern}
      />
      <button
        onClick={onRemove}
        className="hidden shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-danger/10 hover:text-danger sm:block"
        aria-label={`Forget ${rule.pattern}`}
        title="Forget this shop"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function MerchantRulesManager() {
  const { tags, categories, showToast } = useBudget();
  const { rules, isLoaded, error, needsMigration, save, remove } = useMerchantRules(true, tags);
  const [shop, setShop] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const categoryOnly = !needsMigration;
  const key = normalizeMerchant(shop);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !categoryId) return;
    if (await save(key, categoryId, tagId)) {
      showToast({ tone: "default", message: `Remembered “${key}”` });
      setShop("");
      setCategoryId("");
      setTagId(null);
    }
  };

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Shops it remembers</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        New Inbox items from these shops start with this category and tag. A Food shop with{" "}
        <strong className="text-foreground">Meal by time</strong> gets Breakfast, Lunch or Dinner from when you paid.
        A shop matches when its name contains these words.
      </p>
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      {needsMigration && !error && (
        <p className="mt-3 text-xs text-muted-foreground">
          To remember a category without a tag (e.g. Food, meal by time), run{" "}
          <code className="font-mono">scripts/migrations/2026-10-04_merchant_rule_categories.sql</code> in Supabase.
        </p>
      )}

      {!isLoaded ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-secondary/60" />
      ) : rules.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4 shrink-0" />
          None yet. Tick <strong className="font-medium text-foreground">Remember</strong> when adding an Inbox item, or
          add a shop below.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border/70">
          {rules.map((r) => (
            <RuleRow
              key={r.id}
              rule={r}
              categoryOnly={categoryOnly}
              onSave={(c, t) => save(r.pattern, c, t)}
              onRemove={async () => {
                await remove(r.id);
                showToast({ tone: "default", message: `Forgot “${r.pattern}”` });
              }}
            />
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 flex flex-col gap-2 rounded-xl border bg-background/40 p-3 sm:flex-row sm:items-center">
        <input
          value={shop}
          maxLength={60}
          onChange={(e) => setShop(e.target.value)}
          placeholder="Shop name, e.g. Tealive"
          className="field py-1.5 text-sm sm:w-40 sm:shrink-0"
          aria-label="Shop name"
        />
        <CategoryTagPicker
          categoryId={categoryId}
          tagId={tagId}
          onChange={(c, t) => {
            setCategoryId(c);
            setTagId(t);
          }}
          categoryOnly={categoryOnly}
          idPrefix="New shop"
        />
        <button
          type="submit"
          disabled={!key || !categoryId || (!categoryOnly && !tagId)}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      {categories.length > 0 && key && rules.some((r) => r.pattern === key) && (
        <p className="mt-2 text-xs text-muted-foreground">“{key}” is already remembered; adding it again replaces it.</p>
      )}
    </section>
  );
}
