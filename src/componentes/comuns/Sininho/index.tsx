import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../../styles/variables';

export interface Notificacao {
  id: string | number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'aviso' | 'sucesso' | 'erro';
  data: string;
  lida: boolean;
}

export interface SinhoProps {
  notificacoes?: Notificacao[];
  aoClicar?: () => void;
  aoRemover?: (id: string | number) => void;
}

export function Sininho({ notificacoes = [], aoClicar, aoRemover }: SinhoProps) {
  const [aberto, setAberto] = useState(false);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const getCor = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return COLORS.success;
      case 'erro':
        return COLORS.error;
      case 'aviso':
        return COLORS.warning;
      default:
        return COLORS.accent;
    }
  };

  const getEmoji = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return '\u2705';
      case 'erro':
        return '\u274C';
      case 'aviso':
        return '\u26A0\uFE0F';
      default:
        return '\u2139\uFE0F';
    }
  };

  return (
    <View style={{ position: 'relative', zIndex: 9000, elevation: 80 }}>
      <TouchableOpacity
        onPress={() => {
          setAberto(!aberto);
          aoClicar?.();
        }}
        style={{
          backgroundColor: COLORS.bgTertiary,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 6,
          position: 'relative',
        }}
      >
        <Text style={{ fontSize: 18 }}>{'\uD83D\uDD14'}</Text>
        {naoLidas > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: COLORS.error,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: COLORS.bgPrimary,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
          </View>
        )}
      </TouchableOpacity>

      {aberto && (
        <View
          style={{
            position: 'absolute',
            top: 50,
            right: 0,
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 9100,
            elevation: 90,
            width: 320,
            maxHeight: 400,
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.borderColor,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Notificações</Text>
          </View>

          {notificacoes.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Nenhuma notificação</Text>
            </View>
          ) : (
            <ScrollView>
              {notificacoes.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => aoRemover?.(notif.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.borderColor,
                    backgroundColor: notif.lida ? 'transparent' : COLORS.borderColor,
                    opacity: notif.lida ? 0.7 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 16 }}>{getEmoji(notif.tipo)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: getCor(notif.tipo),
                          fontSize: 12,
                          fontWeight: '600',
                          marginBottom: 2,
                        }}
                      >
                        {notif.titulo}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                        {notif.mensagem}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 4 }}>
                        {new Date(notif.data).toLocaleTimeString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}







