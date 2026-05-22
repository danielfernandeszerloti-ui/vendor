export type UserRole = 'administrador' | 'ti' | 'visualizacao'
export type Status = 'ativo' | 'inativo'
export type Criticidade = 'baixa' | 'media' | 'alta' | 'critica'
export type StatusContrato = 'ativo' | 'vencido' | 'cancelado' | 'em_renovacao'
export type StatusServico = 'operacional' | 'degradado' | 'fora_do_ar' | 'manutencao'
export type AmbienteServico = 'producao' | 'homologacao' | 'desenvolvimento'
export type StatusIncidente = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'
export type ImpactoIncidente = 'baixo' | 'medio' | 'alto' | 'critico'
export type CategoriaFornecedor =
  | 'infraestrutura' | 'software' | 'cloud' | 'telecomunicacoes'
  | 'seguranca' | 'consultoria' | 'hardware' | 'outros'

export interface Usuario {
  id: string
  email: string
  nome: string
  cargo?: string
  role: UserRole
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Fornecedor {
  id: string
  nome: string
  categoria: CategoriaFornecedor
  cnpj?: string
  contato_comercial?: string
  contato_tecnico?: string
  telefone?: string
  email?: string
  site?: string
  sla?: string
  observacoes?: string
  status: Status
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface Contrato {
  id: string
  fornecedor_id: string
  numero_contrato?: string
  data_inicio: string
  data_vencimento: string
  renovacao_automatica: boolean
  valor_mensal?: number
  criticidade: Criticidade
  responsavel_interno?: string
  observacoes?: string
  status: StatusContrato
  arquivo_url?: string
  arquivo_nome?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  fornecedor?: Fornecedor
}

export interface Servico {
  id: string
  nome: string
  fornecedor_id: string
  tipo?: string
  status: StatusServico
  ambiente: AmbienteServico
  criticidade: Criticidade
  url?: string
  observacoes?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  fornecedor?: Fornecedor
}

export interface Incidente {
  id: string
  titulo: string
  descricao: string
  fornecedor_id: string
  data_abertura: string
  data_resolucao?: string
  status: StatusIncidente
  sla_horas?: number
  tempo_resolucao_horas?: number
  protocolo?: string
  impacto: ImpactoIncidente
  responsavel_interno?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  fornecedor?: Fornecedor
  historico?: IncidenteHistorico[]
}

export interface IncidenteHistorico {
  id: string
  incidente_id: string
  descricao: string
  status_anterior?: StatusIncidente
  status_novo?: StatusIncidente
  created_by: string
  created_at: string
  usuario?: { nome: string }
}
