import { api } from '../api';
import { InterfaceModuloUsuario, InterfaceTelaModulo } from '../../tipos/usuario.tipos';

interface EnvelopeApi<T> {
  sucesso?: boolean;
  mensagem?: string;
  dados: T;
}

export interface UsuarioAdminApi {
  id: number;
  nome: string;
  email: string;
  dataNascimento: string;
  perfil: 'USER' | 'ADMIN';
  status: boolean;
  modulosAtivos: InterfaceModuloUsuario[];
  dataCriacao: string;
}

function extrairDados<T>(entrada: EnvelopeApi<T> | T): T {
  if (entrada && typeof entrada === 'object' && 'dados' in (entrada as Record<string, unknown>)) {
    return (entrada as EnvelopeApi<T>).dados;
  }
  return entrada as T;
}

function parseStatus(valor: unknown, padrao: boolean): boolean {
  if (valor === undefined || valor === null) return padrao;
  if (typeof valor === 'boolean') return valor;
  const texto = String(valor).trim().toLowerCase();
  if (!texto) return padrao;
  if (['false', '0', 'inativo', 'inactive', 'disabled'].includes(texto)) return false;
  if (['true', '1', 'ativo', 'active', 'enabled'].includes(texto)) return true;
  return padrao;
}

function mapearUsuarioApi(item: Record<string, unknown>): UsuarioAdminApi {
  const perfilBruto = item.perfil as unknown;
  const perfilId =
    perfilBruto && typeof perfilBruto === 'object'
      ? String((perfilBruto as Record<string, unknown>).id ?? 'USER')
      : String(perfilBruto ?? 'USER');

  const modulosBrutos = (item.modulosAtivos || item.modulos_ativos || []) as Array<Record<string, unknown>>;
  const modulosAtivos: InterfaceModuloUsuario[] = Array.isArray(modulosBrutos)
    ? modulosBrutos.map((modulo) => ({
        id: String(modulo.id ?? ''),
        nome: String(modulo.nome ?? ''),
        status: parseStatus(modulo.status, true),
        telas: (
          (Array.isArray(modulo.telas)
            ? (modulo.telas as Array<Record<string, unknown>>)
            : Array.isArray(modulo.funcionalidades)
              ? (modulo.funcionalidades as Array<Record<string, unknown>>)
              : []) as Array<Record<string, unknown>>
        ).map(
          (tela): InterfaceTelaModulo => ({
            id: String(tela.id ?? ''),
            nome: String(tela.nome ?? ''),
            status: parseStatus(tela.status, true),
            funcionalidades: Array.isArray(tela.funcionalidades)
              ? (tela.funcionalidades as Array<Record<string, unknown>>).map((func) => ({
                  id: String(func.id ?? ''),
                  nome: String(func.nome ?? ''),
                  status: parseStatus(func.status, true),
                }))
              : [],
          }),
        ),
      }))
    : [];

  return {
    id: Number(item.id ?? 0),
    nome: String(item.nome ?? ''),
    email: String(item.email ?? ''),
    dataNascimento: String(item.dataNascimento ?? item.data_nascimento ?? ''),
    perfil: perfilId.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
    status: parseStatus(item.status, true),
    modulosAtivos,
    dataCriacao: String(item.dataCriacao ?? item.data_criacao ?? new Date().toISOString().slice(0, 10)),
  };
}

export async function listarUsuariosAdminApi(signal?: AbortSignal): Promise<UsuarioAdminApi[]> {
  const { data } = await api.get<EnvelopeApi<Record<string, unknown>[]> | Record<string, unknown>[]>(
    '/usuarios',
    { signal },
  );
  return extrairDados(data).map(mapearUsuarioApi);
}

export async function obterUsuarioAdminApi(id: number, signal?: AbortSignal): Promise<UsuarioAdminApi> {
  const { data } = await api.get<EnvelopeApi<Record<string, unknown>> | Record<string, unknown>>(
    `/usuarios/${id}`,
    { signal },
  );
  return mapearUsuarioApi(extrairDados(data));
}

export async function criarUsuarioAdminApi(payload: {
  nome: string;
  email: string;
  dataNascimento: string;
  perfil: 'USER' | 'ADMIN';
  status: boolean;
  modulosAtivos: InterfaceModuloUsuario[];
}): Promise<UsuarioAdminApi> {
  const { data } = await api.post<EnvelopeApi<Record<string, unknown>> | Record<string, unknown>>(
    '/usuarios',
    payload,
  );
  return mapearUsuarioApi(extrairDados(data));
}

export async function atualizarUsuarioAdminApi(
  id: number,
  payload: {
    nome: string;
    email: string;
    dataNascimento: string;
    perfil: 'USER' | 'ADMIN';
    status: boolean;
    modulosAtivos: InterfaceModuloUsuario[];
  },
): Promise<UsuarioAdminApi> {
  const { data } = await api.put<EnvelopeApi<Record<string, unknown>> | Record<string, unknown>>(
    `/usuarios/${id}`,
    payload,
  );
  return mapearUsuarioApi(extrairDados(data));
}

export async function deletarUsuarioAdminApi(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
