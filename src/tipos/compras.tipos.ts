export type CategoriaListaCompra =
  | 'mercado'
  | 'moveis'
  | 'roupas'
  | 'farmacia'
  | 'construcao'
  | 'outros';

export type StatusListaCompra = 'ativa' | 'arquivada' | 'concluida';
export type PermissaoParticipanteLista = 'proprietario' | 'coproprietario' | 'leitor';
export type FiltroStatusCompra = 'todos' | 'comprados' | 'naoComprados';
export type OrdenacaoItensCompra = 'alfabetica' | 'preco' | 'cor';
export type DirecaoOrdenacao = 'asc' | 'desc';

export type UnidadeMedidaItemCompra =
  | 'unidade'
  | 'kg'
  | 'g'
  | 'mg'
  | 'l'
  | 'ml'
  | 'pacote'
  | 'caixa';

export interface ParticipanteListaCompra {
  usuarioId: number;
  nomeUsuario: string;
  permissao: PermissaoParticipanteLista;
}

export interface ListaCompra {
  id: number;
  nome: string;
  observacao?: string;
  categoria: CategoriaListaCompra;
  status: StatusListaCompra;
  papelUsuario?: PermissaoParticipanteLista;
  criadoPorUsuarioId: number;
  participantes: ParticipanteListaCompra[];
  valorTotal?: number;
  valorComprado?: number;
  percentualComprado?: number;
  quantidadeItens?: number;
  quantidadeItensComprados?: number;
  quantidadeParticipantes?: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemListaCompra {
  id: number;
  listaId: number;
  descricao: string;
  observacao: string;
  unidadeMedida: UnidadeMedidaItemCompra;
  quantidade: number;
  marcadorCor: string;
  valorUnitario: number;
  valorTotal: number;
  comprado: boolean;
  versao: number;
  atualizadoEm: string;
}

export interface DesejoCompra {
  id: number;
  descricao: string;
  observacao: string;
  unidadeMedida: UnidadeMedidaItemCompra;
  quantidade: number;
  valorAlvo: number;
  selecionado: boolean;
  criadoEm: string;
}

export interface HistoricoItemCompra {
  produtoId: number;
  descricao: string;
  unidade: UnidadeMedidaItemCompra;
  ultimoPreco: number;
  menorPreco: number;
  maiorPreco: number;
  mediaPreco: number;
  dataUltimoPreco: string;
  totalOcorrencias: number;
  historicoPrecos: Array<{
    data: string;
    valor: number;
  }>;
}

export interface SugestaoItemCompra {
  descricao: string;
  observacao: string;
  unidadeMedida: UnidadeMedidaItemCompra;
  quantidade: number;
  valorUnitario: number;
  valorReferencia: number;
  marcadorCor: string;
}

export interface ResumoListaCompra {
  totalLista: number;
  totalComprado: number;
  percentualComprado: number;
  quantidadeItens: number;
  quantidadeItensComprados: number;
}

export type AcaoLoteItensCompra =
  | 'MarcarSelecionadosComprados'
  | 'DesmarcarSelecionados'
  | 'ExcluirSelecionados'
  | 'ExcluirComprados'
  | 'ExcluirNaoComprados'
  | 'ExcluirSemPreco'
  | 'LimparLista'
  | 'ResetarPrecos'
  | 'ResetarCores'
  | 'CriarNovaListaComComprados'
  | 'CriarNovaListaComNaoComprados'
  | 'DuplicarLista'
  | 'MesclarDuplicados';

export type AcaoPosConversaoDesejo = 'Manter' | 'Arquivar' | 'MarcarComoConvertido';

export interface ListaCompraLog {
  id: number;
  listaId: number;
  evento: string;
  usuarioId: number;
  itemListaCompraId?: number;
  descricao?: string;
  valorAnterior?: string;
  valorNovo?: string;
  dataHoraUtc: string;
}

export interface ListaCompraDetalhe extends ListaCompra {
  valorTotal: number;
  valorComprado: number;
  percentualComprado: number;
  quantidadeItens: number;
  quantidadeItensComprados: number;
  itens: ItemListaCompra[];
  participantes: ParticipanteListaCompra[];
  logs: ListaCompraLog[];
}

export interface PayloadConverterDesejosParaListaCompra {
  desejosIds: number[];
  listaDestinoId?: number | null;
  nomeNovaLista?: string;
  categoriaNovaLista?: CategoriaListaCompra;
  acaoPosConversao?: AcaoPosConversaoDesejo;
}

export interface RespostaConverterDesejosParaListaCompra {
  listaId: number;
  itensCriados: number;
  desejosProcessados: number;
}

export interface EventoTempoRealCompra {
  listaId: number;
  evento:
    | 'lista_criada'
    | 'lista_atualizada'
    | 'lista_arquivada'
    | 'lista_excluida'
    | 'lista_duplicada'
    | 'lista_compartilhada'
    | 'participante_removido'
    | 'item_criado'
    | 'item_atualizado'
    | 'item_edicao_rapida'
    | 'item_comprado'
    | 'item_desmarcado'
    | 'lote_executado'
    | 'desejos_convertidos'
    | 'lista_derivada_criada';
  usuarioId: number;
  dataHoraUtc: string;
  itemId?: number;
  versao?: number;
  usuarioNome?: string;
}
