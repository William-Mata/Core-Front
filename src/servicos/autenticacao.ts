import { api } from './api';
import { InterfaceModuloUsuario, InterfaceTelaModulo, InterfaceUsuario } from '../tipos/usuario.tipos';

interface RespostaLoginApi {
  accessToken: string;
  refreshToken: string;
  expiracao?: string;
  usuario: unknown;
}

interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  expiracao?: string;
  usuario: InterfaceUsuario;
}

interface PayloadEsqueciSenha {
  email: string;
}

interface PayloadAlterarSenha {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

interface PayloadCriarPrimeiraSenha {
  email: string;
  novaSenha: string;
  confirmarSenha: string;
}

interface PayloadCadastrarUsuario {
  nome: string;
  email: string;
  dataNascimento: string;
}

interface RespostaMensagem {
  mensagem?: string;
}

function parseStatus(valor: unknown, padrao = true): boolean {
  if (valor === undefined || valor === null) return padrao;
  if (typeof valor === 'boolean') return valor;
  const texto = String(valor).trim().toLowerCase();
  if (['1', 'true', 'ativo', 'active', 'enabled'].includes(texto)) return true;
  if (['0', 'false', 'inativo', 'inactive', 'disabled'].includes(texto)) return false;
  return padrao;
}

function normalizarPerfilId(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function slug(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizarModuloId(modulo: Record<string, unknown>): string {
  const idBruto = String(modulo.id ?? '').trim();
  if (idBruto) return idBruto;
  const nome = slug(String(modulo.nome ?? ''));
  if (nome.includes('finance')) return 'financeiro';
  if (nome.includes('compra')) return 'compras';
  if (nome.includes('amig')) return 'amigos';
  if (nome.includes('admin')) return 'administracao';
  return idBruto || nome || `modulo-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizarTelaId(tela: Record<string, unknown>): string {
  const idBruto = String(tela.id ?? '').trim();
  if (idBruto) return idBruto;
  const nome = slug(String(tela.nome ?? ''));
  if (nome.includes('despesa')) return 'despesa';
  if (nome.includes('receita')) return 'receita';
  if (nome.includes('reembolso')) return 'reembolso';
  if (nome.includes('conta')) return 'conta-bancaria';
  if (nome.includes('cart')) return 'cartao';
  if (nome.includes('usuario')) return 'usuarios';
  if (nome.includes('permiss')) return 'permissoes';
  if (nome.includes('document')) return 'documentos';
  if (nome.includes('aviso')) return 'avisos';
  if (nome.includes('visao') || nome.includes('geral')) return 'visao-geral';
  if (nome.includes('documentacao')) return 'documentacao';
  if (nome.includes('lista')) return 'lista';
  if (nome.includes('historico') && nome.includes('item')) return 'historico-itens';
  if (nome.includes('desejo')) return 'desejos';
  if (nome.includes('convite')) return 'convite';
  return idBruto || nome || `tela-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizarModulos(modulosBrutos: unknown): InterfaceModuloUsuario[] {
  if (!Array.isArray(modulosBrutos)) return [];

  return modulosBrutos.map((moduloBruto) => {
    const modulo = (moduloBruto || {}) as Record<string, unknown>;
    const telasBrutas = Array.isArray(modulo.telas)
      ? (modulo.telas as Array<Record<string, unknown>>)
      : [];
    const funcionalidadesLegado = Array.isArray(modulo.funcionalidades)
      ? (modulo.funcionalidades as Array<Record<string, unknown>>)
      : [];

    const telas: InterfaceTelaModulo[] =
      telasBrutas.length > 0
        ? telasBrutas.map((telaBruta) => {
            const funcionalidadesBrutas = Array.isArray(telaBruta.funcionalidades)
              ? (telaBruta.funcionalidades as Array<Record<string, unknown>>)
              : [];
            return {
              id: normalizarTelaId(telaBruta),
              nome: String(telaBruta.nome ?? ''),
              status: parseStatus(telaBruta.status, true),
              funcionalidades: funcionalidadesBrutas.map((func) => ({
                id: String(func.id ?? ''),
                nome: String(func.nome ?? ''),
                status: parseStatus(func.status, true),
              })),
            };
          })
        : funcionalidadesLegado.map((func) => ({
            id: normalizarTelaId(func),
            nome: String(func.nome ?? ''),
            status: parseStatus(func.status, true),
            funcionalidades: [],
          }));

    return {
      id: normalizarModuloId(modulo),
      nome: String(modulo.nome ?? ''),
      status: parseStatus(modulo.status, true),
      telas,
    };
  });
}

function normalizarUsuario(entrada: unknown): InterfaceUsuario {
  const usuario = (entrada || {}) as Record<string, unknown>;
  const perfilBruto = (usuario.perfil || {}) as Record<string, unknown>;

  return {
    id: Number(usuario.id ?? 0),
    nome: String(usuario.nome ?? ''),
    email: String(usuario.email ?? ''),
    status: parseStatus(usuario.status, true),
    perfil: {
      id: normalizarPerfilId(perfilBruto.id),
      nome: String(perfilBruto.nome ?? ''),
    },
    modulosAtivos: normalizarModulos(usuario.modulosAtivos),
  };
}

function criarModulosPadraoCadastroUsuario(): InterfaceModuloUsuario[] {
  const funcionalidadesCrud = [
    { id: '1', nome: 'Visualizar', status: true },
    { id: '2', nome: 'Criar', status: true },
    { id: '3', nome: 'Editar', status: true },
    { id: '4', nome: 'Excluir', status: true },
  ];
  const funcionalidadesVisualizar = [{ id: '1', nome: 'Visualizar', status: true }];
  const funcionalidadesInativas = funcionalidadesCrud.map((funcionalidade) => ({ ...funcionalidade, status: false }));
  const funcionalidadesVisualizarInativas = funcionalidadesVisualizar.map((funcionalidade) => ({ ...funcionalidade, status: false }));

  return [
    {
      id: '1',
      nome: 'Geral',
      status: true,
      telas: [
        { id: '1', nome: 'Dashboard', status: true, funcionalidades: funcionalidadesVisualizar },
        { id: '2', nome: 'Painel do Usuario', status: true, funcionalidades: funcionalidadesVisualizar },
        { id: '3', nome: 'Lista de Amigos', status: true, funcionalidades: funcionalidadesCrud },
        { id: '4', nome: 'Convites', status: true, funcionalidades: funcionalidadesCrud },
        { id: '5', nome: 'Documentacao Modulo Geral', status: true, funcionalidades: funcionalidadesVisualizar },
      ],
    },
    {
      id: '2',
      nome: 'Administracao',
      status: false,
      telas: [
        { id: '30', nome: 'Administracao', status: false, funcionalidades: funcionalidadesVisualizarInativas },
        { id: '31', nome: 'Usuarios', status: false, funcionalidades: funcionalidadesInativas },
        { id: '32', nome: 'Permissoes', status: false, funcionalidades: funcionalidadesInativas },
        { id: '33', nome: 'Documentos', status: false, funcionalidades: funcionalidadesInativas },
        { id: '34', nome: 'Avisos', status: false, funcionalidades: funcionalidadesInativas },
        { id: '35', nome: 'Documentacao Modulo Administracao', status: false, funcionalidades: funcionalidadesVisualizarInativas },
      ],
    },
    {
      id: '3',
      nome: 'Financeiro',
      status: true,
      telas: [
        { id: '100', nome: 'Despesas', status: true, funcionalidades: funcionalidadesCrud },
        { id: '101', nome: 'Receitas', status: true, funcionalidades: funcionalidadesCrud },
        { id: '102', nome: 'Reembolso', status: true, funcionalidades: funcionalidadesCrud },
        { id: '103', nome: 'Contas Bancarias', status: true, funcionalidades: funcionalidadesCrud },
        { id: '104', nome: 'Cartoes de Credito', status: true, funcionalidades: funcionalidadesCrud },
        { id: '105', nome: 'Documentacao Modulo Financeiro', status: true, funcionalidades: funcionalidadesVisualizar },
      ],
    },
    {
      id: '4',
      nome: 'Compras',
      status: true,
      telas: [
        { id: '200', nome: 'Listas de Compras', status: true, funcionalidades: funcionalidadesCrud },
        { id: '201', nome: 'Lista de Desejos', status: true, funcionalidades: funcionalidadesCrud },
        { id: '202', nome: 'Historico de Itens', status: true, funcionalidades: funcionalidadesVisualizar },
        { id: '203', nome: 'Documentacao Modulo Compras', status: true, funcionalidades: funcionalidadesVisualizar },
      ],
    },
  ];
}

export async function autenticar(email: string, senha: string): Promise<RespostaLogin> {
  const { data } = await api.post<RespostaLoginApi>('/autenticacao/entrar', { email, senha });
  return {
    ...data,
    usuario: normalizarUsuario(data.usuario),
  };
}

export async function cadastrarUsuario(payload: PayloadCadastrarUsuario): Promise<void> {
  await api.post('/usuarios', {
    nome: payload.nome,
    email: payload.email,
    dataNascimento: payload.dataNascimento,
    perfil: 'USER',
    status: true,
    modulosAtivos: criarModulosPadraoCadastroUsuario(),
  });
}

export async function solicitarRecuperacaoSenha(payload: PayloadEsqueciSenha): Promise<void> {
  await api.post('/autenticacao/esqueci-senha', payload);
}

export async function alterarSenha(payload: PayloadAlterarSenha): Promise<void> {
  await api.post('/usuarios/alterar-senha', payload);
}

export async function criarPrimeiraSenha(payload: PayloadCriarPrimeiraSenha): Promise<string> {
  const { data } = await api.post<RespostaMensagem>('/autenticacao/criar-primeira-senha', {
    email: payload.email,
    senha: payload.novaSenha,
    confirmarSenha: payload.confirmarSenha,
  });
  return data?.mensagem || 'Senha criada com sucesso.';
}
