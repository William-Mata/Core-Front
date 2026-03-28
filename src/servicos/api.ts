import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { usarCarregamentoStore } from '../store/usarCarregamentoStore';
import { usarAutenticacaoStore } from '../store/usarAutenticacaoStore';
import { usarNotificacaoStore } from '../store/usarNotificacaoStore';
import { obterTokenAcesso, obterRefreshToken, salvarTokens, limparTokens } from '../utils/armazenamento';
import { erroApiJaNotificado, extrairMensagemErroApi, marcarErroApiComoNotificado } from '../utils/erroApi';

interface ConfiguracaoComCarregamento extends InternalAxiosRequestConfig {
  exibirCarregamentoGlobal?: boolean;
  _carregamentoGlobalContabilizado?: boolean;
  _jaRenovado?: boolean;
}

let estaRenovando = false;
let filaAguardando: Array<{
  resolver: (valor: string) => void;
  rejeitar: (erro: unknown) => void;
}> = [];

const processarFila = (erro: unknown, token: string | null = null): void => {
  filaAguardando.forEach(({ resolver, rejeitar }) => {
    if (erro) rejeitar(erro);
    else if (token) resolver(token);
  });
  filaAguardando = [];
};

const finalizarCarregamentoSeNecessario = (config?: ConfiguracaoComCarregamento): void => {
  if (!config?._carregamentoGlobalContabilizado) return;
  config._carregamentoGlobalContabilizado = false;
  usarCarregamentoStore.getState().decrementarRequisicoes();
};

export const criarInstanciaApi = (): AxiosInstance => {
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://localhost:5001/api').trim();
  const instancia = axios.create({
    baseURL: apiUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  instancia.interceptors.request.use(
    async (configuracao: InternalAxiosRequestConfig) => {
      const requisicao = configuracao as ConfiguracaoComCarregamento;
      const tokenAcesso = await obterTokenAcesso();
      if (tokenAcesso && requisicao.headers) {
        requisicao.headers.Authorization = `Bearer ${tokenAcesso}`;
      }

      if (requisicao.exibirCarregamentoGlobal !== false) {
        usarCarregamentoStore.getState().incrementarRequisicoes();
        requisicao._carregamentoGlobalContabilizado = true;
      }

      return requisicao;
    },
    (erro) => Promise.reject(erro),
  );

  instancia.interceptors.response.use(
    (resposta: AxiosResponse) => {
      finalizarCarregamentoSeNecessario(resposta.config as ConfiguracaoComCarregamento);
      return resposta;
    },
    async (erro) => {
      const requisicaoOriginal = erro.config as ConfiguracaoComCarregamento | undefined;
      finalizarCarregamentoSeNecessario(requisicaoOriginal);

      if (requisicaoOriginal?.url?.includes('/autenticacao/renovar')) {
        if (!erroApiJaNotificado(erro)) {
          usarNotificacaoStore?.getState?.().adicionarToast({
            tipo: 'erro',
            mensagem: extrairMensagemErroApi(erro),
          });
          marcarErroApiComoNotificado(erro);
        }
        await limparTokens();
        usarAutenticacaoStore.getState().deslogar();
        return Promise.reject(erro);
      }

      if (erro.response?.status === 401 && !requisicaoOriginal?._jaRenovado) {
        if (!requisicaoOriginal) {
          return Promise.reject(erro);
        }

        requisicaoOriginal._jaRenovado = true;

        if (estaRenovando) {
          return new Promise((resolver, rejeitar) => {
            filaAguardando.push({ resolver, rejeitar });
          }).then((novoToken) => {
            requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
            return instancia(requisicaoOriginal);
          });
        }

        estaRenovando = true;

        try {
          const refreshToken = await obterRefreshToken();
          if (!refreshToken) throw new Error('Sem refresh token');

          const configuracaoRenovacao: AxiosRequestConfig & { exibirCarregamentoGlobal?: boolean } = {
            exibirCarregamentoGlobal: false,
          };

          const { data } = await instancia.post('/autenticacao/renovar', { refreshToken }, configuracaoRenovacao);
          const { accessToken: novoAccessToken, refreshToken: novoRefreshToken } = data;

          await salvarTokens(novoAccessToken, novoRefreshToken);
          usarAutenticacaoStore.getState().atualizarToken(novoAccessToken);

          processarFila(null, novoAccessToken);
          requisicaoOriginal.headers.Authorization = `Bearer ${novoAccessToken}`;
          return instancia(requisicaoOriginal);
        } catch (erroRefresh) {
          processarFila(erroRefresh, null);
          await limparTokens();
          usarAutenticacaoStore.getState().deslogar();
          return Promise.reject(erroRefresh);
        } finally {
          estaRenovando = false;
        }
      }

      if (erro.response?.status === 403) {
        usarAutenticacaoStore.getState().definirAcessoNegado(true);
      }

      if (erro.response?.status >= 400) {
        if (!erroApiJaNotificado(erro)) {
          usarNotificacaoStore?.getState?.().adicionarToast({
            tipo: 'erro',
            mensagem: extrairMensagemErroApi(erro),
          });
          marcarErroApiComoNotificado(erro);
        }
      }

      return Promise.reject(erro);
    },
  );

  return instancia;
};

export const api = criarInstanciaApi();
