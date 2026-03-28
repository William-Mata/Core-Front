import { api } from './api';

interface EnvelopeApi<T> {
  sucesso?: boolean;
  dados: T;
}

export interface RegistroFinanceiroApi {
  id: number;
  [key: string]: unknown;
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

export async function listarDespesasApi(opcoes?: OpcoesRequisicao): Promise<RegistroFinanceiroApi[]> {
  const { data } = await api.get<EnvelopeApi<RegistroFinanceiroApi[]> | RegistroFinanceiroApi[]>('/financeiro/despesas', { signal: opcoes?.signal });
  return extrairDados(data);
}

export async function criarDespesaApi(payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.post<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>('/financeiro/despesas', payload);
  return extrairDados(data);
}

export async function atualizarDespesaApi(id: number, payload: Record<string, unknown>): Promise<RegistroFinanceiroApi> {
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(`/financeiro/despesas/${id}`, payload);
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
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(`/financeiro/receitas/${id}`, payload);
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
  const { data } = await api.put<EnvelopeApi<RegistroFinanceiroApi> | RegistroFinanceiroApi>(`/financeiro/reembolsos/${id}`, payload);
  return extrairDados(data);
}

export async function deletarReembolsoApi(id: number): Promise<void> {
  await api.delete(`/financeiro/reembolsos/${id}`);
}
