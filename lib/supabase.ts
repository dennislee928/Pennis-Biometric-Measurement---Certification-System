import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') return createClient(supabaseUrl, supabaseAnonKey);
  if (!client) client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
