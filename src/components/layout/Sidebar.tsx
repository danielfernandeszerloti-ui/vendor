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
  { href: '/usuarios', icon: Users,  label: 'Usuários' },
  { href: '/auditoria', icon: Shield, label: 'Auditoria' },
]

const ROLE_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  ti:            'TI',
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

  // Fecha sidebar mobile ao navegar
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Salva preferência de colapso
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

  const isAdmin = user?.role === 'administrador'
  const visibleMain = MAIN_NAV.filter(item => item.roles.includes(user?.role || ''))

  function NavLink({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href === '/dashboard' && pathname === '/dashboard')
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          'nav-item group',
          active && 'nav-item-active',
          collapsed && 'justify-center px-0'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-current')} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const sidebarContent = (
    <div className={cn(
      'h-full flex flex-col overflow-hidden transition-all duration-200',
      collapsed ? 'w-[60px]' : 'w-[220px]'
    )}>
      {/* Logo */}
      <div
        className="flex items-center gap-3 h-14 px-4 flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #232994 0%, #1a1f6e 60%, #0f1347 100%)' }}
      >
        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Zerbini"
            width={28}
            height={28}
            className="object-contain drop-shadow-sm"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden leading-tight">
            <p className="text-[13px] font-bold text-white truncate">Zerbini do Brasil</p>
            <p className="text-[10px] font-medium truncate" style={{ color: '#00c8b4', opacity: 0.9 }}>
              Gestão de Fornecedores
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {!collapsed && (
          <span className="nav-section-label mt-1 mb-0.5">Navegação</span>
        )}
        {visibleMain.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {isAdmin && (
          <>
            {!collapsed && (
              <span className="nav-section-label mt-4 mb-0.5">Administração</span>
            )}
            {ADMIN_NAV.map(item => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div
        className="p-2 flex-shrink-0"
        style={{
          background: 'var(--sidebar-bg)',
          borderTop: '1px solid var(--sidebar-border)',
        }}
      >
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2630a8, #00c8b4)' }}
            >
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.nome}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {ROLE_LABEL[user.role] || user.role}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'nav-item w-full text-red-400 hover:text-red-300 hover:!bg-red-500/10',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
        style={{ background: 'var(--brand-navy)', color: '#fff' }}
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
          'md:hidden fixed inset-y-0 left-0 z-50 shadow-xl transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--sidebar-bg)', width: 220 }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
        >
          <X className="w-4 h-4" />
        </button>
        <div style={{ width: 220 }}>{sidebarContent}</div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen flex-shrink-0 relative"
        style={{
          width: collapsed ? 60 : 220,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'width 200ms ease',
        }}
      >
        {sidebarContent}

        {/* Toggle collapse button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-[52px] z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
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
