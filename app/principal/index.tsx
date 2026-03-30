import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { Cabecalho } from '../../src/componentes/comuns/Cabecalho';
import { EsqueletoCarregamento } from '../../src/componentes/comuns/EsqueletoCarregamento';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { formatarDataPorIdioma, formatarMesPorIdioma, formatarValorPorIdioma } from '../../src/utils/formatacaoLocale';
import { COLORS } from '../../src/styles/variables';
import { listarDespesasApi, listarReceitasApi, listarReembolsosApi, type RegistroFinanceiroApi } from '../../src/servicos/financeiro';
import i18n from '../../src/i18n/configuracao';

type TipoTransacao = 'despesa' | 'receita' | 'reembolso' | 'estorno';
type WidgetId =
  | 'resumo'
  | 'graficoReceitasAreaSubarea'
  | 'graficoDespesasAreaSubarea'
  | 'graficoAnual'
  | 'ultimasTransacoes'
  | 'balancoGeral';
type TipoContaBalanco = 'conta' | 'cartao';

interface Transacao {
  id: number;
  tipo: TipoTransacao;
  valor: number;
  descricao: string;
  dataEfetivacao: string;
  codigoPagamento: string;
  tipoPagamento: string;
  contaBancaria?: string;
  cartao?: string;
  area: string;
  subarea: string;
}

interface ItemBalanco {
  id: string;
  tipo: TipoContaBalanco;
  nome: string;
  subtitulo: string;
  saldo: number;
}

interface ItemAreaSubarea {
  id: string;
  area: string;
  subarea: string;
  receitas: number;
  despesas: number;
}

interface PieAreaItem {
  value: number;
  color: string;
  text: string;
  area: string;
  subarea: string;
  tooltipText: string;
  tooltipComponent?: () => ReactElement;
}

const CORES_RECEITA = [COLORS.success, COLORS.info, '#23c4a8', '#5dd39e', '#2dd4bf', '#14b8a6'];
const CORES_DESPESA = [COLORS.error, COLORS.warning, '#fb7185', '#f97316', '#ef4444', '#f59e0b'];

function erroCancelado(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const erroTipado = erro as { code?: string; name?: string };
  return erroTipado.code === 'ERR_CANCELED' || erroTipado.name === 'CanceledError';
}

