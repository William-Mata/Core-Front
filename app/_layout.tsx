import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { CarregamentoGlobal } from '../src/componentes/comuns/CarregamentoGlobal';
import { ToastViewport } from '../src/componentes/comuns/ToastViewport';
import { usarCarregamentoStore } from '../src/store/usarCarregamentoStore';
import { COLORS } from '../src/styles/variables';

export default function RootLayout() {
  const pathname = usePathname();
  const iniciarCarregamentoNavegacao = usarCarregamentoStore((estado) => estado.iniciarCarregamentoNavegacao);
  const finalizarCarregamentoNavegacao = usarCarregamentoStore((estado) => estado.finalizarCarregamentoNavegacao);
  const ultimaRotaRef = useRef(pathname);

  useEffect(() => {
    try {
      require('../src/i18n/configuracao');
    } catch {
      // Ignorar indisponibilidade temporaria de i18n durante bootstrap.
    }

    if (Platform.OS === 'web') {
      try {
        const { iniciarMocks } = require('../src/mocks');
        iniciarMocks();
      } catch {
        // Ignorar indisponibilidade temporaria de mocks em runtime.
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const idEstilo = 'scroll-global-tema-core';
    if (document.getElementById(idEstilo)) return;

    const estilo = document.createElement('style');
    estilo.id = idEstilo;
    estilo.textContent = `
      *::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      *::-webkit-scrollbar-track {
        background: ${COLORS.bgSecondary};
        border: 1px solid ${COLORS.borderColor};
        border-radius: 999px;
      }
      *::-webkit-scrollbar-thumb {
        background: ${COLORS.accent};
        border: 2px solid ${COLORS.bgSecondary};
        border-radius: 999px;
      }
      *::-webkit-scrollbar-thumb:hover {
        background: ${COLORS.accentSoft};
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: ${COLORS.accent} ${COLORS.bgSecondary};
      }
    `;

    document.head.appendChild(estilo);
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
