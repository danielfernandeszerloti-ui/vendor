import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Shield } from 'lucide-react'

export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase.from('usuarios').select('role').eq('id', user.id).single()
  if (me?.role !== 'administrador') redirect('/dashboard')

  const page = Number(searchParams.page) || 1
  const per = 30
  const from = (page - 1) * per

  const { data: logs, count } = await supabase
    .from('logs_auditoria')
    .select('*, usuario:usuarios(nome, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + per - 1)

  const totalPages = Math.ceil((count || 0) / per)

  const acaoColor: Record<string, string> = {
    INSERT: 'badge-green',
    UPDATE: 'badge-blue',
    DELETE: 'badge-red',
    LOGIN: 'badge-gray',
  }

  return (
    <div>
      <Navbar title="Auditoria" subtitle="Histórico de ações no sistema" />
      <div className="p-6 animate-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="page-title">Logs de Auditoria</h2>
            <p className="page-subtitle">{count || 0} registros</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          {(logs?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                <Shield className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-medium text-gray-500">Nenhum log registrado ainda</p>
              <p className="text-sm text-gray-400 mt-1">As ações do sistema aparecerão aqui</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="table-header">Data/Hora</th>
                  <th className="table-header">Usuário</th>
                  <th className="table-header">Ação</th>
                  <th className="table-header">Entidade</th>
                </tr>
              </thead>
              <tbody>
                {logs?.map(log => (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell text-xs text-gray-500">{formatDateTime(log.created_at)}</td>
                    <td className="table-cell">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{(log.usuario as any)?.nome || '—'}</p>
                      <p className="text-xs text-gray-400">{(log.usuario as any)?.email}</p>
                    </td>
                    <td className="table-cell">
                      <span className={acaoColor[log.acao] || 'badge-gray'}>{log.acao}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500 capitalize">{log.entidade_tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && <a href={`/auditoria?page=${page - 1}`} className="btn-secondary text-xs py-1 px-3">← Anterior</a>}
                {page < totalPages && <a href={`/auditoria?page=${page + 1}`} className="btn-secondary text-xs py-1 px-3">Próxima →</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
