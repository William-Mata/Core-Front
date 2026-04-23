import React, { useState } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { COLORS } from '../../../styles/variables';
import { CampoDataIntervalo } from '../CampoData';

export interface FiltroPadraoValor {
  id: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
}

interface FiltroPadraoProps {
  valor: FiltroPadraoValor;
  aoMudar: (valor: FiltroPadraoValor) => void;
  exibirIntervaloData?: boolean;
  children?: React.ReactNode;
}

export function FiltroPadrao({ valor, aoMudar, exibirIntervaloData = true, children }: FiltroPadraoProps) {
  const { t } = usarTraducao();
  const [foco, setFoco] = useState<keyof FiltroPadraoValor | null>(null);

  const estiloInput = (campo: keyof FiltroPadraoValor) => ({
    backgroundColor: COLORS.bgSecondary,
    color: 'white' as const,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: foco === campo ? COLORS.borderAccent : COLORS.borderColor,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          boxShadow: foco === campo ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
        } as any)
      : {}),
  });

  return (
    <View
      style={{
        backgroundColor: COLORS.bgTertiary,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>{t('comum.filtros.titulo')}</Text>

      <View style={{ gap: 8 }}>
        <TextInput
          placeholder={t('comum.filtros.id')}
          placeholderTextColor={COLORS.textSecondary}
          value={valor.id}
          onFocus={() => setFoco('id')}
          onBlur={() => setFoco(null)}
          onChangeText={(id) => aoMudar({ ...valor, id })}
          keyboardType='numeric'
          style={estiloInput('id')}
        />

        <TextInput
          placeholder={t('comum.filtros.descricao')}
          placeholderTextColor={COLORS.textSecondary}
          value={valor.descricao}
          onFocus={() => setFoco('descricao')}
          onBlur={() => setFoco(null)}
          onChangeText={(descricao) => aoMudar({ ...valor, descricao })}
          style={estiloInput('descricao')}
        />

        {exibirIntervaloData ? (
          <CampoDataIntervalo
            label={`${t('comum.filtros.dataInicio')} - ${t('comum.filtros.dataFim')}`}
            dataInicio={valor.dataInicio}
            dataFim={valor.dataFim}
            onChange={({ dataInicio, dataFim }) => aoMudar({ ...valor, dataInicio, dataFim })}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
}
