import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, LAYOUT } from '../../../styles/variables';

interface EsqueletoCarregamentoProps {
  altura?: number;
  largura?: string | number;
  estilo?: ViewStyle;
}

export function EsqueletoCarregamento({ altura = 16, largura = '100%', estilo }: EsqueletoCarregamentoProps) {
  return (
    <View
      style={[estilos.base, { height: altura, width: largura as any }, estilo]}
    />
  );
}

const estilos = StyleSheet.create({
  base: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: LAYOUT.radiusSm,
    opacity: 0.75,
  },
});
