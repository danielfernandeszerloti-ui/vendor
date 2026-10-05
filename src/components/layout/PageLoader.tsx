'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PageLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ background: '#1a1f6e' }}>
      <div className="h-full animate-pulse" style={{ background: 'linear-gradient(90deg, #1a1f6e, #00c8b4, #e91e8c)' }} />
    </div>
  )
}