import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { usarAutenticacaoStore } from '../src/store/usarAutenticacaoStore';
import { COLORS } from '../src/styles/variables';

export default function Home() {
  const router = useRouter();
  const { estaAutenticado, usuario } = usarAutenticacaoStore();

  useEffect(() => {
    // Pequeno delay para mostrar splash
    const timer = setTimeout(() => {
      if (estaAutenticado && usuario) {
        router.replace('/dashboard');
      } else {
        router.replace('/auth/entrar');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [estaAutenticado, usuario, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
      <Text style={{ color: COLORS.accent, fontSize: 48, fontWeight: 'bold', marginBottom: 16 }}>
        Core
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
        Preparando ambiente...
      </Text>
    </View>
  );
}

