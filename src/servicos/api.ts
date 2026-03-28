import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { obterTokenAcesso, obterRefreshToken, salvarTokens, limparTokens } from '../utils/armazenamento';
import { usarAutenticacaoStore } from '../store/usarAutenticacaoStore';
import { usarNotificacaoStore } from '../store/usarNotificacaoStore';
import { erroApiJaNotificado, extrairMensagemErroApi, marcarErroApiComoNotificado } from '../utils/erroApi';

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

export const criarInstanciaApi = (): AxiosInstance => {
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://localhost:5001/api').trim();
  const instancia = axios.create({
    baseURL: apiUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  instancia.interceptors.request.use(
    async (configuracao: InternalAxiosRequestConfig) => {
      const tokenAcesso = await obterTokenAcesso();
      if (tokenAcesso && configuracao.headers) {
        configuracao.headers.Authorization = `Bearer ${tokenAcesso}`;
      }
      return configuracao;
    },
    (erro) => Promise.reject(erro),
  );

  instancia.interceptors.response.use(
    (resposta: AxiosResponse) => resposta,
    async (erro) => {
      const requisicaoOriginal = erro.config;

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

          const { data } = await instancia.post('/autenticacao/renovar', { refreshToken });
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
