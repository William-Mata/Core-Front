import { api } from '../api';

interface EnvelopeApi<T> {
  sucesso?: boolean;
  dados: T;
}

export interface RegistroFinanceiroApi {
  id: number;
  [key: string]: unknown;
}

export interface AmigoRateioApi {
  id: number;
  nome: string;
  email?: string;
}

export interface SubAreaRateioApi {
  id: number;
  nome: string;
}

export interface AreaSubareaRateioApi {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
  subAreas: SubAreaRateioApi[];
}

export interface SubAreaSomaRateioApi {
  id: number;
  nome: string;
  valorTotalRateio: number;
}

export interface AreaSomaRateioApi {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
  valorTotalRateio: number;
  subAreas: SubAreaSomaRateioApi[];
}

function extrairDados<T>(entrada: EnvelopeApi<T> | T): T {
  if (entrada && typeof entrada === 'object' && 'dados' in (entrada as Record<string, unknown>)) {
    return (entrada as EnvelopeApi<T>).dados;
  }
  return entrada as T;
}

interface OpcoesRequisicao {
  signal?: AbortSignal;
  dataInicio?: string;
  dataFim?: string;
  id?: string;
  descricao?: string;
  competencia?: string;
  competenciaMes?: number;
  competenciaAno?: number;
  cartaoId?: number;
  pagina?: number;
  tamanhoPagina?: number;
  verificarUltimaRecorrencia?: boolean;
  desconsiderarVinculadosCartaoCredito?: boolean;
  desconsiderarCancelados?: boolean;
}

interface OpcoesEscopoRecorrencia {
  escopoRecorrencia?: 1 | 2 | 3;
}

export type OrdemRegistrosHistoricoApi = 1 | 2 | 'MaisRecentes' | 'MaisAntigos';

export interface OpcoesHistoricoTransacoesApi {
  signal?: AbortSignal;
  quantidadeRegistros?: number;
  ordemRegistros?: OrdemRegistrosHistoricoApi;
}

export interface OpcoesResumoHistoricoTransacoesApi {
  signal?: AbortSignal;
  ano?: number;
}

export interface OpcoesAreasSubareasSomaRateioApi {
  signal?: AbortSignal;
  tipo?: 'Despesa' | 'Receita';
}

export interface HistoricoTransacaoApi {
  idTransacao?: string | number;
  IdTransacao?: string | number;
  idOrigem?: string | number;
  tipoTransacao: string;
  valor: number;
  descricao: string;
  dataEfetivacao: string;
  tipoPagamento?: string | null;
  contaBancaria?: string | null;
  cartao?: string | null;
  tipoDespesa?: string | null;
  tipoReceita?: string | null;
}

export interface ResumoHistoricoTransacoesApi {
  ano: number | null;
  totalReceitas: number;
  totalDespesas: number;
  totalReembolsos: number;
  totalEstornos: number;
  totalGeral: number;
}

interface EfetivarDespesaPayloadApi {
  dataEfetivacao: string;
  observacaoHistorico?: string;
  tipoPagamento: string;
  valorTotal: number;
  desconto: number;
  acrescimo: number;
  imposto: number;
  juros: number;
  documentos: unknown[];
  contaBancariaId: number | null;
  contaDestinoId?: number | null;
  cartaoId: number | null;
}

interface EfetivarReceitaPayloadApi {
  dataEfetivacao: string;
  observacaoHistorico?: string;
  tipoRecebimento: string;
  valorTotal: number;
  desconto: number;
  acrescimo: number;
  imposto: number;
  juros: number;
  documentos: unknown[];
  contaBancariaId: number | null;
  contaDestinoId?: number | null;
  cartaoId: number | null;
}

interface EstornarRegistroPayloadApi {
  dataEstorno: string;
  observacaoHistorico?: string;
  ocultarDoHistorico?: boolean;
}

interface EfetivarReembolsoPayloadApi {
  dataEfetivacao: string;
  valorEfetivacao: number;
  observacaoHistorico?: string;
  documentos: unknown[];
}

interface EstornarReembolsoPayloadApi {
  dataEstorno: string;
  observacaoHistorico?: string;
  ocultarDoHistorico?: boolean;
}

