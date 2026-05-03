import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { COLORS } from '../../../src/styles/variables';

export default function AdminLayout() {
  const router = useRouter();
  const { estaAutenticado, usuario } = usarAutenticacaoStore();
  const ehAdmin = Boolean(usuario && (usuario.perfil?.id === 1 || String(usuario.perfil?.nome || '').toUpperCase().includes('ADMIN')));
  const possuiAcessoAdmin = Boolean(estaAutenticado && ehAdmin);

  useEffect(() => {
    if (!possuiAcessoAdmin) {
      router.replace('/dashboard');
    }
  }, [possuiAcessoAdmin, router]);

  if (!possuiAcessoAdmin) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Administracao',
        }}
      />
      <Stack.Screen
        name="usuarios"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="simulacao"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="documentos"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="documento"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="avisos"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="aviso"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="documentacao"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
