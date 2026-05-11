import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qmpnkvtirfjjztsbsrnb.supabase.co'
const supabaseAnonKey = 'sb_publishable_mIrlB2d1tVvJiLCU7j7x2A_yCrzcClH'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles:', JSON.stringify(data, null, 2))
  }
}

checkProfiles()
