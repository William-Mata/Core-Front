import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ToastViewport } from '../src/componentes/comuns/ToastViewport';

export default function RootLayout() {
  useEffect(() => {
    try {
      require('../src/i18n/configuracao');
    } catch (error) {
      console.log('i18n nao esta disponivel por enquanto');
    }

    if (Platform.OS === 'web') {
      try {
        const { iniciarMocks } = require('../src/mocks');
        iniciarMocks();
      } catch (error) {
        console.log('Mocks nao estao disponiveis por enquanto');
      }
    }
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="principal" options={{ headerShown: false }} />
      </Stack>
      <ToastViewport />
    </>
  );
}
