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
  competenciaMes?: number;
  competenciaAno?: number;
}

function montarConfigConsulta(opcoes?: OpcoesRequisicao): { signal?: AbortSignal; params?: Record<string, string | number> } {
  const params: Record<string, string | number> = {};

  if (opcoes?.dataInicio) params.dataInicio = opcoes.dataInicio;
  if (opcoes?.dataFim) params.dataFim = opcoes.dataFim;
  if (opcoes?.id) params.id = opcoes.id;
  if (opcoes?.descricao) params.descricao = opcoes.descricao;
  if (opcoes?.competenciaMes) params.competenciaMes = opcoes.competenciaMes;
  if (opcoes?.competenciaAno) params.competenciaAno = opcoes.competenciaAno;

  return {
    signal: opcoes?.signal,
    ...(Object.keys(params).length ? { params } : {}),
  };
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? '').trim();
}

function extrairLista<T>(entrada: unknown): T[] {
  if (Array.isArray(entrada)) return entrada as T[];
  if (!entrada || typeof entrada !== 'object') return [];

  const registro = entrada as Record<string, unknown>;
  for (const chave of ['dados', 'itens', 'amigos', 'areas', 'areaSubareas']) {
    if (Array.isArray(registro[chave])) return registro[chave] as T[];
  }
  return [];
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

export async function listarDespesasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/despesas', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function criarDespesaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/despesas', payload);
  return extrairDados(data);
}

export async function atualizarDespesaApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/despesas/' + id, payload);
  return extrairDados(data);
}

export async function listarReceitasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/receitas', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function criarReceitaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/receitas', payload);
  return extrairDados(data);
}

export async function atualizarReceitaApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/receitas/' + id, payload);
  return extrairDados(data);
}

export async function listarReembolsosApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/reembolsos', montarConfigConsulta(opcoes));
  return extrairDados(data);
}

export async function criarReembolsoApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/reembolsos', payload);
  return extrairDados(data);
}

export async function atualizarReembolsoApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/reembolsos/' + id, payload);
  return extrairDados(data);
}

export async function deletarReembolsoApi(id: number): Promise<void> {
  await api.delete('/financeiro/reembolsos/' + id);
}

export interface ConviteAmizadeApi {
  id: number;
  nome?: string;
  email: string;
  status?: string;
  dataCriacao?: string;
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
    nome: normalizarTexto((item as any).nome) || undefined,
    email: normalizarTexto((item as any).email),
    status: normalizarTexto((item as any).status) || undefined,
    dataCriacao: normalizarTexto((item as any).dataCriacao || (item as any).dataConvite) || undefined,
  })).filter((item) => item.id > 0 && Boolean(item.email));
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
  await api.post('/financeiro/aprovacoes/despesas/' + id + '/aprovar');
}

export async function rejeitarDespesaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/aprovacoes/despesas/' + id + '/rejeitar');
}

export async function listarAprovacoesReceitasApi(opcoes?: OpcoesRequisicao): Promise<AprovacaoFinanceiraApi[]> {
  const { data } = await api.get<EnvelopeApi<AprovacaoFinanceiraApi[]> | AprovacaoFinanceiraApi[]>('/financeiro/aprovacoes/receitas', montarConfigConsulta(opcoes));
  return extrairLista<AprovacaoFinanceiraApi>(extrairDados(data));
}

export async function aprovarReceitaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/aprovacoes/receitas/' + id + '/aprovar');
}

export async function rejeitarReceitaPendenteApi(id: number): Promise<void> {
  await api.post('/financeiro/aprovacoes/receitas/' + id + '/rejeitar');
}