function montarCompetencia(opcoes?: OpcoesRequisicao): string | undefined {
  if (!opcoes) return undefined;
  if (opcoes.competencia) return opcoes.competencia;
  if (opcoes.competenciaAno && opcoes.competenciaMes) {
    return `${String(opcoes.competenciaAno)}-${String(opcoes.competenciaMes).padStart(2, '0')}`;
  }
  return undefined;
}

function montarConfigConsulta(opcoes?: OpcoesRequisicao): { signal?: AbortSignal; params?: Record<string, string | number | boolean> } {
  const params: Record<string, string | number | boolean> = {};
  const competencia = montarCompetencia(opcoes);

  if (opcoes?.dataInicio) params.dataInicio = opcoes.dataInicio;
  if (opcoes?.dataFim) params.dataFim = opcoes.dataFim;
  if (opcoes?.id) params.id = opcoes.id;
  if (opcoes?.descricao) params.descricao = opcoes.descricao;
  if (competencia) params.competencia = competencia;
  const verificarUltimaRecorrencia = opcoes?.verificarUltimaRecorrencia ;

  if (verificarUltimaRecorrencia !== undefined) {
    params.verificarUltimaRecorrencia = verificarUltimaRecorrencia;
  }

  if (opcoes?.desconsiderarVinculadosCartaoCredito !== undefined) {
    params.desconsiderarVinculadosCartaoCredito = opcoes.desconsiderarVinculadosCartaoCredito;
  }
  
  if (opcoes?.desconsiderarCancelados !== undefined) {
    params.desconsiderarCancelados = opcoes.desconsiderarCancelados;
  }

  return {
    signal: opcoes?.signal,
    ...(Object.keys(params).length ? { params } : {}),
  };
}

function montarConfigEscopoRecorrencia(opcoes?: OpcoesEscopoRecorrencia): { params?: Record<string, number> } {
  if (!opcoes?.escopoRecorrencia) return {};
  return {
    params: {
      escopoRecorrencia: opcoes.escopoRecorrencia,
    },
  };
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? '').trim();
}

function normalizarDataHoraParaApi(valor: unknown): string {
  const texto = normalizarTexto(valor);
  if (!texto) return texto;

  const matchComSegundos = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(texto);
  if (matchComSegundos) return texto;

  const matchSemSegundos = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(texto);
  if (matchSemSegundos) return `${matchSemSegundos[1]}T${matchSemSegundos[2]}:${matchSemSegundos[3]}:00`;

  const matchSomenteData = /^(\d{4}-\d{2}-\d{2})$/.exec(texto);
  if (matchSomenteData) return `${matchSomenteData[1]}T00:00:00`;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return texto;

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function prepararPayloadDataHoraApi<T extends object>(payload: T, campos: string[]): T {
  const payloadNormalizado = { ...(payload as Record<string, unknown>) };
  for (const campo of campos) {
    if (!(campo in payloadNormalizado)) continue;
    const valor = payloadNormalizado[campo];
    if (valor === null || valor === undefined || valor === '') continue;
    payloadNormalizado[campo] = normalizarDataHoraParaApi(valor);
  }
  return payloadNormalizado as T;
}

function normalizarOrdemHistorico(ordem: OrdemRegistrosHistoricoApi | undefined): 'MaisRecentes' | 'MaisAntigos' {
  if (ordem === undefined) return 'MaisRecentes';
  if (ordem === 1 || ordem === 'MaisRecentes') return 'MaisRecentes';
  if (ordem === 2 || ordem === 'MaisAntigos') return 'MaisAntigos';
  throw new Error('Parametro ordemRegistros invalido. Valores permitidos: 1, 2, MaisRecentes, MaisAntigos.');
}

function normalizarQuantidadeHistorico(quantidade: number | undefined): number {
  if (quantidade === undefined) return 50;
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error('Parametro quantidadeRegistros invalido. O valor deve ser inteiro e maior que zero.');
  }
  return quantidade;
}

function normalizarAnoResumo(ano: number | undefined): number | undefined {
  if (ano === undefined) return undefined;
  if (!Number.isInteger(ano) || ano <= 0) {
    throw new Error('Parametro ano invalido. O valor deve ser inteiro e maior que zero.');
  }
  return ano;
}

