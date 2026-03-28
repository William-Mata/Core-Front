// Tipos para o módulo de Administração

export enum TipoDocumento {
  PDF = 'PDF',
  IMAGEM = 'IMAGEM',
  PLANILHA = 'PLANILHA',
  VIDEO = 'VIDEO',
  OUTRO = 'OUTRO',
}

export enum StatusPublicacao {
  RASCUNHO = 'RASCUNHO',
  PUBLICADO = 'PUBLICADO',
  ARQUIVADO = 'ARQUIVADO',
}

export interface InterfacePermissao {
  id: string;
  modulo: string;
  acao: string;
  descricao: string;
  ativo: boolean;
}

export interface InterfaceArvorePermissoes {
  modulo: string;
  permissoes: InterfacePermissao[];
  submodulos?: InterfaceArvorePermissoes[];
}

export interface InterfaceDocumento {
  id: number;
  titulo: string;
  descricao?: string;
  arquivo?: {
    nome: string;
    url: string;
    tamanho: number;
    tipo: TipoDocumento;
  };
  versoes: InterfaceVersaoDocumento[];
  status: StatusPublicacao;
  modulo?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  criadoPor: number;
  atualizadoPor?: number;
}

export interface InterfaceVersaoDocumento {
  numero: number;
  data: string;
  alteracoes: string;
  usuarioId: number;
  usuarioNome: string;
}

export interface InterfaceAviso {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: 'INFO' | 'AVISO' | 'CRITICO';
  destinatarios: 'TODOS' | 'MODULO' | 'USUARIO';
  moduloId?: number;
  usuarioIds?: number[];
  dataCriacao: string;
  dataPublicacao?: string;
  dataVencimento?: string;
  requerCiencia: boolean;
  ciencias: InterfaceCienciaAviso[];
  status: StatusPublicacao;
  criadoPor: number;
  criadoPorNome: string;
}

export interface InterfaceCienciaAviso {
  usuarioId: number;
  usuarioNome: string;
  dataCiencia: string;
  lido: boolean;
}

export interface InterfaceSimulacaoUsuario {
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  dataInicio: string;
  adminId: number;
  accessToken: string;
  refreshToken: string;
}

export interface InterfaceRelatorioAvisos {
  avisoId: number;
  titulo: string;
  totalDestinatarios: number;
  totalCiencias: number;
  percentualCiencia: number;
  naoLeram: number;
}
