import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware.js';
import { InterfaceUsuario } from '../tipos/usuario.tipos';
import { limparTokens } from '../utils/armazenamento';
import { storageSessaoPersistente } from '../utils/storagePersistente';

interface EstadoAutenticacao {
  usuario: InterfaceUsuario | null;
  accessToken: string | null;
  estaAutenticado: boolean;
  estaSimulando: boolean;
  usuarioSimulado: InterfaceUsuario | null;
  acessoNegado: boolean;

  definirSessao: (usuario: InterfaceUsuario, token: string) => void;
  atualizarToken: (novoToken: string) => void;
  deslogar: () => Promise<void>;
  iniciarSimulacao: (usuario: InterfaceUsuario) => void;
  encerrarSimulacao: () => void;
  definirAcessoNegado: (valor: boolean) => void;
}

export const usarAutenticacaoStore = create<EstadoAutenticacao>()(
  persist(
    (definir, obter) => ({
      usuario: null,
      accessToken: null,
      estaAutenticado: false,
      estaSimulando: false,
      usuarioSimulado: null,
      acessoNegado: false,

      definirSessao: (usuario, token) =>
        definir({
          usuario,
          accessToken: token,
          estaAutenticado: true,
          acessoNegado: false,
        }),

      atualizarToken: (novoToken) => definir({ accessToken: novoToken }),

      deslogar: async () => {
        await limparTokens();
        definir({
          usuario: null,
          accessToken: null,
          estaAutenticado: false,
          estaSimulando: false,
          usuarioSimulado: null,
        });
      },

      iniciarSimulacao: (usuarioAlvo) =>
        definir({ estaSimulando: true, usuarioSimulado: usuarioAlvo }),

      encerrarSimulacao: () => definir({ estaSimulando: false, usuarioSimulado: null }),

      definirAcessoNegado: (valor) => definir({ acessoNegado: valor }),
    }),
    {
      name: 'autenticacao-storage',
      storage: createJSONStorage(() => storageSessaoPersistente),
      partialize: (estado) => ({
        usuario: estado.usuario,
        estaAutenticado: estado.estaAutenticado,
      }),
    },
  ),
);
