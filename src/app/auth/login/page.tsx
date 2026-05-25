'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

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
    } finally { setLoading(false) }
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
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a1f6e 0%, #0f1347 60%, #0a0d30 100%)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00c8b4, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e91e8c, transparent)' }} />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center">
            <Image src="/logo.png" alt="Zerbini" width={56} height={56} className="object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Zerbini do Brasil</p>
            <p className="text-sm font-medium" style={{ color: '#00c8b4' }}>Gestão de TI</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Controle total dos seus fornecedores de TI
          </h1>
          <p className="leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Gerencie contratos, serviços, incidentes e documentos em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Fornecedores', 'Contratos', 'Incidentes', 'Serviços'].map(item => (
              <div key={item} className="rounded-xl p-3 border"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-white font-medium text-sm">{item}</p>
                <p className="text-xs" style={{ color: '#00c8b4' }}>Centralizados</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © 2024 Zerbini do Brasil. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="Zerbini" width={40} height={40} className="object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">Zerbini do Brasil</span>
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
                <input type="email" className="input pl-9" placeholder="seu@zerbini.com.br"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            {mode === 'login' && (
              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPwd ? 'text' : 'password'} className="input pl-9 pr-10"
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full justify-center py-2.5 text-base text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: '#1a1f6e' }}>
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Aguarde...</span>
                : mode === 'login' ? 'Entrar' : 'Enviar email'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login'
              ? <button onClick={() => setMode('reset')} className="text-sm hover:underline font-medium" style={{ color: '#1a1f6e' }}>Esqueci minha senha</button>
              : <button onClick={() => setMode('login')} className="text-sm hover:underline font-medium" style={{ color: '#1a1f6e' }}>← Voltar ao login</button>}
          </div>
        </div>
      </div>
    </div>
  )
}