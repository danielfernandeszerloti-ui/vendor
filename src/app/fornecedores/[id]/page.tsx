import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { formatDate, formatDateTime, CATEGORIA_LABELS } from '@/lib/utils'
import Link from 'next/link'
import {
  Building2, FileText, Server, AlertTriangle,
  Globe, Mail, Phone, User, Download,
} from 'lucide-react'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fornecedor } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!fornecedor) notFound()

  const [{ data: contratos }, { data: servicos }, { data: incidentes }, { data: anexos }] =
    await Promise.all([
      supabase.from('contratos').select('*').eq('fornecedor_id', params.id).order('data_vencimento'),
      supabase.from('servicos').select('*').eq('fornecedor_id', params.id).order('nome'),
      supabase.from('incidentes').select('*').eq('fornecedor_id', params.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('fornecedor_anexos').select('*').eq('fornecedor_id', params.id).order('created_at', { ascending: false }),
    ])

  const incStatusColor: Record<string, string> = {
    aberto: 'badge-red', em_andamento: 'badge-yellow',
    resolvido: 'badge-green', fechado: 'badge-gray',
  }
  const servicoStatusColor: Record<string, string> = {
    operacional: 'badge-green', degradado: 'badge-yellow',
    fora_do_ar: 'badge-red', manutencao: 'badge-blue',
  }
  const pagColor: Record<string, string> = {
    pendente: 'badge-yellow', pago: 'badge-green', vencido: 'badge-red',
  }

  function formatSize(bytes: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={fornecedor.nome}
        crumbs={[
          { label: 'Fornecedores', href: '/fornecedores' },
          { label: fornecedor.nome },
        ]}
      />

      <div className="flex-1 overflow-y-auto animate-in">
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-12">

          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1f6e, #00c8b4)' }}>
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {fornecedor.nome}
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {CATEGORIA_LABELS[fornecedor.categoria] || fornecedor.categoria}
                  </p>
                </div>
              </div>
              <span className={fornecedor.status === 'ativo' ? 'badge-green' : 'badge-gray'}>
                {fornecedor.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Building2, label: 'CNPJ',             value: fornecedor.cnpj },
                { icon: Mail,      label: 'E-mail',           value: fornecedor.email },
                { icon: Phone,     label: 'Telefone',         value: fornecedor.telefone },
                { icon: User,      label: 'Contato comercial',value: fornecedor.contato_nome || fornecedor.contato_comercial },
                { icon: User,      label: 'Contato técnico',  value: fornecedor.contato_tecnico },
                { icon: Server,    label: 'SLA',              value: fornecedor.sla_horas ? `${fornecedor.sla_horas}h` : fornecedor.sla },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="flex items-center gap-2 text-sm">
                  <f.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{f.value}</p>
                  </div>
                </div>
              ))}
              {fornecedor.site && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Site</p>
                    <a href={fornecedor.site} target="_blank" rel="noopener noreferrer"
                      className="hover:underline" style={{ color: 'var(--brand-cyan)' }}>
                      {fornecedor.site}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {fornecedor.observacoes && (
              <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Observações</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fornecedor.observacoes}</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Faturas',    value: contratos?.length  || 0, icon: FileText,      color: 'var(--brand-navy)' },
              { label: 'Serviços',   value: servicos?.length   || 0, icon: Server,        color: 'var(--brand-cyan)' },
              { label: 'Incidentes', value: incidentes?.length || 0, icon: AlertTriangle, color: 'var(--brand-pink)' },
              { label: 'Documentos', value: anexos?.length     || 0, icon: Download,      color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.color + '20' }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Documentos */}
          {(anexos?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Download className="w-4 h-4" style={{ color: '#7c3aed' }} />
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Documentos e contratos</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {anexos?.map(anexo => (
                  <a key={anexo.id} href={anexo.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border transition-colors group"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--brand-navy)20' }}>
                      <FileText className="w-4 h-4" style={{ color: 'var(--brand-navy)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {anexo.nome_original}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatSize(anexo.tamanho_bytes)} · {formatDate(anexo.created_at)}
                      </p>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Faturas */}
          {(contratos?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--brand-navy)' }} />
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Faturas</h2>
                </div>
                <Link href={`/contratos?fornecedor_id=${fornecedor.id}`}
                  className="text-xs hover:underline" style={{ color: 'var(--brand-cyan)' }}>
                  Ver todas
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">Número</th>
                    <th className="th hidden sm:table-cell">Vencimento</th>
                    <th className="th hidden md:table-cell">Tipo</th>
                    <th className="th">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos?.map(c => (
                    <tr key={c.id} className="tr">
                      <td className="td font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {c.numero_contrato || '—'}
                      </td>
                      <td className="td hidden sm:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(c.data_vencimento)}
                      </td>
                      <td className="td hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>
                        {c.tipo_servico || '—'}
                      </td>
                      <td className="td">
                        <span className={pagColor[c.status_pagamento] || 'badge-gray'}>
                          {c.status_pagamento || 'pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Serviços */}
          {(servicos?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Server className="w-4 h-4" style={{ color: 'var(--brand-cyan)' }} />
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Serviços</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">Nome</th>
                    <th className="th hidden md:table-cell">Tipo</th>
                    <th className="th hidden sm:table-cell">Ambiente</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos?.map(s => (
                    <tr key={s.id} className="tr">
                      <td className="td font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {s.nome}
                      </td>
                      <td className="td hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>
                        {s.tipo || '—'}
                      </td>
                      <td className="td hidden sm:table-cell text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
                        {s.ambiente}
                      </td>
                      <td className="td">
                        <span className={servicoStatusColor[s.status] || 'badge-gray'}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Incidentes recentes */}
          {(incidentes?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: 'var(--brand-pink)' }} />
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Incidentes recentes</h2>
                </div>
                <Link href={`/incidentes?fornecedor_id=${fornecedor.id}`}
                  className="text-xs hover:underline" style={{ color: 'var(--brand-cyan)' }}>
                  Ver todos
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">Título</th>
                    <th className="th hidden sm:table-cell">Impacto</th>
                    <th className="th">Status</th>
                    <th className="th hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentes?.map(i => (
                    <tr key={i.id} className="tr">
                      <td className="td">
                        <Link href={`/incidentes/${i.id}`}
                          className="font-medium text-sm hover:underline"
                          style={{ color: 'var(--text-primary)' }}>
                          {i.titulo}
                        </Link>
                      </td>
                      <td className="td hidden sm:table-cell text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
                        {i.impacto}
                      </td>
                      <td className="td">
                        <span className={incStatusColor[i.status] || 'badge-gray'}>{i.status}</span>
                      </td>
                      <td className="td hidden md:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(i.created_at)}
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
  )
}
