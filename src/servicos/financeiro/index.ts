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

export async function listarAmigosRateioApi(opcoes?: OpcoesRequisicao): Promise<AmigoRateioApi[]> {
  const { data } = await api.get('/financeiro/amigos', { signal: opcoes?.signal });
  return extrairLista<Record<string, unknown>>(extrairDados<unknown>(data))
    .map((item) => ({
      id: Number(item.id ?? 0),
      nome: normalizarTexto(item.nome),
      email: normalizarTexto(item.email) || undefined,
    }))
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function listarAreasSubareasRateioApi(opcoes?: OpcoesRequisicao): Promise<AreaSubareaRateioApi[]> {
  const { data } = await api.get('/financeiro/areas-subareas', { signal: opcoes?.signal });
  return extrairLista<Record<string, unknown>>(extrairDados<unknown>(data))
    .map((item) => ({
      id: Number(item.id ?? 0),
      nome: normalizarTexto(item.nome),
      tipo: (normalizarTexto(item.tipo) === 'receita' ? 'receita' : 'despesa') as AreaSubareaRateioApi['tipo'],
      subAreas: Array.isArray(item.subAreas)
        ? (item.subAreas as Array<Record<string, unknown>>)
            .map((subArea) => ({
              id: Number(subArea.id ?? 0),
              nome: normalizarTexto(subArea.nome),
            }))
            .filter((subArea) => subArea.id > 0 && Boolean(subArea.nome))
        : [],
    }))
    .filter((item) => item.id > 0 && Boolean(item.nome));
}

export async function listarDespesasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/despesas', { signal: opcoes?.signal });
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
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/receitas', { signal: opcoes?.signal });
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
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/reembolsos', { signal: opcoes?.signal });
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