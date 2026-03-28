import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, LAYOUT } from '../../../styles/variables';

interface EsqueletoCarregamentoProps {
  altura?: number;
  largura?: string | number;
  estilo?: ViewStyle;
}

export function EsqueletoCarregamento({ altura = 16, largura = '100%', estilo }: EsqueletoCarregamentoProps) {
  const animacao = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animacao, {
          toValue: 260,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animacao, {
          toValue: -160,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      animacao.stopAnimation();
    };
  }, [animacao]);

  return (
    <View style={[estilos.base, { height: altura, width: largura as never }, estilo]}>
      <Animated.View style={[estilos.brilho, { transform: [{ translateX: animacao }] }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: COLORS.bgTertiary,
    borderRadius: LAYOUT.radiusSm,
    opacity: 0.82,
  },
  brilho: {
    position: 'absolute',
    left: -120,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: COLORS.accentRgba,
    opacity: 0.45,
  },
});
