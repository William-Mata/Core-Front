import { api } from '../api';
import {
  AcaoLoteItensCompra,
  CategoriaListaCompra,
  DesejoCompra,
  HistoricoItemCompra,
  ItemListaCompra,
  ListaCompra,
  ListaCompraDetalhe,
  ListaCompraLog,
  ParticipanteListaCompra,
  PayloadConverterDesejosParaListaCompra,
  PermissaoParticipanteLista,
  RespostaConverterDesejosParaListaCompra,
  SugestaoItemCompra,
  UnidadeMedidaItemCompra,
} from '../../tipos/compras.tipos';

interface EnvelopeApi<T> {
  dados: T;
}

interface OpcoesRequisicao {
  signal?: AbortSignal;
}

interface OpcoesListarListasCompra extends OpcoesRequisicao {
  incluirArquivadas?: boolean;
}

export interface PayloadParticipanteListaCompra {
  usuarioId: number;
  permissao: PermissaoParticipanteLista;
}

export interface PayloadCriarListaCompra {
  nome: string;
  observacao?: string;
  categoria: CategoriaListaCompra;
  participantes?: PayloadParticipanteListaCompra[];
}

export interface PayloadAtualizarListaCompra {
  nome?: string;
  observacao?: string;
  categoria?: CategoriaListaCompra;
  status?: ListaCompra['status'];
  participantes?: PayloadParticipanteListaCompra[];
}

export interface PayloadCriarItemListaCompra {
  descricao: string;
  observacao?: string;
  unidadeMedida: UnidadeMedidaItemCompra;
  quantidade: number;
  marcadorCor?: string;
  valorUnitario: number;
}

export interface PayloadAtualizarItemListaCompra {
  descricao?: string;
  observacao?: string;
  unidadeMedida?: UnidadeMedidaItemCompra;
  quantidade?: number;
  marcadorCor?: string;
  valorUnitario?: number;
  comprado?: boolean;
  versao?: number;
}

export interface PayloadAcaoLoteItensCompra {
  acao: AcaoLoteItensCompra;
  itensIds?: number[];
}

export interface PayloadCriarDesejoCompra {
  descricao: string;
  observacao?: string;
  unidadeMedida: UnidadeMedidaItemCompra;
  quantidade: number;
  valorAlvo?: number;
}

export interface PayloadAtualizarDesejoCompra {
  descricao?: string;
  observacao?: string;
  unidadeMedida?: UnidadeMedidaItemCompra;
  quantidade?: number;
  valorAlvo?: number;
}

export interface ConsultaHistoricoItens {
  descricao?: string;
  unidade?: UnidadeMedidaItemCompra;
  dataInicio?: string;
  dataFim?: string;
  signal?: AbortSignal;
}

export interface ConsultaSugestoesItem {
  termo: string;
  limite?: number;
  signal?: AbortSignal;
}

function extrairDados<T>(entrada: EnvelopeApi<T> | T): T {
  if (entrada && typeof entrada === 'object' && 'dados' in (entrada as Record<string, unknown>)) {
    return (entrada as EnvelopeApi<T>).dados;
  }
  return entrada as T;
}

function montarConfigConsulta(opcoes?: OpcoesRequisicao): { signal?: AbortSignal } {
  return { signal: opcoes?.signal };
}

function normalizarTextoSemAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizarCorEtiqueta(cor: unknown): string {
  const valor = String(cor ?? '').trim().toLowerCase();
  return /^#[\da-f]{6}$/.test(valor) ? valor : '#9ca3af';
}

function normalizarPermissao(permissao: unknown): PermissaoParticipanteLista {
  const valor = normalizarTextoSemAcento(String(permissao ?? '').trim().toLowerCase());
  if (
    valor === 'coproprietario'
    || valor === 'co-proprietario'
    || valor === 'co_proprietario'
    || valor === 'co proprietario'
    || valor === 'coowner'
    || valor === 'co-owner'
    || valor === 'editor'
  ) {
    return 'coproprietario';
  }
  if (valor === 'leitor') return 'leitor';
  if (valor === 'proprietario' || valor === 'dono' || valor === 'owner') return 'proprietario';
  return 'leitor';
}

