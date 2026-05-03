import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { COLORS } from '../../../styles/variables';
import { ModuloDocumentacao, usarDocumentacaoStore } from '../../../store/usarDocumentacaoStore';

interface DocumentacaoModuloProps {
  modulo: ModuloDocumentacao;
  titulo: string;
}

export function DocumentacaoModulo({ modulo, titulo }: DocumentacaoModuloProps) {
  const router = useRouter();
  const { t } = usarTraducao();
  const listarPorModulo = usarDocumentacaoStore((state) => state.listarPorModulo);
  const [expandidos, setExpandidos] = useState<number[]>([]);

  const documentos = useMemo(
    () => listarPorModulo(modulo).filter((doc) => doc.status === 'PUBLICADO'),
    [listarPorModulo, modulo],
  );

  const alternar = (id: number) => {
    setExpandidos((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View
        style={{
          backgroundColor: COLORS.bgSecondary,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 42 }} />
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: COLORS.accent, fontSize: 18, fontWeight: '700' }}>{t('documentacao.titulo', { modulo: titulo })}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, alignItems: 'flex-end' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>{t('documentacao.descricaoPadrao', { modulo: titulo })}</Text>
        </View>

        {documentos.length === 0 ? (
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 30 }}>{t('documentacao.vazio')}</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {documentos.map((doc) => {
              const aberto = expandidos.includes(doc.id);
              return (
                <View key={doc.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, overflow: 'hidden' }}>
                  <TouchableOpacity onPress={() => alternar(doc.id)} style={{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: COLORS.accent, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{doc.titulo}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{doc.descricao}</Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 18 }}>{aberto ? '-' : '+'}</Text>
                  </TouchableOpacity>

                  {aberto ? (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: COLORS.borderColor }}>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13, lineHeight: 20, marginTop: 12 }}>{doc.conteudo}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 10 }}>
                        {t('documentacao.atualizadoEm')}: {doc.atualizadoEm}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

