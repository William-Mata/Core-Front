import { create } from 'zustand';
import {
  DirecaoOrdenacao,
  EventoTempoRealCompra,
  FiltroStatusCompra,
  ItemListaCompra,
  ListaCompra,
  OrdenacaoItensCompra,
} from '../tipos/compras.tipos';

interface ComprasState {
  listas: ListaCompra[];
  itensDaListaAtiva: ItemListaCompra[];
  listaAtivaId: number | null;
  filtroStatus: FiltroStatusCompra;
  ordenacao: OrdenacaoItensCompra;
  direcaoOrdenacao: DirecaoOrdenacao;
  itensSelecionadosIds: number[];
  avisosSincronizacao: string[];
  versaoItensPorId: Record<number, number>;
  definirListas: (listas: ListaCompra[]) => void;
  definirListaAtiva: (listaId: number | null) => void;
  definirItensDaListaAtiva: (itens: ItemListaCompra[]) => void;
  definirFiltroStatus: (filtro: FiltroStatusCompra) => void;
  definirOrdenacao: (ordenacao: OrdenacaoItensCompra, direcao: DirecaoOrdenacao) => void;
  alternarSelecaoItem: (itemId: number) => void;
  limparSelecaoItens: () => void;
  definirVersaoItem: (itemId: number, versao: number) => void;
  registrarAvisoSincronizacao: (mensagem: string) => void;
  limparAvisosSincronizacao: () => void;
  aplicarEventoTempoReal: (evento: EventoTempoRealCompra) => void;
}

export const usarComprasStore = create<ComprasState>((set) => ({
  listas: [],
  itensDaListaAtiva: [],
  listaAtivaId: null,
  filtroStatus: 'todos',
  ordenacao: 'alfabetica',
  direcaoOrdenacao: 'asc',
  itensSelecionadosIds: [],
  avisosSincronizacao: [],
  versaoItensPorId: {},
  definirListas: (listas) => set(() => ({ listas })),
  definirListaAtiva: (listaAtivaId) =>
    set(() => ({
      listaAtivaId,
      itensSelecionadosIds: [],
      avisosSincronizacao: [],
    })),
  definirItensDaListaAtiva: (itensDaListaAtiva) =>
    set(() => ({
      itensDaListaAtiva,
      versaoItensPorId: itensDaListaAtiva.reduce<Record<number, number>>((acc, item) => {
        acc[item.id] = item.versao;
        return acc;
      }, {}),
    })),
  definirFiltroStatus: (filtroStatus) => set(() => ({ filtroStatus })),
  definirOrdenacao: (ordenacao, direcaoOrdenacao) => set(() => ({ ordenacao, direcaoOrdenacao })),
  alternarSelecaoItem: (itemId) =>
    set((state) => {
      const selecionado = state.itensSelecionadosIds.includes(itemId);
      return {
        itensSelecionadosIds: selecionado
          ? state.itensSelecionadosIds.filter((id) => id !== itemId)
          : [...state.itensSelecionadosIds, itemId],
      };
    }),
  limparSelecaoItens: () => set(() => ({ itensSelecionadosIds: [] })),
  definirVersaoItem: (itemId, versao) =>
    set((state) => ({
      versaoItensPorId: {
        ...state.versaoItensPorId,
        [itemId]: versao,
      },
    })),
  registrarAvisoSincronizacao: (mensagem) =>
    set((state) => ({
      avisosSincronizacao: [...state.avisosSincronizacao, mensagem],
    })),
  limparAvisosSincronizacao: () => set(() => ({ avisosSincronizacao: [] })),
  aplicarEventoTempoReal: (evento) =>
    set((state) => {
      if (state.listaAtivaId !== evento.listaId) return {};
      if (!evento.itemId || !evento.versao) {
        return {
          avisosSincronizacao: [
            ...state.avisosSincronizacao,
            'Lista atualizada em outro dispositivo. Sincronize para obter os dados mais recentes.',
          ],
        };
      }

      const versaoAtual = state.versaoItensPorId[evento.itemId] ?? 0;
      if (evento.versao <= versaoAtual) return {};

      return {
        versaoItensPorId: {
          ...state.versaoItensPorId,
          [evento.itemId]: evento.versao,
        },
        avisosSincronizacao: [
          ...state.avisosSincronizacao,
          `Item atualizado por ${evento.usuarioNome ?? 'outro usuario'}.`,
        ],
      };
    }),
}));
