import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { formatarDataPorIdioma } from '../../../src/utils/formatacaoLocale';
import { COLORS } from '../../../src/styles/variables';
import { usarDocumentacaoStore } from '../../../src/store/usarDocumentacaoStore';

export default function GerenciadorDocumentos() {
  const router = useRouter();
  const { t } = usarTraducao();
  const documentos = usarDocumentacaoStore((state) => state.documentos);

  const getStatusColor = (status: string) => (status === 'PUBLICADO' ? COLORS.success : COLORS.warning);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.accent, fontSize: 24 }}>{'\u2190'}</Text></TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{t('admin.documentacao.gerenciar')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}><Text style={{ color: COLORS.accent, fontSize: 20 }}>{'\u2715'}</Text></TouchableOpacity>
      </View>

      <FlatList
        data={documentos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/principal/admin/documento?id=${item.id}`)} style={{ backgroundColor: COLORS.bgTertiary, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{item.titulo}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{t(`documentacao.modulos.${item.modulo}`)}</Text>
                  </View>
                  <View style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{item.criadoPor}</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 6 }}>
                  <Text style={{ color: item.status === 'PUBLICADO' ? 'black' : 'white', fontSize: 10, fontWeight: '600' }}>{item.status}</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.atualizadoEm)}</Text>
              </View>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{item.descricao}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>{t('documentacao.vazio')}</Text>}
      />

      <TouchableOpacity onPress={() => router.push('/principal/admin/documento')} style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: COLORS.accent, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
