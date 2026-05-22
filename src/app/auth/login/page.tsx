'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Login realizado!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) throw error
      toast.success('Email de recuperação enviado!')
      setMode('login')
    } catch {
      toast.error('Erro ao enviar email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.3) 0%, transparent 40%)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">VendorManager</p>
            <p className="text-brand-300 text-xs">Gestão de TI</p>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Controle total dos seus fornecedores de TI
          </h1>
          <p className="text-brand-300 leading-relaxed">
            Gerencie contratos, serviços, incidentes e documentos em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {['Fornecedores', 'Contratos', 'Incidentes', 'Documentos'].map(item => (
              <div key={item} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-white font-medium text-sm">{item}</p>
                <p className="text-brand-300 text-xs">Centralizados</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-brand-400 text-xs">© 2024 VendorManager TI</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">VendorManager</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Recuperar acesso'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            {mode === 'login' ? 'Entre com suas credenciais' : 'Informe seu email para recuperação'}
          </p>

          <form onSubmit={mode === 'login' ? handleLogin : handleReset} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="input pl-9" placeholder="seu@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            {mode === 'login' && (
              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPwd ? 'text' : 'password'} className="input pl-9 pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Aguarde...</span>
                : mode === 'login' ? 'Entrar' : 'Enviar email'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login'
              ? <button onClick={() => setMode('reset')} className="text-sm text-brand-600 hover:underline">Esqueci minha senha</button>
              : <button onClick={() => setMode('login')} className="text-sm text-brand-600 hover:underline">← Voltar ao login</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
