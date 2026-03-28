import { View, Text, TouchableOpacity, FlatList, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../src/utils/formatacaoLocale';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro } from '../../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../../src/utils/erroApi';
import { listarDespesasApi, type RegistroFinanceiroApi } from '../../../src/servicos/financeiro';

interface Despesa {
  id: number;
  titulo: string;
  categoria: string;
  valor: number;
  data: string;
  status: string;
}

function paraNumero(valor: unknown, padrao = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarDespesaApi(item: RegistroFinanceiroApi): Despesa {
  const statusTexto = String(item.status ?? item.situacao ?? 'PENDENTE')
    .trim()
    .toLowerCase();

  const categoria = String(item.tipoDespesa ?? item.categoria ?? 'outros')
    .trim()
    .toLowerCase();

  return {
    id: paraNumero(item.id),
    titulo: String(item.titulo ?? item.descricao ?? `#${item.id}`),
    categoria,
    valor: paraNumero(item.valor ?? item.valorLiquido ?? item.valorTotal),
    data: String(item.data ?? item.dataLancamento ?? item.dataEfetivacao ?? new Date().toISOString().split('T')[0]),
    status: statusTexto,
  };
}

const STATUS_EFETIVADO = new Set(['efetivada', 'efetivado', 'paid', 'concluida', 'concluido']);

export default function SeletorDespesas() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [busca, setBusca] = useState('');
  const [focoBusca, setFocoBusca] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [despesasDisponiveis, setDespesasDisponiveis] = useState<Despesa[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const carregar = async () => {
      setCarregando(true);
      try {
        const resposta = await listarDespesasApi({ signal: controller.signal });
        const despesasNormalizadas = resposta
          .map(normalizarDespesaApi)
          .filter((despesa) => STATUS_EFETIVADO.has(despesa.status));
        setDespesasDisponiveis(despesasNormalizadas);
      } catch (erro) {
        if (erroApiJaNotificado(erro)) return;
        setDespesasDisponiveis([]);
        notificarErro(extrairMensagemErroApi(erro, t('financeiro.seletorDespesas.nenhuma')));
      } finally {
        setCarregando(false);
      }
    };

    void carregar();

    return () => controller.abort();
  }, []);

  const despesasFiltradas = useMemo(
    () =>
      despesasDisponiveis.filter(
        (d) =>
          d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          t(`financeiro.despesa.categorias.${d.categoria}`).toLowerCase().includes(busca.toLowerCase()),
      ),
    [busca, despesasDisponiveis, t],
  );

  const isSelected = (id: number) => selecionadas.includes(id);

  const toggleSelecao = (id: number) => {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirmar = () => {
    if (selecionadas.length === 0) {
      notificarErro(t('financeiro.seletorDespesas.selecioneUma'));
      return;
    }

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ backgroundColor: COLORS.bgTertiary, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{t('financeiro.seletorDespesas.titulo')}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.accent, fontSize: 20 }}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder={t('financeiro.seletorDespesas.buscar')}
          placeholderTextColor={COLORS.textSecondary}
          value={busca}
          onFocus={() => setFocoBusca(true)}
          onBlur={() => setFocoBusca(false)}
          onChangeText={setBusca}
          style={{
            backgroundColor: COLORS.bgSecondary,
            borderWidth: 1,
            borderColor: focoBusca ? COLORS.borderAccent : COLORS.borderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: 'white',
            fontSize: 14,
            ...(Platform.OS === 'web'
              ? ({
                  outlineStyle: 'none',
                  outlineWidth: 0,
                  boxShadow: focoBusca ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
                } as any)
              : {}),
          }}
        />
      </View>

      <FlatList
        data={despesasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: despesa }) => (
          <TouchableOpacity
            onPress={() => toggleSelecao(despesa.id)}
            style={{
              backgroundColor: isSelected(despesa.id) ? COLORS.accentRgba : COLORS.bgTertiary,
              padding: 14,
              borderRadius: 10,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: isSelected(despesa.id) ? COLORS.borderAccent : COLORS.borderColor,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', flex: 1 }}>{despesa.titulo}</Text>
                <Text style={{ color: COLORS.success, fontSize: 14, fontWeight: '600' }}>{formatarValorPorIdioma(despesa.valor)}</Text>
              </View>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                {t(`financeiro.despesa.categorias.${despesa.categoria}`)} • {formatarDataPorIdioma(despesa.data)}
              </Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: isSelected(despesa.id) ? COLORS.accent : COLORS.textSecondary,
                  backgroundColor: isSelected(despesa.id) ? COLORS.accent : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isSelected(despesa.id) && <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{'\u2713'}</Text>}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>
            {carregando ? t('comum.carregando') : t('financeiro.seletorDespesas.nenhuma')}
          </Text>
        }
      />

      <View style={{ backgroundColor: COLORS.bgTertiary, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderColor, gap: 10 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' }}>
          {t('financeiro.seletorDespesas.selecionadas', {
            count: String(selecionadas.length),
            s: selecionadas.length !== 1 ? 's' : '',
          })}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => router.back()} estilo={{ flex: 1 }} />
          <Botao titulo={t('comum.acoes.confirmar')} tipo="primario" onPress={handleConfirmar} estilo={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}
