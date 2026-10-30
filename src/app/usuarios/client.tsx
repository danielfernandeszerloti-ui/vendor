'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Users, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Usuario } from '@/types'

const roleLabel: Record<string, string> = {
  administrador: 'Administrador', ti: 'TI', financeiro: 'Financeiro', visualizacao: 'Visualização',
}
const roleColor: Record<string, string> = {
  administrador: 'badge-red', ti: 'badge-blue', financeiro: 'badge-yellow', visualizacao: 'badge-gray',
}

export function UsuariosClient({ usuarios, currentUserId }: { usuarios: Usuario[]; currentUserId: string }) {
  const router   = useRouter()
  const supabase = createClient()
  const [editing, setEditing]   = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Usuario>>({})

  async function save(id: string) {
    const { error } = await supabase.from('usuarios').update(editData).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return }
    toast.success('Usuário atualizado')
    setEditing(null)
    router.refresh()
  }

  async function toggleAtivo(u: Usuario) {
    if (u.id === currentUserId) {
      toast.error('Você não pode desativar sua própria conta')
      return
    }
    const { error } = await supabase.from('usuarios').update({ ativo: !u.ativo }).eq('id', u.id)
    if (error) { toast.error('Erro'); return }
    toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
    router.refresh()
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
        </span>
      </div>

      <div className="table-container flex-1">
        {usuarios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Users className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="empty-title">Nenhum usuário encontrado</p>
            <p className="empty-desc">Usuários são criados via Supabase Auth</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="th">Usuário</th>
                <th className="th hidden md:table-cell">E-mail</th>
                <th className="th hidden lg:table-cell">Cargo</th>
                <th className="th">Perfil</th>
                <th className="th">Status</th>
                <th className="th hidden sm:table-cell">Desde</th>
                <th className="th" style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="tr group/row">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: 'var(--brand-navy)' }}>
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      {editing === u.id ? (
                        <input
                          defaultValue={u.nome}
                          onChange={e => setEditData(d => ({ ...d, nome: e.target.value }))}
                          className="input py-1 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {u.nome}
                          {u.id === currentUserId && (
                            <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(você)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>
                  <td className="td hidden lg:table-cell">
                    {editing === u.id ? (
                      <input
                        defaultValue={u.cargo || ''}
                        onChange={e => setEditData(d => ({ ...d, cargo: e.target.value }))}
                        className="input py-1 text-sm"
                      />
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{u.cargo || '—'}</span>
                    )}
                  </td>
                  <td className="td">
                    {editing === u.id ? (
                      <select
                        defaultValue={u.role}
                        onChange={e => setEditData(d => ({ ...d, role: e.target.value as any }))}
                        className="input py-1 text-sm">
                        <option value="visualizacao">Visualização</option>
                        <option value="ti">TI</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    ) : (
                      <span className={roleColor[u.role] || 'badge-gray'}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    )}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => toggleAtivo(u)}
                      className={`cursor-pointer hover:opacity-80 transition-opacity ${u.ativo ? 'badge-green' : 'badge-red'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="td hidden sm:table-cell text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(u.created_at)}
                  </td>
                  <td className="td">
                    <div className="row-actions">
                      {editing === u.id ? (
                        <>
                          <button onClick={() => save(u.id)}
                            className="btn-icon-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Salvar">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="btn-icon-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Cancelar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditing(u.id); setEditData({}) }}
                          className="btn-icon-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Editar">
                          <Edit className="w-3.5 h-3.5" />
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
    </div>
  )
}
