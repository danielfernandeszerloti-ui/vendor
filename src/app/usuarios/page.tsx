import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { redirect } from 'next/navigation'
import { UsuariosClient } from './client'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase.from('usuarios').select('role').eq('id', user.id).single()
  if (me?.role !== 'administrador') redirect('/dashboard')

  const { data: usuarios } = await supabase.from('usuarios').select('*').order('nome')

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Usuários"
        crumbs={[{ label: 'Admin', href: '/dashboard' }, { label: 'Usuários' }]}
      />
      <div className="flex-1 flex flex-col overflow-hidden animate-in">
        <UsuariosClient usuarios={usuarios || []} currentUserId={user.id} />
      </div>
    </div>
  )
}