function normalizarCategoria(categoria: unknown): CategoriaListaCompra {
  const valor = String(categoria ?? '').trim().toLowerCase();
  if (valor === 'mercado') return 'mercado';
  if (valor === 'moveis') return 'moveis';
  if (valor === 'roupas') return 'roupas';
  if (valor === 'farmacia') return 'farmacia';
  if (valor === 'construcao') return 'construcao';
  return 'outros';
}

function normalizarUnidade(unidade: unknown): UnidadeMedidaItemCompra {
  const valor = String(unidade ?? '').trim().toLowerCase();
  if (valor === 'kg') return 'kg';
  if (valor === 'g') return 'g';
  if (valor === 'mg') return 'mg';
  if (valor === 'l') return 'l';
  if (valor === 'ml') return 'ml';
  if (valor === 'pacote') return 'pacote';
  if (valor === 'caixa') return 'caixa';
  return 'unidade';
}

function normalizarParticipante(entrada: unknown): ParticipanteListaCompra {
  const participante = (entrada ?? {}) as Record<string, unknown>;
  return {
    usuarioId: Number(participante.usuarioId ?? participante.id ?? participante.participanteId ?? 0),
    nomeUsuario: String(participante.nomeUsuario ?? participante.nome ?? participante.usuarioNome ?? ''),
    permissao: normalizarPermissao(participante.permissao ?? participante.papel),
  };
}

function normalizarLista(entrada: unknown): ListaCompra {
  const lista = (entrada ?? {}) as Record<string, unknown>;
  const participantesEntrada = Array.isArray(lista.participantes) ? lista.participantes : [];
  const papelUsuario = normalizarPermissao(lista.papelUsuario ?? lista.papel ?? lista.permissaoUsuario);
  const valorTotal = Number(lista.valorTotal);
  const valorComprado = Number(lista.valorComprado);
  const percentualComprado = Number(lista.percentualComprado);
  const quantidadeItens = Number(lista.quantidadeItens);
  const quantidadeItensComprados = Number(lista.quantidadeItensComprados);
  const quantidadeParticipantes = Number(lista.quantidadeParticipantes);
  const statusEntrada = String(lista.status ?? 'ativa').toLowerCase();
  const status = statusEntrada === 'arquivada' ? 'arquivada' : statusEntrada === 'concluida' ? 'concluida' : 'ativa';

  return {
    id: Number(lista.id ?? 0),
    nome: String(lista.nome ?? ''),
    observacao: String(lista.observacao ?? ''),
    categoria: normalizarCategoria(lista.categoria ?? lista.categoriaLista),
    status,
    papelUsuario,
    criadoPorUsuarioId: Number(
      lista.criadoPorUsuarioId
      ?? lista.usuarioId
      ?? lista.usuarioCadastroId
      ?? lista.proprietarioUsuarioId
      ?? 0,
    ),
    participantes: participantesEntrada.map(normalizarParticipante),
    valorTotal: Number.isFinite(valorTotal) ? valorTotal : undefined,
    valorComprado: Number.isFinite(valorComprado) ? valorComprado : undefined,
    percentualComprado: Number.isFinite(percentualComprado) ? percentualComprado : undefined,
    quantidadeItens: Number.isFinite(quantidadeItens) ? quantidadeItens : undefined,
    quantidadeItensComprados: Number.isFinite(quantidadeItensComprados) ? quantidadeItensComprados : undefined,
    quantidadeParticipantes: Number.isFinite(quantidadeParticipantes)
      ? quantidadeParticipantes
      : participantesEntrada.length,
    criadoEm: String(lista.criadoEm ?? ''),
    atualizadoEm: String(lista.atualizadoEm ?? lista.dataHoraAtualizacao ?? ''),
  };
}

