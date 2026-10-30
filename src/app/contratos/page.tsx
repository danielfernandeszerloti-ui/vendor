import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ContratosClient } from './client'

export default async function Page({
  searchParams,
}: {
  searchParams: {
    search?: string; status?: string; pagamento?: string
    mes?: string; page?: string
  }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario }  = await supabase.from('usuarios').select('role').eq('id', user?.id || '').single()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const per  = 20
  const from = (page - 1) * per

  let q = supabase
    .from('contratos')
    .select('*, fornecedor:fornecedores(id,nome)', { count: 'exact' })

  if (searchParams.search) {
    q = q.or([
      `numero_contrato.ilike.%${searchParams.search}%`,
      `tipo_servico.ilike.%${searchParams.search}%`,
    ].join(','))
  }
  if (searchParams.status)    q = q.eq('status', searchParams.status)
  if (searchParams.pagamento) q = q.eq('status_pagamento', searchParams.pagamento)
  if (searchParams.mes)       q = q.eq('mes_competencia', parseInt(searchParams.mes))

  const [{ data, count }, { data: fornecedores }] = await Promise.all([
    q.order('data_vencimento').range(from, from + per - 1),
    supabase.from('fornecedores').select('id,nome').eq('status', 'ativo').order('nome'),
  ])

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Faturas e contratos"
        crumbs={[{ label: 'Faturas e contratos' }]}
      />
      <div className="flex-1 flex flex-col overflow-hidden animate-in">
        <ContratosClient
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
