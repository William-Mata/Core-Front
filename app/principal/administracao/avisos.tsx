import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { formatarDataPorIdioma } from '../../../src/utils/formatacaoLocale';
import { COLORS } from '../../../src/styles/variables';

interface Aviso {
  id: number;
  titulo: string;
  tipo: 'INFO' | 'AVISO' | 'CRITICO';
  status: 'PUBLICADO' | 'RASCUNHO';
  dataCriacao: string;
  destinatarios: number;
  ciencias: number;
}

export default function GerenciadorAvisos() {
  const router = useRouter();
  const { t } = usarTraducao();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAvisos([
        { id: 1, titulo: t('admin.avisos.mock.manutencao'), tipo: 'AVISO', status: 'PUBLICADO', dataCriacao: '2024-03-10', destinatarios: 150, ciencias: 128 },
        { id: 2, titulo: t('admin.avisos.mock.atualizacao'), tipo: 'CRITICO', status: 'PUBLICADO', dataCriacao: '2024-03-05', destinatarios: 150, ciencias: 145 },
        { id: 3, titulo: t('admin.avisos.mock.recurso'), tipo: 'INFO', status: 'RASCUNHO', dataCriacao: '2024-03-15', destinatarios: 0, ciencias: 0 },
      ]);
      setCarregando(false);
    }, 500);
  }, [t]);

  const getTipoBadgeColor = (tipo: string) => (tipo === 'INFO' ? COLORS.info : tipo === 'AVISO' ? COLORS.warning : COLORS.error);
  const getStatusColor = (status: string) => (status === 'PUBLICADO' ? COLORS.success : COLORS.warning);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.accent, fontSize: 24 }}>{'\u2190'}</Text></TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{'\uD83D\uDCE3'} {t('admin.avisos.titulo')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}><Text style={{ color: COLORS.accent, fontSize: 20 }}>{'\u2715'}</Text></TouchableOpacity>
      </View>

      <FlatList
        data={avisos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/principal/administracao/aviso?id=${item.id}`)} style={{ backgroundColor: COLORS.bgTertiary, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: getTipoBadgeColor(item.tipo) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={{ backgroundColor: getTipoBadgeColor(item.tipo), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: item.tipo === 'INFO' ? 'black' : 'white', fontSize: 10, fontWeight: '600' }}>
                      {item.tipo === 'INFO' ? '\u2139\uFE0F' : item.tipo === 'AVISO' ? '\u26A0\uFE0F' : '\uD83D\uDEA8'} {t(`admin.avisos.tipos.${item.tipo}`)}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>{item.titulo}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{t('admin.avisos.destinatarios')}: {item.destinatarios}</Text>
                  {item.status === 'PUBLICADO' && <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{t('admin.avisos.ciencia')}: {item.ciencias}/{item.destinatarios}</Text>}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: item.status === 'PUBLICADO' ? 'black' : 'white', fontSize: 10, fontWeight: '600' }}>
                    {item.status === 'PUBLICADO' ? `${'\u2705'} ${t('admin.avisos.publicado')}` : `${'\uD83D\uDCDD'} ${t('admin.avisos.rascunho')}`}
                  </Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.dataCriacao)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={carregando ? null : <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>{t('admin.avisos.vazio')}</Text>}
      />

      <TouchableOpacity onPress={() => router.push('/principal/administracao/aviso')} style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: COLORS.accent, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}




