import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ContratosClient } from './client'

export default async function Page({ searchParams }: { searchParams: { search?: string; status?: string; page?: string } }) {
  const supabase = createClient()
  const page = Number(searchParams.page) || 1
  const per = 20
  const from = (page - 1) * per

  let q = supabase.from('contratos').select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })
  if (searchParams.search) q = q.or(`numero_contrato.ilike.%${searchParams.search}%,responsavel_interno.ilike.%${searchParams.search}%`)
  if (searchParams.status) q = q.eq('status', searchParams.status)

  const { data, count } = await q.order('data_vencimento').range(from, from + per - 1)
  const { data: fornecedores } = await supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome')

  return (
    <div>
      <Navbar title="Contratos" subtitle="Controle de contratos e vencimentos" />
      <div className="p-6 animate-in">
        <ContratosClient items={data || []} count={count || 0} page={page} perPage={per} fornecedores={fornecedores || []} />
      </div>
    </div>
  )
}
