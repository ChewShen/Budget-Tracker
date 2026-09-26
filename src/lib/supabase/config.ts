export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// False when .env.local still has the placeholder values. The app then runs in
// local-only mode (mock data + localStorage) with no login.
export const isSupabaseConfigured =
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) && !SUPABASE_URL.includes("your-project-id");