function normalizarItem(entrada: unknown): ItemListaCompra {
  const item = (entrada ?? {}) as Record<string, unknown>;
  const quantidade = Number(item.quantidade ?? 0);
  const valorUnitario = Number(item.valorUnitario ?? item.precoUnitario ?? 0);
  const valorTotal = Number(item.valorTotal ?? Number((quantidade * valorUnitario).toFixed(2)));
  return {
    id: Number(item.id ?? 0),
    listaId: Number(item.listaId ?? 0),
    descricao: String(item.descricao ?? ''),
    observacao: String(item.observacao ?? ''),
    unidadeMedida: normalizarUnidade(item.unidadeMedida ?? item.unidade),
    quantidade: Number.isFinite(quantidade) ? quantidade : 0,
    marcadorCor: normalizarCorEtiqueta(item.etiquetaCor ?? item.marcadorCor),
    valorUnitario: Number.isFinite(valorUnitario) ? valorUnitario : 0,
    valorTotal: Number.isFinite(valorTotal) ? valorTotal : 0,
    comprado: Boolean(item.comprado),
    versao: Number(item.versao ?? 0),
    atualizadoEm: String(item.atualizadoEm ?? item.dataHoraUtc ?? item.dataHoraCompra ?? ''),
  };
}

function normalizarLog(entrada: unknown): ListaCompraLog {
  const log = (entrada ?? {}) as Record<string, unknown>;
  return {
    id: Number(log.id ?? 0),
    listaId: Number(log.listaId ?? 0),
    evento: String(log.evento ?? log.acao ?? ''),
    usuarioId: Number(log.usuarioId ?? log.usuarioCadastroId ?? 0),
    itemListaCompraId: Number(log.itemListaCompraId ?? 0) || undefined,
    descricao: String(log.descricao ?? ''),
    valorAnterior: String(log.valorAnterior ?? ''),
    valorNovo: String(log.valorNovo ?? ''),
    dataHoraUtc: String(log.dataHoraUtc ?? log.dataHoraCadastro ?? ''),
  };
}

function normalizarDetalheLista(entrada: unknown): ListaCompraDetalhe {
  const detalhe = (entrada ?? {}) as Record<string, unknown>;
  const listaBase = normalizarLista(detalhe);
  const itensEntrada = Array.isArray(detalhe.itens) ? detalhe.itens : [];
  const logsEntrada = Array.isArray(detalhe.logs) ? detalhe.logs : [];
  const participantesEntrada = Array.isArray(detalhe.participantes) ? detalhe.participantes : listaBase.participantes;

  return {
    ...listaBase,
    participantes: participantesEntrada.map(normalizarParticipante),
    valorTotal: Number(detalhe.valorTotal ?? 0),
    valorComprado: Number(detalhe.valorComprado ?? 0),
    percentualComprado: Number(detalhe.percentualComprado ?? 0),
    quantidadeItens: Number(detalhe.quantidadeItens ?? itensEntrada.length),
    quantidadeItensComprados: Number(detalhe.quantidadeItensComprados ?? 0),
    itens: itensEntrada.map(normalizarItem),
    logs: logsEntrada.map(normalizarLog),
  };
}

function normalizarDesejo(entrada: unknown): DesejoCompra {
  const desejo = (entrada ?? {}) as Record<string, unknown>;
  return {
    id: Number(desejo.id ?? 0),
    descricao: String(desejo.descricao ?? ''),
    observacao: String(desejo.observacao ?? ''),
    unidadeMedida: normalizarUnidade(desejo.unidadeMedida ?? desejo.unidade),
    quantidade: Number(desejo.quantidade ?? 0),
    valorAlvo: Number(desejo.valorAlvo ?? desejo.precoEstimado ?? 0),
    selecionado: Boolean(desejo.selecionado),
    criadoEm: String(desejo.criadoEm ?? ''),
  };
}

