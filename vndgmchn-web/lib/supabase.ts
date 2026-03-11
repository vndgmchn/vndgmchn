import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('[supabase] SUPABASE_URL present:', !!supabaseUrl);
console.log('[supabase] SUPABASE_ANON_KEY present:', !!supabaseAnonKey);

if (!supabaseUrl) {
    throw new Error('Missing environment variable: SUPABASE_URL');
}
if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
