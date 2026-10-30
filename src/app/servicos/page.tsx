import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ServicosClient } from './client'

export default async function Page({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; ambiente?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario }  = await supabase.from('usuarios').select('role').eq('id', user?.id || '').single()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const per  = 20
  const from = (page - 1) * per

  let q = supabase
    .from('servicos')
    .select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })

  if (searchParams.search)   q = q.ilike('nome', `%${searchParams.search}%`)
  if (searchParams.status)   q = q.eq('status', searchParams.status)
  if (searchParams.ambiente) q = q.eq('ambiente', searchParams.ambiente)

  const [{ data, count }, { data: fornecedores }] = await Promise.all([
    q.order('nome').range(from, from + per - 1),
    supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome'),
  ])

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Serviços de TI"
        crumbs={[{ label: 'Serviços de TI' }]}
      />
      <div className="flex-1 flex flex-col overflow-hidden animate-in">
        <ServicosClient
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
