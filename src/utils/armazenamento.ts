import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

function obterStorageWeb() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export const salvarTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const storage = obterStorageWeb();
    storage?.setItem(CHAVES.ACCESS_TOKEN, accessToken);
    storage?.setItem(CHAVES.REFRESH_TOKEN, refreshToken);
    return;
  }

  await SecureStore.setItemAsync(CHAVES.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(CHAVES.REFRESH_TOKEN, refreshToken);
};

export const obterTokenAcesso = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return obterStorageWeb()?.getItem(CHAVES.ACCESS_TOKEN) ?? null;
  }
  return SecureStore.getItemAsync(CHAVES.ACCESS_TOKEN);
};

export const obterRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return obterStorageWeb()?.getItem(CHAVES.REFRESH_TOKEN) ?? null;
  }
  return SecureStore.getItemAsync(CHAVES.REFRESH_TOKEN);
};

export const limparTokens = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    const storage = obterStorageWeb();
    storage?.removeItem(CHAVES.ACCESS_TOKEN);
    storage?.removeItem(CHAVES.REFRESH_TOKEN);
    return;
  }

  await SecureStore.deleteItemAsync(CHAVES.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(CHAVES.REFRESH_TOKEN);
};
