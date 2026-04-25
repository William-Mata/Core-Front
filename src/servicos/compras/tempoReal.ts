import { api } from '../api';
import { Platform } from 'react-native';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  IHttpConnectionOptions,
  LogLevel,
} from '@microsoft/signalr';
import { EventoTempoRealCompra } from '../../tipos/compras.tipos';
import { obterTokenAcesso } from '../../utils/armazenamento';

type FuncaoAoReceberEvento = (evento: EventoTempoRealCompra) => void;
type FuncaoAoConexaoAlterada = (conectado: boolean) => void;
export type CodigoErroTempoRealCompras = 'nao_autenticado' | 'sem_permissao_visualizacao' | 'desconhecido';

interface ClienteTempoRealCompras {
  iniciar: () => Promise<void>;
  parar: () => Promise<void>;
  entrarLista: (listaId: number) => Promise<void>;
  sairLista: (listaId: number) => Promise<void>;
  estaConectado: () => boolean;
}

interface OpcoesClienteTempoRealCompras {
  urlHub?: string;
  aoReceberEvento: FuncaoAoReceberEvento;
  aoConexaoAlterada?: FuncaoAoConexaoAlterada;
}

function extrairMensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'string') return erro;
  if (typeof erro === 'object' && erro !== null) {
    const valorMensagem = (erro as { message?: unknown }).message;
    if (typeof valorMensagem === 'string') return valorMensagem;
  }
  return '';
}

export function obterCodigoErroTempoRealCompras(erro: unknown): CodigoErroTempoRealCompras {
  const mensagem = extrairMensagemErro(erro).toLowerCase();
  if (mensagem.includes('usuario_nao_autenticado')) return 'nao_autenticado';
  if (mensagem.includes('lista_compra_sem_permissao_visualizacao')) return 'sem_permissao_visualizacao';
  return 'desconhecido';
}

export function obterUrlHubCompras(): string {
  const baseUrlApi = String(api.defaults.baseURL ?? '').trim();
  if (!baseUrlApi) return '/hubs/compras';
  const baseSemApi = baseUrlApi.replace(/\/api\/?$/i, '');
  return `${baseSemApi}/hubs/compras`;
}

function montarOpcoesConexao(): IHttpConnectionOptions {
  const opcoesConexao: IHttpConnectionOptions = {
    accessTokenFactory: async () => (await obterTokenAcesso()) ?? '',
  };

  if (Platform.OS === 'web') {
    // Backend aceita access_token em query string no fluxo do hub.
    opcoesConexao.transport = HttpTransportType.WebSockets;
    opcoesConexao.skipNegotiation = true;
    opcoesConexao.withCredentials = true;
  }

  return opcoesConexao;
}

export async function criarClienteTempoRealCompras(opcoes: OpcoesClienteTempoRealCompras): Promise<ClienteTempoRealCompras> {
  let conexao: HubConnection | null = null;
  let conectado = false;
  const listasInscritas = new Set<number>();

  const notificarConexao = (status: boolean) => {
    conectado = status;
    opcoes.aoConexaoAlterada?.(status);
  };

  const sincronizarListasInscritas = async () => {
    if (!conexao || !conectado || listasInscritas.size === 0) return;
    for (const listaId of listasInscritas) {
      await conexao.invoke('EntrarLista', listaId);
    }
  };

  const urlHub = opcoes.urlHub ?? obterUrlHubCompras();
  const opcoesConexao = montarOpcoesConexao();

  conexao = new HubConnectionBuilder()
    .configureLogging(LogLevel.None)
    .withUrl(urlHub, opcoesConexao)
    .withAutomaticReconnect()
    .build();

  conexao.on('listaAtualizada', (evento: EventoTempoRealCompra) => {
    opcoes.aoReceberEvento(evento);
  });

  conexao.onclose(() => {
    notificarConexao(false);
  });

  conexao.onreconnecting(() => {
    notificarConexao(false);
  });

  conexao.onreconnected(() => {
    notificarConexao(true);
    void sincronizarListasInscritas();
  });

  return {
    iniciar: async () => {
      if (!conexao) {
        notificarConexao(false);
        return;
      }
      if (conexao.state === HubConnectionState.Connected) {
        notificarConexao(true);
        await sincronizarListasInscritas();
        return;
      }
      await conexao.start();
      notificarConexao(true);
      await sincronizarListasInscritas();
    },
    parar: async () => {
      if (!conexao) {
        notificarConexao(false);
        return;
      }
      await conexao.stop();
      listasInscritas.clear();
      notificarConexao(false);
    },
    entrarLista: async (listaId) => {
      listasInscritas.add(listaId);
      if (!conexao || !conectado) return;
      await conexao.invoke('EntrarLista', listaId);
    },
    sairLista: async (listaId) => {
      listasInscritas.delete(listaId);
      if (!conexao || !conectado) return;
      await conexao.invoke('SairLista', listaId);
    },
    estaConectado: () => conectado,
  };
}
