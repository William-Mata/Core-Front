// Enumeradores do módulo Financeiro
export enum TipoTransacao {
  DESPESA = 'DESPESA',
  RECEITA = 'RECEITA',
  REEMBOLSO = 'REEMBOLSO',
  ESTORNO = 'ESTORNO',
}

export enum TipoPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  BOLETO = 'BOLETO',
  TED_DOC = 'TED_DOC',
}

export enum StatusDespesa {
  PENDENTE = 'PENDENTE',
  EFETIVADA = 'EFETIVADA',
  ESTORNADA = 'ESTORNADA',
  PARCELADA = 'PARCELADA',
}

export enum StatusReembolso {
  AGUARDANDO = 'AGUARDANDO',
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  PAGO = 'PAGO',
  REJEITADO = 'REJEITADO',
}

// Interfaces

export interface InterfaceDespesa {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  status: StatusDespesa;
  tipo: TipoTransacao;
  tipoPagamento: TipoPagamento;
  usuarioId: number;
  dataCadastro: string;
  dataAtualizacao: string;
}

export interface InterfaceReembolso {
  id: number;
  descricao: string;
  valorTotal: number;
  status: StatusReembolso;
  solicitanteId: number;
  solicitanteName: string;
  responsavelAprovacaoId?: number;
  responsavelAprovacaoName?: string;
  dataSolicitacao: string;
  dataAprovacao?: string;
  dataPagamento?: string;
  motivoRejeicao?: string;
  despesasVinculadas: InterfaceDespesa[];
  anexos?: string[];
  dataCadastro: string;
  dataAtualizacao: string;
}

export interface InterfaceParticipanteRateio {
  id: number;
  amigoId: number;
  amigoNome: string;
  valorFixo?: number;
  percentual?: number;
  quitado: boolean;
  dataQuitacao?: string;
}

export interface InterfaceResumoFinanceiro {
  totalDespesas: number;
  totalReceitas: number;
  totalReembolsos: number;
  saldoMes: number;
  transacoesRecentes: InterfaceDespesa[];
}
