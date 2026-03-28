import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../styles/variables';

export interface SeletorIdiomaProps {
  idiomaSelecionado?: string;
  aoMudarIdioma?: (idioma: string) => void;
}

function BandeiraIdioma({ codigo }: { codigo: string }) {
  if (codigo === 'pt-BR') {
    return (
      <View
        style={{
          width: 18,
          height: 12,
          backgroundColor: '#009c3b',
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: 8, height: 8, backgroundColor: '#ffdf00', transform: [{ rotate: '45deg' }] }} />
        <View
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            borderRadius: 999,
            backgroundColor: '#002776',
          }}
        />
      </View>
    );
  }

  if (codigo === 'en') {
    return (
      <View
        style={{
          width: 18,
          height: 12,
          borderRadius: 2,
          backgroundColor: '#b22234',
          overflow: 'hidden',
          marginRight: 8,
        }}
      >
        {[2, 6, 10].map((top) => (
          <View key={top} style={{ position: 'absolute', top, left: 0, right: 0, height: 2, backgroundColor: '#ffffff' }} />
        ))}
        <View style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 7, backgroundColor: '#3c3b6e' }} />
      </View>
    );
  }

  if (codigo === 'es') {
    return (
      <View
        style={{
          width: 18,
          height: 12,
          borderRadius: 2,
          overflow: 'hidden',
          marginRight: 8,
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#aa151b' }} />
        <View style={{ flex: 2, backgroundColor: '#f1bf00' }} />
        <View style={{ flex: 1, backgroundColor: '#aa151b' }} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: 18,
        height: 12,
        borderRadius: 2,
        backgroundColor: COLORS.info,
        marginRight: 8,
      }}
    />
  );
}

export function SeletorIdioma({ idiomaSelecionado = 'pt-BR', aoMudarIdioma }: SeletorIdiomaProps) {
  const [aberto, setAberto] = useState(false);

  const idiomas = [
    { codigo: 'pt-BR', sigla: 'PT-BR', nome: 'Portugues' },
    { codigo: 'en', sigla: 'EN', nome: 'English' },
    { codigo: 'es', sigla: 'ES', nome: 'Espanol' },
  ];

  const idiomaAtual = idiomas.find((idioma) => idioma.codigo === idiomaSelecionado);

  return (
    <View style={{ position: 'relative', zIndex: 3000, elevation: 30, overflow: 'visible' }}>
      <TouchableOpacity
        onPress={() => setAberto(!aberto)}
        style={{
          backgroundColor: COLORS.bgTertiary,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: COLORS.borderColor,
          minWidth: 96,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {idiomaAtual ? <BandeiraIdioma codigo={idiomaAtual.codigo} /> : null}
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
            {idiomaAtual ? idiomaAtual.sigla : idiomaSelecionado}
          </Text>
        </View>
      </TouchableOpacity>

      {aberto ? (
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            right: 0,
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 6,
            overflow: 'hidden',
            zIndex: 4000,
            elevation: 40,
            minWidth: 140,
          }}
        >
          {idiomas.map((idioma) => (
            <TouchableOpacity
              key={idioma.codigo}
              onPress={() => {
                aoMudarIdioma?.(idioma.codigo);
                setAberto(false);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: idiomaSelecionado === idioma.codigo ? COLORS.borderColor : COLORS.bgTertiary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BandeiraIdioma codigo={idioma.codigo} />
                <Text
                  style={{
                    color: idiomaSelecionado === idioma.codigo ? COLORS.accent : COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: idiomaSelecionado === idioma.codigo ? '600' : '400',
                  }}
                >
                  {idioma.nome}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
