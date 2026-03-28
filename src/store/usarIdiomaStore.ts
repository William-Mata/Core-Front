import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware.js';
import i18n from '../i18n/configuracao';
import { storageLocalPersistente } from '../utils/storagePersistente';

interface IdiomaStore {
  idiomaSelecionado: string;
  definirIdioma: (idioma: string) => void;
  idiomas: string[];
}

export const usarIdiomaStore = create<IdiomaStore>()(
  persist(
    (set) => ({
      idiomaSelecionado: 'pt-BR',
      idiomas: ['pt-BR', 'en', 'es'],
      definirIdioma: (idioma: string) => {
        i18n.changeLanguage(idioma);
        set({ idiomaSelecionado: idioma });
      },
    }),
    {
      name: 'idioma-storage',
      onRehydrateStorage: () => (estado) => {
        if (estado?.idiomaSelecionado) {
          i18n.changeLanguage(estado.idiomaSelecionado);
        }
      },
      storage: createJSONStorage(() => storageLocalPersistente),
    }
  )
);
