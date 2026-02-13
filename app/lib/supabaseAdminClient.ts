// app/lib/supabaseAdminClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This client stores its session in a DIFFERENT key
// so it doesn't conflict with the main user login.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'sb-admin-auth-token', 
    persistSession: true,
    detectSessionInUrl: false
  }
})