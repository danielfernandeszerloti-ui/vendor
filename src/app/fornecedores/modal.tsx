'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Fornecedor } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Obrigatório'),
  categoria: z.enum(['infraestrutura','software','cloud','telecomunicacoes','seguranca','consultoria','hardware','outros']),
  cnpj: z.string().optional(),
  contato_comercial: z.string().optional(),
  contato_tecnico: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  site: z.string().optional(),
  sla: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['ativo','inativo']),
})
type FormData = z.infer<typeof schema>

export function FornecedorModal({ open, onClose, fornecedor, onSuccess }: { open: boolean; onClose: () => void; fornecedor?: Fornecedor | null; onSuccess: () => void }) {
  const supabase = createClient()
  const isEdit = !!fornecedor
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ativo', categoria: 'software' },
  })

  useEffect(() => { reset(fornecedor ?? { status: 'ativo', categoria: 'software' }) }, [fornecedor, reset])

  async function onSubmit(data: FormData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')
      if (isEdit) {
        const { error } = await supabase.from('fornecedores').update({ ...data, updated_by: user.id }).eq('id', fornecedor!.id)
        if (error) throw error
        toast.success('Fornecedor atualizado!')
      } else {
        const { error } = await supabase.from('fornecedores').insert({ ...data, created_by: user.id })
        if (error) throw error
        toast.success('Fornecedor cadastrado!')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar') }
  }

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Fornecedor</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto scrollbar-thin">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome da empresa *</label>
              <input {...register('nome')} className="input" placeholder="Microsoft Brasil" />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select {...register('categoria')} className="input">
                <option value="software">Software</option>
                <option value="cloud">Cloud</option>
                <option value="infraestrutura">Infraestrutura</option>
                <option value="telecomunicacoes">Telecomunicações</option>
                <option value="seguranca">Segurança</option>
                <option value="consultoria">Consultoria</option>
                <option value="hardware">Hardware</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="label">Status *</label>
              <select {...register('status')} className="input">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div><label className="label">CNPJ</label><input {...register('cnpj')} className="input" placeholder="00.000.000/0000-00" /></div>
            <div><label className="label">Telefone</label><input {...register('telefone')} className="input" placeholder="(11) 99999-0000" /></div>
            <div>
              <label className="label">E-mail</label>
              <input {...register('email')} type="email" className="input" placeholder="contato@empresa.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div><label className="label">Site</label><input {...register('site')} className="input" placeholder="https://empresa.com" /></div>
            <div><label className="label">Contato Comercial</label><input {...register('contato_comercial')} className="input" placeholder="Nome do contato" /></div>
            <div><label className="label">Contato Técnico</label><input {...register('contato_tecnico')} className="input" placeholder="Nome do técnico" /></div>
            <div><label className="label">SLA</label><input {...register('sla')} className="input" placeholder="99.9% / 4h resposta" /></div>
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
