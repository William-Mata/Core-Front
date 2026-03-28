import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

function criarStorageWeb(tipo: 'local' | 'session'): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === 'undefined') return null;
      const storage = tipo === 'local' ? window.localStorage : window.sessionStorage;
      return storage.getItem(name);
    },
    setItem: (name, value) => {
      if (typeof window === 'undefined') return;
      const storage = tipo === 'local' ? window.localStorage : window.sessionStorage;
      storage.setItem(name, value);
    },
    removeItem: (name) => {
      if (typeof window === 'undefined') return;
      const storage = tipo === 'local' ? window.localStorage : window.sessionStorage;
      storage.removeItem(name);
    },
  };
}

function criarStorageNativo(prefixo: string): StateStorage {
  return {
    getItem: async (name) => (await SecureStore.getItemAsync(`${prefixo}:${name}`)) ?? null,
    setItem: async (name, value) => {
      await SecureStore.setItemAsync(`${prefixo}:${name}`, value);
    },
    removeItem: async (name) => {
      await SecureStore.deleteItemAsync(`${prefixo}:${name}`);
    },
  };
}

export const storageLocalPersistente: StateStorage =
  Platform.OS === 'web' ? criarStorageWeb('local') : criarStorageNativo('local');

export const storageSessaoPersistente: StateStorage =
  Platform.OS === 'web' ? criarStorageWeb('session') : criarStorageNativo('session');
