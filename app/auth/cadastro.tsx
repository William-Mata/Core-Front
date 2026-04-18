import React, { useState } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { CampoData } from '../../src/componentes/comuns/CampoData';
import { COLORS } from '../../src/styles/variables';
import { cadastrarUsuario } from '../../src/servicos/autenticacao';
import { notificarErro, notificarSucesso } from '../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../src/utils/erroApi';
import { idadeMinimaAtingida } from '../../src/utils/validacaoDataNascimento';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroUsuario() {
  const router = useRouter();
  const { t } = usarTraducao();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [focoNome, setFocoNome] = useState(false);
  const [focoEmail, setFocoEmail] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const emailValido = (valor: string) => EMAIL_REGEX.test(valor.trim());

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !dataNascimento) {
      notificarErro(t('admin.usuario.erros.nomeEmailDataNascimentoObrigatorio'));
      return;
    }

    if (!emailValido(email)) {
      notificarErro(t('admin.usuario.erros.emailInvalido'));
      return;
    }

    if (!idadeMinimaAtingida(dataNascimento, 15)) {
      notificarErro(t('admin.usuario.erros.dataNascimentoMinimo15Anos'));
      return;
    }

    setCarregando(true);
    try {
      await cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        dataNascimento,
      });
      notificarSucesso(
        t('admin.usuario.sucessoSalvo', {
          acao: t('admin.usuario.criado'),
        }),
      );
      router.replace('/auth/entrar');
    } catch (erro: unknown) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('admin.usuario.erros.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const placeholderNomeObrigatorio = `${t('admin.usuario.nomeCompleto')} *`;
  const placeholderEmailObrigatorio = `${t('comum.email')} *`;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary, paddingHorizontal: 16 }}>
      <Text style={{ color: COLORS.accent, fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
        Core
      </Text>
      <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
        {t('admin.usuario.novo')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
        {t('primeiroAcesso.descricao')}
      </Text>

      <TextInput
        placeholder={placeholderNomeObrigatorio}
        placeholderTextColor={COLORS.textSecondary}
        value={nome}
        onChangeText={setNome}
        onFocus={() => setFocoNome(true)}
        onBlur={() => setFocoNome(false)}
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
          borderColor: focoNome ? COLORS.borderAccent : COLORS.borderColor,
          fontSize: 14,
          ...(Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                outlineWidth: 0,
                boxShadow: focoNome ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
              } as any)
            : {}),
        }}
      />

      <TextInput
        placeholder={placeholderEmailObrigatorio}
        placeholderTextColor={COLORS.textSecondary}
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocoEmail(true)}
        onBlur={() => setFocoEmail(false)}
        editable={!carregando}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          backgroundColor: COLORS.bgTertiary,
          color: 'white',
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 24,
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

      <CampoData
        label={t('admin.usuario.dataNascimento')}
        value={dataNascimento}
        onChange={setDataNascimento}
        estilo={{ marginBottom: 24 }}
      />

      <TouchableOpacity
        onPress={handleCadastrar}
        disabled={carregando}
        style={{
          backgroundColor: carregando ? COLORS.accentMuted : COLORS.accent,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {carregando ? t('comum.carregando') : t('admin.usuarios.criar')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/auth/entrar')}
        disabled={carregando}
        style={{ marginTop: 12, alignSelf: 'center' }}
      >
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>
          {t('comum.entrar')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
