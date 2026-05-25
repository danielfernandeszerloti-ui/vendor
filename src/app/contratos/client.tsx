'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, Edit, Trash2, Filter, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency, getDaysUntilExpiry, isContractExpired, STATUS_CONTRATO_LABELS, CRITICIDADE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ContratoModal } from './modal'
import { BackButton } from '@/components/layout/BackButton'

const critColor: Record<string, string> = { baixa: 'badge-green', media: 'badge-yellow', alta: 'badge-orange', critica: 'badge-red' }
const statusColor: Record<string, string> = { ativo: 'badge-green', vencido: 'badge-red', cancelado: 'badge-gray', em_renovacao: 'badge-yellow' }
const pagamentoColor: Record<string, string> = { pendente: 'badge-yellow', pago: 'badge-green', vencido: 'badge-red' }
const pagamentoLabel: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido' }
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function ContratosClient({ items, count, page, perPage, fornecedores }: { items: any[]; count: number; page: number; perPage: number; fornecedores: { id: string; nome: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [filtroPagamento, setFiltroPagamento] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const totalPages = Math.ceil(count / perPage)

  async function del(id: string) {
    if (!confirm('Excluir este contrato?')) return
    const { error } = await supabase.from('contratos').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluído'); router.refresh()
  }

  async function marcarPago(id: string) {
    const { error } = await supabase.from('contratos').update({
      status_pagamento: 'pago',
      data_pagamento: new Date().toISOString().slice(0, 10)
    }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success('Marcado como pago!'); router.refresh()
  }

  function edit(c: any) { setEditing(c); setOpen(true) }
  function close() { setOpen(false); setEditing(null) }

  function applyFilters() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filtroPagamento) params.set('pagamento', filtroPagamento)
    if (filtroMes) params.set('mes', filtroMes)
    router.push(`/contratos?${params.toString()}`)
  }

  const pendentes = items.filter(i => i.status_pagamento === 'pendente' || !i.status_pagamento).length

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <BackButton href="/dashboard" label="Voltar para Dashboard" />
            <h2 className="page-title">Contratos</h2>
            <p className="page-subtitle">
              {count} registros ·{' '}
              <span className={pendentes > 0 ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                {pendentes} pendentes de pagamento
              </span>
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Novo Contrato</button>
        </div>

        <div className="card p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar fornecedor, número..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()} />
          </div>
          <select className="input w-44" value={filtroPagamento} onChange={e => setFiltroPagamento(e.target.value)}>
            <option value="">Todos os pagamentos</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagos</option>
            <option value="vencido">Vencidos</option>
          </select>
          <select className="input w-40" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
          </select>
          <button onClick={applyFilters} className="btn-secondary"><Filter className="w-4 h-4" />Filtrar</button>
          <button onClick={() => { setSearch(''); setFiltroPagamento(''); setFiltroMes(''); router.push('/contratos') }} className="btn-secondary">Limpar</button>
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
                  <th className="table-header">Competência</th>
                  <th className="table-header">Vencimento</th>
                  <th className="table-header">Valor/mês</th>
                  <th className="table-header">Pagamento</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const dias = getDaysUntilExpiry(c.data_vencimento)
                  const exp = isContractExpired(c.data_vencimento)
                  const pagamento = c.status_pagamento || 'pendente'
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 dark:text-white">{c.fornecedor?.nome || '—'}</p>
                        {c.numero_contrato && <p className="text-xs text-gray-500 font-mono">{c.numero_contrato}</p>}
                      </td>
                      <td className="table-cell text-sm text-gray-500">
                        {c.mes_competencia ? `${MESES[c.mes_competencia - 1]}${c.ano_competencia ? `/${c.ano_competencia}` : ''}` : '—'}
                      </td>
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
                      <td className="table-cell font-medium">{c.valor_mensal ? formatCurrency(c.valor_mensal) : '—'}</td>
                      <td className="table-cell">
                        <span className={pagamentoColor[pagamento]}>{pagamentoLabel[pagamento]}</span>
                        {c.data_pagamento && <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.data_pagamento)}</p>}
                      </td>
                      <td className="table-cell"><span className={statusColor[c.status]}>{STATUS_CONTRATO_LABELS[c.status]}</span></td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {c.arquivo_boleto_url && (
                            <a href={c.arquivo_boleto_url} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Ver boleto">
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {pagamento !== 'pago' && (
                            <button onClick={() => marcarPago(c.id)}
                              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title="Marcar como pago">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => edit(c)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(c.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
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