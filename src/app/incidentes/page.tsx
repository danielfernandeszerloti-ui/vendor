import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { IncidentesClient } from './client'


export default async function Page({ searchParams }: { searchParams: { search?: string; status?: string; page?: string } }) {
  const supabase = createClient()
  const page = Number(searchParams.page) || 1
  const per = 20
  const from = (page - 1) * per

  let q = supabase.from('incidentes').select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })
  if (searchParams.search) q = q.ilike('titulo', `%${searchParams.search}%`)
  if (searchParams.status) q = q.eq('status', searchParams.status)

  const { data, count } = await q.order('created_at', { ascending: false }).range(from, from + per - 1)
  const { data: fornecedores } = await supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome')

  return (
    <div>
      <Navbar title="Incidentes" subtitle="Registro e acompanhamento de incidentes" />
      <div className="p-6 animate-in">
        <IncidentesClient items={data || []} count={count || 0} page={page} perPage={per} fornecedores={fornecedores || []} />
      </div>
    </div>
  )
}
