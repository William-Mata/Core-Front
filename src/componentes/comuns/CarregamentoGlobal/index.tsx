import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { usarCarregamentoStore } from '../../../store/usarCarregamentoStore';
import { COLORS } from '../../../styles/variables';

const LIMITE_PROGRESSO_CARREGANDO = 99.2;
const JANELA_ACOPLAMENTO_NAVEGACAO_MS = 420;

export function CarregamentoGlobal() {
  const { t } = usarTraducao();
  const carregandoNavegacao = usarCarregamentoStore((estado) => estado.carregandoNavegacao);
  const requisicoesAtivas = usarCarregamentoStore((estado) => estado.requisicoesAtivas);
  const animacaoBarra = useRef(new Animated.Value(-140)).current;
  const progressoNavegacao = useRef(new Animated.Value(0)).current;
  const opacidadeNavegacao = useRef(new Animated.Value(1)).current;
  const animacaoNavegacaoRef = useRef<Animated.CompositeAnimation | null>(null);
  const temporizadorProgressoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const temporizadorAcoplamentoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carregamentoSincronizadoRef = useRef(false);
  const teveNavegacaoNoCicloRef = useRef(false);
  const estavaCarregamentoSincronizadoRef = useRef(false);
  const [navegacaoVisivel, setNavegacaoVisivel] = useState(false);
  const [janelaAcoplamentoAtiva, setJanelaAcoplamentoAtiva] = useState(false);
  const [larguraTexto, setLarguraTexto] = useState(0);
  const [percentualNavegacao, setPercentualNavegacao] = useState(0);

  const haRequisicoesAtivas = requisicoesAtivas > 0;
  const haFonteAtiva = carregandoNavegacao || haRequisicoesAtivas;
  const carregamentoSincronizado = haFonteAtiva || janelaAcoplamentoAtiva;
  const mostrarBarra = carregamentoSincronizado || navegacaoVisivel;
  const larguraBaseTexto = Math.max(1, larguraTexto);
  const textoPrincipalCarregamentoTraduzido = t('comum.carregamento.textoPrincipal');
  const textoPrincipalCarregamento =
    textoPrincipalCarregamentoTraduzido === 'comum.carregamento.textoPrincipal'
      ? String(process.env.EXPO_PUBLIC_APP_NAME ?? 'Core')
      : textoPrincipalCarregamentoTraduzido;
  const larguraPreenchimentoAnimada = useMemo(
    () =>
      progressoNavegacao.interpolate({
        inputRange: [0, 100],
        outputRange: [0, larguraBaseTexto],
      }),
    [larguraBaseTexto, progressoNavegacao],
  );

  useEffect(() => {
    carregamentoSincronizadoRef.current = carregamentoSincronizado;
  }, [carregamentoSincronizado]);

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

  useEffect(() => {
    const idAssinatura = progressoNavegacao.addListener(({ value }) => {
      const percentualAjustado = Math.round(Math.max(0, Math.min(100, value)));
      setPercentualNavegacao(percentualAjustado);
    });

    return () => {
      progressoNavegacao.removeListener(idAssinatura);
    };
  }, [progressoNavegacao]);

  useEffect(() => {
    const limparTemporizadorAcoplamento = () => {
      const temporizadorAtual = temporizadorAcoplamentoRef.current;
      if (!temporizadorAtual) {
        return;
      }

      clearTimeout(temporizadorAtual);
      temporizadorAcoplamentoRef.current = null;
    };

    if (carregandoNavegacao) {
      teveNavegacaoNoCicloRef.current = true;
      if (janelaAcoplamentoAtiva) {
        setJanelaAcoplamentoAtiva(false);
      }
      limparTemporizadorAcoplamento();
      return;
    }

    if (haRequisicoesAtivas || !navegacaoVisivel || !teveNavegacaoNoCicloRef.current) {
      if (janelaAcoplamentoAtiva) {
        setJanelaAcoplamentoAtiva(false);
      }
      limparTemporizadorAcoplamento();
      return;
    }

    if (temporizadorAcoplamentoRef.current || janelaAcoplamentoAtiva) {
      return;
    }

    setJanelaAcoplamentoAtiva(true);
    temporizadorAcoplamentoRef.current = setTimeout(() => {
      temporizadorAcoplamentoRef.current = null;
      setJanelaAcoplamentoAtiva(false);
    }, JANELA_ACOPLAMENTO_NAVEGACAO_MS);
  }, [carregandoNavegacao, haRequisicoesAtivas, janelaAcoplamentoAtiva, navegacaoVisivel]);

  useEffect(() => {
    const limparTemporizadorProgresso = () => {
      const temporizadorAtual = temporizadorProgressoRef.current;
      if (!temporizadorAtual) {
        return;
      }

      clearTimeout(temporizadorAtual);
      temporizadorProgressoRef.current = null;
    };

    const pararAnimacaoNavegacao = () => {
      const animacaoEmAndamento = animacaoNavegacaoRef.current;
      if (!animacaoEmAndamento) {
        return;
      }

      animacaoEmAndamento.stop();
      animacaoNavegacaoRef.current = null;
    };

    const iniciarProgressoFluido = () => {
      const executarEtapa = () => {
        if (!carregamentoSincronizadoRef.current) {
          return;
        }

        progressoNavegacao.stopAnimation((valorAtual) => {
          if (!carregamentoSincronizadoRef.current) {
            return;
          }

          const restante = Math.max(0, LIMITE_PROGRESSO_CARREGANDO - valorAtual);
          if (restante <= 0.08) {
            temporizadorProgressoRef.current = setTimeout(() => {
              executarEtapa();
            }, 180);
            return;
          }

          const incremento = Math.max(0.28, Math.min(4.8, restante * 0.16));
          const proximoValor = Math.min(LIMITE_PROGRESSO_CARREGANDO, valorAtual + incremento);
          const duracao = Math.round(260 + restante * 24);

          const animacaoEtapa = Animated.timing(progressoNavegacao, {
            toValue: proximoValor,
            duration: duracao,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          });

          animacaoNavegacaoRef.current = animacaoEtapa;
          animacaoEtapa.start(({ finished }) => {
            if (!finished || !carregamentoSincronizadoRef.current) {
              return;
            }

            temporizadorProgressoRef.current = setTimeout(() => {
              executarEtapa();
            }, 60);
          });
        });
      };

      executarEtapa();
    };

    const iniciouCarregamento =
      carregamentoSincronizado && !estavaCarregamentoSincronizadoRef.current;
    const finalizouCarregamento =
      !carregamentoSincronizado && estavaCarregamentoSincronizadoRef.current;

    if (iniciouCarregamento) {
      limparTemporizadorProgresso();
      pararAnimacaoNavegacao();
      if (temporizadorAcoplamentoRef.current) {
        clearTimeout(temporizadorAcoplamentoRef.current);
        temporizadorAcoplamentoRef.current = null;
      }
      if (janelaAcoplamentoAtiva) {
        setJanelaAcoplamentoAtiva(false);
      }

      setNavegacaoVisivel(true);
      teveNavegacaoNoCicloRef.current = carregandoNavegacao;
      opacidadeNavegacao.setValue(1);
      progressoNavegacao.setValue(0);
      iniciarProgressoFluido();
    }

    if (finalizouCarregamento && navegacaoVisivel) {
      limparTemporizadorProgresso();
      pararAnimacaoNavegacao();

      const animacaoFinal = Animated.sequence([
        Animated.timing(progressoNavegacao, {
          toValue: 100,
          duration: 460,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacidadeNavegacao, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

      animacaoNavegacaoRef.current = animacaoFinal;
      animacaoFinal.start(({ finished }) => {
        if (!finished) {
          return;
        }

        setNavegacaoVisivel(false);
        progressoNavegacao.setValue(0);
        opacidadeNavegacao.setValue(1);
        teveNavegacaoNoCicloRef.current = false;
      });
    }

    estavaCarregamentoSincronizadoRef.current = carregamentoSincronizado;

    return () => {
      limparTemporizadorProgresso();
    };
  }, [
    carregamentoSincronizado,
    carregandoNavegacao,
    janelaAcoplamentoAtiva,
    navegacaoVisivel,
    opacidadeNavegacao,
    progressoNavegacao,
  ]);

  useEffect(
    () => () => {
      const temporizadorAtual = temporizadorProgressoRef.current;
      if (temporizadorAtual) {
        clearTimeout(temporizadorAtual);
        temporizadorProgressoRef.current = null;
      }

      const temporizadorAcoplamento = temporizadorAcoplamentoRef.current;
      if (temporizadorAcoplamento) {
        clearTimeout(temporizadorAcoplamento);
        temporizadorAcoplamentoRef.current = null;
      }

      const animacaoEmAndamento = animacaoNavegacaoRef.current;
      if (!animacaoEmAndamento) {
        return;
      }

      animacaoEmAndamento.stop();
      animacaoNavegacaoRef.current = null;
    },
    [],
  );

  return (
    <>
      {mostrarBarra ? <View pointerEvents="auto" style={estilos.overlayBloqueioRequisicao} /> : null}

      {mostrarBarra ? (
        <View pointerEvents="none" style={estilos.barraContainer}>
          <View style={estilos.barraTrilho}>
            <Animated.View style={[estilos.barraProgresso, { transform: [{ translateX: animacaoBarra }] }]} />
          </View>
        </View>
      ) : null}

      {navegacaoVisivel ? (
        <Animated.View pointerEvents="none" style={[estilos.overlayNavegacao, { opacity: opacidadeNavegacao }]}>
          <View style={estilos.cardNavegacao}>
            <View style={estilos.areaTextoPreenchimento}>
              <Text
                style={estilos.textoBase}
                onLayout={({ nativeEvent }) => {
                  const larguraCalculada = Math.round(nativeEvent.layout.width);
                  if (larguraCalculada <= 0 || larguraCalculada === larguraTexto) {
                    return;
                  }

                  setLarguraTexto(larguraCalculada);
                }}
              >
                {textoPrincipalCarregamento}
              </Text>
              <Animated.View style={[estilos.mascaraPreenchimento, { width: larguraPreenchimentoAnimada }]}>
                <Text
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={estilos.textoPreenchido}
                >
                  {textoPrincipalCarregamento}
                </Text>
              </Animated.View>
            </View>
            <View style={estilos.containerRodapeNavegacao}>
              <Text style={estilos.textoPercentual}>{`${percentualNavegacao}%`}</Text>
              <Text style={estilos.textoNavegacao}>{t('comum.carregando')}</Text>
            </View>
          </View>
        </Animated.View>
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
  overlayBloqueioRequisicao: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11995,
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardNavegacao: {
    minWidth: 220,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
    backgroundColor: 'rgba(13, 13, 18, 0.95)',
  },
  areaTextoPreenchimento: {
    position: 'relative',
    alignSelf: 'center',
  },
  mascaraPreenchimento: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  textoBase: {
    color: 'rgba(240, 240, 245, 0.2)',
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
    letterSpacing: 1,
  },
  textoPreenchido: {
    color: COLORS.accent,
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 0, 110, 0.45)',
    textShadowRadius: 14,
  },
  containerRodapeNavegacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoPercentual: {
    minWidth: 40,
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  textoNavegacao: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
