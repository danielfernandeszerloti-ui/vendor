'use client'
import { useEffect, useState } from 'react'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function ContratoModal({ open, onClose, contrato, fornecedores, onSuccess }: {
  open: boolean; onClose: () => void; contrato?: any | null;
  fornecedores: { id: string; nome: string }[]; onSuccess: () => void
}) {
  const supabase = createClient()
  const isEdit = !!contrato
  const [saving, setSaving] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoAtual, setArquivoAtual] = useState<{ nome: string; url: string } | null>(null)

  const [form, setForm] = useState({
    fornecedor_id: '', numero_contrato: '', data_inicio: '', data_vencimento: '',
    renovacao_automatica: false, valor_mensal: '', criticidade: 'media',
    responsavel_interno: '', observacoes: '', status: 'ativo',
    status_pagamento: 'pendente', mes_competencia: '', ano_competencia: '', data_pagamento: '',
  })

  useEffect(() => {
    if (contrato) {
      setForm({
        fornecedor_id: contrato.fornecedor_id || '',
        numero_contrato: contrato.numero_contrato || '',
        data_inicio: contrato.data_inicio || '',
        data_vencimento: contrato.data_vencimento || '',
        renovacao_automatica: contrato.renovacao_automatica || false,
        valor_mensal: contrato.valor_mensal || '',
        criticidade: contrato.criticidade || 'media',
        responsavel_interno: contrato.responsavel_interno || '',
        observacoes: contrato.observacoes || '',
        status: contrato.status || 'ativo',
        status_pagamento: contrato.status_pagamento || 'pendente',
        mes_competencia: contrato.mes_competencia || '',
        ano_competencia: contrato.ano_competencia || '',
        data_pagamento: contrato.data_pagamento || '',
      })
      if (contrato.arquivo_boleto_nome && contrato.arquivo_boleto_url) {
        setArquivoAtual({ nome: contrato.arquivo_boleto_nome, url: contrato.arquivo_boleto_url })
      } else {
        setArquivoAtual(null)
      }
    } else {
      setForm({
        fornecedor_id: '', numero_contrato: '', data_inicio: '', data_vencimento: '',
        renovacao_automatica: false, valor_mensal: '', criticidade: 'media',
        responsavel_interno: '', observacoes: '', status: 'ativo',
        status_pagamento: 'pendente', mes_competencia: '', ano_competencia: '', data_pagamento: '',
      })
      setArquivoAtual(null)
    }
    setArquivo(null)
  }, [contrato, open])

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fornecedor_id) { toast.error('Selecione um fornecedor'); return }
    if (!form.data_inicio) { toast.error('Informe a data de início'); return }
    if (!form.data_vencimento) { toast.error('Informe a data de vencimento'); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')

      const payload = {
        fornecedor_id: form.fornecedor_id,
        numero_contrato: form.numero_contrato || null,
        data_inicio: form.data_inicio,
        data_vencimento: form.data_vencimento,
        renovacao_automatica: form.renovacao_automatica,
        valor_mensal: form.valor_mensal ? Number(form.valor_mensal) : null,
        criticidade: form.criticidade,
        responsavel_interno: form.responsavel_interno || null,
        observacoes: form.observacoes || null,
        status: form.status,
        status_pagamento: form.status_pagamento,
        mes_competencia: form.mes_competencia ? Number(form.mes_competencia) : null,
        ano_competencia: form.ano_competencia ? Number(form.ano_competencia) : null,
        data_pagamento: form.data_pagamento || null,
      }

      let contratoId = contrato?.id

      if (isEdit) {
        const { error } = await supabase.from('contratos').update({ ...payload, updated_by: user.id }).eq('id', contratoId)
        if (error) throw error
      } else {
        const { data: novo, error } = await supabase.from('contratos').insert({ ...payload, created_by: user.id }).select().single()
        if (error) throw error
        contratoId = novo.id
      }

      if (arquivo && contratoId) {
        const ext = arquivo.name.split('.').pop()
        const nomeArquivo = `${contratoId}_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('contratos').upload(nomeArquivo, arquivo, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('contratos').getPublicUrl(nomeArquivo)
          await supabase.from('contratos').update({ arquivo_boleto_url: publicUrl, arquivo_boleto_nome: arquivo.name }).eq('id', contratoId)
        }
      }

      toast.success(isEdit ? 'Contrato atualizado!' : 'Contrato cadastrado!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function removerArquivo() {
    if (!contrato?.id) return
    await supabase.from('contratos').update({ arquivo_boleto_url: null, arquivo_boleto_nome: null }).eq('id', contrato.id)
    setArquivoAtual(null)
    toast.success('Arquivo removido')
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Contrato</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto scrollbar-thin max-h-[75vh]">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="label">Fornecedor *</label>
              <select className="input" value={form.fornecedor_id} onChange={e => set('fornecedor_id', e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Número do Contrato</label>
              <input className="input" placeholder="CTR-2024-001" value={form.numero_contrato} onChange={e => set('numero_contrato', e.target.value)} />
            </div>
            <div>
              <label className="label">Responsável Interno</label>
              <input className="input" placeholder="Nome do responsável" value={form.responsavel_interno} onChange={e => set('responsavel_interno', e.target.value)} />
            </div>
            <div>
              <label className="label">Data de Início *</label>
              <input type="date" className="input" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
            </div>
            <div>
              <label className="label">Data de Vencimento *</label>
              <input type="date" className="input" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} />
            </div>
            <div>
              <label className="label">Valor Mensal (R$)</label>
              <input type="number" step="0.01" className="input" placeholder="0,00" value={form.valor_mensal} onChange={e => set('valor_mensal', e.target.value)} />
            </div>
            <div>
              <label className="label">Criticidade *</label>
              <select className="input" value={form.criticidade} onChange={e => set('criticidade', e.target.value)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Status do Contrato *</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="em_renovacao">Em renovação</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="label">Status de Pagamento *</label>
              <select className="input" value={form.status_pagamento} onChange={e => set('status_pagamento', e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div>
              <label className="label">Mês de Competência</label>
              <select className="input" value={form.mes_competencia} onChange={e => set('mes_competencia', e.target.value)}>
                <option value="">Selecione...</option>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano de Competência</label>
              <input type="number" className="input" placeholder={String(new Date().getFullYear())} value={form.ano_competencia} onChange={e => set('ano_competencia', e.target.value)} />
            </div>
            {form.status_pagamento === 'pago' && (
              <div>
                <label className="label">Data de Pagamento</label>
                <input type="date" className="input" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="renovacao" className="w-4 h-4 rounded border-gray-300"
                checked={form.renovacao_automatica} onChange={e => set('renovacao_automatica', e.target.checked)} />
              <label htmlFor="renovacao" className="text-sm text-gray-700 dark:text-gray-300">Renovação automática</label>
            </div>

            <div className="md:col-span-2">
              <label className="label">Boleto / Documento PDF</label>
              {arquivoAtual ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <a href={arquivoAtual.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-xs">{arquivoAtual.nome}</a>
                  </div>
                  <button type="button" onClick={removerArquivo} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{arquivo ? arquivo.name : 'Clique para selecionar PDF ou imagem'}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG até 10MB</p>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e => setArquivo(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</span> : isEdit ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}