function normalizarTipoConsultaSomaRateio(tipo: OpcoesAreasSubareasSomaRateioApi['tipo'] | undefined): 'Despesa' | 'Receita' | undefined {
  if (tipo === undefined) return undefined;
  const tipoNormalizado = normalizarTexto(tipo).toLowerCase();
  if (tipoNormalizado === 'despesa') return 'Despesa';
  if (tipoNormalizado === 'receita') return 'Receita';
  throw new Error('Parametro tipo invalido. Valores permitidos: Despesa ou Receita.');
}

function extrairLista<T>(entrada: unknown): T[] {
  if (Array.isArray(entrada)) return entrada as T[];
  if (!entrada || typeof entrada !== 'object') return [];

  const registro = entrada as Record<string, unknown>;
  for (const chave of ['dados', 'itens', 'amigos', 'areas', 'areaSubareas', 'faturas', 'faturasCartao', 'transacoes', 'lancamentos']) {
    if (Array.isArray(registro[chave])) return registro[chave] as T[];
  }
  return [];
}

function obterNumeroPositivo(valor: unknown): number | undefined {
  const numero = Number(valor ?? NaN);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

function validarCompetenciaObrigatoriaFaturaCartao(competencia: string): string {
  const valor = normalizarTexto(competencia);
  if (!valor) {
    throw new Error('Parametro competencia obrigatorio para consulta de fatura de cartao.');
  }
  return valor;
}

function normalizarTipoTransacaoFaturaCartao(
  tipoTransacao: TipoTransacaoFaturaCartaoApi | undefined,
): TipoTransacaoFaturaCartaoApi | undefined {
  if (!tipoTransacao) return undefined;
  const valor = normalizarTexto(tipoTransacao).toLowerCase();
  if (valor === 'despesa' || valor === 'receita' || valor === 'reembolso') {
    return valor;
  }
  throw new Error('Parametro tipoTransacao invalido. Valores permitidos: despesa, receita ou reembolso.');
}

function montarConfigConsultaFaturaCartao(opcoes: OpcoesConsultaFaturaCartaoApi): {
  signal?: AbortSignal;
  params: Record<string, string | number>;
} {
  const competencia = validarCompetenciaObrigatoriaFaturaCartao(opcoes.competencia);
  const tipoTransacao = normalizarTipoTransacaoFaturaCartao(opcoes.tipoTransacao);
  const params: Record<string, string | number> = { competencia };

  if (opcoes.cartaoId && opcoes.cartaoId > 0) params.cartaoId = opcoes.cartaoId;
  if (opcoes.pagina && opcoes.pagina > 0) params.pagina = opcoes.pagina;
  if (opcoes.tamanhoPagina && opcoes.tamanhoPagina > 0) params.tamanhoPagina = opcoes.tamanhoPagina;
  if (tipoTransacao) params.tipoTransacao = tipoTransacao;

  return {
    signal: opcoes.signal,
    params,
  };
}

function normalizarFaturaCartaoResumoApi(item: RegistroFinanceiroApi): FaturaCartaoResumoApi {
  const faturaRegistro = item.fatura && typeof item.fatura === 'object'
    ? (item.fatura as Record<string, unknown>)
    : (item as Record<string, unknown>);
  const faturaCartaoId =
    obterNumeroPositivo(item.faturaCartaoId)
    ?? obterNumeroPositivo(faturaRegistro.faturaCartaoId)
    ?? obterNumeroPositivo(item.id)
    ?? obterNumeroPositivo(faturaRegistro.id)
    ?? 0;
  const valorTotal = Number(
    item.valorTotal
    ?? faturaRegistro.valorTotal
    ?? item.total
    ?? faturaRegistro.total
    ?? 0,
  );

  return {
    ...item,
    faturaCartaoId,
    cartaoId:
      obterNumeroPositivo(item.cartaoId)
      ?? obterNumeroPositivo(faturaRegistro.cartaoId),
    competencia: normalizarTexto(item.competencia ?? faturaRegistro.competencia),
    status: normalizarTexto(item.status ?? faturaRegistro.status) || undefined,
    valorTotal,
  };
}

function normalizarFaturaCartaoDetalheApi(item: RegistroFinanceiroApi): FaturaCartaoDetalheApi {
  const faturaRegistro = item.fatura && typeof item.fatura === 'object'
    ? (item.fatura as Record<string, unknown>)
    : (item as Record<string, unknown>);
  const transacoesEntrada =
    (Array.isArray(item.transacoes) ? item.transacoes
      : Array.isArray(item.lancamentos) ? item.lancamentos
      : Array.isArray(item.itens) ? item.itens
      : Array.isArray(faturaRegistro.transacoes) ? faturaRegistro.transacoes
      : Array.isArray(faturaRegistro.lancamentos) ? faturaRegistro.lancamentos
      : []) as RegistroFinanceiroApi[];
  const faturaCartaoId =
    obterNumeroPositivo(item.faturaCartaoId)
    ?? obterNumeroPositivo(faturaRegistro.faturaCartaoId)
    ?? obterNumeroPositivo(item.id)
    ?? obterNumeroPositivo(faturaRegistro.id)
    ?? 0;
  const valorTotal = Number(
    item.valorTotal
    ?? faturaRegistro.valorTotal
    ?? item.total
    ?? faturaRegistro.total
    ?? 0,
  );
  const valorTotalTransacoes = Number(
    item.valorTotalTransacoes
    ?? faturaRegistro.valorTotalTransacoes
    ?? item.totalTransacoes
    ?? faturaRegistro.totalTransacoes
    ?? valorTotal,
  );

  return {
    ...item,
    faturaCartaoId,
    cartaoId:
      obterNumeroPositivo(item.cartaoId)
      ?? obterNumeroPositivo(faturaRegistro.cartaoId),
    competencia: normalizarTexto(item.competencia ?? faturaRegistro.competencia),
    status: normalizarTexto(item.status ?? faturaRegistro.status) || undefined,
    valorTotal,
    valorTotalTransacoes,
    transacoes: transacoesEntrada.map((transacao) => ({
      ...transacao,
      id: obterNumeroPositivo(transacao.id) ?? obterNumeroPositivo(transacao.transacaoId) ?? 0,
      faturaCartaoId: obterNumeroPositivo(transacao.faturaCartaoId) ?? faturaCartaoId,
    })),
  };
}

async function obterListaComFallback<T>(rotas: string[], opcoes?: OpcoesRequisicao): Promise<T[]> {
  let ultimoErro: unknown;

  for (const rota of rotas) {
    try {
      const { data } = await api.get(rota, montarConfigConsulta(opcoes));
      return extrairLista<T>(extrairDados<unknown>(data));
    } catch (erro) {
      ultimoErro = erro;
    }
  }

  throw ultimoErro;
}

function normalizarTipoArea(valor: unknown): AreaSubareaRateioApi['tipo'] {
  return normalizarTexto(valor).toLowerCase() === 'receita' ? 'receita' : 'despesa';
}

export async function listarAmigosRateioApi(opcoes?: OpcoesRequisicao): Promise<AmigoRateioApi[]> {
  const lista = await obterListaComFallback<Record<string, unknown>>(['/financeiro/amigos'], opcoes);
  return lista
    .map((item, indice) => ({
      id: Number(item.id ?? item.usuarioId ?? indice + 1),
      nome: normalizarTexto(item.nome ?? item.nomeCompleto ?? item.descricao),
      email: normalizarTexto(item.email) || undefined,
    }))
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function listarAreasSubareasRateioApi(opcoes?: OpcoesRequisicao): Promise<AreaSubareaRateioApi[]> {
  const lista = await obterListaComFallback<Record<string, unknown>>(['/financeiro/areas-subareas', '/areas-subareas'], opcoes);
  return lista
    .map((item, indice) => {
      const subAreasEntrada = Array.isArray(item.subAreas)
        ? item.subAreas
        : Array.isArray(item.subareas)
          ? item.subareas
          : [];

      return {
        id: Number(item.id ?? item.areaId ?? indice + 1),
        nome: normalizarTexto(item.nome ?? item.area),
        tipo: normalizarTipoArea(item.tipo),
        subAreas: (subAreasEntrada as Array<Record<string, unknown>>)
          .map((subArea, subIndice) => ({
            id: Number(subArea.id ?? subArea.subAreaId ?? subIndice + 1),
            nome: normalizarTexto(subArea.nome ?? subArea.subarea),
          }))
          .filter((subArea) => subArea.id > 0 && Boolean(subArea.nome)),
      };
    })
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function listarAreasSubareasSomaRateioApi(
  opcoes?: OpcoesAreasSubareasSomaRateioApi,
): Promise<AreaSomaRateioApi[]> {
  const tipo = normalizarTipoConsultaSomaRateio(opcoes?.tipo);
  const config = {
    signal: opcoes?.signal,
    ...(tipo ? { params: { tipo } } : {}),
  };

  const { data } = await api.get<EnvelopeApi<AreaSomaRateioApi[]> | AreaSomaRateioApi[]>(
    '/financeiro/areas-subareas/soma-rateio',
    config,
  );

  return extrairLista<Record<string, unknown>>(extrairDados(data))
    .map((item, indice) => {
      const subAreasEntrada = Array.isArray(item.subAreas) ? item.subAreas : [];
      return {
        id: Number(item.id ?? item.areaId ?? indice + 1),
        nome: normalizarTexto(item.nome ?? item.area),
        tipo: normalizarTipoArea(item.tipo),
        valorTotalRateio: Number(item.valorTotalRateio ?? item.valorTotal ?? 0),
        subAreas: (subAreasEntrada as Array<Record<string, unknown>>)
          .map((subArea, subIndice) => ({
            id: Number(subArea.id ?? subArea.subAreaId ?? subIndice + 1),
            nome: normalizarTexto(subArea.nome ?? subArea.subarea),
            valorTotalRateio: Number(subArea.valorTotalRateio ?? subArea.valorTotal ?? 0),
          }))
          .filter((subArea) => subArea.id > 0 && Boolean(subArea.nome)),
      };
    })
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function listarDespesasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/despesas', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function obterDespesaApi(id: number): Promise<RegistroFinanceiroApi> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/despesas/' + id);
  return extrairDados(data);
}

export async function criarDespesaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/despesas', payloadNormalizado);
  return extrairDados(data);
}

export async function atualizarDespesaApi(
  id: number,
  payload: Record<string, unknown>,
  opcoesEscopoRecorrencia?: OpcoesEscopoRecorrencia,
): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/despesas/' + id,
    payloadNormalizado,
    montarConfigEscopoRecorrencia(opcoesEscopoRecorrencia),
  );
  return extrairDados(data);
}

