'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Search, AlertTriangle, Edit, Trash2, Eye, X as XIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Incidente } from '@/types'
import { IncidenteModal } from './modal'
import { Pagination } from '@/components/layout/Pagination'

const statusColor: Record<string, string> = {
  aberto: 'badge-red', em_andamento: 'badge-yellow',
  resolvido: 'badge-green', fechado: 'badge-gray',
}
const statusLabel: Record<string, string> = {
  aberto: 'Aberto', em_andamento: 'Em andamento',
  resolvido: 'Resolvido', fechado: 'Fechado',
}
const impactoColor: Record<string, string> = {
  baixo: 'badge-green', medio: 'badge-yellow',
  alto: 'badge-orange', critico: 'badge-red',
}
const impactoLabel: Record<string, string> = {
  baixo: 'Baixo', medio: 'Médio', alto: 'Alto', critico: 'Crítico',
}

interface Props {
  items:        Incidente[]
  count:        number
  page:         number
  perPage:      number
  fornecedores: { id: string; nome: string }[]
  role:         string
}

export function IncidentesClient({ items, count, page, perPage, fornecedores, role }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Incidente | null>(null)
  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [deleting, setDeleting] = useState<string | null>(null)

  const isAdmin = role === 'administrador'
  const canEdit = role === 'administrador' || role === 'ti'

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
    if (!confirm('Excluir este incidente e todo seu histórico?')) return
    setDeleting(id)
    const { error } = await supabase.from('incidentes').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Incidente excluído')
    router.refresh()
  }

  const hasFilters = !!(searchParams.get('search') || searchParams.get('status') || searchParams.get('impacto'))
  const abertos = items.filter(i => i.status === 'aberto' || i.status === 'em_andamento').length

  return (
    <>
      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-input-wrapper flex-1 min-w-48 max-w-72">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Buscar incidente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="select-wrapper w-40">
          <select
            className="input"
            value={searchParams.get('status') || ''}
            onChange={e => updateFilter('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>

        <div className="select-wrapper w-36">
          <select
            className="input"
            value={searchParams.get('impacto') || ''}
            onChange={e => updateFilter('impacto', e.target.value)}
          >
            <option value="">Todos os impactos</option>
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
            <option value="critico">Crítico</option>
          </select>
        </div>

        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost btn-md">
            <XIcon className="w-3.5 h-3.5" />Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {abertos > 0 && (
            <span className="badge-red hidden sm:inline-flex">
              {abertos} em aberto
            </span>
          )}
          {canEdit && (
            <button onClick={() => { setEditing(null); setOpen(true) }} className="btn-primary btn-md">
              <Plus className="w-4 h-4" />Novo incidente
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="table-container flex-1">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <AlertTriangle className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              </div>
              {hasFilters ? (
                <>
                  <p className="empty-title">Nenhum incidente encontrado</p>
                  <p className="empty-desc">Tente outros filtros</p>
                  <button onClick={clearAll} className="btn-ghost btn-sm mt-3">
                    <XIcon className="w-3.5 h-3.5" />Limpar filtros
                  </button>
                </>
              ) : (
                <><p className="empty-title">Nenhum incidente registrado</p>
                  <p className="empty-desc">O ambiente está sem incidentes</p></>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th" style={{ width: '40%' }}>Título</th>
                  <th className="th hidden md:table-cell">Fornecedor</th>
                  <th className="th">Impacto</th>
                  <th className="th">Status</th>
                  <th className="th hidden lg:table-cell">Data</th>
                  <th className="th" style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="tr group/row">
                    <td className="td">
                      <Link href={`/incidentes/${i.id}`}
                        className="font-medium hover:underline truncate block max-w-xs"
                        style={{ color: 'var(--text-primary)' }}>
                        {i.titulo}
                      </Link>
                      {i.descricao && (
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {i.descricao}
                        </p>
                      )}
                    </td>
                    <td className="td hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
                      {(i as any).fornecedor?.nome || '—'}
                    </td>
                    <td className="td">
                      <span className={impactoColor[i.impacto] || 'badge-gray'}>
                        {impactoLabel[i.impacto] || i.impacto}
                      </span>
                    </td>
                    <td className="td">
                      <span className={statusColor[i.status] || 'badge-gray'}>
                        {statusLabel[i.status] || i.status}
                      </span>
                    </td>
                    <td className="td hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(i.created_at)}
                    </td>
                    <td className="td">
                      <div className="row-actions">
                        <Link href={`/incidentes/${i.id}`}
                          className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Ver detalhes">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {canEdit && (
                          <button onClick={() => { setEditing(i); setOpen(true) }}
                            className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => del(i.id)} disabled={deleting === i.id}
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

      {open && (
        <IncidenteModal
          open={open}
          incidente={editing}
          fornecedores={fornecedores}
          onClose={() => { setOpen(false); setEditing(null) }}
          onSuccess={() => { setOpen(false); setEditing(null); router.refresh() }}
        />
      )}
    </>
  )
}
