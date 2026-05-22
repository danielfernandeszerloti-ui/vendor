'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Contrato } from '@/types'

const schema = z.object({
  fornecedor_id: z.string().min(1, 'Obrigatório'),
  numero_contrato: z.string().optional(),
  data_inicio: z.string().min(1, 'Obrigatório'),
  data_vencimento: z.string().min(1, 'Obrigatório'),
  renovacao_automatica: z.boolean(),
  valor_mensal: z.coerce.number().optional(),
  criticidade: z.enum(['baixa','media','alta','critica']),
  responsavel_interno: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['ativo','vencido','cancelado','em_renovacao']),
})
type F = z.infer<typeof schema>

export function ContratoModal({ open, onClose, contrato, fornecedores, onSuccess }: { open: boolean; onClose: () => void; contrato?: Contrato | null; fornecedores: { id: string; nome: string }[]; onSuccess: () => void }) {
  const supabase = createClient()
  const isEdit = !!contrato
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ativo', criticidade: 'media', renovacao_automatica: false },
  })

  useEffect(() => {
    if (contrato) reset({ ...contrato, valor_mensal: contrato.valor_mensal ?? undefined })
    else reset({ status: 'ativo', criticidade: 'media', renovacao_automatica: false })
  }, [contrato, reset])

  async function onSubmit(data: F) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')
      if (isEdit) {
        const { error } = await supabase.from('contratos').update({ ...data, updated_by: user.id }).eq('id', contrato!.id)
        if (error) throw error
        toast.success('Contrato atualizado!')
      } else {
        const { error } = await supabase.from('contratos').insert({ ...data, created_by: user.id })
        if (error) throw error
        toast.success('Contrato cadastrado!')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar') }
  }

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Contrato</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto scrollbar-thin max-h-[70vh]">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Fornecedor *</label>
              <select {...register('fornecedor_id')} className="input">
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.fornecedor_id && <p className="text-xs text-red-500 mt-1">{errors.fornecedor_id.message}</p>}
            </div>
            <div><label className="label">Número do Contrato</label><input {...register('numero_contrato')} className="input" placeholder="CTR-2024-001" /></div>
            <div><label className="label">Responsável Interno</label><input {...register('responsavel_interno')} className="input" placeholder="Nome do responsável" /></div>
            <div>
              <label className="label">Data de Início *</label>
              <input {...register('data_inicio')} type="date" className="input" />
              {errors.data_inicio && <p className="text-xs text-red-500 mt-1">{errors.data_inicio.message}</p>}
            </div>
            <div>
              <label className="label">Data de Vencimento *</label>
              <input {...register('data_vencimento')} type="date" className="input" />
              {errors.data_vencimento && <p className="text-xs text-red-500 mt-1">{errors.data_vencimento.message}</p>}
            </div>
            <div><label className="label">Valor Mensal (R$)</label><input {...register('valor_mensal')} type="number" step="0.01" className="input" placeholder="0,00" /></div>
            <div>
              <label className="label">Criticidade *</label>
              <select {...register('criticidade')} className="input">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="ativo">Ativo</option>
                <option value="em_renovacao">Em renovação</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input {...register('renovacao_automatica')} type="checkbox" id="renovacao" className="w-4 h-4 rounded border-gray-300 text-brand-600" />
              <label htmlFor="renovacao" className="text-sm text-gray-700 dark:text-gray-300">Renovação automática</label>
            </div>
            <div className="md:col-span-2"><label className="label">Observações</label><textarea {...register('observacoes')} className="input resize-none" rows={3} /></div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</span> : isEdit ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