function mapearTransacoesApiParaDashboard(
  itens: RegistroFinanceiroApi[],
  tipo: TipoTransacao,
  t: (chave: string) => string,
): Transacao[] {
  return itens.map((item, indice) => {
    const pagamento = String(item.tipoPagamento ?? item.tipoRecebimento ?? 'DINHEIRO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const codigoPagamento =
      pagamento === 'CREDITO' || pagamento === 'CARTAO_CREDITO'
        ? 'CARTAO_CREDITO'
        : pagamento === 'PIX'
          ? 'PIX'
          : pagamento === 'TRANSFERENCIA'
            ? 'TRANSFERENCIA'
            : pagamento === 'BOLETO'
              ? 'BOLETO'
              : 'DINHEIRO';

    const data = String(item.dataEfetivacao ?? item.dataLancamento ?? item.data ?? new Date().toISOString().split('T')[0]).slice(0, 10);
    const area = String(item.area ?? item.categoria ?? t('dashboard.areas.OPERACOES'));
    const subarea = String(item.subarea ?? item.descricao ?? item.titulo ?? t('dashboard.subareas.SUPRIMENTOS'));

    return {
      id: Number(item.id ?? indice + 1),
      tipo,
      valor: Number(item.valor ?? item.valorLiquido ?? item.valorTotal ?? 0),
      descricao: String(item.descricao ?? item.titulo ?? `${t('dashboard.tipos.' + tipo)} #${item.id ?? indice + 1}`),
      dataEfetivacao: data,
      codigoPagamento,
      tipoPagamento: t(`dashboard.pagamento.${codigoPagamento}`),
      contaBancaria: item.contaBancaria ? String(item.contaBancaria) : undefined,
      cartao: item.cartao ? String(item.cartao) : undefined,
      area,
      subarea,
    };
  });
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = usarTraducao();
  const { width } = useWindowDimensions();
  const idiomaAtual = i18n.resolvedLanguage || i18n.language || 'pt-BR';

  const [ordemWidgets, setOrdemWidgets] = useState<WidgetId[]>([
    'resumo',
    'graficoReceitasAreaSubarea',
    'graficoDespesasAreaSubarea',
    'graficoAnual',
    'ultimasTransacoes',
    'balancoGeral',
  ]);
  const [widgetArrastando, setWidgetArrastando] = useState<WidgetId | null>(null);
  const [indiceReceitaSelecionada, setIndiceReceitaSelecionada] = useState(0);
  const [indiceDespesaSelecionada, setIndiceDespesaSelecionada] = useState(0);
  const [seriesVisiveis, setSeriesVisiveis] = useState({
    receitas: true,
    despesas: true,
    reembolsos: true,
    estornos: true,
  });
  const [larguraGraficoAnualDisponivel, setLarguraGraficoAnualDisponivel] = useState(0);
  const [transacoesApi, setTransacoesApi] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const carregarDashboard = async () => {
      setCarregando(true);
      try {
        const [despesasApi, receitasApi, reembolsosApi] = await Promise.all([
          listarDespesasApi({ signal: controller.signal }),
          listarReceitasApi({ signal: controller.signal }),
          listarReembolsosApi({ signal: controller.signal }),
        ]);

        const despesas = mapearTransacoesApiParaDashboard(despesasApi, 'despesa', t);
        const receitas = mapearTransacoesApiParaDashboard(receitasApi, 'receita', t);
        const reembolsos = mapearTransacoesApiParaDashboard(reembolsosApi, 'reembolso', t);

        if (!ativo) return;
        setTransacoesApi(
          [...despesas, ...receitas, ...reembolsos].sort((a, b) =>
            a.dataEfetivacao < b.dataEfetivacao ? 1 : -1,
          ),
        );
      } catch (erro) {
        if (erroCancelado(erro)) return;
        if (!ativo) return;
        setTransacoesApi([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregarDashboard();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [idiomaAtual]);

  const transacoes = transacoesApi;

  const contasCartoes = useMemo<ItemBalanco[]>(() => {
    const mapaContas = new Map<string, number>();
    const mapaCartoes = new Map<string, number>();

    for (const item of transacoes) {
      const valorAssinado = item.tipo === 'despesa' ? -item.valor : item.valor;

      if (item.contaBancaria && item.contaBancaria.trim()) {
        const nomeConta = item.contaBancaria.trim();
        mapaContas.set(nomeConta, Number((mapaContas.get(nomeConta) ?? 0) + valorAssinado));
      }

      if (item.cartao && item.cartao.trim()) {
        const nomeCartao = item.cartao.trim();
        mapaCartoes.set(nomeCartao, Number((mapaCartoes.get(nomeCartao) ?? 0) + valorAssinado));
      }
    }

    const itensContas: ItemBalanco[] = Array.from(mapaContas.entries()).map(([nome, saldo], indice) => ({
      id: `conta-${indice}-${nome}`,
      tipo: 'conta',
      nome,
      subtitulo: t('dashboard.saldoAtualConta'),
      saldo,
    }));

    const itensCartoes: ItemBalanco[] = Array.from(mapaCartoes.entries()).map(([nome, saldo], indice) => ({
      id: `cartao-${indice}-${nome}`,
      tipo: 'cartao',
      nome,
      subtitulo: t('dashboard.saldoDisponivelCartao'),
      saldo,
    }));

    return [...itensContas, ...itensCartoes];
  }, [transacoes, t]);

  const transacoesFiltradas = transacoes;

  const resumo = useMemo(() => {
    const totalDespesas = transacoesFiltradas.filter((x) => x.tipo === 'despesa').reduce((acc, item) => acc + item.valor, 0);
    const totalReceitas = transacoesFiltradas.filter((x) => x.tipo === 'receita').reduce((acc, item) => acc + item.valor, 0);
    const totalReembolsos = transacoesFiltradas.filter((x) => x.tipo === 'reembolso').reduce((acc, item) => acc + item.valor, 0);
    const totalEstornos = transacoesFiltradas.filter((x) => x.tipo === 'estorno').reduce((acc, item) => acc + item.valor, 0);

    return {
      totalDespesas,
      totalReceitas,
      totalReembolsos,
      totalEstornos,
      saldo: totalReceitas + totalReembolsos + totalEstornos - totalDespesas,
    };
  }, [transacoesFiltradas]);

  const larguraContainerGraficoAnual = useMemo(() => {
    if (larguraGraficoAnualDisponivel > 0) {
      return Math.max(larguraGraficoAnualDisponivel, 280);
    }
    if (width >= 1400) return width - 260;
    if (width >= 1100) return width - 220;
    if (width >= 900) return width - 160;
    return Math.max(width - 84, 300);
  }, [larguraGraficoAnualDisponivel, width]);
  const larguraPlotGraficoAnual = useMemo(
    () => Math.max(larguraContainerGraficoAnual - (width > 900 ? 56 : 48), 220),
    [larguraContainerGraficoAnual, width],
  );

  const itensAreaSubarea = useMemo<ItemAreaSubarea[]>(() => {
    const mapa = new Map<string, ItemAreaSubarea>();

    for (const item of transacoesFiltradas) {
      const chave = `${item.area}|${item.subarea}`;
      const atual = mapa.get(chave) ?? { id: chave, area: item.area, subarea: item.subarea, receitas: 0, despesas: 0 };
      if (item.tipo === 'receita') atual.receitas += item.valor;
      if (item.tipo === 'despesa') atual.despesas += item.valor;
      mapa.set(chave, atual);
    }

    return Array.from(mapa.values())
      .sort((a, b) => b.receitas + b.despesas - (a.receitas + a.despesas))
      .slice(0, 30);
  }, [transacoesFiltradas]);

  const dadosPieAreaSubareaReceitas = useMemo<PieAreaItem[]>(
    () =>
      itensAreaSubarea
        .filter((item) => item.receitas > 0)
        .map((item, indice) => ({
          value: Number(item.receitas.toFixed(2)),
          color: CORES_RECEITA[indice % CORES_RECEITA.length],
          text: item.subarea,
          area: item.area,
          subarea: item.subarea,
          tooltipText: `${item.area} / ${item.subarea}\n${formatarValorPorIdioma(item.receitas)}`,
          tooltipComponent: () => (
            <View style={{ backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7, minWidth: 128, maxWidth: 150 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 8 }}>{item.area}</Text>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 10, fontWeight: '700', marginTop: 1 }}>{item.subarea}</Text>
              <Text style={{ color: CORES_RECEITA[indice % CORES_RECEITA.length], fontSize: 10, fontWeight: '700', marginTop: 3 }}>
                {formatarValorPorIdioma(item.receitas)}
              </Text>
            </View>
          ),
        })),
    [itensAreaSubarea],
  );

  const dadosPieAreaSubareaDespesas = useMemo<PieAreaItem[]>(
    () =>
      itensAreaSubarea
        .filter((item) => item.despesas > 0)
        .map((item, indice) => ({
          value: Number(item.despesas.toFixed(2)),
          color: CORES_DESPESA[indice % CORES_DESPESA.length],
          text: item.subarea,
          area: item.area,
          subarea: item.subarea,
          tooltipText: `${item.area} / ${item.subarea}\n${formatarValorPorIdioma(item.despesas)}`,
          tooltipComponent: () => (
            <View style={{ backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7, minWidth: 128, maxWidth: 150 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 8 }}>{item.area}</Text>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 10, fontWeight: '700', marginTop: 1 }}>{item.subarea}</Text>
              <Text style={{ color: CORES_DESPESA[indice % CORES_DESPESA.length], fontSize: 10, fontWeight: '700', marginTop: 3 }}>
                {formatarValorPorIdioma(item.despesas)}
              </Text>
            </View>
          ),
        })),
    [itensAreaSubarea],
  );

  useEffect(() => {
    if (indiceReceitaSelecionada >= dadosPieAreaSubareaReceitas.length) {
      setIndiceReceitaSelecionada(0);
    }
  }, [dadosPieAreaSubareaReceitas.length, indiceReceitaSelecionada]);

  useEffect(() => {
    if (indiceDespesaSelecionada >= dadosPieAreaSubareaDespesas.length) {
      setIndiceDespesaSelecionada(0);
    }
  }, [dadosPieAreaSubareaDespesas.length, indiceDespesaSelecionada]);

  const dadosAnuais = useMemo(() => {
    const anoAtual = new Date().getFullYear();

    return Array.from({ length: 12 }, (_, indice) => {
      const dataMes = new Date(anoAtual, indice, 1);
      const chave = `${anoAtual}-${String(indice + 1).padStart(2, '0')}`;
      const baseMes = transacoesFiltradas.filter((item) => item.dataEfetivacao.startsWith(chave));

      return {
        mes: formatarMesPorIdioma(dataMes),
        despesas: baseMes.filter((item) => item.tipo === 'despesa').reduce((acc, item) => acc + item.valor, 0),
        receitas: baseMes.filter((item) => item.tipo === 'receita').reduce((acc, item) => acc + item.valor, 0),
        reembolsos: baseMes.filter((item) => item.tipo === 'reembolso').reduce((acc, item) => acc + item.valor, 0),
        estornos: baseMes.filter((item) => item.tipo === 'estorno').reduce((acc, item) => acc + item.valor, 0),
      };
    });
  }, [transacoesFiltradas]);

  const reordenarWidget = (origem: WidgetId, destino: WidgetId) => {
    if (origem === destino) return;
    setOrdemWidgets((atual) => {
      const semOrigem = atual.filter((item) => item !== origem);
      const indiceDestino = semOrigem.indexOf(destino);
      if (indiceDestino < 0) return atual;
      const nova = [...semOrigem];
      nova.splice(indiceDestino, 0, origem);
      return nova;
    });
  };

  const moverWidget = (id: WidgetId, direcao: 'cima' | 'baixo') => {
    setOrdemWidgets((atual) => {
      const indice = atual.indexOf(id);
      if (indice < 0) return atual;
      const alvo = direcao === 'cima' ? indice - 1 : indice + 1;
      if (alvo < 0 || alvo >= atual.length) return atual;
      const nova = [...atual];
      [nova[indice], nova[alvo]] = [nova[alvo], nova[indice]];
      return nova;
    });
  };

  const alternarSerieAnual = (serie: keyof typeof seriesVisiveis) => {
    setSeriesVisiveis((atual) => {
      const proximo = { ...atual, [serie]: !atual[serie] };
      const algumaAtiva = Object.values(proximo).some(Boolean);
      return algumaAtiva ? proximo : atual;
    });
  };

  const renderCardResumo = (titulo: string, valor: string, cor: string) => (
    <View style={{ flex: width > 1100 ? 1 : undefined, minWidth: width > 1100 ? 0 : 180, backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 14 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>{titulo}</Text>
      <Text style={{ color: cor, fontSize: 20, fontWeight: '700' }}>{valor}</Text>
    </View>
  );


  const renderWidgetCarregando = () => (
    <View style={{ gap: 10 }}>
      <EsqueletoCarregamento altura={18} largura="42%" estilo={{ marginBottom: 2 }} />
      <EsqueletoCarregamento altura={14} largura="68%" />
      <EsqueletoCarregamento altura={14} largura="58%" />
      <View style={{ marginTop: 4 }}>
        <EsqueletoCarregamento altura={160} largura="100%" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <EsqueletoCarregamento altura={34} largura="32%" />
        <EsqueletoCarregamento altura={34} largura="32%" />
        <EsqueletoCarregamento altura={34} largura="32%" />
      </View>
    </View>
  );
  const renderAreaSubareaWidget = (
    titulo: string,
    descricao: string,
    corTitulo: string,
    dados: PieAreaItem[],
    indiceSelecionado: number,
    aoSelecionar: (indice: number) => void,
  ) => {
    const radius = width > 1280 ? 112 : width > 960 ? 102 : 92;
    const innerRadius = width > 1280 ? 62 : width > 960 ? 56 : 50;

    return (
      <View>
        <Text style={{ color: corTitulo, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>{titulo}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 12 }}>{descricao}</Text>

        <View
          style={{
            backgroundColor: COLORS.bgSecondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            padding: 12,
            flexDirection: width > 980 ? 'row' : 'column',
            alignItems: width > 980 ? 'stretch' : 'center',
            justifyContent: 'flex-start',
            gap: width > 980 ? 28 : 12,
          }}
        >
          {dados.length > 0 ? (
            <>
              <View
                style={{
                  flex: width > 980 ? 1 : undefined,
                  width: width > 980 ? undefined : '100%',
                  minWidth: width > 980 ? 0 : undefined,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 0,
                }}
              >
                <PieChart
                  data={dados}
                  donut
                  selectedIndex={indiceSelecionado}
                  setSelectedIndex={aoSelecionar}
                  focusedPieIndex={indiceSelecionado}
                  onPress={(_: unknown, index: number) => aoSelecionar(index)}
                  radius={radius}
                  innerRadius={innerRadius}
                  innerCircleColor={COLORS.bgTertiary}
                  strokeColor={COLORS.bgSecondary}
                  strokeWidth={2}
                  focusOnPress
                  toggleFocusOnPress={false}
                  showTooltip
                  persistTooltip
                  tooltipDuration={999999}
                  tooltipWidth={150}
                  tooltipTextNoOfLines={2}
                  tooltipBackgroundColor="transparent"
                  tooltipBorderRadius={8}
                  tooltipHorizontalShift={width > 980 ? -2 : 0}
                  tooltipVerticalShift={8}
                  paddingHorizontal={width > 980 ? 34 : 24}
                  paddingVertical={28}
                  isAnimated
                  animationDuration={650}
                />
              </View>

              <ScrollView
                style={{
                  width: width > 980 ? 280 : '100%',
                  maxWidth: width > 980 ? 280 : 460,
                  maxHeight: 260,
                  marginLeft: width > 980 ? 'auto' : 0,
                  alignSelf: width > 980 ? 'flex-start' : 'stretch',
                }}
                contentContainerStyle={{ gap: 6 }}
                showsVerticalScrollIndicator
              >
                {dados.map((item, indice) => (
                  <View
                    key={`${titulo}-${item.area}-${item.subarea}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 7,
                      paddingHorizontal: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: indice === indiceSelecionado ? item.color : COLORS.borderColor,
                      backgroundColor: indice === indiceSelecionado ? COLORS.bgHover : COLORS.bgTertiary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: item.color }} />
                      <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 10, fontWeight: indice === indiceSelecionado ? '700' : '500', flexShrink: 1 }}>
                        {item.area} / {item.subarea}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.widgetGraficoInfo')}</Text>
          )}
        </View>
      </View>
    );
  };

  const obterTituloWidget = (id: WidgetId) => {
    if (id === 'graficoReceitasAreaSubarea') return `${t('dashboard.cards.receitas')} - ${t('dashboard.graficoAreaSubarea')}`;
    if (id === 'graficoDespesasAreaSubarea') return `${t('dashboard.cards.despesas')} - ${t('dashboard.graficoAreaSubarea')}`;
    return t(`dashboard.widgets.${id}`);
  };

  const renderWidget = (id: WidgetId) => {
    if (id === 'resumo') {
      return (
        <View>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>{t('dashboard.resumoFinanceiro')}</Text>
          <View style={{ flexDirection: width > 1100 ? 'row' : 'column', gap: 10 }}>
            {renderCardResumo(t('dashboard.cards.receitas'), formatarValorPorIdioma(resumo.totalReceitas), COLORS.success)}
            {renderCardResumo(t('dashboard.cards.despesas'), formatarValorPorIdioma(resumo.totalDespesas), COLORS.error)}
            {renderCardResumo(t('dashboard.cards.reembolsos'), formatarValorPorIdioma(resumo.totalReembolsos), COLORS.info)}
            {renderCardResumo(t('dashboard.cards.estornos'), formatarValorPorIdioma(resumo.totalEstornos), COLORS.warning)}
            {renderCardResumo(t('dashboard.cards.saldo'), formatarValorPorIdioma(resumo.saldo), resumo.saldo >= 0 ? COLORS.success : COLORS.error)}
          </View>
        </View>
      );
    }

    if (id === 'graficoReceitasAreaSubarea') {
      return renderAreaSubareaWidget(
        `${t('dashboard.cards.receitas')} - ${t('dashboard.graficoAreaSubarea')}`,
        t('dashboard.graficoAreaSubareaDescricao'),
        COLORS.success,
        dadosPieAreaSubareaReceitas,
        indiceReceitaSelecionada,
        setIndiceReceitaSelecionada,
      );
    }

    if (id === 'graficoDespesasAreaSubarea') {
      return renderAreaSubareaWidget(
        `${t('dashboard.cards.despesas')} - ${t('dashboard.graficoAreaSubarea')}`,
        t('dashboard.graficoAreaSubareaDescricao'),
        COLORS.error,
        dadosPieAreaSubareaDespesas,
        indiceDespesaSelecionada,
        setIndiceDespesaSelecionada,
      );
    }

    if (id === 'graficoAnual') {
      const dadosReceitas = dadosAnuais.map((item) => ({ value: Number(item.receitas.toFixed(2)), label: item.mes }));
      const dadosDespesas = dadosAnuais.map((item) => ({ value: Number(item.despesas.toFixed(2)), label: item.mes }));
      const dadosReembolsos = dadosAnuais.map((item) => ({ value: Number(item.reembolsos.toFixed(2)), label: item.mes }));
      const dadosEstornos = dadosAnuais.map((item) => ({ value: Number(item.estornos.toFixed(2)), label: item.mes }));
      const legendaSeries = [
        { chave: 'receitas' as const, cor: COLORS.success, titulo: t('dashboard.cards.receitas') },
        { chave: 'despesas' as const, cor: COLORS.error, titulo: t('dashboard.cards.despesas') },
        { chave: 'reembolsos' as const, cor: COLORS.info, titulo: t('dashboard.cards.reembolsos') },
        { chave: 'estornos' as const, cor: COLORS.warning, titulo: t('dashboard.cards.estornos') },
      ];
      const espacamentoGraficoAnual = Math.max(
        (larguraPlotGraficoAnual - 8) / Math.max(dadosAnuais.length - 1, 1),
        14,
      );

      return (
        <View>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>{t('dashboard.graficoAnual')}</Text>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {legendaSeries.map((serie) => (
                <TouchableOpacity
                  key={serie.chave}
                  onPress={() => alternarSerieAnual(serie.chave)}
                  testID={`dashboard-serie-${serie.chave}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: seriesVisiveis[serie.chave] ? serie.cor : COLORS.borderColor,
                    backgroundColor: seriesVisiveis[serie.chave] ? COLORS.bgHover : COLORS.bgTertiary,
                    opacity: seriesVisiveis[serie.chave] ? 1 : 0.6,
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: serie.cor }} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{serie.titulo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              testID="dashboard-grafico-anual"
              onLayout={(evento) => {
                const larguraMedida = evento.nativeEvent.layout.width;
                if (Math.abs(larguraMedida - larguraGraficoAnualDisponivel) > 2) {
                  setLarguraGraficoAnualDisponivel(larguraMedida);
                }
              }}
              style={{ width: '100%' }}
            >
              <LineChart
                data={dadosReceitas}
                data2={dadosDespesas}
                data3={dadosReembolsos}
                data4={dadosEstornos}
                parentWidth={larguraContainerGraficoAnual}
                width={larguraPlotGraficoAnual}
                height={280}
                spacing={espacamentoGraficoAnual}
                initialSpacing={0}
                endSpacing={0}
                adjustToWidth
                curved
                isAnimated
                animationDuration={700}
                noOfSections={4}
                disableScroll
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={COLORS.borderColor}
                rulesColor={COLORS.borderColor}
                yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 11 }}
                xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 11 }}
                color1={COLORS.success}
                color2={COLORS.error}
                color3={COLORS.info}
                color4={COLORS.warning}
                thickness1={seriesVisiveis.receitas ? 3 : 0}
                thickness2={seriesVisiveis.despesas ? 3 : 0}
                thickness3={seriesVisiveis.reembolsos ? 3 : 0}
                thickness4={seriesVisiveis.estornos ? 3 : 0}
                dataPointsColor1={COLORS.success}
                dataPointsColor2={COLORS.error}
                dataPointsColor3={COLORS.info}
                dataPointsColor4={COLORS.warning}
                dataPointsRadius1={3}
                dataPointsRadius2={3}
                dataPointsRadius3={3}
                dataPointsRadius4={3}
                hideDataPoints1={!seriesVisiveis.receitas}
                hideDataPoints2={!seriesVisiveis.despesas}
                hideDataPoints3={!seriesVisiveis.reembolsos}
                hideDataPoints4={!seriesVisiveis.estornos}
                startFillColor1={COLORS.success}
                endFillColor1={COLORS.success}
                startFillColor2={COLORS.error}
                endFillColor2={COLORS.error}
                startFillColor3={COLORS.info}
                endFillColor3={COLORS.info}
                startFillColor4={COLORS.warning}
                endFillColor4={COLORS.warning}
                startOpacity1={seriesVisiveis.receitas ? 0.16 : 0}
                endOpacity1={seriesVisiveis.receitas ? 0.03 : 0}
                startOpacity2={seriesVisiveis.despesas ? 0.12 : 0}
                endOpacity2={seriesVisiveis.despesas ? 0.02 : 0}
                startOpacity3={seriesVisiveis.reembolsos ? 0.12 : 0}
                endOpacity3={seriesVisiveis.reembolsos ? 0.02 : 0}
                startOpacity4={seriesVisiveis.estornos ? 0.12 : 0}
                endOpacity4={seriesVisiveis.estornos ? 0.02 : 0}
                areaChart={seriesVisiveis.receitas}
                areaChart2={seriesVisiveis.despesas}
                areaChart3={seriesVisiveis.reembolsos}
                areaChart4={seriesVisiveis.estornos}
                pointerConfig={{
                  activatePointersOnLongPress: false,
                  activatePointersInstantlyOnTouch: true,
                  persistPointer: true,
                  showPointerStrip: true,
                  pointerStripColor: COLORS.borderAccent,
                  pointerStripWidth: 1,
                  stripOverPointer: true,
                  pointerColor: COLORS.accent,
                  radius: 4,
                  pointerLabelWidth: 180,
                  pointerLabelHeight: 120,
                  shiftPointerLabelY: -8,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items: any[]) => {
                    const mes = items?.find((item) => item?.label)?.label ?? '';
                    const receita = seriesVisiveis.receitas ? (items?.[0]?.value ?? 0) : null;
                    const despesa = seriesVisiveis.despesas ? (items?.[1]?.value ?? 0) : null;
                    const reembolso = seriesVisiveis.reembolsos ? (items?.[2]?.value ?? 0) : null;
                    const estorno = seriesVisiveis.estornos ? (items?.[3]?.value ?? 0) : null;

                    return (
                      <View style={{ backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minWidth: 170 }}>
                        <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>{mes}</Text>
                        {receita !== null ? <Text style={{ color: COLORS.success, fontSize: 10 }}>{t('dashboard.cards.receitas')}: {formatarValorPorIdioma(receita)}</Text> : null}
                        {despesa !== null ? <Text style={{ color: COLORS.error, fontSize: 10, marginTop: 2 }}>{t('dashboard.cards.despesas')}: {formatarValorPorIdioma(despesa)}</Text> : null}
                        {reembolso !== null ? <Text style={{ color: COLORS.info, fontSize: 10, marginTop: 2 }}>{t('dashboard.cards.reembolsos')}: {formatarValorPorIdioma(reembolso)}</Text> : null}
                        {estorno !== null ? <Text style={{ color: COLORS.warning, fontSize: 10, marginTop: 2 }}>{t('dashboard.cards.estornos')}: {formatarValorPorIdioma(estorno)}</Text> : null}
                      </View>
                    );
                  },
                }}
              />
            </View>
          </View>
        </View>
      );
    }

    if (id === 'balancoGeral') {
      return (
        <View>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>{t('dashboard.balancoGeral')}</Text>
          <View style={{ flexDirection: width > 1100 ? 'row' : 'column', gap: 12 }}>
            {contasCartoes.map((item) => (
              <View key={item.id} style={{ flex: width > 1100 ? 1 : undefined, backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, padding: 14 }}>
                <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{item.nome}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>{item.tipo === 'conta' ? t('dashboard.tiposBalanco.conta') : t('dashboard.tiposBalanco.cartao')}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 10 }}>{item.subtitulo}</Text>
                <Text style={{ color: item.saldo >= 0 ? COLORS.success : COLORS.error, fontSize: 20, fontWeight: '700', marginTop: 6 }}>{formatarValorPorIdioma(item.saldo)}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>{t('dashboard.ultimasTransacoes')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: 1260 }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingBottom: 8, marginBottom: 8 }}>
              <Text style={{ width: 90, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.id')}</Text>
              <Text style={{ width: 130, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.tipo')}</Text>
              <Text style={{ width: 120, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.valor')}</Text>
              <Text style={{ width: 210, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.descricao')}</Text>
              <Text style={{ width: 130, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.dataEfetivacao')}</Text>
              <Text style={{ width: 160, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.tipoPagamento')}</Text>
              <Text style={{ width: 180, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.contaBancaria')}</Text>
              <Text style={{ width: 170, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.cartao')}</Text>
              <Text style={{ width: 170, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.areaSubarea')}</Text>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {transacoesFiltradas.slice(0, 100).map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingVertical: 8 }}>
                  <Text style={{ width: 90, color: COLORS.textPrimary, fontSize: 12 }}>#{item.id}</Text>
                  <Text style={{ width: 130, color: COLORS.textPrimary, fontSize: 12 }}>{t(`dashboard.tipos.${item.tipo}`)}</Text>
                  <Text style={{ width: 120, color: item.tipo === 'despesa' ? COLORS.error : COLORS.success, fontSize: 12, fontWeight: '600' }}>{formatarValorPorIdioma(item.valor)}</Text>
                  <Text style={{ width: 210, color: COLORS.textPrimary, fontSize: 12 }}>{item.descricao}</Text>
                  <Text style={{ width: 130, color: COLORS.textPrimary, fontSize: 12 }}>{formatarDataPorIdioma(item.dataEfetivacao)}</Text>
                  <Text style={{ width: 160, color: COLORS.textPrimary, fontSize: 12 }}>{item.tipoPagamento}</Text>
                  <Text style={{ width: 180, color: COLORS.textPrimary, fontSize: 12 }}>{item.contaBancaria ?? '-'}</Text>
                  <Text style={{ width: 170, color: COLORS.textPrimary, fontSize: 12 }}>{item.codigoPagamento === 'CARTAO_CREDITO' ? item.cartao ?? '-' : '-'}</Text>
                  <Text style={{ width: 170, color: COLORS.textPrimary, fontSize: 12 }}>{item.area} / {item.subarea}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <Cabecalho titulo={t('dashboard.titulo')} />

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <View style={{ backgroundColor: COLORS.bgTertiary, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, marginBottom: 16 }}>
          <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{t('dashboard.globalTitle')}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>{t('dashboard.globalDescription')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/principal/documentacao')}
            style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{t('documentacao.acao')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{t('dashboard.reordenarHint')}</Text>

        <View style={{ gap: 12 }}>
          {ordemWidgets.map((id, index) => {
            const webProps: any =
              Platform.OS === 'web'
                ? {
                    draggable: true,
                    onDragStart: (event: any) => {
                      event.dataTransfer?.setData('text/plain', id);
                      event.dataTransfer?.setData('application/widget-id', id);
                      event.dataTransfer!.effectAllowed = 'move';
                      setWidgetArrastando(id);
                    },
                    onDragOver: (event: any) => {
                      event.preventDefault();
                      if (event.dataTransfer) {
                        event.dataTransfer.dropEffect = 'move';
                      }
                    },
                    onDragEnd: () => setWidgetArrastando(null),
                    onDrop: (event: any) => {
                      event.preventDefault();
                      const origem =
                        event.dataTransfer?.getData('application/widget-id') ||
                        event.dataTransfer?.getData('text/plain') ||
                        widgetArrastando;
                      if (origem) reordenarWidget(origem as WidgetId, id);
                      setWidgetArrastando(null);
                    },
                  }
                : {};

            return (
              <View key={id} {...webProps} testID={`dashboard-widget-${id}`} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: widgetArrastando === id ? COLORS.borderAccent : COLORS.borderColor, borderRadius: 12, padding: 14, opacity: widgetArrastando === id ? 0.72 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' }}>
                    {t('dashboard.widget')}: {obterTituloWidget(id)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity testID={`dashboard-widget-${id}-cima`} onPress={() => moverWidget(id, 'cima')} disabled={index === 0} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: index === 0 ? COLORS.bgTertiary : COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor }}>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2191'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`dashboard-widget-${id}-baixo`} onPress={() => moverWidget(id, 'baixo')} disabled={index === ordemWidgets.length - 1} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: index === ordemWidgets.length - 1 ? COLORS.bgTertiary : COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor }}>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2193'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {carregando ? renderWidgetCarregando() : renderWidget(id)}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}


