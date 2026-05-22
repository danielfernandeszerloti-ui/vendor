'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Users, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Usuario } from '@/types'

const roleLabel: Record<string, string> = { administrador: 'Administrador', ti: 'TI', visualizacao: 'Visualização' }
const roleColor: Record<string, string> = { administrador: 'badge-red', ti: 'badge-blue', visualizacao: 'badge-gray' }

export function UsuariosClient({ usuarios, currentUserId }: { usuarios: Usuario[]; currentUserId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Usuario>>({})

  async function save(id: string) {
    const { error } = await supabase.from('usuarios').update(editData).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success('Usuário atualizado!')
    setEditing(null)
    router.refresh()
  }

  async function toggleAtivo(u: Usuario) {
    if (u.id === currentUserId) { toast.error('Você não pode desativar sua própria conta'); return }
    const { error } = await supabase.from('usuarios').update({ ativo: !u.ativo }).eq('id', u.id)
    if (error) { toast.error('Erro'); return }
    toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="page-title">Usuários</h2><p className="page-subtitle">{usuarios.length} usuários cadastrados</p></div>
      </div>

      <div className="card overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">Nenhum usuário encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Usuários são criados via Supabase Auth</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="table-header">Usuário</th>
                <th className="table-header">Email</th>
                <th className="table-header">Cargo</th>
                <th className="table-header">Perfil</th>
                <th className="table-header">Status</th>
                <th className="table-header">Desde</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300">{u.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      {editing === u.id
                        ? <input defaultValue={u.nome} onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))} className="input py-1 text-sm" />
                        : <span className="font-medium text-gray-900 dark:text-white">{u.nome}</span>}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{u.email}</td>
                  <td className="table-cell text-gray-500 text-xs">
                    {editing === u.id
                      ? <input defaultValue={u.cargo || ''} onChange={e => setEditData(d => ({ ...d, cargo: e.target.value }))} className="input py-1 text-sm" />
                      : u.cargo || '—'}
                  </td>
                  <td className="table-cell">
                    {editing === u.id
                      ? <select defaultValue={u.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value as any }))} className="input py-1 text-sm">
                          <option value="visualizacao">Visualização</option>
                          <option value="ti">TI</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      : <span className={roleColor[u.role]}>{roleLabel[u.role]}</span>}
                  </td>
                  <td className="table-cell">
                    <button onClick={() => toggleAtivo(u)} className={u.ativo ? 'badge-green cursor-pointer hover:opacity-80' : 'badge-red cursor-pointer hover:opacity-80'}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="table-cell">
                    {editing === u.id
                      ? <div className="flex gap-1">
                          <button onClick={() => save(u.id)} className="w-7 h-7 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditing(null)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      : <button onClick={() => { setEditing(u.id); setEditData({}) }} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit className="w-3.5 h-3.5" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
