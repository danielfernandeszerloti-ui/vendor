'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export function GastoChart({ data }: { data: Array<{ valor_mensal?: number | null; fornecedor?: { nome: string } | null }> }) {
  const grouped = data.reduce((acc: Record<string, number>, c) => {
    const nome = c.fornecedor?.nome || 'Outros'
    acc[nome] = (acc[nome] || 0) + (c.valor_mensal || 0)
    return acc
  }, {})

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Gastos por Fornecedor</h3>
          <p className="text-xs text-gray-500">Custo mensal consolidado</p>
        </div>
        <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
          {formatCurrency(data.reduce((s, c) => s + (c.valor_mensal || 0), 0))}
        </p>
      </div>
      {chartData.length === 0
        ? <p className="text-sm text-gray-500 text-center py-12">Nenhum dado financeiro disponível</p>
        : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Mensal']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )
}
