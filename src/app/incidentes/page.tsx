import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { IncidentesClient } from './client'

export default async function Page({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; impacto?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario }  = await supabase.from('usuarios').select('role').eq('id', user?.id || '').single()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const per  = 20
  const from = (page - 1) * per

  let q = supabase
    .from('incidentes')
    .select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })

  if (searchParams.search) q = q.ilike('titulo', `%${searchParams.search}%`)
  if (searchParams.status) q = q.eq('status', searchParams.status)
  if (searchParams.impacto) q = q.eq('impacto', searchParams.impacto)

  const [{ data, count }, { data: fornecedores }] = await Promise.all([
    q.order('created_at', { ascending: false }).range(from, from + per - 1),
    supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome'),
  ])

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Incidentes"
        crumbs={[{ label: 'Incidentes' }]}
      />
      <div className="flex-1 flex flex-col overflow-hidden animate-in">
        <IncidentesClient
          items={data || []}
          count={count || 0}
          page={page}
          perPage={per}
          fornecedores={fornecedores || []}
          role={usuario?.role || 'visualizacao'}
        />
      </div>
    </div>
  )
}
