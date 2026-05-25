import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { BackButton } from '@/components/layout/BackButton'
import { formatDateTime, IMPACTO_LABELS, STATUS_INCIDENTE_LABELS } from '@/lib/utils'
import { IncidenteHistoricoPanel } from '../historico'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: incidente } = await supabase
    .from('incidentes')
    .select('*, fornecedor:fornecedores(nome), historico:incidentes_historico(*, usuario:usuarios(nome))')
    .eq('id', params.id).single()

  if (!incidente) notFound()

  const statusColor: Record<string, string> = { aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray' }
  const impactoColor: Record<string, string> = { baixo: 'badge-green', medio: 'badge-yellow', alto: 'badge-orange', critico: 'badge-red' }

  return (
    <div>
      <Navbar title="Detalhe do Incidente" />
      <div className="p-6 max-w-4xl animate-in">
        <BackButton href="/incidentes" label="Voltar para Incidentes" />

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{incidente.titulo}</h1>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <span className={impactoColor[incidente.impacto]}>{IMPACTO_LABELS[incidente.impacto]}</span>
              <span className={statusColor[incidente.status]}>{STATUS_INCIDENTE_LABELS[incidente.status]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div><p className="text-xs text-gray-400">Fornecedor</p><p className="font-medium text-gray-900 dark:text-white">{(incidente.fornecedor as any)?.nome}</p></div>
            <div><p className="text-xs text-gray-400">Protocolo</p><p className="font-mono font-medium text-gray-900 dark:text-white">{incidente.protocolo || '—'}</p></div>
            <div><p className="text-xs text-gray-400">SLA</p><p className="font-medium text-gray-900 dark:text-white">{incidente.sla_horas ? `${incidente.sla_horas}h` : '—'}</p></div>
            <div><p className="text-xs text-gray-400">Responsável</p><p className="font-medium text-gray-900 dark:text-white">{incidente.responsavel_interno || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Abertura</p><p className="font-medium text-gray-900 dark:text-white">{formatDateTime(incidente.data_abertura)}</p></div>
            {incidente.data_resolucao && <div><p className="text-xs text-gray-400">Resolução</p><p className="font-medium text-gray-900 dark:text-white">{formatDateTime(incidente.data_resolucao)}</p></div>}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</p>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{incidente.descricao}</p>
          </div>
        </div>

        <IncidenteHistoricoPanel incidenteId={incidente.id} historico={(incidente.historico as any) || []} />
      </div>
    </div>
  )
}