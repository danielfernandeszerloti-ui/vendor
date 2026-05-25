import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { BackButton } from '@/components/layout/BackButton'
import { formatDate, formatDateTime, CATEGORIA_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { Building2, FileText, Server, AlertTriangle, Globe, Mail, Phone, User, Download } from 'lucide-react'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fornecedor } = await supabase.from('fornecedores').select('*').eq('id', params.id).single()
  if (!fornecedor) notFound()

  const [{ data: contratos }, { data: servicos }, { data: incidentes }, { data: anexos }] = await Promise.all([
    supabase.from('contratos').select('*').eq('fornecedor_id', params.id).order('data_vencimento'),
    supabase.from('servicos').select('*').eq('fornecedor_id', params.id).order('nome'),
    supabase.from('incidentes').select('*').eq('fornecedor_id', params.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('fornecedor_anexos').select('*').eq('fornecedor_id', params.id).order('created_at', { ascending: false }),
  ])

  const statusColor: Record<string, string> = { aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray' }
  const servicoStatus: Record<string, string> = { operacional: 'badge-green', degradado: 'badge-yellow', fora_do_ar: 'badge-red', manutencao: 'badge-blue' }

  function formatSize(bytes: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div>
      <Navbar title="Detalhe do Fornecedor" />
      <div className="p-6 max-w-5xl space-y-6 animate-in">
        <BackButton href="/fornecedores" label="Voltar para Fornecedores" />

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1f6e, #00c8b4)' }}>
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fornecedor.nome}</h1>
                <p className="text-gray-500 text-sm mt-0.5">{CATEGORIA_LABELS[fornecedor.categoria]}</p>
              </div>
            </div>
            <span className={fornecedor.status === 'ativo' ? 'badge-green' : 'badge-red'}>
              {fornecedor.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fornecedor.cnpj && <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">CNPJ</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.cnpj}</p></div></div>}
            {fornecedor.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">E-mail</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.email}</p></div></div>}
            {fornecedor.telefone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Telefone</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.telefone}</p></div></div>}
            {fornecedor.site && <div className="flex items-center gap-2 text-sm"><Globe className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Site</p><a href={fornecedor.site} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#1a1f6e' }}>{fornecedor.site}</a></div></div>}
            {fornecedor.contato_comercial && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Contato Comercial</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.contato_comercial}</p></div></div>}
            {fornecedor.contato_tecnico && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Contato Técnico</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.contato_tecnico}</p></div></div>}
            {fornecedor.sla && <div className="text-sm"><p className="text-xs text-gray-400">SLA</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.sla}</p></div>}
          </div>

          {fornecedor.observacoes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Observações</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{fornecedor.observacoes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Boletos',    value: contratos?.length  || 0, icon: FileText,      color: '#1a1f6e' },
            { label: 'Serviços',   value: servicos?.length   || 0, icon: Server,        color: '#00c8b4' },
            { label: 'Incidentes', value: incidentes?.length || 0, icon: AlertTriangle, color: '#e91e8c' },
            { label: 'Documentos', value: anexos?.length     || 0, icon: Download,      color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '20' }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Anexos */}
        {(anexos?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <Download className="w-4 h-4" style={{ color: '#7c3aed' }} />
              <h2 className="font-semibold text-gray-900 dark:text-white">Documentos e Contratos</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {anexos?.map(anexo => (
                <a key={anexo.id} href={anexo.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{anexo.nome_original}</p>
                    <p className="text-xs text-gray-400">{formatSize(anexo.tamanho_bytes)} · {formatDate(anexo.created_at)}</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Boletos */}
        {(contratos?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <FileText className="w-4 h-4" style={{ color: '#1a1f6e' }} />
              <h2 className="font-semibold text-gray-900 dark:text-white">Boletos</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr><th className="table-header">Número</th><th className="table-header">Início</th><th className="table-header">Vencimento</th><th className="table-header">Status</th></tr>
              </thead>
              <tbody>
                {contratos?.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{c.numero_contrato || '—'}</td>
                    <td className="table-cell text-xs">{formatDate(c.data_inicio)}</td>
                    <td className="table-cell text-xs">{formatDate(c.data_vencimento)}</td>
                    <td className="table-cell"><span className={c.status === 'ativo' ? 'badge-green' : 'badge-gray'}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Serviços */}
        {(servicos?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <Server className="w-4 h-4" style={{ color: '#00c8b4' }} />
              <h2 className="font-semibold text-gray-900 dark:text-white">Serviços</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr><th className="table-header">Nome</th><th className="table-header">Tipo</th><th className="table-header">Ambiente</th><th className="table-header">Status</th></tr>
              </thead>
              <tbody>
                {servicos?.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-medium text-gray-900 dark:text-white">{s.nome}</td>
                    <td className="table-cell text-xs text-gray-500">{s.tipo || '—'}</td>
                    <td className="table-cell text-xs text-gray-500 capitalize">{s.ambiente}</td>
                    <td className="table-cell"><span className={servicoStatus[s.status]}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Incidentes */}
        {(incidentes?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <AlertTriangle className="w-4 h-4" style={{ color: '#e91e8c' }} />
              <h2 className="font-semibold text-gray-900 dark:text-white">Incidentes Recentes</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr><th className="table-header">Título</th><th className="table-header">Impacto</th><th className="table-header">Status</th><th className="table-header">Data</th></tr>
              </thead>
              <tbody>
                {incidentes?.map(i => (
                  <tr key={i.id} className="table-row">
                    <td className="table-cell"><Link href={`/incidentes/${i.id}`} className="font-medium text-gray-900 dark:text-white hover:underline">{i.titulo}</Link></td>
                    <td className="table-cell text-xs capitalize text-gray-500">{i.impacto}</td>
                    <td className="table-cell"><span className={statusColor[i.status]}>{i.status}</span></td>
                    <td className="table-cell text-xs text-gray-500">{formatDate(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}