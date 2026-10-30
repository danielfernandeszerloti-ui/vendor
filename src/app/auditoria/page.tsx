import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { Pagination } from '@/components/layout/Pagination'

export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase.from('usuarios').select('role').eq('id', user.id).single()
  if (me?.role !== 'administrador') redirect('/dashboard')

  const page = Math.max(1, Number(searchParams.page) || 1)
  const per  = 30
  const from = (page - 1) * per

  const { data: logs, count } = await supabase
    .from('logs_auditoria')
    .select('*, usuario:usuarios(nome, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + per - 1)

  const acaoColor: Record<string, string> = {
    INSERT: 'badge-green', UPDATE: 'badge-blue',
    DELETE: 'badge-red', LOGIN: 'badge-gray',
  }

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title="Auditoria"
        crumbs={[{ label: 'Admin', href: '/dashboard' }, { label: 'Auditoria' }]}
      />
      <div className="flex-1 flex flex-col overflow-hidden animate-in">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="table-container flex-1">
            {(logs?.length ?? 0) === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Shield className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="empty-title">Nenhum log registrado</p>
                <p className="empty-desc">As ações do sistema aparecerão aqui</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">Data / Hora</th>
                    <th className="th">Usuário</th>
                    <th className="th">Ação</th>
                    <th className="th hidden md:table-cell">Entidade</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map(log => (
                    <tr key={log.id} className="tr">
                      <td className="td tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="td">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {(log.usuario as any)?.nome || '—'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {(log.usuario as any)?.email}
                        </p>
                      </td>
                      <td className="td">
                        <span className={acaoColor[log.acao] || 'badge-gray'}>{log.acao}</span>
                      </td>
                      <td className="td hidden md:table-cell text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                        {log.entidade_tipo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination total={count || 0} page={page} perPage={per} />
        </div>
      </div>
    </div>
  )
}
