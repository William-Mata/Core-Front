import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../src/styles/variables';

export default function FinanceiroIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/principal/financeiro/despesa');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: COLORS.textSecondary }}>Redirecionando para Despesas...</Text>
    </View>
  );
}




