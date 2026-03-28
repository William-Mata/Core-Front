import { create } from 'zustand';

interface EstadoCarregamento {
  carregandoNavegacao: boolean;
  requisicoesAtivas: number;
  iniciarCarregamentoNavegacao: () => void;
  finalizarCarregamentoNavegacao: () => void;
  incrementarRequisicoes: () => void;
  decrementarRequisicoes: () => void;
}

export const usarCarregamentoStore = create<EstadoCarregamento>((set) => ({
  carregandoNavegacao: false,
  requisicoesAtivas: 0,

  iniciarCarregamentoNavegacao: () => set({ carregandoNavegacao: true }),
  finalizarCarregamentoNavegacao: () => set({ carregandoNavegacao: false }),

  incrementarRequisicoes: () =>
    set((estado) => ({
      requisicoesAtivas: estado.requisicoesAtivas + 1,
    })),

  decrementarRequisicoes: () =>
    set((estado) => ({
      requisicoesAtivas: Math.max(0, estado.requisicoesAtivas - 1),
    })),
}));
