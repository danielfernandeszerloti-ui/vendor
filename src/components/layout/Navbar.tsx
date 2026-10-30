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
    const stored       = localStorage.getItem('theme')
    const prefersDark  = stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <header
      className="flex-shrink-0"
      style={{
        height: 70,
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-card)',
        padding: '0 34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {/* Lado esquerdo: breadcrumb + título */}
      <div className="flex-1 min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav
            className="breadcrumb"
            aria-label="Navegação"
            style={{ gap: 8, marginBottom: 3 }}
          >
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center" style={{ gap: 6 }}>
                {i > 0 && (
                  <ChevronRight
                    className="flex-shrink-0"
                    style={{ width: 10, height: 10, color: 'var(--text-disabled)' }}
                  />
                )}
                {crumb.href
                  ? (
                    <Link
                      href={crumb.href}
                      style={{ fontSize: 11, color: 'var(--muted)' }}
                      className="hover:underline transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )
                  : (
                    <span style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 600 }}>
                      {crumb.label}
                    </span>
                  )
                }
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-baseline gap-2.5">
          <h1
            className="truncate"
            style={{
              fontSize: 22,
              fontWeight: 650,
              letterSpacing: '-0.8px',
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <span
              className="hidden sm:block truncate"
              style={{ fontSize: 11, color: 'var(--muted)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Lado direito: ações + toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <button
          onClick={toggle}
          className="btn-icon"
          style={{ color: 'var(--muted)' }}
          aria-label={dark ? 'Modo claro' : 'Modo escuro'}
        >
          {dark
            ? <Sun  style={{ width: 16, height: 16 }} />
            : <Moon style={{ width: 16, height: 16 }} />
          }
        </button>
      </div>
    </header>
  )
}
