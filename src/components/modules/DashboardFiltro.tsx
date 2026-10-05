'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Filter } from 'lucide-react'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function DashboardFiltro({ mesAtual, anoAtual }: { mesAtual: number; anoAtual: number }) {
  const router = useRouter()
  const [mes, setMes] = useState(mesAtual)
  const [ano, setAno] = useState(anoAtual)

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  function aplicar() {
    router.push(`/dashboard?mes=${mes}&ano=${ano}`)
  }

  function resetar() {
    const hoje = new Date()
    setMes(hoje.getMonth() + 1)
    setAno(hoje.getFullYear())
    router.push('/dashboard')
  }

  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
        <Filter className="w-4 h-4" />
        Filtrar por período:
      </div>
      <select
        className="input w-40"
        value={mes}
        onChange={e => setMes(Number(e.target.value))}
      >
        {MESES.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        className="input w-28"
        value={ano}
        onChange={e => setAno(Number(e.target.value))}
      >
        {anos.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
      <button onClick={aplicar} className="btn-primary py-2">
        Aplicar
      </button>
      <button onClick={resetar} className="btn-secondary py-2">
        Mês atual
      </button>
    </div>
  )
}