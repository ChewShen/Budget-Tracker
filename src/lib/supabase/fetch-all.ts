import type { SupabaseClient } from "@supabase/supabase-js";

// Every expense, in pages: Supabase returns at most 1,000 rows per request (the project's
// "max rows"), so a single request would silently drop the oldest. Keeps reading until a page
// comes back empty, which works whatever that limit is set to. Ordered by date then id so no
// row is skipped or repeated between pages.
export async function fetchAllTransactions(supabase: Pick<SupabaseClient, "from">, pageSize = 1000) {
  const rows: any[] = [];
  for (;;) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, categories(name), tags(name)")
      .order("date", { ascending: false })
      .order("id")
      .range(rows.length, rows.length + pageSize - 1);
    if (error) return { data: null, error };
    if (!data?.length) return { data: rows, error: null };
    rows.push(...data);
  }
}
