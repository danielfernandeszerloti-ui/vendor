import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function getDaysUntilExpiry(dataVencimento: string) {
  const vencimento = new Date(dataVencimento)
  const hoje = new Date()
  return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export function isContractExpired(dataVencimento: string) {
  return isBefore(new Date(dataVencimento), new Date())
}

export function isContractExpiringSoon(dataVencimento: string, dias = 30) {
  const vencimento = new Date(dataVencimento)
  const limite = addDays(new Date(), dias)
  return isBefore(vencimento, limite) && !isContractExpired(dataVencimento)
}

export const CATEGORIA_LABELS: Record<string, string> = {
  infraestrutura: 'Infraestrutura', software: 'Software', cloud: 'Cloud',
  telecomunicacoes: 'Telecomunicações', seguranca: 'Segurança',
  consultoria: 'Consultoria', hardware: 'Hardware', outros: 'Outros',
}

export const CRITICIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
}

export const STATUS_SERVICO_LABELS: Record<string, string> = {
  operacional: 'Operacional', degradado: 'Degradado',
  fora_do_ar: 'Fora do ar', manutencao: 'Manutenção',
}

export const STATUS_INCIDENTE_LABELS: Record<string, string> = {
  aberto: 'Aberto', em_andamento: 'Em andamento',
  resolvido: 'Resolvido', fechado: 'Fechado',
}

export const IMPACTO_LABELS: Record<string, string> = {
  baixo: 'Baixo', medio: 'Médio', alto: 'Alto', critico: 'Crítico',
}

export const STATUS_CONTRATO_LABELS: Record<string, string> = {
  ativo: 'Ativo', vencido: 'Vencido',
  cancelado: 'Cancelado', em_renovacao: 'Em renovação',
}
