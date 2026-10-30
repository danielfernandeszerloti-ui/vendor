'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Plus, Search, FileText, Edit, Trash2, Check,
  ExternalLink, X as XIcon, ChevronDown, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ContratoModal } from './modal'
import { Pagination } from '@/components/layout/Pagination'

const pagamentoColor: Record<string, string> = {
  pendente: 'badge-yellow',
  pago:     'badge-green',
  vencido:  'badge-red',
}
const pagamentoLabel: Record<string, string> = {
  pendente: 'Pendente',
  pago:     'Pago',
  vencido:  'Vencido',
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  items:        any[]
  count:        number
  page:         number
  perPage:      number
  fornecedores: { id: string; nome: string }[]
  role:         string
}

export function ContratosClient({ items, count, page, perPage, fornecedores, role }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const [open, setOpen]           = useState(false)
  const [editing, setEditing]     = useState<any | null>(null)
  const [search, setSearch]       = useState(searchParams.get('search') || '')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  const isAdmin = role === 'administrador'
  const canEdit = role === 'administrador' || role === 'ti' || role === 'financeiro'

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilter('search', search.trim())
  }

  function clearAll() {
    setSearch('')
    startTransition(() => router.push(pathname))
  }

  async function marcarPago(id: string) {
    setMarkingPaid(id)
    const { error } = await supabase.from('contratos').update({
      status_pagamento: 'pago',
      data_pagamento:   new Date().toISOString().slice(0, 10),
    }).eq('id', id)
    setMarkingPaid(null)
    if (error) { toast.error('Erro ao registrar pagamento'); return }
    toast.success('Pagamento registrado')
    router.refresh()
  }

  async function del(id: string) {
    if (!confirm('Excluir esta fatura? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    const { error } = await supabase.from('contratos').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Fatura excluída')
    router.refresh()
  }

  const hasFilters = !!(searchParams.get('search') || searchParams.get('pagamento') || searchParams.get('mes'))
  const pendentes  = items.filter(i => i.status_pagamento === 'pendente' || !i.status_pagamento).length

  return (
    <>
      {/* Filtros */}
      <div className="filter-bar gap-2">
        <form onSubmit={handleSearch} className="search-input-wrapper flex-1 min-w-48 max-w-72">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Buscar fornecedor, número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="select-wrapper w-40">
          <select
            className="input"
            value={searchParams.get('pagamento') || ''}
            onChange={e => updateFilter('pagamento', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagos</option>
            <option value="vencido">Vencidos</option>
          </select>
        </div>

        <div className="select-wrapper w-36">
          <select
            className="input"
            value={searchParams.get('mes') || ''}
            onChange={e => updateFilter('mes', e.target.value)}
          >
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => (
              <option key={i} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost btn-md">
            <XIcon className="w-3.5 h-3.5" />Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {pendentes > 0 && (
            <span className="badge-yellow hidden sm:inline-flex">
              {pendentes} pendente{pendentes !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {count.toLocaleString('pt-BR')} {count === 1 ? 'fatura' : 'faturas'}
          </span>
          {canEdit && (
            <button onClick={() => { setEditing(null); setOpen(true) }} className="btn-primary btn-md">
              <Plus className="w-4 h-4" />Nova fatura
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="table-container flex-1">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              </div>
              {hasFilters ? (
                <>
                  <p className="empty-title">Nenhuma fatura encontrada</p>
                  <p className="empty-desc">Tente outros filtros ou limpe a busca</p>
                  <button onClick={clearAll} className="btn-ghost btn-sm mt-3">
                    <XIcon className="w-3.5 h-3.5" />Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <p className="empty-title">Nenhuma fatura cadastrada</p>
                  <p className="empty-desc">Registre a primeira fatura do sistema</p>
                  {canEdit && (
                    <button onClick={() => setOpen(true)} className="btn-primary btn-sm mt-3">
                      <Plus className="w-3.5 h-3.5" />Nova fatura
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th" style={{ width: '30%' }}>Fornecedor</th>
                  <th className="th hidden md:table-cell">Tipo de serviço</th>
                  <th className="th hidden sm:table-cell">Vencimento</th>
                  <th className="th hidden lg:table-cell">Competência</th>
                  <th className="th-right">Valor</th>
                  <th className="th">Pagamento</th>
                  <th className="th" style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const isPendente = !c.status_pagamento || c.status_pagamento === 'pendente'
                  const isVencido  = c.status_pagamento === 'vencido'
                  return (
                    <tr key={c.id} className={`tr group/row ${isVencido ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                      <td className="td">
                        <p className="font-medium text-sm truncate max-w-[200px]"
                          style={{ color: 'var(--text-primary)' }}>
                          {c.fornecedor?.nome || '—'}
                        </p>
                        {c.numero_contrato && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {c.numero_contrato}
                          </p>
                        )}
                      </td>
                      <td className="td hidden md:table-cell">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {c.tipo_servico || '—'}
                        </span>
                      </td>
                      <td className="td hidden sm:table-cell">
                        <span className={`text-sm tabular ${isVencido ? 'font-medium' : ''}`}
                          style={{ color: isVencido ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {c.data_vencimento ? formatDate(c.data_vencimento) : '—'}
                        </span>
                      </td>
                      <td className="td hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                        {c.mes_competencia && c.ano_competencia
                          ? `${MESES[(c.mes_competencia - 1)]?.slice(0, 3)} ${c.ano_competencia}`
                          : '—'
                        }
                      </td>
                      <td className="td-numeric">
                        <span className="text-sm font-medium tabular" style={{ color: 'var(--text-primary)' }}>
                          {c.valor_mensal ? formatCurrency(c.valor_mensal) : '—'}
                        </span>
                      </td>
                      <td className="td">
                        <span className={pagamentoColor[c.status_pagamento] || 'badge-gray'}>
                          {pagamentoLabel[c.status_pagamento] || 'Pendente'}
                        </span>
                        {c.data_pagamento && c.status_pagamento === 'pago' && (
                          <p className="text-xs mt-0.5 tabular" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(c.data_pagamento)}
                          </p>
                        )}
                      </td>
                      <td className="td">
                        <div className="row-actions">
                          {c.arquivo_boleto_url && (
                            <a
                              href={c.arquivo_boleto_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Ver boleto">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {canEdit && isPendente && (
                            <button
                              onClick={() => marcarPago(c.id)}
                              disabled={markingPaid === c.id}
                              className="btn-icon-sm text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              title="Marcar como pago">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => { setEditing(c); setOpen(true) }}
                              className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => del(c.id)}
                              disabled={deleting === c.id}
                              className="btn-icon-sm text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Excluir">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <Pagination total={count} page={page} perPage={perPage} />
      </div>

      {open && (
        <ContratoModal
          open={open}
          contrato={editing}
          fornecedores={fornecedores}
          onClose={() => { setOpen(false); setEditing(null) }}
          onSuccess={() => { setOpen(false); setEditing(null); router.refresh() }}
        />
      )}
    </>
  )
}