export async function cancelarDespesaApi(
  id: number,
  opcoesEscopoRecorrencia?: OpcoesEscopoRecorrencia,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/despesas/' + id + '/cancelar',
    undefined,
    montarConfigEscopoRecorrencia(opcoesEscopoRecorrencia),
  );
  return extrairDados(data);
}

export async function efetivarDespesaApi(
  id: number,
  payload: EfetivarDespesaPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/despesas/' + id + '/efetivar',
    payloadNormalizado,
  );
  return extrairDados(data);
}

export async function estornarDespesaApi(
  id: number,
  payload: EstornarRegistroPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/despesas/' + id + '/estornar',
    payload,
  );
  return extrairDados(data);
}

export async function listarReceitasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/receitas', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function obterReceitaApi(id: number): Promise<RegistroFinanceiroApi> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/receitas/' + id);
  return extrairDados(data);
}

export async function criarReceitaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/receitas', payloadNormalizado);
  return extrairDados(data);
}

export async function atualizarReceitaApi(
  id: number,
  payload: Record<string, unknown>,
  opcoesEscopoRecorrencia?: OpcoesEscopoRecorrencia,
): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/receitas/' + id,
    payloadNormalizado,
    montarConfigEscopoRecorrencia(opcoesEscopoRecorrencia),
  );
  return extrairDados(data);
}

