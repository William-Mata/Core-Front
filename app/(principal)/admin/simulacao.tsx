import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { useState } from 'react';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export default function FormSimulacao() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [usuarios] = useState<Usuario[]>([
    { id: 1, nome: 'João Silva', email: 'joao@example.com' },
    { id: 2, nome: 'Maria Santos', email: 'maria@example.com' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@example.com' },
  ]);
  const [carregando, setCarregando] = useState(false);

  const handleIniciarSimulacao = async () => {
    if (!usuarioSelecionado) {
      notificarErro( t('admin.simulacao.erros.selecioneUsuario'));
      return;
    }

    setCarregando(true);
    try {
      setTimeout(() => {
        notificarSucesso(t('admin.simulacao.msgSucesso', { nome: usuarioSelecionado.nome }));
        router.back();
      }, 500);
    } catch {
      notificarErro( t('admin.simulacao.erros.falha'));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ width: 42 }} />
        <Text style={{ flex: 1, textAlign: 'center', color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{'\uD83D\uDD04'} {t('admin.simulacao.titulo')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, alignItems: 'flex-end' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 24 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={{ backgroundColor: COLORS.bgTertiary, padding: 12, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderColor }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{'\u2139\uFE0F'} {t('admin.simulacao.oQue')}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}>{t('admin.simulacao.descricao')}</Text>
        </View>

        <View style={{ backgroundColor: COLORS.warning, opacity: 0.1, padding: 12, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: COLORS.warning }}>
          <Text style={{ color: COLORS.warning, fontSize: 12, fontWeight: '600' }}>{'\u26A0\uFE0F'} {t('admin.simulacao.avisoSeguranca')}</Text>
          <Text style={{ color: COLORS.warning, fontSize: 11, marginTop: 4 }}>{t('admin.simulacao.avisoTexto')}</Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>{t('admin.simulacao.selecione')}</Text>
          <View style={{ gap: 8 }}>
            {usuarios.map((usr) => (
              <TouchableOpacity key={usr.id} onPress={() => setUsuarioSelecionado(usr)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: usuarioSelecionado?.id === usr.id ? COLORS.accent : COLORS.bgTertiary, borderWidth: 1, borderColor: usuarioSelecionado?.id === usr.id ? COLORS.accent : COLORS.borderColor }}>
                <Text style={{ color: usuarioSelecionado?.id === usr.id ? 'white' : COLORS.textSecondary, fontWeight: '600', marginBottom: 2 }}>{usr.nome}</Text>
                <Text style={{ color: usuarioSelecionado?.id === usr.id ? COLORS.accentSoft : COLORS.textSecondary, fontSize: 12 }}>{usr.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {usuarioSelecionado && (
          <View style={{ backgroundColor: COLORS.bgTertiary, padding: 12, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{'\u2705'} {t('admin.simulacao.usuarioSelecionado')}</Text>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{usuarioSelecionado.nome}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>{usuarioSelecionado.email}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Botao titulo={t('comum.acoes.cancelar')} onPress={() => router.back()} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
          <Botao titulo={carregando ? t('admin.simulacao.iniciando') : t('admin.simulacao.iniciar')} onPress={handleIniciarSimulacao} tipo="primario" estilo={{ flex: 1 }} disabled={carregando || !usuarioSelecionado} />
        </View>
      </ScrollView>
    </View>
  );
}










