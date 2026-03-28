import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { CarregamentoGlobal } from '../src/componentes/comuns/CarregamentoGlobal';
import { ToastViewport } from '../src/componentes/comuns/ToastViewport';
import { usarCarregamentoStore } from '../src/store/usarCarregamentoStore';

export default function RootLayout() {
  const pathname = usePathname();
  const iniciarCarregamentoNavegacao = usarCarregamentoStore((estado) => estado.iniciarCarregamentoNavegacao);
  const finalizarCarregamentoNavegacao = usarCarregamentoStore((estado) => estado.finalizarCarregamentoNavegacao);
  const ultimaRotaRef = useRef(pathname);

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

  useEffect(() => {
    if (!pathname || ultimaRotaRef.current === pathname) {
      return;
    }

    ultimaRotaRef.current = pathname;
    iniciarCarregamentoNavegacao();

    const timer = setTimeout(() => {
      finalizarCarregamentoNavegacao();
    }, 240);

    return () => clearTimeout(timer);
  }, [finalizarCarregamentoNavegacao, iniciarCarregamentoNavegacao, pathname]);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="principal" options={{ headerShown: false }} />
      </Stack>
      <CarregamentoGlobal />
      <ToastViewport />
    </>
  );
}
