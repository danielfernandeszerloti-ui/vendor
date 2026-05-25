'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ href, label = 'Voltar' }: { href?: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      className="btn-back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}