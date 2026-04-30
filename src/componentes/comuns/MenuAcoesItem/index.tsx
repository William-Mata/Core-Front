import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../../styles/variables';

export type OpcaoMenuAcoesItem = {
  id: string;
  rotulo: string;
  aoPressionar: () => void;
  perigosa?: boolean;
};

type PropsMenuAcoesItem = {
  aberto: boolean;
  aoAlternar: () => void;
  aoFechar: () => void;
  tituloMenu: string;
  opcoes: OpcaoMenuAcoesItem[];
};

export function MenuAcoesItem({
  aberto,
  aoAlternar,
  aoFechar,
  tituloMenu,
  opcoes,
}: PropsMenuAcoesItem) {
  if (opcoes.length === 0) return null;

  return (
    <View style={{ position: 'relative', zIndex: aberto ? 999 : 75, elevation: aberto ? 24 : 0 }}>
      <Pressable
        accessibilityRole="button"
        onPress={aoAlternar}
        style={({ pressed }) => ({
          width: 30,
          height: 30,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: aberto ? COLORS.borderAccent : COLORS.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed
            ? COLORS.accentSubtle
            : aberto
              ? COLORS.accentSubtle
              : COLORS.bgSecondary,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: aberto ? COLORS.accent : COLORS.textPrimary, fontSize: 18, fontWeight: '700', lineHeight: 18 }}>
          {'\u22EE'}
        </Text>
      </Pressable>

      {aberto ? (
        <>
          <Pressable
            onPress={aoFechar}
            style={{
              position: 'absolute',
              top: -2000,
              right: -2000,
              bottom: -2000,
              left: -2000,
              zIndex: 900,
              cursor: 'default',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 34,
              right: 0,
              zIndex: 1000,
              minWidth: 170,
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: COLORS.bgSecondary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 24,
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.borderColor,
                backgroundColor: COLORS.accentSubtle,
              }}
            >
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{tituloMenu}</Text>
            </View>

            {opcoes.map((opcao, indice) => (
              <Pressable
                key={opcao.id}
                onPress={() => {
                  aoFechar();
                  opcao.aoPressionar();
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 11,
                  borderTopWidth: indice === 0 ? 0 : 1,
                  borderTopColor: COLORS.borderColor,
                  backgroundColor: pressed ? COLORS.bgTertiary : COLORS.bgSecondary,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {opcao.perigosa ? (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: COLORS.borderAccent,
                      }}
                    />
                  ) : null}
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>{opcao.rotulo}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