function normalizarHistorico(entrada: unknown): HistoricoItemCompra {
  const historico = (entrada ?? {}) as Record<string, unknown>;
  return {
    produtoId: Number(historico.produtoId ?? 0),
    descricao: String(historico.descricao ?? ''),
    unidade: normalizarUnidade(historico.unidade),
    ultimoPreco: Number(historico.ultimoPreco ?? 0),
    menorPreco: Number(historico.menorPreco ?? 0),
    maiorPreco: Number(historico.maiorPreco ?? 0),
    mediaPreco: Number(historico.mediaPreco ?? 0),
    dataUltimoPreco: String(historico.dataUltimoPreco ?? ''),
    totalOcorrencias: Number(historico.totalOcorrencias ?? 0),
  };
}

function normalizarSugestao(entrada: unknown): SugestaoItemCompra {
  const sugestao = (entrada ?? {}) as Record<string, unknown>;
  const valorUnitario = Number(sugestao.precoUnitario ?? sugestao.valorUnitario ?? sugestao.ultimoPrecoUnitario ?? sugestao.ultimoPreco ?? 0);
  return {
    descricao: String(sugestao.descricao ?? ''),
    observacao: String(sugestao.observacao ?? ''),
    unidadeMedida: normalizarUnidade(sugestao.unidadeMedida ?? sugestao.unidade),
    quantidade: Number(sugestao.quantidade ?? 1),
    valorUnitario,
    valorReferencia: Number(sugestao.valorReferencia ?? valorUnitario),
    marcadorCor: normalizarCorEtiqueta(sugestao.etiquetaCor ?? sugestao.marcadorCor),
  };
}

function mapearPermissaoParaPapelApi(permissao: PermissaoParticipanteLista): 'Proprietario' | 'CoProprietario' | 'Leitor' {
  if (permissao === 'proprietario') return 'Proprietario';
  if (permissao === 'coproprietario') return 'CoProprietario';
  return 'Leitor';
}

function montarPayloadParticipantes(
  participantes?: PayloadParticipanteListaCompra[],
): Array<{ usuarioId: number; papel: 'Proprietario' | 'CoProprietario' | 'Leitor' }> | undefined {
  if (!participantes || participantes.length === 0) return undefined;

  return participantes.map((participante) => ({
    usuarioId: participante.usuarioId,
    papel: mapearPermissaoParaPapelApi(participante.permissao),
  }));
}

export async function listarListasCompraApi(opcoes?: OpcoesListarListasCompra): Promise<ListaCompra[]> {
  const config = montarConfigConsulta(opcoes);
  const { data } = await api.get<EnvelopeApi<unknown[]> | unknown[]>('/compras/listas', {
    ...config,
    params: {
      incluirArquivadas: opcoes?.incluirArquivadas ?? false,
    },
  });
  const listas = extrairDados(data);
  return Array.isArray(listas) ? listas.map(normalizarLista) : [];
}

export async function obterListaCompraApi(listaId: number, opcoes?: OpcoesRequisicao): Promise<ListaCompraDetalhe> {
  const { data } = await api.get<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}`, montarConfigConsulta(opcoes));
  return normalizarDetalheLista(extrairDados(data));
}

export async function obterDetalheListaCompraApi(listaId: number, opcoes?: OpcoesRequisicao): Promise<ListaCompraDetalhe> {
  const { data } = await api.get<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/detalhe`, montarConfigConsulta(opcoes));
  return normalizarDetalheLista(extrairDados(data));
}

export async function criarListaCompraApi(payload: PayloadCriarListaCompra): Promise<ListaCompra> {
  const participantes = montarPayloadParticipantes(payload.participantes);
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>('/compras/listas', {
    nome: payload.nome,
    ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
    categoria: payload.categoria,
    ...(participantes ? { participantes } : {}),
  });
  return normalizarLista(extrairDados(data));
}

