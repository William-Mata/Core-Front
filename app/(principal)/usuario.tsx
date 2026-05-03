import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CampoTexto } from '../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../src/componentes/comuns/Botao';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { usarAutenticacaoStore } from '../../src/store/usarAutenticacaoStore';
import { COLORS } from '../../src/styles/variables';
import { alterarSenha } from '../../src/servicos/autenticacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../src/utils/erroApi';
import { notificarErro, notificarSucesso } from '../../src/utils/notificacao';

export default function PainelUsuario() {
  const router = useRouter();
  const { t } = usarTraducao();
  const usuario = usarAutenticacaoStore((state) => state.usuario);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  const validar = () => {
    const invalidos: Record<string, boolean> = {};
    if (!senhaAtual.trim()) invalidos.senhaAtual = true;
    if (!novaSenha.trim()) invalidos.novaSenha = true;
    if (!confirmarSenha.trim()) invalidos.confirmarSenha = true;

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos);
      notificarErro(t('usuarioPainel.erros.camposObrigatorios'));
      return false;
    }

    if (novaSenha.length < 10) {
      setCamposInvalidos((atual) => ({ ...atual, novaSenha: true }));
      notificarErro(t('usuarioPainel.erros.senhaMinima'));
      return false;
    }

    if (novaSenha !== confirmarSenha) {
      setCamposInvalidos((atual) => ({ ...atual, confirmarSenha: true }));
      notificarErro(t('usuarioPainel.erros.confirmacaoDiferente'));
      return false;
    }

    return true;
  };

  const handleAlterarSenha = async () => {
    if (!validar()) return;

    setSalvando(true);
    try {
      await alterarSenha({
        senhaAtual: senhaAtual.trim(),
        novaSenha: novaSenha.trim(),
        confirmarSenha: confirmarSenha.trim(),
      });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setCamposInvalidos({});
      notificarSucesso(t('usuarioPainel.sucesso.senhaAlterada'));
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('usuarioPainel.erros.falhaAlterarSenha')));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.bgSecondary,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ width: 42 }} />
        <Text style={{ flex: 1, textAlign: 'center', color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('usuarioPainel.titulo')}</Text>
        <TouchableOpacity onPress={() => router.push('/dashboard' as any)} style={{ width: 42, alignItems: 'flex-end' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
            {t('usuarioPainel.informacoes')}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
            {t('usuarioPainel.nome')}: <Text style={{ color: COLORS.textPrimary }}>{usuario?.nome || '-'}</Text>
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
            {t('usuarioPainel.email')}: <Text style={{ color: COLORS.textPrimary }}>{usuario?.email || '-'}</Text>
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            {t('usuarioPainel.perfil')}: <Text style={{ color: COLORS.textPrimary }}>{usuario?.perfil?.nome || '-'}</Text>
          </Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
            {t('usuarioPainel.alterarSenha')}
          </Text>

          <CampoTexto
            label={t('usuarioPainel.campos.senhaAtual')}
            value={senhaAtual}
            onChangeText={(valor) => {
              setCamposInvalidos((atual) => ({ ...atual, senhaAtual: false }));
              setSenhaAtual(valor);
            }}
            error={camposInvalidos.senhaAtual}
            secureTextEntry
            estilo={{ marginBottom: 12 }}
          />
          <CampoTexto
            label={t('usuarioPainel.campos.novaSenha')}
            value={novaSenha}
            onChangeText={(valor) => {
              setCamposInvalidos((atual) => ({ ...atual, novaSenha: false }));
              setNovaSenha(valor);
            }}
            error={camposInvalidos.novaSenha}
            secureTextEntry
            estilo={{ marginBottom: 12 }}
          />
          <CampoTexto
            label={t('usuarioPainel.campos.confirmarSenha')}
            value={confirmarSenha}
            onChangeText={(valor) => {
              setCamposInvalidos((atual) => ({ ...atual, confirmarSenha: false }));
              setConfirmarSenha(valor);
            }}
            error={camposInvalidos.confirmarSenha}
            secureTextEntry
            estilo={{ marginBottom: 16 }}
          />

          <Botao
            titulo={salvando ? t('comum.carregando') : t('usuarioPainel.botaoSalvar')}
            onPress={handleAlterarSenha}
            tipo="primario"
            disabled={salvando}
          />
        </View>
      </ScrollView>
    </View>
  );
}

