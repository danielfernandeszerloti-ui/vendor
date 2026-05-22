'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Building2, FileText, Server, AlertTriangle, Users, Shield, LogOut, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Usuario } from '@/types'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/fornecedores', icon: Building2, label: 'Fornecedores' },
  { href: '/contratos', icon: FileText, label: 'Contratos' },
  { href: '/servicos', icon: Server, label: 'Serviços' },
  { href: '/incidentes', icon: AlertTriangle, label: 'Incidentes' },
]
const adminNav = [
  { href: '/usuarios', icon: Users, label: 'Usuários' },
  { href: '/auditoria', icon: Shield, label: 'Auditoria' },
]

export function Sidebar({ user }: { user: Usuario | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()
  const isAdmin = user?.role === 'administrador'

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Sessão encerrada')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className={cn('h-screen flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-200 relative flex-shrink-0', collapsed ? 'w-16' : 'w-56')}>
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 h-16 border-b border-gray-200 dark:border-gray-800 px-4 flex-shrink-0')}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <div className="overflow-hidden"><p className="font-bold text-sm text-gray-900 dark:text-white truncate">VendorManager</p><p className="text-[11px] text-gray-500">Gestão de TI</p></div>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {!collapsed && <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest py-2">Menu</p>}
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn(active ? 'sidebar-link-active' : 'sidebar-link', collapsed && 'justify-center px-0')}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            {!collapsed && <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest py-2 pt-4">Admin</p>}
            {adminNav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                  className={cn(active ? 'sidebar-link-active' : 'sidebar-link', collapsed && 'justify-center px-0')}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button onClick={logout} title={collapsed ? 'Sair' : undefined}
          className={cn('sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10', collapsed && 'justify-center px-0')}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300">{user.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.nome}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
