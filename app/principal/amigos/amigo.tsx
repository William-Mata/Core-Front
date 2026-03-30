import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { useState } from 'react';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { enviarConviteAmizadeApi } from '../../../src/servicos/financeiro';

export default function FormAmigo() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleEnviarConvite = async () => {
    if (!email) {
      notificarErro( t('amigos.form.erros.emailObrigatorio'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notificarErro( t('amigos.form.erros.emailInvalido'));
      return;
    }

    setCarregando(true);
    try {
      await enviarConviteAmizadeApi({ email: email.trim(), mensagem: mensagem.trim() || undefined });
      notificarSucesso(t('amigos.form.sucesso'));
      router.back();
    } catch {
      notificarErro( t('amigos.form.erros.falhaEnvio'));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('amigos.form.titulo')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 24 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontSize: 14, fontWeight: '600', marginBottom: 12 }}>{'\uD83E\uDD1D'} {t('amigos.form.subtitulo')}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}>{t('amigos.form.descricao')}</Text>
        </View>

        <CampoTexto label={t('amigos.form.emailLabel')} placeholder={t('amigos.form.emailPlaceholder')} value={email} onChangeText={setEmail} estilo={{ marginBottom: 16 }} keyboardType="email-address" />

        <CampoTexto label={t('amigos.form.msgLabel')} placeholder={t('amigos.form.msgPlaceholder')} value={mensagem} onChangeText={setMensagem} estilo={{ marginBottom: 24, minHeight: 80 }} multiline numberOfLines={3} />

        <View style={{ backgroundColor: COLORS.bgTertiary, padding: 12, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderColor }}>
          <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '600' }}>{'\u2139\uFE0F'} {t('amigos.form.infoTitulo')}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>{t('amigos.form.infoTexto')}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Botao titulo={t('comum.acoes.cancelar')} onPress={() => router.back()} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
          <Botao titulo={carregando ? t('amigos.form.enviando') : t('amigos.form.enviar')} onPress={handleEnviarConvite} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
        </View>
      </ScrollView>
    </View>
  );
}









