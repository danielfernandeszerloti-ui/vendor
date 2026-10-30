'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  total:   number
  page:    number
  perPage: number
}

export function Pagination({ total, page, perPage }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const totalPages  = Math.ceil(total / perPage)

  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  // Páginas visíveis: sempre mostra 5 ao redor da atual
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="pagination">
      <p className="pagination-info">
        {from.toLocaleString('pt-BR')}–{to.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')} registros
      </p>
      <div className="pagination-controls">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="page-btn disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) => (
          p === '...'
            ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm"
                style={{ color: 'var(--text-muted)' }}>…</span>
            : <button
                key={p}
                onClick={() => goTo(p)}
                className={`page-btn ${p === page ? 'page-btn-active' : ''}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
        ))}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="page-btn disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
