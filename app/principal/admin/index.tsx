import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { Cabecalho } from '../../../src/componentes/comuns/Cabecalho';
import { COLORS } from '../../../src/styles/variables';

interface Estatisticas {
  totalUsuarios: number;
  usuariosAtivosHoje: number;
}

const atalhos = [
  { rota: '/principal/admin/usuario', icone: '\uD83D\uDC64', titulo: 'admin.usuarios.lista' },
  { rota: '/principal/admin/documentos', icone: '\uD83D\uDCD6', titulo: 'admin.documentacao.gerenciar' },
  { rota: '/principal/admin/avisos', icone: '\uD83D\uDCE3', titulo: 'admin.avisos.titulo' },
  { rota: '/principal/admin/simulacao', icone: '\uD83D\uDD04', titulo: 'admin.simulacao.titulo' },
  { rota: '/principal/admin/documentacao', icone: '\u2139\uFE0F', titulo: 'documentacao.acao' },
] as const;

export default function Administracao() {
  const router = useRouter();
  const { t } = usarTraducao();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setEstatisticas({ totalUsuarios: 125, usuariosAtivosHoje: 42 });
    }, 200);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <Cabecalho titulo={t('admin.titulo')} />

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <Text style={{ color: COLORS.accent, fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>{'\u2699\uFE0F'} {t('admin.painel')}</Text>

        {estatisticas ? (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>{t('admin.estatisticas')}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: COLORS.bgTertiary, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('admin.usuariosTotais')}</Text>
                <Text style={{ color: COLORS.accent, fontSize: 24, fontWeight: 'bold' }}>{estatisticas.totalUsuarios}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: COLORS.bgTertiary, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('admin.ativosHoje')}</Text>
                <Text style={{ color: COLORS.success, fontSize: 24, fontWeight: 'bold' }}>{estatisticas.usuariosAtivosHoje}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>{t('admin.acoesRapidas')}</Text>
          <View style={{ gap: 10 }}>
            {atalhos.map((atalho) => (
              <TouchableOpacity
                key={atalho.rota}
                onPress={() => router.push(atalho.rota)}
                style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <Text style={{ color: COLORS.accent, fontSize: 18 }}>{atalho.icone}</Text>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>{t(atalho.titulo)}</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 18 }}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
