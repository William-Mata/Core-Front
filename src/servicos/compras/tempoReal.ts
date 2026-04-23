import { api } from '../api';
import { EventoTempoRealCompra } from '../../tipos/compras.tipos';
import { obterTokenAcesso } from '../../utils/armazenamento';

type FuncaoAoReceberEvento = (evento: EventoTempoRealCompra) => void;
type FuncaoAoConexaoAlterada = (conectado: boolean) => void;

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

type ConstrutorConexaoBuilder = new () => {
  withUrl: (url: string, opcoes?: { accessTokenFactory?: () => string }) => {
    withAutomaticReconnect: () => {
      build: () => ConexaoTempoReal;
    };
    build: () => ConexaoTempoReal;
  };
  withAutomaticReconnect: () => {
    build: () => ConexaoTempoReal;
  };
  build: () => ConexaoTempoReal;
};

interface ConexaoTempoReal {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  invoke: (metodo: string, ...args: unknown[]) => Promise<void>;
  on: (nomeEvento: string, callback: (payload: EventoTempoRealCompra) => void) => void;
  onclose: ((erro?: Error) => void) | null;
  onreconnected: ((connectionId?: string) => void) | null;
  state?: unknown;
}

export function obterUrlHubCompras(): string {
  const baseUrlApi = String(api.defaults.baseURL ?? '').trim();
  if (!baseUrlApi) return '/hubs/compras';
  const baseSemApi = baseUrlApi.replace(/\/api\/?$/i, '');
  return `${baseSemApi}/hubs/compras`;
}

export async function criarClienteTempoRealCompras(opcoes: OpcoesClienteTempoRealCompras): Promise<ClienteTempoRealCompras> {
  let conexao: ConexaoTempoReal | null = null;
  let conectado = false;

  const notificarConexao = (status: boolean) => {
    conectado = status;
    opcoes.aoConexaoAlterada?.(status);
  };

  try {
    const modulo = (await import('@microsoft/signalr')) as unknown as {
      HubConnectionBuilder: ConstrutorConexaoBuilder;
    };

    const builder = new modulo.HubConnectionBuilder();
    const urlHub = opcoes.urlHub ?? obterUrlHubCompras();
    conexao = builder
      .withUrl(urlHub, {
        accessTokenFactory: async () => (await obterTokenAcesso()) ?? '',
      })
      .withAutomaticReconnect()
      .build();

    conexao.on('listaAtualizada', (evento: EventoTempoRealCompra) => {
      opcoes.aoReceberEvento(evento);
    });

    conexao.onclose = () => {
      notificarConexao(false);
    };

    conexao.onreconnected = () => {
      notificarConexao(true);
    };
  } catch {
    conexao = null;
  }

  return {
    iniciar: async () => {
      if (!conexao) {
        notificarConexao(false);
        return;
      }
      await conexao.start();
      notificarConexao(true);
    },
    parar: async () => {
      if (!conexao) {
        notificarConexao(false);
        return;
      }
      await conexao.stop();
      notificarConexao(false);
    },
    entrarLista: async (listaId) => {
      if (!conexao || !conectado) return;
      await conexao.invoke('EntrarLista', listaId);
    },
    sairLista: async (listaId) => {
      if (!conexao || !conectado) return;
      await conexao.invoke('SairLista', listaId);
    },
    estaConectado: () => conectado,
  };
}