export async function cancelarReceitaApi(
  id: number,
  opcoesEscopoRecorrencia?: OpcoesEscopoRecorrencia,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/receitas/' + id + '/cancelar',
    undefined,
    montarConfigEscopoRecorrencia(opcoesEscopoRecorrencia),
  );
  return extrairDados(data);
}

export async function efetivarReceitaApi(
  id: number,
  payload: EfetivarReceitaPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/receitas/' + id + '/efetivar',
    payloadNormalizado,
  );
  return extrairDados(data);
}

export async function estornarReceitaApi(
  id: number,
  payload: EstornarRegistroPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/receitas/' + id + '/estornar',
    payload,
  );
  return extrairDados(data);
}

export async function listarReceitasPendentesAprovacaoApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>(
    '/financeiro/receitas/pendentes-aprovacao',
    montarConfigConsulta(opcoes),
  );
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data));
}

export async function listarReembolsosApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/reembolsos', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function obterReembolsoApi(id: number): Promise<RegistroFinanceiroApi> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/reembolsos/' + id);
  return extrairDados(data);
}

export async function criarReembolsoApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/reembolsos', payloadNormalizado);
  return extrairDados(data);
}

export async function atualizarReembolsoApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataLancamento', 'dataEfetivacao']);
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/reembolsos/' + id, payloadNormalizado);
  return extrairDados(data);
}

