/**
 * Tipos TypeScript centralizados para o Beef Sync
 * Sistema de gestÃ£o pecuÃ¡ria
 */

// ============ TIPOS BASE ============

export type Sexo = 'Macho' | 'FÃªmea';
export type Situacao = 'Ativo' | 'Vendido' | 'Morto' | 'Transferido';
export type TipoOperacao = 'entrada' | 'saida' | 'uso';
export type StatusSemen = 'disponivel' | 'esgotado' | 'vencido';
export type TipoNF = 'entrada' | 'saida';
export type TipoProduto = 'bovino' | 'semen' | 'embriao';
export type StatusProtocolo = 'em_andamento' | 'concluido' | 'cancelado';
export type TipoNotificacao = 'nascimento' | 'estoque' | 'gestacao' | 'saude' | 'financeiro' | 'sistema';
export type PrioridadeNotificacao = 'low' | 'medium' | 'high';
export type TipoServico = 'VacinaÃ§Ã£o' | 'ReproduÃ§Ã£o' | 'Tratamento' | 'ManutenÃ§Ã£o' | 'Outro';
export type StatusServico = 'Ativo' | 'ConcluÃ­do' | 'Pendente' | 'Cancelado';

// ============ INTERFACES DE ENTIDADES ============

export interface Animal {
  id?: number;
  serie: string;
  rg: string;
  tatuagem?: string;
  sexo: Sexo;
  raca: string;
  data_nascimento?: Date | string;
  hora_nascimento?: string;
  peso?: number;
  cor?: string;
  tipo_nascimento?: string;
  dificuldade_parto?: string;
  meses?: number;
  situacao?: Situacao;
  pai?: string;
  mae?: string;
  receptora?: string;
  is_fiv?: boolean;
  custo_total?: number;
  valor_venda?: number;
  valor_real?: number;
  veterinario?: string;
  observacoes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Custo {
  id?: number;
  animal_id: number;
  tipo: string;
  subtipo?: string;
  valor: number;
  data: Date | string;
  observacoes?: string;
  detalhes?: Record<string, any>;
  data_registro?: Date | string;
  created_at?: Date | string;
}

export interface Gestacao {
  id?: number;
  pai_serie?: string;
  pai_rg?: string;
  mae_serie?: string;
  mae_rg?: string;
  receptora_nome?: string;
  receptora_serie?: string;
  receptora_rg?: string;
  data_cobertura: Date | string;
  custo_acumulado?: number;
  situacao?: 'Ativa' | 'Nasceu' | 'Perdeu' | 'Cancelada';
  observacoes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Nascimento {
  id?: number;
  gestacao_id?: number;
  serie: string;
  rg: string;
  sexo: Sexo;
  data_nascimento: Date | string;
  hora_nascimento?: string;
  peso?: number;
  cor?: string;
  tipo_nascimento?: string;
  dificuldade_parto?: string;
  custo_nascimento?: number;
  veterinario?: string;
  observacoes?: string;
  created_at?: Date | string;
}

export interface EstoqueSemen {
  id?: number;
  nome_touro: string;
  rg_touro?: string;
  raca?: string;
  localizacao?: string;
  rack_touro?: string;
  botijao?: string;
  caneca?: string;
  tipo_operacao?: TipoOperacao;
  fornecedor?: string;
  destino?: string;
  numero_nf?: string;
  valor_compra?: number;
  data_compra?: Date | string;
  quantidade_doses?: number;
  doses_disponiveis?: number;
  doses_usadas?: number;
  certificado?: string;
  data_validade?: Date | string;
  origem?: string;
  linhagem?: string;
  observacoes?: string;
  status?: StatusSemen;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface TransferenciaEmbriao {
  id?: number;
  numero_te: string;
  data_te: Date | string;
  receptora_id?: number;
  doadora_id?: number;
  touro_id?: number;
  local_te?: string;
  data_fiv?: Date | string;
  raca?: string;
  tecnico_responsavel?: string;
  observacoes?: string;
  status?: 'realizada' | 'cancelada' | 'pendente';
  resultado?: 'positivo' | 'negativo' | 'pendente';
  data_diagnostico?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface NotaFiscal {
  id?: number;
  numero_nf: string;
  data_compra: Date | string;
  data?: Date | string;
  origem?: string;
  fornecedor?: string;
  destino?: string;
  valor_total?: number;
  quantidade_receptoras?: number;
  valor_por_receptora?: number;
  observacoes?: string;
  natureza_operacao?: string;
  tipo: TipoNF;
  tipo_produto?: TipoProduto;
  itens?: NotaFiscalItem[];
  data_cadastro?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface NotaFiscalItem {
  id?: string;
  serie?: string;
  rg?: string;
  descricao?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
}

export interface Servico {
  id?: number;
  animal_id?: number;
  tipo: TipoServico;
  descricao: string;
  data_aplicacao: Date | string;
  custo?: number;
  status?: StatusServico;
  responsavel?: string;
  observacoes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Notificacao {
  id?: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  prioridade?: PrioridadeNotificacao;
  lida?: boolean;
  dados_extras?: Record<string, any>;
  animal_id?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ProtocoloReprodutivo {
  id?: number;
  nome: string;
  descricao?: string;
  tipo: 'IATF' | 'SincronizaÃ§Ã£o' | 'TE' | 'Outro';
  duracao_dias?: number;
  medicamentos?: Record<string, any>;
  observacoes?: string;
  ativo?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ProtocoloAplicado {
  id?: number;
  animal_id: number;
  protocolo_id: number;
  data_inicio: Date | string;
  data_fim?: Date | string;
  status?: StatusProtocolo;
  observacoes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ============ TIPOS DE RESPOSTA DA API ============

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ TIPOS DE FILTROS E QUERIES ============

export interface AnimalFilter {
  situacao?: Situacao;
  sexo?: Sexo;
  raca?: string;
  serie?: string;
  rg?: string;
  search?: string;
  is_fiv?: boolean;
  data_inicio?: Date | string;
  data_fim?: Date | string;
}

export interface SemenFilter {
  status?: StatusSemen;
  nome_touro?: string;
  raca?: string;
  botijao?: string;
  vencido?: boolean;
}

// ============ TIPOS DE ESTATÃ�STICAS ============

export interface DashboardStats {
  totalAnimals: number;
  activeAnimals: number;
  totalBirths: number;
  totalDeaths: number;
  totalCosts: number;
  totalRevenue: number;
  semenStock: number;
  activeGestations: number;
  monthlyBirths: number;
  mortalityRate: number;
  averageCostPerAnimal: number;
  roi: number;
}

export interface FinancialStats {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  averageSalePrice: number;
  averageCost: number;
  roi: number;
}

// ============ TIPOS DE CONTEXTO ============

export interface AppContextType {
  animals: Animal[];
  setAnimals: (animals: Animal[]) => void;
  birthData: Nascimento[];
  setBirthData: (births: Nascimento[]) => void;
  /** @deprecated Custos removidos do contexto - carregar sob demanda via API */
  costs?: Custo[];
  setCosts?: (costs: Custo[]) => void;
  semenStock: EstoqueSemen[];
  setSemenStock: (stock: EstoqueSemen[]) => void;
  notasFiscais: NotaFiscal[];
  setNotasFiscais: (notas: NotaFiscal[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetAllData: () => void;
  stats: {
    totalAnimals: number;
    activeAnimals: number;
    totalBirths: number;
    totalCosts: number;
    totalSemen: number;
  };
}

export interface ToastContextType {
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  warning: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
}

// ============ TIPOS DE CONFIGURAÃâ€¡ÃÆ’O ============

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface CacheConfig {
  ttl: number; // Time to live em milissegundos
  maxSize: number; // Tamanho mÃ¡ximo do cache
  strategy: 'LRU' | 'LFU' | 'FIFO';
}

// ============ TIPOS UTILITÃ�RIOS ============

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// ============ TIPOS DE FORMULÃ�RIOS ============

export interface AnimalFormData extends Omit<Animal, 'id' | 'created_at' | 'updated_at'> {
  // Campos adicionais especÃ­ficos do formulÃ¡rio se necessÃ¡rio
}

export interface CustoFormData extends Omit<Custo, 'id' | 'created_at' | 'data_registro'> {
  // Campos adicionais especÃ­ficos do formulÃ¡rio se necessÃ¡rio
}

// ============ TIPOS DE VALIDAÃâ€¡ÃÆ’O ============

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============ TIPOS DE HOOKS ============

export interface UseFetchOptions<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cache?: boolean;
  cacheTTL?: number;
}

export interface UseFetchResult<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============ TIPOS DE EXPORTAÃâ€¡ÃÆ’O ============

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
}

