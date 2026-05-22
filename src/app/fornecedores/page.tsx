import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { FornecedoresClient } from './client'

export default async function Page({ searchParams }: { searchParams: { search?: string; categoria?: string; status?: string; page?: string } }) {
  const supabase = createClient()
  const page = Number(searchParams.page) || 1
  const per = 20
  const from = (page - 1) * per

  let q = supabase.from('fornecedores').select('*', { count: 'exact' })
  if (searchParams.search) q = q.or(`nome.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,cnpj.ilike.%${searchParams.search}%`)
  if (searchParams.categoria) q = q.eq('categoria', searchParams.categoria)
  if (searchParams.status) q = q.eq('status', searchParams.status)

  const { data, count } = await q.order('nome').range(from, from + per - 1)

  return (
    <div>
      <Navbar title="Fornecedores" subtitle="Cadastro e gestão de fornecedores" />
      <div className="p-6 animate-in">
        <FornecedoresClient items={data || []} count={count || 0} page={page} perPage={per} />
      </div>
    </div>
  )
}
