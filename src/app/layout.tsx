import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import { PageLoader } from '@/components/layout/PageLoader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zerbini do Brasil',
  description: 'Sistema de Gerenciamento de Fornecedores de TI',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
      </head>
      <body>
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
