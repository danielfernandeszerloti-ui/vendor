import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { formatDateTime, IMPACTO_LABELS, STATUS_INCIDENTE_LABELS } from '@/lib/utils'
import { IncidenteHistoricoPanel } from '../historico'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: incidente } = await supabase
    .from('incidentes')
    .select('*, fornecedor:fornecedores(nome), historico:incidentes_historico(*, usuario:usuarios(nome))')
    .eq('id', params.id)
    .single()

  if (!incidente) notFound()

  const statusColor: Record<string, string> = {
    aberto: 'badge-red', em_andamento: 'badge-yellow',
    resolvido: 'badge-green', fechado: 'badge-gray',
  }
  const impactoColor: Record<string, string> = {
    baixo: 'badge-green', medio: 'badge-yellow',
    alto: 'badge-orange', critico: 'badge-red',
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={incidente.titulo}
        crumbs={[
          { label: 'Incidentes', href: '/incidentes' },
          { label: incidente.titulo },
        ]}
      />

      <div className="flex-1 overflow-y-auto animate-in">
        <div className="p-6 max-w-4xl mx-auto pb-12 space-y-6">

          {/* Main info */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <h1 className="text-xl font-bold pr-4" style={{ color: 'var(--text-primary)' }}>
                {incidente.titulo}
              </h1>
              <div className="flex gap-2 flex-shrink-0">
                <span className={impactoColor[incidente.impacto] || 'badge-gray'}>
                  {IMPACTO_LABELS[incidente.impacto] || incidente.impacto}
                </span>
                <span className={statusColor[incidente.status] || 'badge-gray'}>
                  {STATUS_INCIDENTE_LABELS[incidente.status] || incidente.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 p-4 rounded-xl"
              style={{ background: 'var(--bg-subtle)' }}>
              {[
                { label: 'Fornecedor',  value: (incidente.fornecedor as any)?.nome || '—' },
                { label: 'Protocolo',   value: incidente.protocolo || '—', mono: true },
                { label: 'SLA',         value: incidente.sla_horas ? `${incidente.sla_horas}h` : '—' },
                { label: 'Responsável', value: incidente.responsavel_interno || '—' },
                { label: 'Abertura',    value: formatDateTime(incidente.data_abertura) },
                incidente.data_resolucao
                  ? { label: 'Resolução', value: formatDateTime(incidente.data_resolucao) }
                  : null,
              ].filter(Boolean).map(f => (
                <div key={f!.label}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{f!.label}</p>
                  <p className={`font-medium text-sm ${f!.mono ? 'font-mono' : ''}`}
                    style={{ color: 'var(--text-primary)' }}>
                    {f!.value}
                  </p>
                </div>
              ))}
            </div>

            {incidente.descricao && (
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Descrição
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}>
                  {incidente.descricao}
                </p>
              </div>
            )}
          </div>

          {/* Histórico */}
          <IncidenteHistoricoPanel
            incidenteId={incidente.id}
            historico={(incidente.historico as any) || []}
          />
        </div>
      </div>
    </div>
  )
}
