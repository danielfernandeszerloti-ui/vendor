'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2, Edit, Trash2, Eye, Filter, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIA_LABELS, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Fornecedor, CategoriaFornecedor } from '@/types'
import { FornecedorModal } from './modal'
import { BackButton } from '@/components/layout/BackButton'

const catColors: Record<CategoriaFornecedor, string> = {
  infraestrutura: 'badge-blue', software: 'badge-purple', cloud: 'badge-indigo',
  telecomunicacoes: 'badge-yellow', seguranca: 'badge-red',
  consultoria: 'badge-gray', hardware: 'badge-orange', outros: 'badge-gray',
}

export function FornecedoresClient({ items, count, page, perPage }: { items: Fornecedor[]; count: number; page: number; perPage: number }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [search, setSearch] = useState('')
  const totalPages = Math.ceil(count / perPage)

  async function del(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('fornecedores').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Excluído com sucesso')
    router.refresh()
  }

  function edit(f: Fornecedor) { setEditing(f); setOpen(true) }
  function close() { setOpen(false); setEditing(null) }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BackButton href="/dashboard" label="Voltar para Dashboard" />
          <div><h2 className="page-title">Fornecedores</h2><p className="page-subtitle">{count} cadastrados</p></div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Novo Fornecedor</button>
        </div>

        <div className="card p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Buscar nome, email, CNPJ..." value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') router.push(`/fornecedores?search=${search}`) }} />
          </div>
          <button onClick={() => router.push(`/fornecedores?search=${search}`)} className="btn-secondary"><Filter className="w-4 h-4" />Filtrar</button>
          {search && <button onClick={() => { setSearch(''); router.push('/fornecedores') }} className="btn-secondary">Limpar</button>}
        </div>

        <div className="card overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Nenhum fornecedor encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Novo Fornecedor" para começar</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Empresa</th>
                  <th className="table-header">Categoria</th>
                  <th className="table-header">Contato</th>
                  <th className="table-header">SLA</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(f => (
                  <tr key={f.id} className="table-row">
                    <td className="table-cell">
                      <Link href={`/fornecedores/${f.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 transition-colors block">{f.nome}</Link>
                      {f.cnpj && <p className="text-xs text-gray-500 mt-0.5">{f.cnpj}</p>}
                    </td>
                    <td className="table-cell"><span className={catColors[f.categoria]}>{CATEGORIA_LABELS[f.categoria]}</span></td>
                    <td className="table-cell">
                      <div className="text-xs">
                        {f.email && <p className="text-gray-600 dark:text-gray-400">{f.email}</p>}
                        {f.telefone && <p className="text-gray-500">{f.telefone}</p>}
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{f.sla || '—'}</td>
                    <td className="table-cell">
                      <span className={f.status === 'ativo' ? 'badge-green' : 'badge-red'}>
                        {f.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {(f as any).arquivo_contrato_url && (
                          <a href={(f as any).arquivo_contrato_url} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Ver contrato">
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Link href={`/fornecedores/${f.id}`} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Ver"><Eye className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => edit(f)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(f.id, f.nome)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
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
                {page > 1 && <Link href={`/fornecedores?page=${page - 1}`} className="btn-secondary text-xs py-1 px-3">← Anterior</Link>}
                {page < totalPages && <Link href={`/fornecedores?page=${page + 1}`} className="btn-secondary text-xs py-1 px-3">Próxima →</Link>}
              </div>
            </div>
          )}
        </div>
      </div>

      <FornecedorModal open={open} onClose={close} fornecedor={editing} onSuccess={() => { close(); router.refresh() }} />
    </>
  )
}