export async function atualizarListaCompraApi(listaId: number, payload: PayloadAtualizarListaCompra): Promise<ListaCompra> {
  const participantes = montarPayloadParticipantes(payload.participantes);
  const { data } = await api.put<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}`, {
    ...(payload.nome !== undefined ? { nome: payload.nome } : {}),
    ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
    ...(payload.categoria !== undefined ? { categoria: payload.categoria } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(participantes ? { participantes } : {}),
  });
  return normalizarLista(extrairDados(data));
}

export async function duplicarListaCompraApi(listaId: number, payload?: PayloadCriarListaCompra): Promise<ListaCompra> {
  const participantes = montarPayloadParticipantes(payload?.participantes);
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>(
    `/compras/listas/${listaId}/duplicar`,
    payload
      ? {
          nome: payload.nome,
          ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
          categoria: payload.categoria,
          ...(participantes ? { participantes } : {}),
        }
      : undefined,
  );
  return normalizarLista(extrairDados(data));
}

export async function arquivarListaCompraApi(listaId: number): Promise<ListaCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/arquivar`);
  return normalizarLista(extrairDados(data));
}

export async function removerListaCompraApi(listaId: number): Promise<void> {
  await api.delete(`/compras/listas/${listaId}`);
}

export async function listarItensListaCompraApi(listaId: number, opcoes?: OpcoesRequisicao): Promise<ItemListaCompra[]> {
  const detalhe = await obterListaCompraApi(listaId, opcoes);
  return detalhe.itens ?? [];
}

export async function criarItemListaCompraApi(listaId: number, payload: PayloadCriarItemListaCompra): Promise<ItemListaCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/itens`, {
    descricao: payload.descricao,
    observacao: payload.observacao,
    unidade: payload.unidadeMedida,
    quantidade: payload.quantidade,
    etiquetaCor: payload.marcadorCor,
    precoUnitario: payload.valorUnitario,
  });
  return normalizarItem(extrairDados(data));
}

export async function atualizarItemListaCompraApi(
  listaId: number,
  itemId: number,
  payload: PayloadAtualizarItemListaCompra,
): Promise<ItemListaCompra> {
  const { data } = await api.put<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/itens/${itemId}`, {
    ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
    ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
    ...(payload.unidadeMedida !== undefined ? { unidade: payload.unidadeMedida } : {}),
    ...(payload.quantidade !== undefined ? { quantidade: payload.quantidade } : {}),
    ...(payload.marcadorCor !== undefined ? { etiquetaCor: payload.marcadorCor } : {}),
    ...(payload.valorUnitario !== undefined ? { precoUnitario: payload.valorUnitario } : {}),
    ...(payload.comprado !== undefined ? { comprado: payload.comprado } : {}),
    ...(payload.versao !== undefined ? { versao: payload.versao } : {}),
  });
  return normalizarItem(extrairDados(data));
}

export async function removerItemListaCompraApi(listaId: number, itemId: number): Promise<void> {
  await api.delete(`/compras/listas/${listaId}/itens/${itemId}`);
}

export async function atualizarItemRapidoListaCompraApi(
  listaId: number,
  itemId: number,
  quantidade: number,
  valorUnitario: number,
  versao?: number,
): Promise<ItemListaCompra> {
  const { data } = await api.patch<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/itens/${itemId}/edicao-rapida`, {
    quantidade,
    precoUnitario: valorUnitario,
    ...(versao !== undefined ? { versao } : {}),
  });
  return normalizarItem(extrairDados(data));
}

export async function marcarItemListaCompraApi(listaId: number, itemId: number, comprado: boolean): Promise<ItemListaCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/itens/${itemId}/marcar-comprado`, {
    comprado,
  });
  return normalizarItem(extrairDados(data));
}

export async function aplicarAcaoLoteItensCompraApi(
  listaId: number,
  payload: PayloadAcaoLoteItensCompra,
): Promise<ItemListaCompra[] | ListaCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>(`/compras/listas/${listaId}/acoes-lote`, payload);
  const resposta = extrairDados(data);
  if (Array.isArray(resposta)) return resposta.map(normalizarItem);
  return normalizarLista(resposta);
}

