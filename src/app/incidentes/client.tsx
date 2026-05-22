'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, AlertTriangle, Edit, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, STATUS_INCIDENTE_LABELS, IMPACTO_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Incidente } from '@/types'
import { IncidenteModal } from './modal'

const statusColor: Record<string, string> = { aberto: 'badge-red', em_andamento: 'badge-yellow', resolvido: 'badge-green', fechado: 'badge-gray' }
const impactoColor: Record<string, string> = { baixo: 'badge-green', medio: 'badge-yellow', alto: 'badge-orange', critico: 'badge-red' }

export function IncidentesClient({ items, count, page, perPage, fornecedores }: { items: Incidente[]; count: number; page: number; perPage: number; fornecedores: { id: string; nome: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Incidente | null>(null)
  const [search, setSearch] = useState('')
  const totalPages = Math.ceil(count / perPage)

  async function del(id: string) {
    if (!confirm('Excluir este incidente?')) return
    const { error } = await supabase.from('incidentes').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluído'); router.refresh()
  }

  function edit(i: Incidente) { setEditing(i); setOpen(true) }
  function close() { setOpen(false); setEditing(null) }

  const abertos = items.filter(i => i.status === 'aberto' || i.status === 'em_andamento').length

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Incidentes</h2>
            <p className="page-subtitle">{count} registros · <span className={abertos > 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>{abertos} em aberto</span></p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Novo Incidente</button>
        </div>

        <div className="card p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar incidente..." value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/incidentes?search=${search}`)} />
          </div>
          <select className="input w-48" onChange={e => router.push(`/incidentes?status=${e.target.value}`)}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-500">Nenhum incidente encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Título</th>
                  <th className="table-header">Fornecedor</th>
                  <th className="table-header">Impacto</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Protocolo</th>
                  <th className="table-header">Abertura</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="table-row">
                    <td className="table-cell">
                      <Link href={`/incidentes/${i.id}`} className="font-medium text-gray-900 dark:text-white hover:text-brand-600 transition-colors">{i.titulo}</Link>
                      {i.responsavel_interno && <p className="text-xs text-gray-500">{i.responsavel_interno}</p>}
                    </td>
                    <td className="table-cell text-gray-500">{i.fornecedor?.nome || '—'}</td>
                    <td className="table-cell"><span className={impactoColor[i.impacto]}>{IMPACTO_LABELS[i.impacto]}</span></td>
                    <td className="table-cell"><span className={statusColor[i.status]}>{STATUS_INCIDENTE_LABELS[i.status]}</span></td>
                    <td className="table-cell font-mono text-xs text-gray-500">{i.protocolo || '—'}</td>
                    <td className="table-cell text-xs text-gray-500">{formatDateTime(i.data_abertura)}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <Link href={`/incidentes/${i.id}`} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Eye className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => edit(i)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(i.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                {page > 1 && <Link href={`/incidentes?page=${page - 1}`} className="btn-secondary text-xs py-1 px-3">← Anterior</Link>}
                {page < totalPages && <Link href={`/incidentes?page=${page + 1}`} className="btn-secondary text-xs py-1 px-3">Próxima →</Link>}
              </div>
            </div>
          )}
        </div>
      </div>
      <IncidenteModal open={open} onClose={close} incidente={editing} fornecedores={fornecedores} onSuccess={() => { close(); router.refresh() }} />
    </>
  )
}
