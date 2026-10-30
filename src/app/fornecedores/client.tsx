'use client'
import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Plus, Search, Building2, Edit, Trash2, Eye, ExternalLink,
  ChevronDown, X as XIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIA_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Fornecedor, CategoriaFornecedor } from '@/types'
import { FornecedorModal } from './modal'
import { Pagination } from '@/components/layout/Pagination'

const catColors: Record<CategoriaFornecedor, string> = {
  infraestrutura: 'badge-blue',
  software:       'badge-purple',
  cloud:          'badge-indigo',
  telecomunicacoes: 'badge-yellow',
  seguranca:      'badge-red',
  consultoria:    'badge-gray',
  hardware:       'badge-orange',
  outros:         'badge-gray',
}
const statusColor: Record<string, string> = {
  ativo:    'badge-green',
  inativo:  'badge-gray',
  suspenso: 'badge-red',
}
const statusLabel: Record<string, string> = {
  ativo: 'Ativo', inativo: 'Inativo', suspenso: 'Suspenso',
}

interface Props {
  items:   Fornecedor[]
  count:   number
  page:    number
  perPage: number
  role:    string
}

export function FornecedoresClient({ items, count, page, perPage, role }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [deleting, setDeleting] = useState<string | null>(null)

  const isAdmin = role === 'administrador'

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilter('search', search.trim())
  }

  async function del(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"?\nEsta ação não pode ser desfeita e removerá todos os dados vinculados.`)) return
    setDeleting(id)
    const { error } = await supabase.from('fornecedores').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error('Erro ao excluir o fornecedor'); return }
    toast.success('Fornecedor excluído com sucesso')
    router.refresh()
  }

  function openEdit(f: Fornecedor) { setEditing(f); setOpen(true) }
  function closeModal()            { setOpen(false); setEditing(null) }

  const hasFilters = !!searchParams.get('search')

  return (
    <>
      {/* Filtros */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-input-wrapper flex-1 min-w-48 max-w-80">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Buscar nome, email, CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <button onClick={handleSearch as any} className="btn-secondary btn-md">
          <Search className="w-3.5 h-3.5" />Filtrar
        </button>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); router.push(pathname) }}
            className="btn-ghost btn-md"
          >
            <XIcon className="w-3.5 h-3.5" />Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {count.toLocaleString('pt-BR')} {count === 1 ? 'fornecedor' : 'fornecedores'}
          </span>
          {(role === 'administrador' || role === 'ti') && (
            <button onClick={() => { setEditing(null); setOpen(true) }} className="btn-primary btn-md">
              <Plus className="w-4 h-4" />Novo fornecedor
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
                <Building2 className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              </div>
              {hasFilters ? (
                <>
                  <p className="empty-title">Nenhum resultado encontrado</p>
                  <p className="empty-desc">Tente outros termos ou remova os filtros</p>
                  <button onClick={() => { setSearch(''); router.push(pathname) }} className="btn-ghost btn-sm mt-3">
                    <XIcon className="w-3.5 h-3.5" />Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <p className="empty-title">Nenhum fornecedor cadastrado</p>
                  <p className="empty-desc">Comece adicionando seu primeiro fornecedor</p>
                  {(role === 'administrador' || role === 'ti') && (
                    <button onClick={() => setOpen(true)} className="btn-primary btn-sm mt-3">
                      <Plus className="w-3.5 h-3.5" />Novo fornecedor
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th" style={{ width: '35%' }}>Empresa</th>
                  <th className="th">Categoria</th>
                  <th className="th hidden md:table-cell">Contato</th>
                  <th className="th hidden lg:table-cell">SLA</th>
                  <th className="th">Status</th>
                  <th className="th" style={{ width: 1 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(f => (
                  <tr key={f.id} className="tr group/row">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'var(--brand-navy)' }}
                        >
                          {f.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/fornecedores/${f.id}`}
                            className="font-medium hover:underline truncate block"
                            style={{ color: 'var(--text-primary)' }}>
                            {f.nome}
                          </Link>
                          {f.cnpj && (
                            <p className="text-xs truncate tabular" style={{ color: 'var(--text-muted)' }}>
                              {f.cnpj}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <span className={catColors[f.categoria as CategoriaFornecedor] || 'badge-gray'}>
                        {CATEGORIA_LABELS[f.categoria as CategoriaFornecedor] || f.categoria}
                      </span>
                    </td>
                    <td className="td hidden md:table-cell">
                      <p className="text-sm truncate max-w-[160px]" style={{ color: 'var(--text-secondary)' }}>
                        {f.contato_comercial || '—'}
                      </p>
                      {f.contato_tecnico && (
                        <p className="text-xs truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>
                          {f.contato_tecnico}
                        </p>
                      )}
                    </td>
                    <td className="td hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>
                      {f.sla || '—'}
                    </td>
                    <td className="td">
                      <span className={statusColor[f.status] || 'badge-gray'}>
                        {statusLabel[f.status] || f.status}
                      </span>
                    </td>
                    <td className="td">
                      <div className="row-actions">
                        <Link href={`/fornecedores/${f.id}`}
                          className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Ver detalhes">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {(role === 'administrador' || role === 'ti') && (
                          <button
                            onClick={() => openEdit(f)}
                            className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => del(f.id, f.nome)}
                            disabled={deleting === f.id}
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
        <FornecedorModal
          open={open}
          fornecedor={editing}
          onClose={closeModal}
          onSuccess={() => { closeModal(); router.refresh() }}
        />
      )}
    </>
  )
}
