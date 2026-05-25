'use client'
import { useEffect, useState } from 'react'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Fornecedor } from '@/types'

export function FornecedorModal({ open, onClose, fornecedor, onSuccess }: { open: boolean; onClose: () => void; fornecedor?: Fornecedor | null; onSuccess: () => void }) {
  const supabase = createClient()
  const isEdit = !!fornecedor
  const [saving, setSaving] = useState(false)
  const [arquivos, setArquivos] = useState<File[]>([])
  const [anexosExistentes, setAnexosExistentes] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '', categoria: 'software', cnpj: '', contato_comercial: '',
    contato_tecnico: '', telefone: '', email: '', site: '', sla: '',
    observacoes: '', status: 'ativo',
  })

  useEffect(() => {
    if (fornecedor) {
      setForm({
        nome: fornecedor.nome || '',
        categoria: fornecedor.categoria || 'software',
        cnpj: fornecedor.cnpj || '',
        contato_comercial: fornecedor.contato_comercial || '',
        contato_tecnico: fornecedor.contato_tecnico || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        site: fornecedor.site || '',
        sla: fornecedor.sla || '',
        observacoes: fornecedor.observacoes || '',
        status: fornecedor.status || 'ativo',
      })
      carregarAnexos(fornecedor.id)
    } else {
      setForm({ nome: '', categoria: 'software', cnpj: '', contato_comercial: '', contato_tecnico: '', telefone: '', email: '', site: '', sla: '', observacoes: '', status: 'ativo' })
      setAnexosExistentes([])
    }
    setArquivos([])
  }, [fornecedor, open])

  async function carregarAnexos(fornecedorId: string) {
    const { data } = await supabase.from('fornecedor_anexos').select('*').eq('fornecedor_id', fornecedorId).order('created_at', { ascending: false })
    setAnexosExistentes(data || [])
  }

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function adicionarArquivos(files: FileList | null) {
    if (!files) return
    const novos = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024)
    if (novos.length < Array.from(files).length) toast.error('Alguns arquivos excedem 10MB e foram ignorados')
    setArquivos(prev => [...prev, ...novos])
  }

  function removerArquivoNovo(index: number) {
    setArquivos(prev => prev.filter((_, i) => i !== index))
  }

  async function removerAnexo(anexo: any) {
    const { error } = await supabase.from('fornecedor_anexos').delete().eq('id', anexo.id)
    if (error) { toast.error('Erro ao remover'); return }
    setAnexosExistentes(prev => prev.filter(a => a.id !== anexo.id))
    toast.success('Arquivo removido')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autorizado')

      let fornecedorId = (fornecedor as any)?.id

      if (isEdit) {
        const { error } = await supabase.from('fornecedores').update({ ...form, updated_by: user.id }).eq('id', fornecedorId)
        if (error) throw error
      } else {
        const { data: novo, error } = await supabase.from('fornecedores').insert({ ...form, created_by: user.id }).select().single()
        if (error) throw error
        fornecedorId = novo.id
      }

      // Upload dos arquivos novos
      for (const arquivo of arquivos) {
        const ext = arquivo.name.split('.').pop()
        const nomeArquivo = `${fornecedorId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('fornecedores').upload(nomeArquivo, arquivo, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('fornecedores').getPublicUrl(nomeArquivo)
          await supabase.from('fornecedor_anexos').insert({
            fornecedor_id: fornecedorId,
            nome_original: arquivo.name,
            nome_arquivo: nomeArquivo,
            url: publicUrl,
            tamanho_bytes: arquivo.size,
            created_by: user.id,
          })
        }
      }

      toast.success(isEdit ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box w-full max-w-2xl animate-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Editar' : 'Novo'} Fornecedor</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto scrollbar-thin max-h-[75vh]">
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome da empresa *</label>
              <input className="input" placeholder="Microsoft Brasil" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
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
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div><label className="label">CNPJ</label><input className="input" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} /></div>
            <div><label className="label">Telefone</label><input className="input" placeholder="(11) 99999-0000" value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
            <div><label className="label">E-mail</label><input type="email" className="input" placeholder="contato@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Site</label><input className="input" placeholder="https://empresa.com" value={form.site} onChange={e => set('site', e.target.value)} /></div>
            <div><label className="label">Contato Comercial</label><input className="input" placeholder="Nome do contato" value={form.contato_comercial} onChange={e => set('contato_comercial', e.target.value)} /></div>
            <div><label className="label">Contato Técnico</label><input className="input" placeholder="Nome do técnico" value={form.contato_tecnico} onChange={e => set('contato_tecnico', e.target.value)} /></div>
            <div><label className="label">SLA</label><input className="input" placeholder="99.9% / 4h resposta" value={form.sla} onChange={e => set('sla', e.target.value)} /></div>
            <div className="md:col-span-2"><label className="label">Observações</label><textarea className="input resize-none" rows={2} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} /></div>

            {/* Anexos */}
            <div className="md:col-span-2">
              <label className="label">Contratos / Documentos</label>

              {/* Arquivos existentes */}
              {anexosExistentes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {anexosExistentes.map(anexo => (
                    <div key={anexo.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{anexo.nome_original}</a>
                          {anexo.tamanho_bytes && <p className="text-xs text-gray-400">{formatSize(anexo.tamanho_bytes)}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => removerAnexo(anexo)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Arquivos novos a enviar */}
              {arquivos.length > 0 && (
                <div className="space-y-2 mb-3">
                  {arquivos.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-blue-700 dark:text-blue-300 truncate">{f.name}</p>
                          <p className="text-xs text-blue-500">{formatSize(f.size)} — aguardando envio</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removerArquivoNovo(i)} className="w-7 h-7 rounded flex items-center justify-center text-blue-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Área de upload */}
              <label className="flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/50">
                <Upload className="w-5 h-5 text-gray-400 mb-1.5" />
                <p className="text-sm text-gray-500">Clique para adicionar arquivos</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, PNG, JPG até 10MB cada</p>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple className="hidden" onChange={e => adicionarArquivos(e.target.files)} />
              </label>
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