import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { formatDate, CATEGORIA_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Building2, FileText, Server, AlertTriangle, Globe, Mail, Phone, User } from 'lucide-react'

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: fornecedor } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!fornecedor) notFound()

  const [
    { data: contratos },
    { data: servicos },
    { data: incidentes },
  ] = await Promise.all([
    supabase.from('contratos').select('*').eq('fornecedor_id', params.id).order('data_vencimento'),
    supabase.from('servicos').select('*').eq('fornecedor_id', params.id).order('nome'),
    supabase.from('incidentes').select('*').eq('fornecedor_id', params.id).order('created_at', { ascending: false }).limit(5),
  ])

  const statusColor: Record<string, string> = { aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray' }
  const servicoStatus: Record<string, string> = { operacional: 'badge-green', degradado: 'badge-yellow', fora_do_ar: 'badge-red', manutencao: 'badge-blue' }

  return (
    <div>
      <Navbar title="Detalhe do Fornecedor" />
      <div className="p-6 max-w-5xl space-y-6 animate-in">
        <Link href="/fornecedores" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/40 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-brand-600 dark:text-brand-400" />
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
            {fornecedor.cnpj && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">CNPJ</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.cnpj}</p></div>
              </div>
            )}
            {fornecedor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">E-mail</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.email}</p></div>
              </div>
            )}
            {fornecedor.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">Telefone</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.telefone}</p></div>
              </div>
            )}
            {fornecedor.site && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">Site</p>
                  <a href={fornecedor.site} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{fornecedor.site}</a>
                </div>
              </div>
            )}
            {fornecedor.contato_comercial && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">Contato Comercial</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.contato_comercial}</p></div>
              </div>
            )}
            {fornecedor.contato_tecnico && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div><p className="text-xs text-gray-400">Contato Técnico</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.contato_tecnico}</p></div>
              </div>
            )}
            {fornecedor.sla && (
              <div className="flex items-center gap-2 text-sm">
                <div><p className="text-xs text-gray-400">SLA</p><p className="text-gray-700 dark:text-gray-300">{fornecedor.sla}</p></div>
              </div>
            )}
          </div>

          {fornecedor.observacoes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Observações</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{fornecedor.observacoes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Contratos', value: contratos?.length || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Serviços', value: servicos?.length || 0, icon: Server, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Incidentes', value: incidentes?.length || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contratos */}
        {(contratos?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <FileText className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Contratos</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Número</th>
                  <th className="table-header">Início</th>
                  <th className="table-header">Vencimento</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {contratos?.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-mono text-xs">{c.numero_contrato || '—'}</td>
                    <td className="table-cell text-xs">{formatDate(c.data_inicio)}</td>
                    <td className="table-cell text-xs">{formatDate(c.data_vencimento)}</td>
                    <td className="table-cell">
                      <span className={c.status === 'ativo' ? 'badge-green' : 'badge-gray'}>{c.status}</span>
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
            <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-gray-800">
              <Server className="w-4 h-4 text-purple-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Serviços</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Nome</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Ambiente</th>
                  <th className="table-header">Status</th>
                </tr>
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
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Incidentes Recentes</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Título</th>
                  <th className="table-header">Impacto</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Data</th>
                </tr>
              </thead>
              <tbody>
                {incidentes?.map(i => (
                  <tr key={i.id} className="table-row">
                    <td className="table-cell">
                      <Link href={`/incidentes/${i.id}`} className="font-medium text-gray-900 dark:text-white hover:text-brand-600 transition-colors">{i.titulo}</Link>
                    </td>
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
