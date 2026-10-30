'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, FileText, Server, AlertTriangle,
  Users, Shield, LogOut, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Usuario } from '@/types'
import Image from 'next/image'

const MAIN_NAV = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Visão geral',
    roles: ['administrador', 'ti', 'visualizacao', 'financeiro'],
  },
  {
    href: '/fornecedores',
    icon: Building2,
    label: 'Fornecedores',
    roles: ['administrador', 'ti', 'visualizacao'],
  },
  {
    href: '/contratos',
    icon: FileText,
    label: 'Faturas e contratos',
    roles: ['administrador', 'ti', 'visualizacao', 'financeiro'],
  },
  {
    href: '/servicos',
    icon: Server,
    label: 'Serviços de TI',
    roles: ['administrador', 'ti', 'visualizacao'],
  },
  {
    href: '/incidentes',
    icon: AlertTriangle,
    label: 'Incidentes',
    roles: ['administrador', 'ti', 'visualizacao'],
  },
]

const ADMIN_NAV = [
  { href: '/usuarios',  icon: Users,  label: 'Usuários' },
  { href: '/auditoria', icon: Shield,  label: 'Auditoria' },
]

const ROLE_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  ti:            'Analista de TI',
  visualizacao:  'Visualização',
  financeiro:    'Financeiro',
}

interface Props {
  user: Usuario | null
}

export function Sidebar({ user }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    toast.success('Sessão encerrada')
    router.push('/auth/login')
    router.refresh()
  }, [supabase, router])

  const isAdmin    = user?.role === 'administrador'
  const visibleMain = MAIN_NAV.filter(item => item.roles.includes(user?.role || ''))
  const initials   = user ? user.nome.charAt(0).toUpperCase() : '?'

  function NavLink({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
    const active =
      pathname === href ||
      (href !== '/dashboard' && pathname.startsWith(href + '/')) ||
      (href === '/dashboard' && pathname === '/dashboard')

    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn('nav-item', active && 'nav-item-active', collapsed && 'justify-center')}
        style={collapsed ? { padding: '11px' } : undefined}
      >
        <Icon className="w-[15px] h-[15px] flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const sidebarContent = (
    <div
      className={cn(
        'h-full flex flex-col overflow-hidden transition-all duration-200',
        collapsed ? 'w-[64px]' : 'w-[250px]'
      )}
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* ── Workspace card ── */}
      <div
        className={cn(
          'flex-shrink-0 mx-3 mt-6 mb-5 rounded-lg border',
          collapsed ? 'p-2 flex items-center justify-center' : 'p-3'
        )}
        style={{
          background: 'var(--bg-subtle)',
          borderColor: 'var(--line)',
        }}
      >
        {collapsed ? (
          /* Logo compacto */
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#e8edfc', color: 'var(--navy)' }}
          >
            <Image src="/logo.png" alt="Z" width={20} height={20} className="object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="w-[33px] h-[33px] rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#e8edfc', color: 'var(--navy)' }}
            >
              <Image src="/logo.png" alt="Zerbini" width={22} height={22} className="object-contain" />
            </div>
            <div className="overflow-hidden leading-tight flex-1 min-w-0">
              <p
                className="font-bold truncate"
                style={{ fontSize: 14, color: 'var(--navy)', letterSpacing: '-0.3px' }}
              >
                Zerbini do Brasil
              </p>
              <p
                className="flex items-center gap-1 truncate"
                style={{ fontSize: 8, letterSpacing: '1.2px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 550 }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--aqua)' }}
                />
                Gestão de Fornecedores
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navegação principal ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '0 10px' }}>
        {!collapsed && (
          <span className="nav-section-label">Menu</span>
        )}
        <div className="space-y-0.5">
          {visibleMain.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {isAdmin && (
          <>
            {!collapsed && (
              <span className="nav-section-label mt-5">Administração</span>
            )}
            <div className="space-y-0.5">
              {ADMIN_NAV.map(item => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* ── Perfil + Sair ── */}
      <div
        className="flex-shrink-0 pt-4 pb-5"
        style={{ borderTop: '1px solid var(--line)', padding: '16px 10px' }}
      >
        {!collapsed && user && (
          <div
            className="flex items-center gap-2.5 mb-3 px-2 py-1.5 rounded-lg"
          >
            {/* Avatar */}
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: '#e9edfb', color: 'var(--navy)' }}
            >
              {initials}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p
                className="font-semibold truncate leading-tight"
                style={{ fontSize: 12, color: 'var(--ink)' }}
              >
                {user.nome}
              </p>
              <p
                className="truncate"
                style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 550 }}
              >
                {ROLE_LABEL[user.role] || user.role}
              </p>
            </div>
          </div>
        )}

        {collapsed && user && (
          <div className="flex justify-center mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#e9edfb', color: 'var(--navy)' }}
              title={user.nome}
            >
              {initials}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'nav-item w-full',
            collapsed && 'justify-center'
          )}
          style={{
            color: '#dc6293',
            fontSize: 12,
            padding: collapsed ? '10px' : '10px 13px',
          }}
        >
          <LogOut className="w-[15px] h-[15px] flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Botão mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-3.5 z-50 w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
        style={{ background: 'var(--navy)', color: '#fff' }}
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 shadow-2xl transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: 250 }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3.5 w-7 h-7 rounded-lg flex items-center justify-center z-10"
          style={{ background: 'var(--bg-subtle)', color: 'var(--muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen flex-shrink-0 relative"
        style={{
          width: collapsed ? 64 : 250,
          transition: 'width 200ms ease',
        }}
      >
        {sidebarContent}

        {/* Toggle collapse */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[70px] z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
          }}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft  className="w-3 h-3" />
          }
        </button>
      </aside>
    </>
  )
}
