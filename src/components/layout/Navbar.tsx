'use client'
import { Moon, Sun, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

interface Props {
  title:     string
  subtitle?: string
  crumbs?:   Crumb[]
  actions?:  React.ReactNode
}

export function Navbar({ title, subtitle, crumbs, actions }: Props) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (prefersDark) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <header className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex-1 min-w-0">
          {crumbs && crumbs.length > 0 && (
            <nav className="breadcrumb mb-0.5" aria-label="Navegação">
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 breadcrumb-sep flex-shrink-0" />}
                  {crumb.href
                    ? <Link href={crumb.href}>{crumb.label}</Link>
                    : <span className="text-[var(--text-secondary)]">{crumb.label}</span>
                  }
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-baseline gap-2">
            <h1 className="page-title truncate">{title}</h1>
            {subtitle && (
              <span className="text-sm text-[var(--text-muted)] hidden sm:block">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
          <button
            onClick={toggle}
            className="btn-icon text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            aria-label={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