export async function efetivarReembolsoApi(
  id: number,
  payload: EfetivarReembolsoPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const payloadNormalizado = prepararPayloadDataHoraApi(payload, ['dataEfetivacao']);
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/reembolsos/' + id + '/efetivar',
    payloadNormalizado,
  );
  return extrairDados(data);
}

export async function estornarReembolsoApi(
  id: number,
  payload: EstornarReembolsoPayloadApi,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/reembolsos/' + id + '/estornar',
    payload,
  );
  return extrairDados(data);
}

export async function deletarReembolsoApi(id: number): Promise<void> {
  await api.delete('/financeiro/reembolsos/' + id);
}

export interface ConviteAmizadeApi {
  id: number;
  usuarioOrigemNome?: string;
  usuarioOrigemEmail: string;
  mensagem?: string;
  status?: string;
  dataHoraCadastro?: string;
}

export interface AprovacaoFinanceiraApi extends RegistroFinanceiroApi {
  status?: string;
}

export async function enviarConviteAmizadeApi(payload: { email: string; mensagem?: string }): Promise<ConviteAmizadeApi> {
  const { data } = await api.post<EnvelopeApi<ConviteAmizadeApi> | ConviteAmizadeApi>('/financeiro/amigos/convites', payload);
  return extrairDados(data);
}

export async function listarConvitesAmizadeApi(opcoes?: OpcoesRequisicao): Promise<ConviteAmizadeApi[]> {
  const { data } = await api.get<EnvelopeApi<ConviteAmizadeApi[]> | ConviteAmizadeApi[]>('/financeiro/amigos/convites', montarConfigConsulta(opcoes));
  return extrairLista<ConviteAmizadeApi>(extrairDados(data)).map((item, indice) => ({
    id: Number((item as any).id ?? indice + 1),
    usuarioOrigemNome: normalizarTexto((item as any).usuarioOrigemNome ?? (item as any).nome) || undefined,
    usuarioOrigemEmail: normalizarTexto((item as any).usuarioOrigemEmail ?? (item as any).email),
    mensagem: normalizarTexto((item as any).mensagem ?? (item as any).mensagemConvite) || undefined,
    status: normalizarTexto((item as any).status) || 'pendente',
    dataHoraCadastro: normalizarTexto((item as any).dataHoraCadastro ?? (item as any).dataCriacao ?? (item as any).dataConvite) || undefined,
  })).filter((item) => item.id > 0 && Boolean(item.usuarioOrigemEmail));
}

export async function aceitarConviteAmizadeApi(id: number): Promise<void> {
  await api.post('/financeiro/amigos/convites/' + id + '/aceitar');
}

export async function rejeitarConviteAmizadeApi(id: number): Promise<void> {
  await api.post('/financeiro/amigos/convites/' + id + '/rejeitar');
}

export async function removerAmizadeApi(amigoId: number): Promise<void> {
  await api.delete('/financeiro/amigos/' + amigoId);
}

export async function listarAprovacoesDespesasApi(opcoes?: OpcoesRequisicao): Promise<AprovacaoFinanceiraApi[]> {
  const { data } = await api.get<EnvelopeApi<AprovacaoFinanceiraApi[]> | AprovacaoFinanceiraApi[]>('/financeiro/aprovacoes/despesas', montarConfigConsulta(opcoes));
  return extrairLista<AprovacaoFinanceiraApi>(extrairDados(data));
}

