'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Server, Edit, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_SERVICO_LABELS, CRITICIDADE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Servico } from '@/types'
import { ServicoModal } from './modal'
import { BackButton } from '@/components/layout/BackButton'

const statusColor: Record<string, string> = { operacional: 'badge-green', degradado: 'badge-yellow', fora_do_ar: 'badge-red', manutencao: 'badge-blue' }
const critColor: Record<string, string> = { baixa: 'badge-green', media: 'badge-yellow', alta: 'badge-orange', critica: 'badge-red' }
const ambienteColor: Record<string, string> = { producao: 'badge-red', homologacao: 'badge-yellow', desenvolvimento: 'badge-blue' }
const ambienteLabel: Record<string, string> = { producao: 'Produção', homologacao: 'Homologação', desenvolvimento: 'Desenvolvimento' }

export function ServicosClient({ items, count, page, perPage, fornecedores }: { items: Servico[]; count: number; page: number; perPage: number; fornecedores: { id: string; nome: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)
  const [search, setSearch] = useState('')
  const totalPages = Math.ceil(count / perPage)

  async function del(id: string) {
    if (!confirm('Excluir este serviço?')) return
    const { error } = await supabase.from('servicos').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluído'); router.refresh()
  }

  function edit(s: Servico) { setEditing(s); setOpen(true) }
  function close() { setOpen(false); setEditing(null) }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BackButton href="/dashboard" label="Voltar para Dashboard" />
          <div><h2 className="page-title">Serviços</h2><p className="page-subtitle">{count} registros</p></div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Novo Serviço</button>
        </div>

        <div className="card p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar serviço..." value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/servicos?search=${search}`)} />
          </div>
          <button onClick={() => router.push(`/servicos?search=${search}`)} className="btn-secondary">Filtrar</button>
        </div>

        <div className="card overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Server className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-500">Nenhum serviço encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Serviço</th>
                  <th className="table-header">Fornecedor</th>
                  <th className="table-header">Ambiente</th>
                  <th className="table-header">Criticidade</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900 dark:text-white">{s.nome}</p>
                      {s.tipo && <p className="text-xs text-gray-500">{s.tipo}</p>}
                    </td>
                    <td className="table-cell text-gray-500">{s.fornecedor?.nome || '—'}</td>
                    <td className="table-cell"><span className={ambienteColor[s.ambiente]}>{ambienteLabel[s.ambiente]}</span></td>
                    <td className="table-cell"><span className={critColor[s.criticidade]}>{CRITICIDADE_LABELS[s.criticidade]}</span></td>
                    <td className="table-cell"><span className={statusColor[s.status]}>{STATUS_SERVICO_LABELS[s.status]}</span></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Abrir URL"><ExternalLink className="w-3.5 h-3.5" /></a>}
                        <button onClick={() => edit(s)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(s.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && <Link href={`/servicos?page=${page - 1}`} className="btn-secondary text-xs py-1 px-3">← Anterior</Link>}
                {page < totalPages && <Link href={`/servicos?page=${page + 1}`} className="btn-secondary text-xs py-1 px-3">Próxima →</Link>}
              </div>
            </div>
          )}
        </div>
      </div>
      <ServicoModal open={open} onClose={close} servico={editing} fornecedores={fornecedores} onSuccess={() => { close(); router.refresh() }} />
    </>
  )
}
