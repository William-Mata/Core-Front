import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { Cabecalho } from '../../../src/componentes/comuns/Cabecalho';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { useState, useEffect } from 'react';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { COLORS } from '../../../src/styles/variables';

interface Amigo {
  id: number;
  nome: string;
  email: string;
  status: 'amigo' | 'pendente' | 'bloqueado';
  data_adicao: string;
}

export default function Amigos() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaSelecionada, setAbaSelecionada] = useState<'amigos' | 'pendentes'>('amigos');
  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });

  useEffect(() => {
    setTimeout(() => {
      setAmigos([
        { id: 1, nome: 'João Silva', email: 'joao@example.com', status: 'amigo', data_adicao: '2024-01-15' },
        { id: 2, nome: 'Maria Santos', email: 'maria@example.com', status: 'pendente', data_adicao: '2024-03-10' },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@example.com', status: 'amigo', data_adicao: '2024-02-20' },
      ]);
      setCarregando(false);
    }, 500);
  }, []);

  const amigosFiltrados = amigos.filter((a) => {
    const bateAba = abaSelecionada === 'amigos' ? a.status === 'amigo' : a.status === 'pendente';
    const bateId = !filtro.id || String(a.id).includes(filtro.id);
    const bateDescricao = !filtro.descricao || a.nome.toLowerCase().includes(filtro.descricao.toLowerCase()) || a.email.toLowerCase().includes(filtro.descricao.toLowerCase());
    const bateData = estaDentroIntervalo(a.data_adicao, filtro.dataInicio, filtro.dataFim);
    return bateAba && bateId && bateDescricao && bateData;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'amigo':
        return { bg: COLORS.success, label: t('amigos.status.amigo') };
      case 'pendente':
        return { bg: COLORS.warning, label: t('amigos.status.pendente') };
      case 'bloqueado':
        return { bg: COLORS.error, label: t('amigos.status.bloqueado') };
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
                <TouchableOpacity
                  key={amigo.id}
                  onPress={() => router.push(`/principal/amigos/amigo?id=${amigo.id}`)}
                  style={{ backgroundColor: COLORS.bgTertiary, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{amigo.nome}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{amigo.email}</Text>
                  </View>
                  <View style={{ backgroundColor: badge.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>{badge.label}</Text>
                  </View>
                </TouchableOpacity>
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




