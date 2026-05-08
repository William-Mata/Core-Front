import { create } from 'zustand';

interface EstadoLayout {
  mostrarMenuMovel: boolean;
  abrirMenuMovel: () => void;
  fecharMenuMovel: () => void;
  alternarMenuMovel: () => void;
}

export const usarLayoutStore = create<EstadoLayout>((definir) => ({
  mostrarMenuMovel: false,

  abrirMenuMovel: () => definir({ mostrarMenuMovel: true }),
  fecharMenuMovel: () => definir({ mostrarMenuMovel: false }),
  alternarMenuMovel: () =>
    definir((estado) => ({
      mostrarMenuMovel: !estado.mostrarMenuMovel,
    })),
}));