export async function aprovarDespesaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/despesas/' + id + '/aprovar');
}

export async function rejeitarDespesaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/despesas/' + id + '/rejeitar');
}

export async function listarAprovacoesReceitasApi(opcoes?: OpcoesRequisicao): Promise<AprovacaoFinanceiraApi[]> {
  const { data } = await api.get<EnvelopeApi<AprovacaoFinanceiraApi[]> | AprovacaoFinanceiraApi[]>('/financeiro/aprovacoes/receitas', montarConfigConsulta(opcoes));
  return extrairLista<AprovacaoFinanceiraApi>(extrairDados(data));
}

export async function listarHistoricoTransacoesApi(opcoes?: OpcoesHistoricoTransacoesApi): Promise<HistoricoTransacaoApi[]> {
  const quantidadeRegistros = normalizarQuantidadeHistorico(opcoes?.quantidadeRegistros);
  const ordemRegistros = normalizarOrdemHistorico(opcoes?.ordemRegistros);

  const { data } = await api.get<EnvelopeApi<HistoricoTransacaoApi[]> | HistoricoTransacaoApi[]>(
    '/financeiro/historico-transacoes',
    {
      signal: opcoes?.signal,
      params: {
        quantidadeRegistros,
        ordemRegistros,
      },
    },
  );

  return extrairLista<HistoricoTransacaoApi>(extrairDados(data));
}

export async function listarResumoHistoricoTransacoesApi(
  opcoes?: OpcoesResumoHistoricoTransacoesApi,
): Promise<ResumoHistoricoTransacoesApi> {
  const ano = normalizarAnoResumo(opcoes?.ano);
  const config = {
    signal: opcoes?.signal,
    ...(ano !== undefined ? { params: { ano } } : {}),
  };

  const { data } = await api.get<EnvelopeApi<ResumoHistoricoTransacoesApi> | ResumoHistoricoTransacoesApi>(
    '/financeiro/historico-transacoes/resumo',
    config,
  );

  return extrairDados(data);
}

export async function aprovarReceitaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/receitas/' + id + '/aprovar');
}

export async function rejeitarReceitaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/receitas/' + id + '/rejeitar');
}


export interface ContaBancariaOpcaoApi {
  id: number;
  nome: string;
  banco?: string;
}

export interface CartaoOpcaoApi {
  id: number;
  nome: string;
  bandeira?: string;
  tipo?: string;
}

export type TipoTransacaoFaturaCartaoApi = 'despesa' | 'receita' | 'reembolso';

export interface OpcoesConsultaFaturaCartaoApi {
  signal?: AbortSignal;
  competencia: string;
  cartaoId?: number;
  pagina?: number;
  tamanhoPagina?: number;
  tipoTransacao?: TipoTransacaoFaturaCartaoApi;
}

export interface FaturaCartaoResumoApi extends RegistroFinanceiroApi {
  faturaCartaoId: number;
  cartaoId?: number;
  competencia: string;
  status?: string;
  valorTotal: number;
}

export interface FaturaCartaoDetalheApi extends RegistroFinanceiroApi {
  faturaCartaoId: number;
  cartaoId?: number;
  competencia: string;
  status?: string;
  valorTotal: number;
  valorTotalTransacoes: number;
  transacoes: RegistroFinanceiroApi[];
}

export async function listarContasBancariasDetalheApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/contas-bancarias', montarConfigConsulta(opcoes));
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data));
}

export async function listarContasBancariasApi(opcoes?: OpcoesRequisicao): Promise<ContaBancariaOpcaoApi[]> {
  const lista = await obterListaComFallback<Record<string, unknown>>(['/financeiro/contas-bancarias'], opcoes);
  return lista
    .map((item, indice) => ({
      id: Number(item.id ?? indice + 1),
      nome: normalizarTexto(item.nome ?? item.descricao ?? item.conta),
      banco: normalizarTexto(item.banco ?? item.nomeBanco) || undefined,
    }))
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function obterContaBancariaApi(id: number, opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi> {
  const config = montarConfigConsulta(opcoes);
  const temConfig = Boolean(config.signal) || Boolean(config.params);
  const { data } = temConfig
    ? await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias/' + id, config)
    : await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias/' + id);
  return extrairDados(data);
}

export async function criarContaBancariaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias', payload);
  return extrairDados(data);
}

export async function atualizarContaBancariaApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias/' + id, payload);
  return extrairDados(data);
}

