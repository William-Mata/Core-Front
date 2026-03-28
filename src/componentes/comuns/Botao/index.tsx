import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { BotaoProps } from './Botao.tipos';
import { COLORS, LAYOUT } from '../../../styles/variables';

const estilos = StyleSheet.create({
  botao: {
    borderRadius: LAYOUT.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: COLORS.accent,
  },
  secundario: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  perigo: {
    backgroundColor: COLORS.accentSoft,
  },
  hoverPrimario: {
    backgroundColor: COLORS.bgHover,
  },
  hoverSecundario: {
    borderColor: COLORS.borderAccent,
    backgroundColor: COLORS.accentSubtle,
  },
  hoverPerigo: {
    backgroundColor: COLORS.accentMuted,
  },
  pressed: {
    opacity: 0.92,
  },
  desabilitado: {
    opacity: 0.5,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  texto: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});

const corLoaderPorTipo: Record<NonNullable<BotaoProps['tipo']>, string> = {
  primario: COLORS.textPrimary,
  secundario: COLORS.accent,
  perigo: COLORS.textPrimary,
};

export function Botao({
  label,
  titulo,
  testID,
  onPress,
  tipo = 'primario',
  desabilitado,
  disabled,
  carregando,
  estilo,
}: BotaoProps) {
  const [hover, setHover] = useState(false);
  const isDisabled = desabilitado || disabled || carregando;
  const text = label || titulo || '';
  const hoverNoWeb = hover && !isDisabled && Platform.OS === 'web';

  return (
    <Pressable
      testID={testID}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => {
        const estiloFinal: ViewStyle[] = [estilos.botao, estilos[tipo] as ViewStyle];

        if (hoverNoWeb) {
          if (tipo === 'primario') estiloFinal.push(estilos.hoverPrimario);
          if (tipo === 'secundario') estiloFinal.push(estilos.hoverSecundario);
          if (tipo === 'perigo') estiloFinal.push(estilos.hoverPerigo);
        }

        if (pressed && !isDisabled) {
          estiloFinal.push(estilos.pressed);
        }

        if (isDisabled) {
          estiloFinal.push(estilos.desabilitado);
        }

        if (estilo instanceof Object && !Array.isArray(estilo)) {
          estiloFinal.push(estilo);
        }

        return estiloFinal;
      }}
    >
      <View style={estilos.conteudo}>
        {carregando ? <ActivityIndicator size="small" color={corLoaderPorTipo[tipo]} /> : null}
        <Text style={estilos.texto}>{text}</Text>
      </View>
    </Pressable>
  );
}
