import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ServicosClient } from './client'

export default async function Page({ searchParams }: { searchParams: { search?: string; status?: string; page?: string } }) {
  const supabase = createClient()
  const page = Number(searchParams.page) || 1
  const per = 20
  const from = (page - 1) * per

  let q = supabase.from('servicos').select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })
  if (searchParams.search) q = q.ilike('nome', `%${searchParams.search}%`)
  if (searchParams.status) q = q.eq('status', searchParams.status)

  const { data, count } = await q.order('nome').range(from, from + per - 1)
  const { data: fornecedores } = await supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome')

  return (
    <div>
      <Navbar title="Serviços" subtitle="Gestão de serviços contratados" />
      <div className="p-6 animate-in">
        <ServicosClient items={data || []} count={count || 0} page={page} perPage={per} fornecedores={fornecedores || []} />
      </div>
    </div>
  )
}
