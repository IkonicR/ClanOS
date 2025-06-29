import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: ReturnType<typeof createSupabaseClient>;

export const createClient = () => {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or service role key is missing from environment variables.');
  }
  
  console.log(
    'Supabase admin client initializing...',
    {
      url: supabaseUrl,
      key_present: !!supabaseServiceRoleKey,
      key_length: supabaseServiceRoleKey?.length
    }
  );

  supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdmin;
}; 