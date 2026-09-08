import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

//  ฟังก์ชันสำหรับดึงข้อมูล Profile ของ User ปัจจุบัน
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

//  ฟังก์ชันอัปเดต Profile
export async function updateUserProfile(updates: {
  full_name?: string
  department?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 🆕 ฟังก์ชันตรวจสอบว่าเป็น Admin หรือไม่
export async function isAdmin() {
  const profile = await getUserProfile()
  return profile?.role === 'admin'
}