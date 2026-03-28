import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sininho } from '../../comuns/Sininho';
import { usarAutenticacaoStore } from '../../../store/usarAutenticacaoStore';
import { COLORS } from '../../../styles/variables';

export function Cabecalho() {
  const { t } = useTranslation('comum');
  const { usuario } = usarAutenticacaoStore();

  return (
    <View style={estilos.container}>
      <View>
        <Text style={estilos.titulo}>
          {t('cabecalho.bemVindo')}, {usuario?.nome}
        </Text>
        <Text style={estilos.subtitulo}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      <View style={estilos.acoes}>
        <Sininho />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  titulo: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  subtitulo: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
