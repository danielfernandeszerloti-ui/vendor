'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { Plus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Historico {
  id: string
  descricao: string
  created_at: string
  usuario?: { nome: string } | null
}

export function IncidenteHistoricoPanel({ incidenteId, historico }: { incidenteId: string; historico: Historico[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  async function addHistorico() {
    if (!descricao.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')
      const { error } = await supabase.from('incidentes_historico').insert({
        incidente_id: incidenteId, descricao, created_by: user.id
      })
      if (error) throw error
      toast.success('Atualização registrada!')
      setDescricao('')
      router.refresh()
    } catch (e: any) { toast.error(e.message || 'Erro') }
    finally { setLoading(false) }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-4 h-4 text-brand-600" />
        <h2 className="font-bold text-gray-900 dark:text-white">Histórico de Atualizações</h2>
      </div>

      <div className="space-y-4 mb-6">
        {historico.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nenhuma atualização registrada</p>
        ) : (
          historico.map(h => (
            <div key={h.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300">
                  {h.usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{h.usuario?.nome || 'Sistema'}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(h.created_at)}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{h.descricao}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-5">
        <label className="label">Adicionar atualização</label>
        <textarea
          className="input resize-none mb-3"
          rows={3}
          placeholder="Descreva a atualização, ação tomada ou evolução do incidente..."
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
        />
        <button onClick={addHistorico} disabled={loading || !descricao.trim()} className="btn-primary">
          {loading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</span> : <><Plus className="w-4 h-4" />Registrar Atualização</>}
        </button>
      </div>
    </div>
  )
}
