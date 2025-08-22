import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || me.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}


