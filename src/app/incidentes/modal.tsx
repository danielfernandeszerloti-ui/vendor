'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Incidente } from '@/types'

const schema = z.object({
  titulo: z.string().min(3, 'Obrigatório'),
  descricao: z.string().min(5, 'Obrigatório'),
  fornecedor_id: z.string().min(1, 'Obrigatório'),
  data_abertura: z.string().min(1, 'Obrigatório'),
  status: z.enum(['aberto','em_andamento','resolvido','fechado']),
  impacto: z.enum(['baixo','medio','alto','critico']),
  protocolo: z.string().optional(),
  sla_horas: z.coerce.number().optional(),
  responsavel_interno: z.string().optional(),
  data_resolucao: z.string().optional(),
})
type F = z.infer<typeof schema>

export function IncidenteModal({ open, onClose, incidente, fornecedores, onSuccess }: { open: boolean; onClose: () => void; incidente?: Incidente | null; fornecedores: { id: string; nome: string }[]; onSuccess: () => void }) {
  const supabase = createClient()
  const isEdit = !!incidente
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'aberto', impacto: 'medio', data_abertura: new Date().toISOString().slice(0, 16) },
  })

  useEffect(() => {
    if (incidente) reset({ ...incidente, data_abertura: incidente.data_abertura?.slice(0, 16), data_resolucao: incidente.data_resolucao?.slice(0, 16), sla_horas: incidente.sla_horas ?? undefined })
    else reset({ status: 'aberto', impacto: 'medio', data_abertura: new Date().toISOString().slice(0, 16) })
  }, [incidente, reset])

  async function onSubmit(data: F) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')
      if (isEdit) {
        const { error } = await supabase.from('incidentes').update({ ...data, updated_by: user.id }).eq('id', incidente!.id)
        if (error) throw error
        toast.success('Incidente atualizado!')
      } else {
        const { error } = await supabase.from('incidentes').insert({ ...data, created_by: user.id })
        if (error) throw error
        toast.success('Incidente registrado!')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar') }
  }

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Incidente</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto scrollbar-thin max-h-[70vh]">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Título *</label>
              <input {...register('titulo')} className="input" placeholder="Descreva o problema resumidamente" />
              {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="label">Fornecedor *</label>
              <select {...register('fornecedor_id')} className="input">
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.fornecedor_id && <p className="text-xs text-red-500 mt-1">{errors.fornecedor_id.message}</p>}
            </div>
            <div><label className="label">Protocolo</label><input {...register('protocolo')} className="input" placeholder="Número do protocolo" /></div>
            <div>
              <label className="label">Impacto *</label>
              <select {...register('impacto')} className="input">
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em andamento</option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
              </select>
            </div>
            <div>
              <label className="label">Data/Hora de Abertura *</label>
              <input {...register('data_abertura')} type="datetime-local" className="input" />
              {errors.data_abertura && <p className="text-xs text-red-500 mt-1">{errors.data_abertura.message}</p>}
            </div>
            <div><label className="label">Data/Hora de Resolução</label><input {...register('data_resolucao')} type="datetime-local" className="input" /></div>
            <div><label className="label">SLA (horas)</label><input {...register('sla_horas')} type="number" className="input" placeholder="Ex: 4" /></div>
            <div><label className="label">Responsável Interno</label><input {...register('responsavel_interno')} className="input" placeholder="Nome do responsável" /></div>
            <div className="md:col-span-2">
              <label className="label">Descrição *</label>
              <textarea {...register('descricao')} className="input resize-none" rows={4} placeholder="Descreva detalhadamente o incidente..." />
              {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</span> : isEdit ? 'Atualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
