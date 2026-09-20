"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Tag, Layers, Check, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  tags: { id: string; category_id: string; name: string }[];
  onSave: (transaction: {
    amount: number;
    date: string;
    category_id: string;
    tag_id: string;
    description?: string;
    is_one_off: boolean;
  }) => Promise<void>;
}

export function QuickAddModal({
  isOpen,
  onClose,
  categories,
  tags,
  onSave,
}: QuickAddModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [description, setDescription] = useState("");
  const [isOneOff, setIsOneOff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with Food as default category if available
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const food = categories.find((c) => c.name.toLowerCase() === "food") || categories[0];
      setSelectedCategoryId(food.id);
    }
  }, [categories, selectedCategoryId]);

  // Filter tags by selected category
  const availableTags = tags.filter((t) => t.category_id === selectedCategoryId);

  // Default to first tag of category if tag not set or belongs to another category
  useEffect(() => {
    if (availableTags.length > 0) {
      const currentTagValid = availableTags.some((t) => t.id === selectedTagId);
      if (!currentTagValid) {
        setSelectedTagId(availableTags[0].id);
      }
    } else {
      setSelectedTagId("");
    }
  }, [selectedCategoryId, availableTags, selectedTagId]);

  if (!isOpen) return null;

  const handleNumpad = (digit: string) => {
    if (digit === "." && amountStr.includes(".")) return;
    if (amountStr.includes(".") && amountStr.split(".")[1].length >= 2) return;
    setAmountStr((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) return;
    if (!selectedCategoryId || !selectedTagId) return;

    try {
      setIsSubmitting(true);
      await onSave({
        amount,
        date: selectedDate,
        category_id: selectedCategoryId,
        tag_id: selectedTagId,
        description: description.trim() || undefined,
        is_one_off: isOneOff,
      });
      // Reset & close
      setAmountStr("");
      setDescription("");
      setIsOneOff(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border bg-card p-5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs">
              RM
            </span>
            <h2 className="font-bold text-lg text-foreground">Quick Add Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount Display */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (MYR)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-muted-foreground">RM</span>
              <input
                type="text"
                readOnly
                value={amountStr || "0.00"}
                className="w-48 bg-transparent text-center text-4xl font-black tracking-tight text-foreground outline-none"
              />
            </div>
          </div>

          {/* Quick Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "DEL"].map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => (key === "DEL" ? handleBackspace() : handleNumpad(key))}
                  className="flex h-11 items-center justify-center rounded-lg border bg-background font-bold text-lg text-foreground shadow-xs transition hover:bg-muted active:scale-95"
                >
                  {key}
                </button>
              )
            )}
          </div>

          {/* Category Chips */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
              <Layers className="h-3.5 w-3.5" />
              Category
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Chips (Cascading based on Category) */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tag / Sub-category
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    selectedTagId === tag.id
                      ? "bg-secondary text-foreground border border-primary font-bold shadow-xs"
                      : "border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date & One-Off Flag Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" /> Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border bg-background p-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={isOneOff}
                  onChange={(e) => setIsOneOff(e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <span>One-off expense?</span>
              </label>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <input
              type="text"
              placeholder="Description / note (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!parseFloat(amountStr) || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-sm text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 active:scale-98"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Save Expense</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
