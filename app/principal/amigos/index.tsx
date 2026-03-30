import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { Cabecalho } from '../../../src/componentes/comuns/Cabecalho';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { COLORS } from '../../../src/styles/variables';
import {
  aceitarConviteAmizadeApi,
  listarAmigosRateioApi,
  listarConvitesAmizadeApi,
  rejeitarConviteAmizadeApi,
  removerAmizadeApi,
  type AmigoRateioApi,
  type ConviteAmizadeApi,
} from '../../../src/servicos/financeiro';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';

interface AmigoTela {
  id: number;
  nome: string;
  email: string;
  status: 'amigo' | 'pendente';
  dataAdicao: string;
}

export default function Amigos() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [amigos, setAmigos] = useState<AmigoTela[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaSelecionada, setAbaSelecionada] = useState<'amigos' | 'pendentes'>('amigos');
  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });

  const mapearAmigo = (item: AmigoRateioApi): AmigoTela => ({
    id: item.id,
    nome: item.nome,
    email: item.email ?? '',
    status: 'amigo',
    dataAdicao: new Date().toISOString().slice(0, 10),
  });

  const mapearConvite = (item: ConviteAmizadeApi): AmigoTela => ({
    id: item.id,
    nome: item.nome || item.email,
    email: item.email,
    status: 'pendente',
    dataAdicao: (item.dataCriacao || new Date().toISOString()).slice(0, 10),
  });

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [amigosAceitos, convites] = await Promise.all([listarAmigosRateioApi(), listarConvitesAmizadeApi()]);
      const convitesPendentes = convites.filter((item) => String(item.status ?? '').toLowerCase().includes('pend'));
      setAmigos([...amigosAceitos.map(mapearAmigo), ...convitesPendentes.map(mapearConvite)]);
    } catch {
      notificarErro(t('comum.erro'));
      setAmigos([]);
    } finally {
      setCarregando(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const amigosFiltrados = useMemo(
    () =>
      amigos.filter((a) => {
        const bateAba = abaSelecionada === 'amigos' ? a.status === 'amigo' : a.status === 'pendente';
        const bateId = !filtro.id || String(a.id).includes(filtro.id);
        const termo = filtro.descricao.toLowerCase();
        const bateDescricao = !filtro.descricao || a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo);
        const bateData = estaDentroIntervalo(a.dataAdicao, filtro.dataInicio, filtro.dataFim);
        return bateAba && bateId && bateDescricao && bateData;
      }),
    [amigos, abaSelecionada, filtro],
  );

  const aceitarConvite = async (id: number) => {
    try {
      await aceitarConviteAmizadeApi(id);
      notificarSucesso(t('comum.sucesso'));
      await carregarDados();
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const rejeitarConvite = async (id: number) => {
    try {
      await rejeitarConviteAmizadeApi(id);
      notificarSucesso(t('comum.sucesso'));
      await carregarDados();
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const removerAmigo = async (id: number) => {
    try {
      await removerAmizadeApi(id);
      notificarSucesso(t('comum.sucesso'));
      await carregarDados();
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'amigo':
        return { bg: COLORS.success, label: t('amigos.status.amigo') };
      case 'pendente':
        return { bg: COLORS.warning, label: t('amigos.status.pendente') };
      default:
        return { bg: COLORS.textSecondary, label: t('amigos.status.desconhecido') };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <Cabecalho titulo={t('amigos.titulo')} />

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: COLORS.accent, fontSize: 24, fontWeight: 'bold' }}>{'\uD83D\uDC65'} {t('amigos.titulo')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Botao titulo={t('documentacao.acao')} onPress={() => router.push('/principal/amigos/documentacao')} tipo="secundario" />
            <Botao titulo={t('amigos.acoes.convidar')} onPress={() => router.push('/principal/amigos/amigo')} tipo="primario" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setAbaSelecionada('amigos')} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: abaSelecionada === 'amigos' ? COLORS.accent : COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <Text style={{ color: abaSelecionada === 'amigos' ? 'white' : COLORS.textSecondary, fontWeight: '600' }}>
              {t('amigos.abas.meusAmigos')} ({amigos.filter((a) => a.status === 'amigo').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAbaSelecionada('pendentes')} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: abaSelecionada === 'pendentes' ? COLORS.accent : COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <Text style={{ color: abaSelecionada === 'pendentes' ? 'white' : COLORS.textSecondary, fontWeight: '600' }}>
              {t('amigos.abas.convites')} ({amigos.filter((a) => a.status === 'pendente').length})
            </Text>
          </TouchableOpacity>
        </View>

        {abaSelecionada === 'amigos' && (
          <View style={{ backgroundColor: COLORS.bgTertiary, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('amigos.total')}</Text>
            <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: 'bold' }}>{amigos.filter((a) => a.status === 'amigo').length}</Text>
          </View>
        )}

        <FiltroPadrao valor={filtro} aoMudar={setFiltro} />

        <View style={{ gap: 12 }}>
          {carregando ? (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>{t('amigos.carregando')}</Text>
          ) : amigosFiltrados.length > 0 ? (
            amigosFiltrados.map((amigo) => {
              const badge = getStatusBadge(amigo.status);
              return (
                <View key={`${amigo.status}-${amigo.id}`} style={{ backgroundColor: COLORS.bgTertiary, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{amigo.nome}</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{amigo.email}</Text>
                    </View>
                    <View style={{ backgroundColor: badge.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>{badge.label}</Text>
                    </View>
                  </View>

                  {amigo.status === 'pendente' ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Botao titulo={t('comum.acoes.confirmar')} onPress={() => void aceitarConvite(amigo.id)} tipo="primario" estilo={{ flex: 1 }} />
                      <Botao titulo={t('comum.acoes.cancelar')} onPress={() => void rejeitarConvite(amigo.id)} tipo="secundario" estilo={{ flex: 1 }} />
                    </View>
                  ) : (
                    <Botao titulo={t('comum.acoes.remover')} onPress={() => void removerAmigo(amigo.id)} tipo="secundario" />
                  )}
                </View>
              );
            })
          ) : (
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>
              {abaSelecionada === 'amigos' ? t('amigos.vazioAmigos') : t('amigos.vazioConvites')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