export async function inativarContaBancariaApi(id: number, payload: Record<string, unknown> = {}): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias/' + id + '/inativar', payload);
  return extrairDados(data);
}

export async function ativarContaBancariaApi(id: number): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/contas-bancarias/' + id + '/ativar');
  return extrairDados(data);
}

export async function listarLancamentosContaBancariaApi(id: number, opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const config = montarConfigConsulta(opcoes);
  const temConfig = Boolean(config.signal) || Boolean(config.params);
  const { data } = temConfig
    ? await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/contas-bancarias/' + id + '/lancamentos', config)
    : await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/contas-bancarias/' + id + '/lancamentos');
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data));
}

export async function listarCartoesDetalheApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/cartoes', montarConfigConsulta(opcoes));
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data));
}

export async function listarCartoesApi(opcoes?: OpcoesRequisicao): Promise<CartaoOpcaoApi[]> {
  const lista = await obterListaComFallback<Record<string, unknown>>(['/financeiro/cartoes'], opcoes);
  return lista
    .map((item, indice) => ({
      id: Number(item.id ?? indice + 1),
      nome: normalizarTexto(item.nome ?? item.descricao ?? item.cartao),
      bandeira: normalizarTexto(item.bandeira ?? item.nomeBandeira) || undefined,
      tipo: normalizarTexto(item.tipo) || undefined,
    }))
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function obterCartaoApi(id: number, opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi> {
  const config = montarConfigConsulta(opcoes);
  const temConfig = Boolean(config.signal) || Boolean(config.params);
  const { data } = temConfig
    ? await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes/' + id, config)
    : await api.get<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes/' + id);
  return extrairDados(data);
}

export async function criarCartaoApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes', payload);
  return extrairDados(data);
}

export async function atualizarCartaoApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes/' + id, payload);
  return extrairDados(data);
}

export async function inativarCartaoApi(id: number, payload: Record<string, unknown> = {}): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes/' + id + '/inativar', payload);
  return extrairDados(data);
}

export async function ativarCartaoApi(id: number): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/cartoes/' + id + '/ativar');
  return extrairDados(data);
}

export async function listarLancamentosCartaoApi(id: number, opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const config = montarConfigConsulta(opcoes);
  const temConfig = Boolean(config.signal) || Boolean(config.params);
  const { data } = temConfig
    ? await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/cartoes/' + id + '/lancamentos', config)
    : await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/cartoes/' + id + '/lancamentos');
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data));
}

export async function listarFaturasCartaoApi(
  opcoes: OpcoesConsultaFaturaCartaoApi,
): Promise<FaturaCartaoResumoApi[]> {
  const { data } = await api.get<EnvelopeApi<unknown> | unknown>(
    '/financeiro/faturas-cartao',
    montarConfigConsultaFaturaCartao(opcoes),
  );
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data))
    .map(normalizarFaturaCartaoResumoApi)
    .filter((item) => item.faturaCartaoId > 0);
}

export async function listarDetalhesFaturasCartaoApi(
  opcoes: OpcoesConsultaFaturaCartaoApi,
): Promise<FaturaCartaoDetalheApi[]> {
  // Contrato atual do endpoint de detalhes nao aceita filtro por cartaoId.
  const { data } = await api.get<EnvelopeApi<unknown> | unknown>(
    '/financeiro/faturas-cartao/detalhes',
    montarConfigConsultaFaturaCartao({ ...opcoes, cartaoId: undefined }),
  );
  return extrairLista<RegistroFinanceiroApi>(extrairDados(data))
    .map(normalizarFaturaCartaoDetalheApi)
    .filter((item) => item.faturaCartaoId > 0);
}

export async function efetivarFaturaCartaoApi(
  faturaCartaoId: number,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/faturas-cartao/' + faturaCartaoId + '/efetivar',
  );
  return extrairDados(data);
}

export async function estornarFaturaCartaoApi(
  faturaCartaoId: number,
): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(
    '/financeiro/faturas-cartao/' + faturaCartaoId + '/estornar',
  );
  return extrairDados(data);
}
