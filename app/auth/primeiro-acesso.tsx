import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CampoTexto } from '../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../src/componentes/comuns/Botao';
import { COLORS } from '../../src/styles/variables';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { criarPrimeiraSenha } from '../../src/servicos/autenticacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../src/utils/erroApi';
import { notificarErro, notificarSucesso } from '../../src/utils/notificacao';

export default function PrimeiroAcesso() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { t } = usarTraducao();
  const emailParam = String(params.email || '').trim().toLowerCase();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!emailParam) {
      router.replace('/auth/entrar');
    }
  }, [emailParam, router]);

  const validar = () => {
    const invalidos: Record<string, boolean> = {};
    if (!novaSenha.trim()) invalidos.novaSenha = true;
    if (!confirmarSenha.trim()) invalidos.confirmarSenha = true;

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos);
      notificarErro(t('primeiroAcesso.erros.camposObrigatorios'));
      return false;
    }

    if (novaSenha.length < 10) {
      setCamposInvalidos((atual) => ({ ...atual, novaSenha: true }));
      notificarErro(t('primeiroAcesso.erros.senhaMinima'));
      return false;
    }

    if (novaSenha !== confirmarSenha) {
      setCamposInvalidos((atual) => ({ ...atual, confirmarSenha: true }));
      notificarErro(t('primeiroAcesso.erros.confirmacaoDiferente'));
      return false;
    }

    return true;
  };

  const handleConfirmar = async () => {
    if (!validar()) return;

    setSalvando(true);
    try {
      const mensagemSucesso = await criarPrimeiraSenha({
        email: emailParam,
        novaSenha: novaSenha.trim(),
        confirmarSenha: confirmarSenha.trim(),
      });
      notificarSucesso(mensagemSucesso || t('primeiroAcesso.sucesso.senhaCriada'));
      router.replace('/auth/entrar');
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('primeiroAcesso.erros.falhaCriarSenha')));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bgPrimary,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>Core</Text>
      <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        {t('primeiroAcesso.titulo')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 22, textAlign: 'center' }}>
        {t('primeiroAcesso.descricao')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
        {emailParam}
      </Text>

      <View style={{ width: '100%', maxWidth: 420 }}>
        <CampoTexto
          label={t('primeiroAcesso.campos.novaSenha')}
          value={novaSenha}
          onChangeText={(valor) => {
            setCamposInvalidos((atual) => ({ ...atual, novaSenha: false }));
            setNovaSenha(valor);
          }}
          secureTextEntry
          error={camposInvalidos.novaSenha}
          estilo={{ marginBottom: 12 }}
        />
        <CampoTexto
          label={t('primeiroAcesso.campos.confirmarSenha')}
          value={confirmarSenha}
          onChangeText={(valor) => {
            setCamposInvalidos((atual) => ({ ...atual, confirmarSenha: false }));
            setConfirmarSenha(valor);
          }}
          secureTextEntry
          error={camposInvalidos.confirmarSenha}
          estilo={{ marginBottom: 16 }}
        />
        <Botao
          titulo={salvando ? t('comum.carregando') : t('primeiroAcesso.botaoConfirmar')}
          onPress={handleConfirmar}
          tipo="primario"
          disabled={salvando}
          estilo={{ marginBottom: 10 }}
        />
        <Botao
          titulo={t('comum.entrar')}
          onPress={() => router.replace('/auth/entrar')}
          tipo="secundario"
          disabled={salvando}
        />
      </View>
    </View>
  );
}
