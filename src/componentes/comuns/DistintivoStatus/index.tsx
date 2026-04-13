import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DistintivoStatusProps {
  rotulo: string;
  corTexto: string;
  corBorda: string;
  corFundo: string;
  testID?: string;
}

export function DistintivoStatus({ rotulo, corTexto, corBorda, corFundo, testID }: DistintivoStatusProps) {
  const brilho = useRef(new Animated.Value(0)).current;
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animacao.start();

    return () => animacao.stop();
  }, [brilho]);

  const left = brilho.interpolate({
    inputRange: [0, 1],
    outputRange: [-(largura * 0.65), largura * 1.3 || 1],
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const idEstilo = 'distintivo-status-brilho';
    if (document.getElementById(idEstilo)) return;

    const estilo = document.createElement('style');
    estilo.id = idEstilo;
    estilo.textContent = `
      @keyframes distintivoStatusShine {
        0% { left: -65%; }
        100% { left: 130%; }
      }
      [data-testid="badge-tipo-transacao"] {
        position: relative;
        overflow: hidden;
      }
      [data-testid="badge-tipo-transacao"]::after {
        content: '';
        position: absolute;
        top: -6px;
        bottom: -6px;
        left: -65%;
        width: 55%;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.38), rgba(255,255,255,0));
        transform: skewX(-18deg);
        animation: distintivoStatusShine 1.5s linear infinite;
        pointer-events: none;
      }
    `;

    document.head.appendChild(estilo);
  }, []);

  return (
    <View
      testID={testID}
      onLayout={Platform.OS === 'web' ? undefined : (evento) => setLargura(evento.nativeEvent.layout.width)}
      style={[estilos.container, { borderColor: corBorda, backgroundColor: corFundo }]}
    >
      {Platform.OS === 'web' ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.brilho,
            {
              left,
              width: largura ? largura * 0.55 : 0,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.gradiente}
          />
        </Animated.View>
      )}
      <Text style={[estilos.rotulo, { color: corTexto }]}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  brilho: {
    position: 'absolute',
    top: -6,
    bottom: -6,
  },
  gradiente: {
    flex: 1,
    transform: [{ skewX: '-18deg' }],
  },
  rotulo: {
    fontSize: 11,
    fontWeight: '700',
  },
});
