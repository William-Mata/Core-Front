import { create } from 'zustand';

export type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
  id: string;
  tipo: TipoToast;
  mensagem: string;
  duracao?: number;
  lida?: boolean;
}

interface EstadoNotificacao {
  toasts: Toast[];
  adicionarToast: (toast: Omit<Toast, 'id'>) => void;
  removerToast: (id: string) => void;
}

export const usarNotificacaoStore = create<EstadoNotificacao>()((set) => ({
  toasts: [],
  adicionarToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: `${Date.now()}`, ...toast }],
    })),
  removerToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
