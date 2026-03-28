import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { usarCarregamentoStore } from '../../../store/usarCarregamentoStore';
import { COLORS } from '../../../styles/variables';

export function CarregamentoGlobal() {
  const { t } = usarTraducao();
  const carregandoNavegacao = usarCarregamentoStore((estado) => estado.carregandoNavegacao);
  const requisicoesAtivas = usarCarregamentoStore((estado) => estado.requisicoesAtivas);
  const animacaoBarra = useRef(new Animated.Value(-140)).current;

  const mostrarBarra = requisicoesAtivas > 0;

  useEffect(() => {
    if (!mostrarBarra) {
      animacaoBarra.stopAnimation();
      animacaoBarra.setValue(-140);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animacaoBarra, {
          toValue: 280,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animacaoBarra, {
          toValue: -140,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      animacaoBarra.stopAnimation();
      animacaoBarra.setValue(-140);
    };
  }, [animacaoBarra, mostrarBarra]);

  return (
    <>
      {mostrarBarra ? (
        <View pointerEvents="none" style={estilos.barraContainer}>
          <View style={estilos.barraTrilho}>
            <Animated.View style={[estilos.barraProgresso, { transform: [{ translateX: animacaoBarra }] }]} />
          </View>
        </View>
      ) : null}

      {carregandoNavegacao ? (
        <View pointerEvents="none" style={estilos.overlayNavegacao}>
          <View style={estilos.cardNavegacao}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={estilos.textoNavegacao}>{t('comum.carregando')}</Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

const estilos = StyleSheet.create({
  barraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 12000,
  },
  barraTrilho: {
    height: 3,
    backgroundColor: COLORS.bgTertiary,
    overflow: 'hidden',
  },
  barraProgresso: {
    width: 140,
    height: 3,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  overlayNavegacao: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11990,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  cardNavegacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    backgroundColor: COLORS.bgSecondary,
  },
  textoNavegacao: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
