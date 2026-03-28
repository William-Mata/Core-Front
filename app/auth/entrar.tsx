import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { usarAutenticacaoStore } from '../../src/store/usarAutenticacaoStore';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { COLORS } from '../../src/styles/variables';
import { salvarTokens } from '../../src/utils/armazenamento';
import { autenticar, solicitarRecuperacaoSenha } from '../../src/servicos/autenticacao';
import { notificarErro, notificarSucesso } from '../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../src/utils/erroApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TENTATIVAS_LOGIN = 5;
export default function Entrar() {
  const router = useRouter();
  const { definirSessao } = usarAutenticacaoStore();
  const { t } = usarTraducao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [focoEmail, setFocoEmail] = useState(false);
  const [focoSenha, setFocoSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tentativasInvalidas, setTentativasInvalidas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const emailValido = (valor: string) => EMAIL_REGEX.test(valor.trim());

  const registrarFalhaLogin = () => {
    setTentativasInvalidas((anterior) => {
      const proximoValor = anterior + 1;
      if (proximoValor >= MAX_TENTATIVAS_LOGIN) {
        setBloqueado(true);
        notificarErro(t('comum.login.erros.bloqueadoTentativas'));
        return MAX_TENTATIVAS_LOGIN;
      }

      notificarErro(t('comum.login.erros.credenciaisInvalidas'));
      return proximoValor;
    });
  };

  const handleLogin = async () => {
    if (bloqueado) {
      notificarErro(t('comum.login.erros.bloqueadoTentativas'));
      return;
    }

    if (!email || !senha) {
      notificarErro(t('comum.login.erros.camposObrigatorios'));
      return;
    }

    if (!emailValido(email)) {
      notificarErro(t('comum.login.erros.emailInvalido'));
      return;
    }

    setCarregando(true);
    try {
      const resposta = await autenticar(email.trim().toLowerCase(), senha);
      await salvarTokens(resposta.accessToken, resposta.refreshToken);
      definirSessao(resposta.usuario, resposta.accessToken);
      setTentativasInvalidas(0);
      setBloqueado(false);
      setModoRecuperacao(false);
      router.replace('/principal');
    } catch (error: any) {
      const detail = String(error?.response?.data?.detail || '');
      if (error?.response?.status === 400 && detail === 'No primeiro acesso, voce deve criar sua senha.') {
        router.replace({
          pathname: '/auth/primeiro-acesso',
          params: { email: email.trim().toLowerCase() },
        } as any);
        return;
      }
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        registrarFalhaLogin();
        return;
      }
      if (erroApiJaNotificado(error)) return;
      notificarErro(extrairMensagemErroApi(error, 'Falha ao fazer login.'));
    } finally {
      setCarregando(false);
    }
  };

  const handleEsqueciSenha = () => {
    if (!email) {
      notificarErro(t('comum.login.erros.emailObrigatorioRecuperacao'));
      return;
    }

    if (!emailValido(email)) {
      notificarErro(t('comum.login.erros.emailInvalido'));
      return;
    }

    void solicitarRecuperacaoSenha({ email: email.trim().toLowerCase() })
      .catch(() => undefined)
      .finally(() => {
        setTentativasInvalidas(0);
        setBloqueado(false);
        notificarSucesso(t('comum.login.esqueciSenhaSucesso'));
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary, paddingHorizontal: 16 }}>
      <Text style={{ color: COLORS.accent, fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
        Core
      </Text>
      <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: '600', marginBottom: 32 }}>
        {t('comum.entrar')}
      </Text>

      <TextInput
        placeholder={t('comum.email')}
        placeholderTextColor={COLORS.textSecondary}
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocoEmail(true)}
        onBlur={() => setFocoEmail(false)}
        editable={!carregando}
        style={{
          backgroundColor: COLORS.bgTertiary,
          color: 'white',
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 12,
          width: '100%',
          borderWidth: 1,
          borderColor: focoEmail ? COLORS.borderAccent : COLORS.borderColor,
          fontSize: 14,
          ...(Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                outlineWidth: 0,
                boxShadow: focoEmail ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
              } as any)
            : {}),
        }}
      />

      {!modoRecuperacao ? (
        <View
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderRadius: 8,
            marginBottom: 24,
            width: '100%',
            borderWidth: 1,
            borderColor: focoSenha ? COLORS.borderAccent : COLORS.borderColor,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            placeholder={t('comum.senha')}
            placeholderTextColor={COLORS.textSecondary}
            value={senha}
            onChangeText={setSenha}
            onFocus={() => setFocoSenha(true)}
            onBlur={() => setFocoSenha(false)}
            secureTextEntry={!mostrarSenha}
            editable={!carregando}
            style={{
              color: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              flex: 1,
              ...(Platform.OS === 'web'
                ? ({
                    outlineStyle: 'none',
                    outlineWidth: 0,
                    boxShadow: 'none',
                  } as any)
                : {}),
            }}
          />
          <TouchableOpacity
            onPress={() => setMostrarSenha((atual) => !atual)}
            disabled={carregando}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: '700' }}>
              {mostrarSenha ? '\uD83D\uDE48' : '\uD83D\uDC41\uFE0F'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={modoRecuperacao ? handleEsqueciSenha : handleLogin}
        disabled={carregando || (!modoRecuperacao && bloqueado)}
        style={{
          backgroundColor: carregando || (!modoRecuperacao && bloqueado) ? COLORS.accentMuted : COLORS.accent,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {carregando ? t('comum.carregando') : modoRecuperacao ? t('comum.login.esqueciSenha') : t('comum.entrar')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setModoRecuperacao((atual) => !atual)}
        disabled={carregando}
        style={{ marginTop: 12, alignSelf: 'flex-end' }}
      >
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>
          {modoRecuperacao ? t('comum.entrar') : t('comum.login.esqueciSenha')}
        </Text>
      </TouchableOpacity>

    </View>
  );
}





