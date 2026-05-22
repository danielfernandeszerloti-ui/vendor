'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Servico } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Obrigatório'),
  fornecedor_id: z.string().min(1, 'Obrigatório'),
  tipo: z.string().optional(),
  status: z.enum(['operacional','degradado','fora_do_ar','manutencao']),
  ambiente: z.enum(['producao','homologacao','desenvolvimento']),
  criticidade: z.enum(['baixa','media','alta','critica']),
  url: z.string().optional(),
  observacoes: z.string().optional(),
})
type F = z.infer<typeof schema>

export function ServicoModal({ open, onClose, servico, fornecedores, onSuccess }: { open: boolean; onClose: () => void; servico?: Servico | null; fornecedores: { id: string; nome: string }[]; onSuccess: () => void }) {
  const supabase = createClient()
  const isEdit = !!servico
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'operacional', ambiente: 'producao', criticidade: 'media' },
  })

  useEffect(() => {
    if (servico) reset(servico)
    else reset({ status: 'operacional', ambiente: 'producao', criticidade: 'media' })
  }, [servico, reset])

  async function onSubmit(data: F) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')
      if (isEdit) {
        const { error } = await supabase.from('servicos').update({ ...data, updated_by: user.id }).eq('id', servico!.id)
        if (error) throw error
        toast.success('Serviço atualizado!')
      } else {
        const { error } = await supabase.from('servicos').insert({ ...data, created_by: user.id })
        if (error) throw error
        toast.success('Serviço cadastrado!')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar') }
  }

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Serviço</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto scrollbar-thin max-h-[70vh]">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Nome do Serviço *</label><input {...register('nome')} className="input" placeholder="Microsoft 365, AWS EC2..." />{errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}</div>
            <div>
              <label className="label">Fornecedor *</label>
              <select {...register('fornecedor_id')} className="input">
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.fornecedor_id && <p className="text-xs text-red-500 mt-1">{errors.fornecedor_id.message}</p>}
            </div>
            <div><label className="label">Tipo</label><input {...register('tipo')} className="input" placeholder="SaaS, PaaS, IaaS..." /></div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="operacional">Operacional</option>
                <option value="degradado">Degradado</option>
                <option value="fora_do_ar">Fora do ar</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>
            <div>
              <label className="label">Ambiente *</label>
              <select {...register('ambiente')} className="input">
                <option value="producao">Produção</option>
                <option value="homologacao">Homologação</option>
                <option value="desenvolvimento">Desenvolvimento</option>
              </select>
            </div>
            <div>
              <label className="label">Criticidade *</label>
              <select {...register('criticidade')} className="input">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div><label className="label">URL</label><input {...register('url')} className="input" placeholder="https://..." /></div>
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
