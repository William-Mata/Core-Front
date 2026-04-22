import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type StyleProp, Text, type TextStyle } from 'react-native';
import { formatarValorPorIdioma } from '../../../utils/formatacaoLocale';

interface ValorMonetarioAnimadoProps {
  valorFinal: number;
  deveAnimar: boolean;
  duracaoMs?: number;
  estilo?: StyleProp<TextStyle>;
}

function arredondarValorAnimado(valor: number): number {
  const valorArredondado = Number(valor.toFixed(2));
  return Object.is(valorArredondado, -0) ? 0 : valorArredondado;
}

export function ValorMonetarioAnimado({
  valorFinal,
  deveAnimar,
  duracaoMs = 650,
  estilo,
}: ValorMonetarioAnimadoProps) {
  const animacaoValor = useRef(new Animated.Value(0)).current;
  const [valorExibido, setValorExibido] = useState(() => arredondarValorAnimado(Number(valorFinal) || 0));
  const animacaoJaExecutada = useRef(false);

  useEffect(() => {
    const valorNormalizado = Number.isFinite(valorFinal) ? valorFinal : 0;
    const ambienteTeste = process.env.NODE_ENV === 'test';

    if (ambienteTeste) {
      animacaoJaExecutada.current = true;
      setValorExibido(arredondarValorAnimado(valorNormalizado));
      return;
    }

    if (!deveAnimar || animacaoJaExecutada.current) {
      setValorExibido(arredondarValorAnimado(valorNormalizado));
      return;
    }

    let componenteAtivo = true;
    animacaoValor.setValue(0);

    const idListener = animacaoValor.addListener(({ value }) => {
      if (!componenteAtivo) return;
      const valorInterpolado = value * valorNormalizado;
      setValorExibido(arredondarValorAnimado(valorInterpolado));
    });

    Animated.timing(animacaoValor, {
      toValue: 1,
      duration: duracaoMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      if (!componenteAtivo) return;
      animacaoJaExecutada.current = true;
      setValorExibido(arredondarValorAnimado(valorNormalizado));
    });

    return () => {
      componenteAtivo = false;
      animacaoValor.removeListener(idListener);
      animacaoValor.stopAnimation();
    };
  }, [animacaoValor, deveAnimar, duracaoMs, valorFinal]);

  return <Text style={estilo}>{formatarValorPorIdioma(valorExibido)}</Text>;
}
