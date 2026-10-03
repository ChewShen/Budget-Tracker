-- ========================================================
-- Merchant rules can remember a category on its own: "TEALIVE → Food" (the meal still follows
-- the payment time) as well as "GRAB → Transport · Grab". Rules are managed in
-- Settings → Automation → Shops it remembers.
-- Run once in the Supabase SQL Editor, after 2026-10-03_inbox.sql. Safe to re-run.
-- ========================================================

-- 1. Every rule has a category; the tag becomes optional. Existing rules get their tag's category.
ALTER TABLE public.merchant_rules
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories ON DELETE CASCADE;

UPDATE public.merchant_rules r SET category_id = t.category_id
FROM public.tags t
WHERE t.id = r.tag_id AND r.category_id IS NULL;

ALTER TABLE public.merchant_rules ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE public.merchant_rules ALTER COLUMN tag_id DROP NOT NULL;

-- 2. Owner only, and the category and tag must be yours, with the tag in that category.
DROP POLICY IF EXISTS "Owner manages merchant rules" ON public.merchant_rules;

CREATE POLICY "Owner manages merchant rules" ON public.merchant_rules
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid())
    AND (tag_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid() AND t.category_id = merchant_rules.category_id
    ))
  );

-- Check: your rules (a blank tag means "any tag": the meal by time for Food, otherwise you choose).
SELECT r.pattern, c.name AS category, t.name AS tag
FROM public.merchant_rules r
JOIN public.categories c ON c.id = r.category_id
LEFT JOIN public.tags t ON t.id = r.tag_id
ORDER BY r.pattern;
