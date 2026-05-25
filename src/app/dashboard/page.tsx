import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { formatCurrency, getDaysUntilExpiry, isContractExpired } from '@/lib/utils'
import { Building2, FileText, AlertTriangle, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import { GastoChart } from '@/components/modules/GastoChart'

export default async function DashboardPage() {
  const supabase = createClient()

  const [
    { count: totalFornecedores },
    { count: fornecedoresAtivos },
    { count: totalContratos },
    { count: incidentesAbertos },
    { count: servicosCriticos },
    { data: contratosVencendo },
    { data: incidentesRecentes },
    { data: contratosGastosRaw },
  ] = await Promise.all([
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }),
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('contratos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('incidentes').select('*', { count: 'exact', head: true }).in('status', ['aberto', 'em_andamento']),
    supabase.from('servicos').select('*', { count: 'exact', head: true }).eq('criticidade', 'critica').eq('status', 'operacional'),
    supabase.from('contratos').select('id,numero_contrato,data_vencimento,criticidade,fornecedor:fornecedores(nome)').eq('status', 'ativo').order('data_vencimento').limit(5),
    supabase.from('incidentes').select('id,titulo,status,impacto,created_at,fornecedor:fornecedores(nome)').in('status', ['aberto', 'em_andamento']).order('created_at', { ascending: false }).limit(5),
    supabase.from('contratos').select('valor_mensal,fornecedor:fornecedores(nome)').eq('status', 'ativo').not('valor_mensal', 'is', null),
  ])

  const contratosGastos = (contratosGastosRaw || []) as any[]
  const gastoTotal = contratosGastos.reduce((s: number, c: any) => s + (c.valor_mensal || 0), 0)

  const impactoColor: Record<string, string> = { baixo: 'badge-green', medio: 'badge-yellow', alto: 'badge-orange', critico: 'badge-red' }
  const statusColor: Record<string, string> = { aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray' }
  const statusLabel: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', fechado: 'Fechado' }
  const impactoLabel: Record<string, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto', critico: 'Crítico' }

  return (
    <div>
      <Navbar title="Dashboard" subtitle="Visão geral do ambiente TI" />
      <div className="p-6 space-y-6 animate-in">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Fornecedores Ativos', value: fornecedoresAtivos ?? 0, sub: `de ${totalFornecedores ?? 0} cadastrados`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Boletos Pendentes', value: totalContratos ?? 0, sub: 'aguardando pagamento', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Incidentes Abertos', value: incidentesAbertos ?? 0, sub: 'aguardando resolução', icon: AlertTriangle, color: (incidentesAbertos ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600', bg: (incidentesAbertos ?? 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Gasto Mensal', value: formatCurrency(gastoTotal), sub: 'em contratos ativos', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', isText: true },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.isText ? s.value : Number(s.value).toLocaleString('pt-BR')}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <GastoChart data={contratosGastos} />
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Boletos Vencendo</h3>
            </div>
            {(contratosVencendo || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhum boleto vencendo</p>
            ) : (
              <div className="space-y-2">
                {(contratosVencendo || []).map((c: any) => {
                  const dias = getDaysUntilExpiry(c.data_vencimento)
                  const exp = isContractExpired(c.data_vencimento)
                  return (
                    <Link key={c.id} href={`/contratos`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.fornecedor?.nome}</p>
                        <p className="text-xs text-gray-500">{c.numero_contrato || 'Sem número'}</p>
                      </div>
                      <span className={exp ? 'badge-red ml-2 flex-shrink-0' : dias <= 30 ? 'badge-yellow ml-2 flex-shrink-0' : 'badge-blue ml-2 flex-shrink-0'}>
                        {exp ? 'Vencido' : `${dias}d`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
            <Link href="/contratos" className="mt-4 text-xs hover:underline block text-center" style={{ color: '#1a1f6e' }}>Ver todos →</Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Incidentes Recentes</h3>
            </div>
            <Link href="/incidentes" className="btn-secondary text-xs py-1.5">Ver todos</Link>
          </div>
          {(incidentesRecentes || []).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Nenhum incidente aberto</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="table-header">Incidente</th>
                    <th className="table-header">Fornecedor</th>
                    <th className="table-header">Impacto</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(incidentesRecentes || []).map((i: any) => (
                    <tr key={i.id} className="table-row">
                      <td className="table-cell">
                        <Link href={`/incidentes/${i.id}`} className="font-medium text-gray-900 dark:text-white hover:underline transition-colors">{i.titulo}</Link>
                      </td>
                      <td className="table-cell text-gray-500">{i.fornecedor?.nome || '—'}</td>
                      <td className="table-cell"><span className={impactoColor[i.impacto]}>{impactoLabel[i.impacto]}</span></td>
                      <td className="table-cell"><span className={statusColor[i.status]}>{statusLabel[i.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}