'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Search, Server, Edit, Trash2, ExternalLink, X as XIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUS_SERVICO_LABELS, CRITICIDADE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Servico } from '@/types'
import { ServicoModal } from './modal'
import { Pagination } from '@/components/layout/Pagination'

const statusColor: Record<string, string> = {
  operacional: 'badge-green', degradado: 'badge-yellow',
  fora_do_ar: 'badge-red', manutencao: 'badge-blue',
}
const critColor: Record<string, string> = {
  baixa: 'badge-green', media: 'badge-yellow',
  alta: 'badge-orange', critica: 'badge-red',
}
const ambienteColor: Record<string, string> = {
  producao: 'badge-red', homologacao: 'badge-yellow', desenvolvimento: 'badge-blue',
}
const ambienteLabel: Record<string, string> = {
  producao: 'Produção', homologacao: 'Homologação', desenvolvimento: 'Desenvolvimento',
}

interface Props {
  items:        Servico[]
  count:        number
  page:         number
  perPage:      number
  fornecedores: { id: string; nome: string }[]
  role:         string
}

export function ServicosClient({ items, count, page, perPage, fornecedores, role }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)
  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [deleting, setDeleting] = useState<string | null>(null)

  const canEdit = role === 'administrador' || role === 'ti'
  const isAdmin = role === 'administrador'

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

  function clearAll() { setSearch(''); startTransition(() => router.push(pathname)) }

  async function del(id: string) {
    if (!confirm('Excluir este serviço?')) return
    setDeleting(id)
    const { error } = await supabase.from('servicos').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Serviço excluído')
    router.refresh()
  }

  const hasFilters = !!(searchParams.get('search') || searchParams.get('status') || searchParams.get('ambiente'))
  const problemas = items.filter(s => s.status !== 'operacional').length

  return (
    <>
      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-input-wrapper flex-1 min-w-48 max-w-72">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Buscar serviço..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="select-wrapper w-44">
          <select
            className="input"
            value={searchParams.get('status') || ''}
            onChange={e => updateFilter('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="operacional">Operacional</option>
            <option value="degradado">Degradado</option>
            <option value="fora_do_ar">Fora do ar</option>
            <option value="manutencao">Em manutenção</option>
          </select>
        </div>

        <div className="select-wrapper w-40">
          <select
            className="input"
            value={searchParams.get('ambiente') || ''}
            onChange={e => updateFilter('ambiente', e.target.value)}
          >
            <option value="">Todos os ambientes</option>
            <option value="producao">Produção</option>
            <option value="homologacao">Homologação</option>
            <option value="desenvolvimento">Desenvolvimento</option>
          </select>
        </div>

        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost btn-md">
            <XIcon className="w-3.5 h-3.5" />Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {problemas > 0 && (
            <span className="badge-red hidden sm:inline-flex">
              {problemas} com problema
            </span>
          )}
          {canEdit && (
            <button onClick={() => { setEditing(null); setOpen(true) }} className="btn-primary btn-md">
              <Plus className="w-4 h-4" />Novo serviço
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="table-container flex-1">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Server className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              </div>
              {hasFilters ? (
                <>
                  <p className="empty-title">Nenhum serviço encontrado</p>
                  <p className="empty-desc">Tente outros filtros</p>
                  <button onClick={clearAll} className="btn-ghost btn-sm mt-3">
                    <XIcon className="w-3.5 h-3.5" />Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <p className="empty-title">Nenhum serviço cadastrado</p>
                  <p className="empty-desc">Registre os serviços contratados de TI</p>
                  {canEdit && (
                    <button onClick={() => setOpen(true)} className="btn-primary btn-sm mt-3">
                      <Plus className="w-3.5 h-3.5" />Novo serviço
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th" style={{ width: '30%' }}>Serviço</th>
                  <th className="th hidden md:table-cell">Fornecedor</th>
                  <th className="th hidden lg:table-cell">Ambiente</th>
                  <th className="th hidden sm:table-cell">Criticidade</th>
                  <th className="th">Status</th>
                  <th className="th" style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id} className="tr group/row">
                    <td className="td">
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {s.nome}
                      </p>
                      {s.tipo && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.tipo}</p>
                      )}
                    </td>
                    <td className="td hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
                      {(s as any).fornecedor?.nome || '—'}
                    </td>
                    <td className="td hidden lg:table-cell">
                      {s.ambiente ? (
                        <span className={ambienteColor[s.ambiente] || 'badge-gray'}>
                          {ambienteLabel[s.ambiente] || s.ambiente}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="td hidden sm:table-cell">
                      <span className={critColor[s.criticidade] || 'badge-gray'}>
                        {CRITICIDADE_LABELS[s.criticidade] || s.criticidade}
                      </span>
                    </td>
                    <td className="td">
                      <span className={statusColor[s.status] || 'badge-gray'}>
                        {STATUS_SERVICO_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="td">
                      <div className="row-actions">
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="btn-icon-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Abrir URL">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {canEdit && (
                          <button onClick={() => { setEditing(s); setOpen(true) }}
                            className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => del(s.id)} disabled={deleting === s.id}
                            className="btn-icon-sm text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination total={count} page={page} perPage={perPage} />
      </div>

      <ServicoModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        servico={editing}
        fornecedores={fornecedores}
        onSuccess={() => { setOpen(false); setEditing(null); router.refresh() }}
      />
    </>
  )
}