export async function listarDesejosCompraApi(opcoes?: OpcoesRequisicao): Promise<DesejoCompra[]> {
  const { data } = await api.get<EnvelopeApi<unknown[]> | unknown[]>('/compras/desejos', montarConfigConsulta(opcoes));
  const desejos = extrairDados(data);
  return Array.isArray(desejos) ? desejos.map(normalizarDesejo) : [];
}

export async function criarDesejoCompraApi(payload: PayloadCriarDesejoCompra): Promise<DesejoCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>('/compras/desejos', {
    descricao: payload.descricao,
    observacao: payload.observacao,
    unidade: payload.unidadeMedida,
    quantidade: payload.quantidade,
    precoEstimado: payload.valorAlvo ?? 0,
  });
  return normalizarDesejo(extrairDados(data));
}

export async function atualizarDesejoCompraApi(desejoId: number, payload: PayloadAtualizarDesejoCompra): Promise<DesejoCompra> {
  const { data } = await api.put<EnvelopeApi<unknown> | unknown>(`/compras/desejos/${desejoId}`, {
    ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
    ...(payload.observacao !== undefined ? { observacao: payload.observacao } : {}),
    ...(payload.unidadeMedida !== undefined ? { unidade: payload.unidadeMedida } : {}),
    ...(payload.quantidade !== undefined ? { quantidade: payload.quantidade } : {}),
    ...(payload.valorAlvo !== undefined ? { precoEstimado: payload.valorAlvo } : {}),
  });
  return normalizarDesejo(extrairDados(data));
}

export async function removerDesejoCompraApi(desejoId: number): Promise<void> {
  await api.delete(`/compras/desejos/${desejoId}`);
}

export async function converterDesejosParaListaCompraApi(
  payload: PayloadConverterDesejosParaListaCompra,
): Promise<RespostaConverterDesejosParaListaCompra> {
  const { data } = await api.post<EnvelopeApi<unknown> | unknown>('/compras/desejos/converter', payload);
  const resposta = (extrairDados(data) ?? {}) as Record<string, unknown>;
  return {
    listaId: Number(resposta.listaId ?? 0),
    itensCriados: Number(resposta.itensCriados ?? 0),
    desejosProcessados: Number(resposta.desejosProcessados ?? 0),
  };
}

export async function listarHistoricoItensCompraApi(consulta?: ConsultaHistoricoItens): Promise<HistoricoItemCompra[]> {
  const params: Record<string, string> = {};
  if (consulta?.descricao) params.descricao = consulta.descricao;
  if (consulta?.unidade) params.unidade = consulta.unidade;
  if (consulta?.dataInicio) params.dataInicio = consulta.dataInicio;
  if (consulta?.dataFim) params.dataFim = consulta.dataFim;

  const { data } = await api.get<EnvelopeApi<unknown[]> | unknown[]>('/compras/historico-precos', {
    signal: consulta?.signal,
    ...(Object.keys(params).length ? { params } : {}),
  });
  const historico = extrairDados(data);
  return Array.isArray(historico) ? historico.map(normalizarHistorico) : [];
}

export async function buscarSugestoesItensCompraApi(listaId: number, consulta: ConsultaSugestoesItem): Promise<SugestaoItemCompra[]> {
  const termo = consulta.termo.trim();
  if (termo.length < 3) return [];

  const { data } = await api.get<EnvelopeApi<unknown[]> | unknown[]>(`/compras/listas/${listaId}/sugestoes-itens`, {
    signal: consulta.signal,
    params: {
      descricao: termo,
      ...(consulta.limite ? { limite: consulta.limite } : {}),
    },
  });
  const sugestoes = extrairDados(data);
  return Array.isArray(sugestoes) ? sugestoes.map(normalizarSugestao) : [];
}
