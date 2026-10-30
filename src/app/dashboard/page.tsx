import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { formatCurrency, getDaysUntilExpiry, isContractExpired } from '@/lib/utils'
import {
  Building2, FileText, AlertTriangle, DollarSign,
  TrendingUp, ArrowRight, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { GastoChart } from '@/components/modules/GastoChart'
import { DashboardFiltro } from '@/components/modules/DashboardFiltro'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string }
}) {
  const supabase = createClient()

  const hoje = new Date()
  const mes  = searchParams.mes ? parseInt(searchParams.mes) : hoje.getMonth() + 1
  const ano  = searchParams.ano ? parseInt(searchParams.ano) : hoje.getFullYear()

  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultimoDia  = new Date(ano, mes, 0).getDate()
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

  const [
    { count: totalFornecedores },
    { count: fornecedoresAtivos },
    { count: boletosAbertos },
    { count: boletosVencidos },
    { count: incidentesAbertos },
    { data: contratosVencendo },
    { data: incidentesRecentes },
    { data: contratosGastosRaw },
    { data: servicosStatus },
  ] = await Promise.all([
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }),
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('contratos').select('*', { count: 'exact', head: true })
      .eq('status', 'ativo').eq('status_pagamento', 'pendente')
      .gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim),
    supabase.from('contratos').select('*', { count: 'exact', head: true })
      .eq('status', 'ativo').eq('status_pagamento', 'vencido'),
    supabase.from('incidentes').select('*', { count: 'exact', head: true })
      .in('status', ['aberto', 'em_andamento']),
    supabase.from('contratos')
      .select('id,numero_contrato,data_vencimento,criticidade,fornecedor:fornecedores(nome),valor_mensal')
      .eq('status', 'ativo').neq('status_pagamento', 'pago')
      .gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim)
      .order('data_vencimento').limit(6),
    supabase.from('incidentes')
      .select('id,titulo,status,impacto,created_at,fornecedor:fornecedores(nome)')
      .in('status', ['aberto', 'em_andamento'])
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('contratos')
      .select('valor_mensal,fornecedor:fornecedores(nome)')
      .eq('status', 'ativo')
      .gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim)
      .not('valor_mensal', 'is', null),
    supabase.from('servicos')
      .select('status')
      .order('created_at', { ascending: false }),
  ])

  const contratosGastos = (contratosGastosRaw || []) as any[]
  const gastoTotal = contratosGastos.reduce((s: number, c: any) => s + (c.valor_mensal || 0), 0)

  const svcs = servicosStatus || []
  const svcsOperacionais = svcs.filter((s: any) => s.status === 'operacional').length
  const svcsTotal = svcs.length

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const isAtual = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()

  const impactoColor: Record<string, string> = {
    baixo: 'badge-green', medio: 'badge-yellow', alto: 'badge-orange', critico: 'badge-red'
  }
  const statusColor: Record<string, string> = {
    aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray'
  }
  const statusLabel: Record<string, string> = {
    aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado'
  }
  const impactoLabel: Record<string, string> = {
    baixo: 'Baixo', medio: 'Médio', alto: 'Alto', critico: 'Crítico'
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Visão geral"
        crumbs={[{ label: 'Visão geral' }]}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-6 max-w-[1400px] mx-auto animate-in">

          {/* Período + filtro */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {MESES[mes - 1]} {ano}
                {isAtual && (
                  <span className="ml-2 badge-cyan">mês atual</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Indicadores do período selecionado
              </p>
            </div>
            <DashboardFiltro mesAtual={mes} anoAtual={ano} />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Fornecedores */}
            <Link href="/fornecedores" className="stat-card group hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div className="stat-icon" style={{ background: 'rgba(26,31,110,0.08)' }}>
                  <Building2 className="w-4 h-4" style={{ color: '#1a1f6e' }} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p className="stat-value">{(fornecedoresAtivos ?? 0).toLocaleString('pt-BR')}</p>
                <p className="stat-label">Fornecedores ativos</p>
                <p className="stat-sub">de {(totalFornecedores ?? 0).toLocaleString('pt-BR')} cadastrados</p>
              </div>
            </Link>

            {/* Boletos pendentes */}
            <Link
              href={`/contratos?pagamento=pendente&mes=${mes}`}
              className="stat-card group hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="stat-icon" style={{ background: (boletosAbertos ?? 0) > 0 ? 'rgba(217,119,6,0.10)' : 'rgba(5,150,105,0.08)' }}>
                  <FileText className="w-4 h-4" style={{ color: (boletosAbertos ?? 0) > 0 ? '#d97706' : '#059669' }} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p className="stat-value">{(boletosAbertos ?? 0).toLocaleString('pt-BR')}</p>
                <p className="stat-label">Faturas pendentes</p>
                <p className="stat-sub">
                  {(boletosVencidos ?? 0) > 0
                    ? <span style={{ color: 'var(--danger)' }}>{boletosVencidos} vencidas</span>
                    : 'no período'
                  }
                </p>
              </div>
            </Link>

            {/* Incidentes */}
            <Link
              href="/incidentes?status=aberto"
              className="stat-card group hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="stat-icon" style={{ background: (incidentesAbertos ?? 0) > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: (incidentesAbertos ?? 0) > 0 ? '#dc2626' : '#059669' }} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p className="stat-value">{(incidentesAbertos ?? 0).toLocaleString('pt-BR')}</p>
                <p className="stat-label">Incidentes abertos</p>
                <p className="stat-sub" style={{ color: (incidentesAbertos ?? 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {(incidentesAbertos ?? 0) > 0 ? 'requer atenção' : 'nenhum em aberto'}
                </p>
              </div>
            </Link>

            {/* Gasto */}
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div className="stat-icon" style={{ background: 'rgba(0,200,180,0.10)' }}>
                  <DollarSign className="w-4 h-4" style={{ color: '#00a898' }} />
                </div>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p className="stat-value tabular text-lg">{formatCurrency(gastoTotal)}</p>
                <p className="stat-label">Gasto no período</p>
                <p className="stat-sub">{contratosGastos.length} faturas computadas</p>
              </div>
            </div>
          </div>

          {/* Serviços de TI resumo */}
          {svcsTotal > 0 && (
            <div className="card px-5 py-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{
                  background: svcsOperacionais === svcsTotal ? '#059669' : svcsOperacionais === 0 ? '#dc2626' : '#d97706'
                }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Status dos Serviços
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {svcsOperacionais} operacional{svcsOperacionais !== 1 ? 'is' : ''}
                </span>
                {svcsTotal - svcsOperacionais > 0 && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <XCircle className="w-4 h-4 text-red-500" />
                    {svcsTotal - svcsOperacionais} com problema{svcsTotal - svcsOperacionais !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link href="/servicos" className="ml-auto text-xs font-medium hover:underline"
                style={{ color: '#1a1f6e' }}>
                Ver serviços →
              </Link>
            </div>
          )}

          {/* Gráfico + Boletos vencendo */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <GastoChart data={contratosGastos} />
            </div>

            {/* Boletos vencendo */}
            <div className="card flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#d97706' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Faturas pendentes
                  </h3>
                </div>
                <span className="text-xs badge-gray">{(contratosVencendo || []).length}</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {(contratosVencendo || []).length === 0 ? (
                  <div className="empty-state py-12">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="empty-title text-sm">Em dia</p>
                    <p className="empty-desc text-xs">Nenhuma fatura pendente no período</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {(contratosVencendo || []).map((c: any) => {
                      const dias  = getDaysUntilExpiry(c.data_vencimento)
                      const exp   = isContractExpired(c.data_vencimento)
                      return (
                        <Link key={c.id} href="/contratos"
                          className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-subtle)] transition-colors">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {c.fornecedor?.nome}
                            </p>
                            {c.valor_mensal && (
                              <p className="text-xs tabular mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {formatCurrency(c.valor_mensal)}
                              </p>
                            )}
                          </div>
                          <span className={cn('flex-shrink-0', exp ? 'badge-red' : dias <= 7 ? 'badge-red' : dias <= 15 ? 'badge-yellow' : 'badge-blue')}>
                            {exp ? 'Vencido' : `${dias}d`}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-[var(--border)]">
                <Link href="/contratos?pagamento=pendente"
                  className="text-xs font-medium hover:underline flex items-center gap-1"
                  style={{ color: '#1a1f6e' }}>
                  Ver todas as faturas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Incidentes recentes */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Incidentes em aberto
                </h3>
              </div>
              <Link href="/incidentes" className="btn-secondary btn-sm">Ver todos</Link>
            </div>

            {(incidentesRecentes || []).length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="empty-title">Nenhum incidente aberto</p>
                <p className="empty-desc">O ambiente está estável</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="th">Título</th>
                      <th className="th">Fornecedor</th>
                      <th className="th">Impacto</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(incidentesRecentes || []).map((i: any) => (
                      <tr key={i.id} className="tr group/row">
                        <td className="td">
                          <Link href={`/incidentes/${i.id}`}
                            className="font-medium hover:underline"
                            style={{ color: 'var(--text-primary)' }}>
                            {i.titulo}
                          </Link>
                        </td>
                        <td className="td" style={{ color: 'var(--text-muted)' }}>
                          {i.fornecedor?.nome || '—'}
                        </td>
                        <td className="td">
                          <span className={impactoColor[i.impacto]}>
                            {impactoLabel[i.impacto]}
                          </span>
                        </td>
                        <td className="td">
                          <span className={statusColor[i.status]}>
                            {statusLabel[i.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
