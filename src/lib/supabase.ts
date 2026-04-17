import { createClient } from '@supabase/supabase-js'

// Grabs your keys from the .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// The "export" keyword is what lets you import this in other files
export const supabase = createClient(supabaseUrl, supabaseAnonKey)