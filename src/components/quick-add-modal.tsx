"use client";

import { useState, useEffect } from "react";
import { X, Delete } from "lucide-react";
import { categoryIcon, categoryLabel } from "@/lib/categories";
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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

  const amountDisplay = amountStr || "0";

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add expense"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:rounded-3xl sm:pb-5"
      >
        {/* Grabber (mobile) */}
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" />

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Add expense</h2>
          <button
            onClick={onClose}
            className="-mr-1.5 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5 pb-5">
          {/* Amount */}
          <div className="py-3 text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-xl font-medium text-muted-foreground">RM</span>
              <span
                className={`text-5xl font-semibold tracking-tight tabular-nums ${
                  amountStr ? "text-foreground" : "text-muted-foreground/50"
                }`}
                aria-live="polite"
              >
                {amountDisplay}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none">
            {categories.map((cat) => {
              const Icon = categoryIcon(cat.name);
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {categoryLabel(cat.name)}
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <div className="flex max-h-[4.75rem] flex-wrap gap-1.5 overflow-y-auto">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTagId(tag.id)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  selectedTagId === tag.id
                    ? "border-foreground/80 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {/* Note, date, one-off */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Add a note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="field"
                aria-label="Date"
              />
              <button
                type="button"
                onClick={() => setIsOneOff((v) => !v)}
                aria-pressed={isOneOff}
                className={`flex items-center justify-between rounded-xl border px-3.5 text-sm transition ${
                  isOneOff ? "border-foreground/80 text-foreground" : "border-input text-muted-foreground"
                }`}
              >
                One-off
                <span
                  className={`relative h-5 w-9 rounded-full transition ${
                    isOneOff ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
                      isOneOff ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "DEL"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => (key === "DEL" ? handleBackspace() : handleNumpad(key))}
                className="flex h-12 items-center justify-center rounded-xl text-xl font-medium transition hover:bg-secondary active:scale-95 active:bg-secondary"
                aria-label={key === "DEL" ? "Delete digit" : key}
              >
                {key === "DEL" ? <Delete className="h-5 w-5" /> : key}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!parseFloat(amountStr) || isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] disabled:opacity-40"
          >
            {isSubmitting ? "Saving…" : "Save expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
