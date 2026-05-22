'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, Edit, Trash2, Filter, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency, getDaysUntilExpiry, isContractExpired, STATUS_CONTRATO_LABELS, CRITICIDADE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Contrato } from '@/types'
import { ContratoModal } from './modal'

const critColor: Record<string, string> = { baixa: 'badge-green', media: 'badge-yellow', alta: 'badge-orange', critica: 'badge-red' }
const statusColor: Record<string, string> = { ativo: 'badge-green', vencido: 'badge-red', cancelado: 'badge-gray', em_renovacao: 'badge-yellow' }

export function ContratosClient({ items, count, page, perPage, fornecedores }: { items: Contrato[]; count: number; page: number; perPage: number; fornecedores: { id: string; nome: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contrato | null>(null)
  const [search, setSearch] = useState('')
  const totalPages = Math.ceil(count / perPage)

  async function del(id: string) {
    if (!confirm('Excluir este contrato?')) return
    const { error } = await supabase.from('contratos').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluído'); router.refresh()
  }

  function edit(c: Contrato) { setEditing(c); setOpen(true) }
  function close() { setOpen(false); setEditing(null) }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="page-title">Contratos</h2><p className="page-subtitle">{count} registros</p></div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Novo Contrato</button>
        </div>

        <div className="card p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar número, responsável..." value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && router.push(`/contratos?search=${search}`)} />
          </div>
          <button onClick={() => router.push(`/contratos?search=${search}`)} className="btn-secondary"><Filter className="w-4 h-4" />Filtrar</button>
        </div>

        <div className="card overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-500">Nenhum contrato encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Fornecedor</th>
                  <th className="table-header">Número</th>
                  <th className="table-header">Vencimento</th>
                  <th className="table-header">Valor/mês</th>
                  <th className="table-header">Criticidade</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const dias = getDaysUntilExpiry(c.data_vencimento)
                  const exp = isContractExpired(c.data_vencimento)
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 dark:text-white">{c.fornecedor?.nome || '—'}</p>
                        {c.responsavel_interno && <p className="text-xs text-gray-500">{c.responsavel_interno}</p>}
                      </td>
                      <td className="table-cell text-gray-500 font-mono text-xs">{c.numero_contrato || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          {(!exp && dias <= 30) && <AlertCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                          {exp && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                          <div>
                            <p className="text-sm">{formatDate(c.data_vencimento)}</p>
                            <p className={`text-xs ${exp ? 'text-red-500' : dias <= 30 ? 'text-yellow-600' : 'text-gray-400'}`}>
                              {exp ? 'Vencido' : `${dias} dias`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{c.valor_mensal ? formatCurrency(c.valor_mensal) : '—'}</td>
                      <td className="table-cell"><span className={critColor[c.criticidade]}>{CRITICIDADE_LABELS[c.criticidade]}</span></td>
                      <td className="table-cell"><span className={statusColor[c.status]}>{STATUS_CONTRATO_LABELS[c.status]}</span></td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => edit(c)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(c.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && <Link href={`/contratos?page=${page - 1}`} className="btn-secondary text-xs py-1 px-3">← Anterior</Link>}
                {page < totalPages && <Link href={`/contratos?page=${page + 1}`} className="btn-secondary text-xs py-1 px-3">Próxima →</Link>}
              </div>
            </div>
          )}
        </div>
      </div>
      <ContratoModal open={open} onClose={close} contrato={editing} fornecedores={fornecedores} onSuccess={() => { close(); router.refresh() }} />
    </>
  )
}
