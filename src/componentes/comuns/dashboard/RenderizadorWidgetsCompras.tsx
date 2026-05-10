import { type ReactElement, useState } from 'react';
import { type DimensionValue, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GraficoLinhaAnualSvg,
  type SerieGraficoLinhaAnual,
} from './GraficoLinhaAnualSvg';
import { GraficoRoscaCategoriasSvg } from './GraficoRoscaCategoriasSvg';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../utils/formatacaoLocale';
import { COLORS } from '../../../styles/variables';

export type IdWidgetCompras =
  | 'comprasResumoRapido'
  | 'comprasEvolucaoMensal'
  | 'comprasTipos'
  | 'comprasProdutosTop'
  | 'comprasUltimasCompras'
  | 'comprasUltimosDesejos'
  | 'comprasVariacaoPrecos'
  | 'comprasEconomiaPotencial';

type PesoFonte = '400' | '500' | '600' | '700';
type Traduzir = (chave: string, opcoes?: Record<string, string>) => string;

interface ResumoComprasKpi {
  totalGastoMes: number;
  planejamentosAtivos: number;
  itensCompradosMes: number;
  desejosPendentes: number;
  economiaPotencialMes: number;
  possuiEconomiaPotencial: boolean;
}

interface EvolucaoMensalComprasItem {
  chaveMes: string;
  rotuloMes: string;
  valorTotal: number;
  quantidadeItens: number;
  listasFinalizadas: number;
}

interface TipoCompraAgregado {
  rotulo: string;
  valorTotal: number;
  percentual: number;
  quantidadeItens: number;
}

interface ProdutoCompradoAgregado {
  descricao: string;
  quantidade: number;
}

interface ItemCompraRecente {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  planejamento: string;
  corMarcador: string;
}

interface DesejoRecenteItem {
  id: string;
  descricao: string;
  valorEstimado: number;
  data: string;
  status: 'pendente' | 'convertido';
}

interface VariacaoPrecoItem {
  id: string;
  produto: string;
  ultimoPreco: number;
  menorPreco: number;
  maiorPreco: number;
  mediaPreco: number;
  percentualVariacao: number;
  potencialEconomiaUnitaria: number;
}

interface EconomiaPotencialProduto {
  id: string;
  produto: string;
  economiaUnitaria: number;
  ultimoPreco: number;
  menorPreco: number;
}

interface ParametrosValorMonetario {
  valor: number;
  cor: string;
  tamanhoFonte: number;
  pesoFonte: PesoFonte;
  deveAnimar: boolean;
  margemTopo?: number;
}

interface ParametrosNumeroAnimado {
  valor: number;
  cor: string;
  tamanhoFonte: number;
  pesoFonte: PesoFonte;
  deveAnimar: boolean;
}

interface RenderizadorWidgetsComprasProps {
  idWidget: IdWidgetCompras;
  larguraTela: number;
  carregandoCompras: boolean;
  erroCompras: boolean;
  aoTentarNovamente: () => void;
  traduzir: Traduzir;
  resumoComprasKpi: ResumoComprasKpi;
  evolucaoMensalCompras: EvolucaoMensalComprasItem[];
  tiposComprasAgregados: TipoCompraAgregado[];
  produtosMaisComprados: ProdutoCompradoAgregado[];
  ultimasCompras: ItemCompraRecente[];
  ultimosDesejos: DesejoRecenteItem[];
  variacoesPrecos: VariacaoPrecoItem[];
  produtosComMelhorEconomia: EconomiaPotencialProduto[];
  economiaPotencialTotal: number;
  renderizarValorMonetario: (parametros: ParametrosValorMonetario) => ReactElement;
  renderizarNumeroAnimado: (parametros: ParametrosNumeroAnimado) => ReactElement;
}

const LIMITE_ITENS_LISTA = 6;
const PALETA_CATEGORIAS_DISTINTAS = [
  '#06b6d4',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#3b82f6',
  '#84cc16',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#4ade80',
  '#38bdf8',
  '#f43f5e',
  '#a855f7',
  '#eab308',
  '#10b981',
];
const ANGULO_AUREO_CATEGORIAS = 137.508;

const ESTILO_CARTAO_BASE = {
  backgroundColor: COLORS.bgSecondary,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: COLORS.borderColor,
} as const;

function formatarPercentual(valor: number): string {
  return `${Number(valor || 0).toFixed(Math.abs(valor) >= 10 ? 0 : 1)}%`;
}

function limitarPercentual(valor: number): number {
  return Math.min(Math.max(valor, 0), 100);
}

function formatarPercentualDimensao(valor: number): DimensionValue {
  return `${valor}%` as DimensionValue;
}

function obterCorCategoriaDistinta(indice: number): string {
  const corPaleta = PALETA_CATEGORIAS_DISTINTAS[indice];
  if (corPaleta) return corPaleta;
  const matiz = Math.round((indice * ANGULO_AUREO_CATEGORIAS + 196) % 360);
  return `hsl(${matiz}, 72%, 54%)`;
}

function renderizarEstadoVazio(traduzir: Traduzir): ReactElement {
  return (
    <View
      style={{
        ...ESTILO_CARTAO_BASE,
        paddingVertical: 18,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.textSecondary }} />
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>{traduzir('dashboard.compras.semDados')}</Text>
    </View>
  );
}

function renderizarEstadoCarregando(): ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ ...ESTILO_CARTAO_BASE, height: 16, opacity: 0.5 }} />
      <View style={{ ...ESTILO_CARTAO_BASE, height: 76, opacity: 0.36 }} />
      <View style={{ ...ESTILO_CARTAO_BASE, height: 76, opacity: 0.26 }} />
    </View>
  );
}

interface CartaoMetricaProps {
  titulo: string;
  conteudo: ReactElement;
  icone?: keyof typeof MaterialCommunityIcons.glyphMap;
  corIcone?: string;
  subtitulo?: string;
  largura?: DimensionValue;
}

function CartaoMetrica({ titulo, conteudo, icone, corIcone = COLORS.accent, subtitulo, largura = '100%' }: CartaoMetricaProps): ReactElement {
  return (
    <View
      style={{
        width: largura,
        minWidth: 170,
        ...ESTILO_CARTAO_BASE,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: COLORS.bgTertiary,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 }}>{titulo}</Text>
        {icone ? (
          <View style={{ width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor }}>
            <MaterialCommunityIcons name={icone} size={12} color={corIcone} />
          </View>
        ) : null}
      </View>
      {conteudo}
      {subtitulo ? <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>{subtitulo}</Text> : null}
    </View>
  );
}

interface BarraHorizontalProps {
  percentual: number;
  cor?: string;
}

function BarraHorizontal({ percentual, cor = COLORS.accent }: BarraHorizontalProps): ReactElement {
  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: COLORS.bgPrimary, overflow: 'hidden', marginTop: 8 }}>
      <View
        style={{
          width: formatarPercentualDimensao(limitarPercentual(percentual)),
          height: '100%',
          borderRadius: 999,
          backgroundColor: cor,
        }}
      />
    </View>
  );
}

function SparklinePreco({
  minimo,
  medio,
  maximo,
  cor,
}: {
  minimo: number;
  medio: number;
  maximo: number;
  cor: string;
}): ReactElement {
  const base = Math.max(maximo, minimo, medio, 1);
  const larguraMin = formatarPercentualDimensao(Math.max((minimo / base) * 100, 10));
  const larguraMed = formatarPercentualDimensao(Math.max((medio / base) * 100, 10));
  const larguraMax = formatarPercentualDimensao(Math.max((maximo / base) * 100, 10));

  return (
    <View style={{ gap: 4, marginTop: 8 }}>
      <View style={{ height: 4, borderRadius: 999, backgroundColor: COLORS.bgPrimary }}>
        <View style={{ width: larguraMin, height: '100%', borderRadius: 999, backgroundColor: `${cor}88` }} />
      </View>
      <View style={{ height: 4, borderRadius: 999, backgroundColor: COLORS.bgPrimary }}>
        <View style={{ width: larguraMed, height: '100%', borderRadius: 999, backgroundColor: `${cor}bb` }} />
      </View>
      <View style={{ height: 4, borderRadius: 999, backgroundColor: COLORS.bgPrimary }}>
        <View style={{ width: larguraMax, height: '100%', borderRadius: 999, backgroundColor: cor }} />
      </View>
    </View>
  );
}

function obterCorPosicaoRanking(indice: number): string {
  if (indice === 0) return COLORS.warning;
  if (indice === 1) return COLORS.info;
  if (indice === 2) return COLORS.success;
  return COLORS.textSecondary;
}

export function RenderizadorWidgetsCompras({
  idWidget,
  larguraTela,
  carregandoCompras,
  erroCompras,
  aoTentarNovamente,
  traduzir,
  resumoComprasKpi,
  evolucaoMensalCompras,
  tiposComprasAgregados,
  produtosMaisComprados,
  ultimasCompras,
  ultimosDesejos,
  variacoesPrecos,
  produtosComMelhorEconomia,
  economiaPotencialTotal,
  renderizarValorMonetario,
  renderizarNumeroAnimado,
}: RenderizadorWidgetsComprasProps): ReactElement {
  const larguraCardLista = larguraTela >= 1500 ? '32.2%' : larguraTela >= 1080 ? '49.2%' : '100%';
  const larguraCardKpi = larguraTela >= 1500 ? '19.2%' : larguraTela >= 1080 ? '32.6%' : larguraTela >= 760 ? '49.2%' : '100%';
  const [larguraRenderGraficoEvolucao, setLarguraRenderGraficoEvolucao] = useState(0);
  const [indiceCategoriaAtiva, setIndiceCategoriaAtiva] = useState(0);
  const [indiceProdutoAtivo, setIndiceProdutoAtivo] = useState(0);

  if (carregandoCompras) {
    return renderizarEstadoCarregando();
  }

  if (erroCompras) {
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ color: COLORS.error, fontSize: 12 }}>{traduzir('dashboard.compras.erroCarregamento')}</Text>
        <TouchableOpacity
          onPress={aoTentarNovamente}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: COLORS.accentSubtle,
            borderColor: COLORS.borderAccent,
            borderRadius: 8,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{traduzir('compras.acoes.recarregar')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (idWidget === 'comprasResumoRapido') {
    return (
      <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.totalGastoMes')}
          icone="cash-multiple"
          corIcone={COLORS.accent}
          largura={larguraCardKpi}
          conteudo={renderizarValorMonetario({
            valor: resumoComprasKpi.totalGastoMes,
            cor: COLORS.accent,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.planejamentosAtivos')}
          icone="clipboard-check-outline"
          corIcone={COLORS.info}
          largura={larguraCardKpi}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.planejamentosAtivos,
            cor: COLORS.textPrimary,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.itensCompradosMes')}
          icone="basket-check-outline"
          corIcone={COLORS.success}
          largura={larguraCardKpi}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.itensCompradosMes,
            cor: COLORS.success,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.desejosPendentes')}
          icone="heart-outline"
          corIcone={COLORS.warning}
          largura={larguraCardKpi}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.desejosPendentes,
            cor: COLORS.warning,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.economiaPotencialMes')}
          icone="trending-down"
          corIcone={COLORS.success}
          largura={larguraCardKpi}
          conteudo={renderizarValorMonetario({
            valor: resumoComprasKpi.economiaPotencialMes,
            cor: resumoComprasKpi.possuiEconomiaPotencial ? COLORS.success : COLORS.textSecondary,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
        />
      </View>
    );
  }

  if (idWidget === 'comprasEvolucaoMensal') {
    if (!evolucaoMensalCompras.some((item) => item.valorTotal > 0 || item.quantidadeItens > 0 || item.listasFinalizadas > 0)) {
      return renderizarEstadoVazio(traduzir);
    }

    const indiceMesAtual = new Date().getMonth();
    const maiorMes = evolucaoMensalCompras.reduce((atual, item) => (item.valorTotal > atual.valorTotal ? item : atual), evolucaoMensalCompras[0]);
    const menorMes = evolucaoMensalCompras.reduce((atual, item) => (item.valorTotal < atual.valorTotal ? item : atual), evolucaoMensalCompras[0]);
    const totalValor = evolucaoMensalCompras.reduce((soma, item) => soma + item.valorTotal, 0);
    const mediaMensal = totalValor / Math.max(evolucaoMensalCompras.length, 1);
    const valorMesAtual = evolucaoMensalCompras[indiceMesAtual]?.valorTotal ?? 0;
    const valorMesAnterior = indiceMesAtual > 0 ? evolucaoMensalCompras[indiceMesAtual - 1]?.valorTotal ?? 0 : 0;
    const diferencaMesAnterior = valorMesAtual - valorMesAnterior;
    const percentualMesAnterior = valorMesAnterior > 0 ? (diferencaMesAnterior / valorMesAnterior) * 100 : valorMesAtual > 0 ? 100 : 0;
    const tendenciaMes = diferencaMesAnterior > 0 ? 'alta' : diferencaMesAnterior < 0 ? 'baixa' : 'estavel';
    const corTendenciaMes = tendenciaMes === 'alta' ? COLORS.error : tendenciaMes === 'baixa' ? COLORS.success : COLORS.textSecondary;
    const alturaGrafico = larguraTela >= 1400 ? 236 : larguraTela >= 1024 ? 220 : larguraTela >= 768 ? 202 : 184;
    const larguraGrafico = larguraRenderGraficoEvolucao > 0
      ? Math.max(larguraRenderGraficoEvolucao - 4, 220)
      : Math.max(larguraTela - (larguraTela < 768 ? 72 : 112), 220);
    const seriesGrafico: SerieGraficoLinhaAnual[] = [
      {
        chave: 'valor',
        rotulo: traduzir('dashboard.colunas.valor'),
        cor: COLORS.accent,
        valores: evolucaoMensalCompras.map((item) => Number(item.valorTotal.toFixed(2))),
        preencherArea: true,
        espessuraLinha: 3,
        opacidadeInicioArea: 0.18,
        opacidadeFimArea: 0.02,
      },
    ];
    const totalItens = evolucaoMensalCompras.reduce((soma, item) => soma + item.quantidadeItens, 0);
    const totalListas = evolucaoMensalCompras.reduce((soma, item) => soma + item.listasFinalizadas, 0);
    const larguraCardResumoAnual = larguraTela >= 1360 ? '24.2%' : larguraTela >= 920 ? '49.2%' : '100%';

    return (
      <View style={{ width: '100%', gap: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <CartaoMetrica
            titulo={traduzir('dashboard.compras.totalAnual')}
            icone="cash-multiple"
            corIcone={COLORS.accent}
            largura={larguraCardResumoAnual}
            conteudo={renderizarValorMonetario({
              valor: totalValor,
              cor: COLORS.accent,
              tamanhoFonte: 18,
              pesoFonte: '700',
              deveAnimar: true,
              margemTopo: 6,
            })}
          />
          <CartaoMetrica
            titulo={traduzir('dashboard.compras.mediaMensal')}
            icone="chart-line"
            corIcone={COLORS.info}
            largura={larguraCardResumoAnual}
            conteudo={renderizarValorMonetario({
              valor: mediaMensal,
              cor: COLORS.info,
              tamanhoFonte: 18,
              pesoFonte: '700',
              deveAnimar: true,
              margemTopo: 6,
            })}
          />
          <CartaoMetrica
            titulo={traduzir('dashboard.compras.maiorMes')}
            icone="trending-up"
            corIcone={COLORS.success}
            largura={larguraCardResumoAnual}
            conteudo={renderizarValorMonetario({
              valor: maiorMes?.valorTotal ?? 0,
              cor: COLORS.success,
              tamanhoFonte: 18,
              pesoFonte: '700',
              deveAnimar: true,
              margemTopo: 6,
            })}
            subtitulo={maiorMes?.rotuloMes ?? '-'}
          />
          <CartaoMetrica
            titulo={traduzir('dashboard.compras.menorMes')}
            icone="trending-down"
            corIcone={COLORS.warning}
            largura={larguraCardResumoAnual}
            conteudo={renderizarValorMonetario({
              valor: menorMes?.valorTotal ?? 0,
              cor: COLORS.warning,
              tamanhoFonte: 18,
              pesoFonte: '700',
              deveAnimar: true,
              margemTopo: 6,
            })}
            subtitulo={menorMes?.rotuloMes ?? '-'}
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ ...ESTILO_CARTAO_BASE, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>{formatarValorPorIdioma(totalValor)}</Text>
          </View>
          <View style={{ ...ESTILO_CARTAO_BASE, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '700' }}>
              {traduzir('dashboard.compras.quantidadeItens', { quantidade: String(totalItens) })}
            </Text>
          </View>
          <View style={{ ...ESTILO_CARTAO_BASE, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: COLORS.info, fontSize: 11, fontWeight: '700' }}>
              {traduzir('dashboard.compras.quantidadeListas', { quantidade: String(totalListas) })}
            </Text>
          </View>
          <View style={{ ...ESTILO_CARTAO_BASE, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: corTendenciaMes, fontSize: 11, fontWeight: '700' }}>
              {traduzir('dashboard.compras.variacaoMesAnterior', {
                variacao: formatarPercentual(percentualMesAnterior),
                tendencia: traduzir(`dashboard.compras.tendencia.${tendenciaMes}`),
              })}
            </Text>
          </View>
          <View style={{ ...ESTILO_CARTAO_BASE, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: COLORS.warning, fontSize: 11, fontWeight: '700' }}>
              {traduzir('dashboard.compras.mesAtualDestaque', {
                mes: evolucaoMensalCompras[indiceMesAtual]?.rotuloMes ?? '-',
              })}
            </Text>
          </View>
        </View>

        <View
          style={{ width: '100%' }}
          onLayout={(evento) => {
            const proximaLargura = Math.round(evento.nativeEvent.layout.width);
            if (Math.abs(proximaLargura - larguraRenderGraficoEvolucao) > 2) {
              setLarguraRenderGraficoEvolucao(proximaLargura);
            }
          }}
        >
          <View style={{ width: '100%', backgroundColor: COLORS.bgSecondary, borderRadius: 12, paddingTop: 10, paddingBottom: 6, paddingHorizontal: 2, overflow: 'hidden' }}>
            <GraficoLinhaAnualSvg
              testID="compras-grafico-anual-svg"
              largura={larguraGrafico}
              altura={alturaGrafico}
              rotulosEixoX={evolucaoMensalCompras.map((item) => item.rotuloMes)}
              series={seriesGrafico}
              indiceDestaque={indiceMesAtual}
              corIndiceDestaque={COLORS.warning}
              formatarValorEixoY={(valor) => String(Math.round(valor))}
              obterConteudoTooltip={(indice) => {
                const item = evolucaoMensalCompras[indice];
                if (!item) {
                  return {
                    titulo: '',
                    linhas: [],
                  };
                }
                return {
                  titulo: item.rotuloMes,
                  linhas: [
                    {
                      rotulo: traduzir('dashboard.colunas.valor'),
                      valor: formatarValorPorIdioma(item.valorTotal),
                      cor: COLORS.accent,
                    },
                    {
                      rotulo: traduzir('dashboard.compras.resumoMensal', {
                        itens: String(item.quantidadeItens),
                        listas: String(item.listasFinalizadas),
                      }),
                      valor: '',
                      cor: COLORS.textSecondary,
                    },
                  ],
                };
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  if (idWidget === 'comprasTipos') {
    if (!tiposComprasAgregados.length) return renderizarEstadoVazio(traduzir);

    const indiceCategoriaPrincipal = tiposComprasAgregados.reduce((indiceAtual, item, indice, lista) =>
      item.valorTotal > lista[indiceAtual].valorTotal ? indice : indiceAtual, 0);
    const indiceAtivoSeguro = Math.min(Math.max(indiceCategoriaAtiva, 0), tiposComprasAgregados.length - 1);
    const categoriaAtiva = tiposComprasAgregados[indiceAtivoSeguro] ?? tiposComprasAgregados[0];
    const dadosGrafico = tiposComprasAgregados.map((item, indice) => ({
      valor: Math.max(item.valorTotal, 0.01),
      color: obterCorCategoriaDistinta(indice),
    }));
    const tamanhoGrafico = larguraTela < 420 ? 194 : larguraTela < 768 ? 212 : larguraTela < 1080 ? 228 : 244;
    const espessuraGrafico = larguraTela < 480 ? 20 : 24;
    const diametroCentro = Math.max(tamanhoGrafico - espessuraGrafico * 2 - 12, 92);
    const totalCategorias = tiposComprasAgregados.reduce((soma, item) => soma + item.valorTotal, 0);
    const layoutColuna = larguraTela < 1080 || tiposComprasAgregados.length <= 1;

    return (
      <View style={{ width: '100%', gap: 10, flexDirection: layoutColuna ? 'column' : 'row', alignItems: layoutColuna ? 'stretch' : 'flex-start' }}>
        <View style={{ width: layoutColuna ? '100%' : '34%', minWidth: layoutColuna ? 0 : 290, alignItems: 'center', justifyContent: 'center', ...ESTILO_CARTAO_BASE, paddingVertical: 16, paddingHorizontal: 12 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <GraficoRoscaCategoriasSvg
              testID="compras-grafico-categorias-svg"
              largura={tamanhoGrafico}
              altura={tamanhoGrafico}
              segmentos={dadosGrafico.map((item) => ({
                valor: item.valor,
                cor: item.color,
              }))}
              indiceAtivo={indiceAtivoSeguro}
              espessuraAnel={espessuraGrafico}
              onSelecionarIndice={setIndiceCategoriaAtiva}
            />
            <View
              style={{
                position: 'absolute',
                width: diametroCentro,
                height: diametroCentro,
                borderRadius: 999,
                backgroundColor: COLORS.bgTertiary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: COLORS.borderColor,
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{categoriaAtiva.rotulo}</Text>
              {renderizarNumeroAnimado({
                valor: categoriaAtiva.percentual,
                cor: COLORS.accent,
                tamanhoFonte: 16,
                pesoFonte: '700',
                deveAnimar: true,
              })}
              <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 2 }}>{formatarValorPorIdioma(categoriaAtiva.valorTotal)}</Text>
            </View>
          </View>
          {tiposComprasAgregados[indiceCategoriaPrincipal] ? (
            <View style={{ marginTop: 12, width: '100%', ...ESTILO_CARTAO_BASE, backgroundColor: COLORS.bgTertiary, paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{traduzir('dashboard.compras.categoriaPrincipal')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 }}>
                <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>
                  {tiposComprasAgregados[indiceCategoriaPrincipal].rotulo}
                </Text>
                <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>
                  {formatarPercentual(tiposComprasAgregados[indiceCategoriaPrincipal].percentual)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={{ gap: 8, flex: 1 }}>
          {tiposComprasAgregados.map((item, indice) => (
            <TouchableOpacity
              key={item.rotulo}
              activeOpacity={0.86}
              onPress={() => setIndiceCategoriaAtiva(indice)}
              style={{
                ...ESTILO_CARTAO_BASE,
                padding: 10,
                borderColor: indice === indiceAtivoSeguro ? obterCorCategoriaDistinta(indice) : COLORS.borderColor,
                backgroundColor: indice === indiceAtivoSeguro ? COLORS.bgHover : COLORS.bgSecondary,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <View style={{ width: 11, height: 11, borderRadius: 999, backgroundColor: obterCorCategoriaDistinta(indice) }} />
                  <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: indice === indiceAtivoSeguro ? '700' : '600', flex: 1 }}>{item.rotulo}</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' }}>{formatarPercentual(item.percentual)}</Text>
                <View style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>{formatarValorPorIdioma(item.valorTotal)}</Text>
                </View>
              </View>
              <BarraHorizontal percentual={item.percentual} cor={obterCorCategoriaDistinta(indice)} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>
                {traduzir('dashboard.compras.resumoTipoCompra', {
                  percentual: formatarPercentual(item.percentual),
                  itens: String(item.quantidadeItens),
                })}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ ...ESTILO_CARTAO_BASE, backgroundColor: COLORS.bgTertiary, paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{traduzir('dashboard.compras.total')}</Text>
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{formatarValorPorIdioma(totalCategorias)}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (idWidget === 'comprasProdutosTop') {
    if (!produtosMaisComprados.length) return renderizarEstadoVazio(traduzir);
    const maiorQuantidade = Math.max(1, ...produtosMaisComprados.map((item) => item.quantidade));
    const produtosOrdenados = produtosMaisComprados.slice(0, LIMITE_ITENS_LISTA);
    const produtoTopo = produtosOrdenados[0];

    return (
      <View style={{ width: '100%', gap: 8 }}>
        {produtoTopo ? (
          <View style={{ ...ESTILO_CARTAO_BASE, borderColor: COLORS.borderAccent, backgroundColor: COLORS.bgHover, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.warning, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="trophy-variant-outline" size={14} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{produtoTopo.descricao}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 2 }}>{traduzir('dashboard.compras.top1Destaque')}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{String(produtoTopo.quantidade)}</Text>
              </View>
            </View>
            <BarraHorizontal percentual={(produtoTopo.quantidade / maiorQuantidade) * 100} cor={COLORS.warning} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>
              {traduzir('dashboard.compras.percentualRanking', {
                percentual: formatarPercentual((produtoTopo.quantidade / maiorQuantidade) * 100),
              })}
            </Text>
          </View>
        ) : null}

        {produtosOrdenados.slice(1).map((item, indiceLista) => {
          const indice = indiceLista + 1;
          const corPosicao = obterCorPosicaoRanking(indice);
          const percentualProduto = (item.quantidade / maiorQuantidade) * 100;
          const ativo = indiceProdutoAtivo === indice;

          return (
            <TouchableOpacity
              key={`${item.descricao}-${indice}`}
              onPress={() => setIndiceProdutoAtivo(indice)}
              activeOpacity={0.86}
              style={{
                ...ESTILO_CARTAO_BASE,
                padding: 10,
                borderColor: ativo ? corPosicao : COLORS.borderColor,
                backgroundColor: ativo ? COLORS.bgHover : COLORS.bgSecondary,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: corPosicao }}>
                    {indice < 3 ? (
                      <MaterialCommunityIcons name="medal-outline" size={12} color={corPosicao} />
                    ) : (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' }}>{String(indice + 1).padStart(2, '0')}</Text>
                    )}
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.borderColor, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' }}>
                      {String(item.descricao).trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: ativo ? '700' : '600', flex: 1 }}>{item.descricao}</Text>
                </View>
                <View style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>{item.quantidade}</Text>
                </View>
              </View>
              <BarraHorizontal percentual={percentualProduto} cor={corPosicao} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>
                {traduzir('dashboard.compras.percentualRanking', { percentual: formatarPercentual(percentualProduto) })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (idWidget === 'comprasUltimasCompras') {
    if (!ultimasCompras.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ultimasCompras.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ width: larguraCardLista, ...ESTILO_CARTAO_BASE, padding: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: item.corMarcador, marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.descricao}</Text>
                  <View style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700' }}>{formatarValorPorIdioma(item.valor)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                  <View style={{ backgroundColor: COLORS.bgTertiary, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 10 }}>{item.planejamento}</Text>
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.data)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasUltimosDesejos') {
    if (!ultimosDesejos.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ultimosDesejos.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ width: larguraCardLista, ...ESTILO_CARTAO_BASE, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <MaterialCommunityIcons name="heart-outline" size={12} color={COLORS.warning} />
                <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.descricao}</Text>
              </View>
              <View style={{ backgroundColor: COLORS.warningSoft, borderWidth: 1, borderColor: COLORS.warning, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: COLORS.warning, fontSize: 11, fontWeight: '700' }}>{formatarValorPorIdioma(item.valorEstimado)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.data)}</Text>
              <View style={{ backgroundColor: item.status === 'convertido' ? COLORS.successSoft : COLORS.bgTertiary, borderRadius: 999, borderWidth: 1, borderColor: item.status === 'convertido' ? COLORS.success : COLORS.borderColor, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ color: item.status === 'convertido' ? COLORS.success : COLORS.textSecondary, fontSize: 10 }}>
                  {traduzir(`dashboard.compras.statusDesejo.${item.status}`)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasVariacaoPrecos') {
    if (!variacoesPrecos.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ width: '100%', gap: 8 }}>
        {variacoesPrecos.slice(0, LIMITE_ITENS_LISTA).map((item) => {
          const indicador = item.percentualVariacao > 0 ? 'alta' : item.percentualVariacao < 0 ? 'baixa' : 'estavel';
          const corIndicador = indicador === 'alta' ? COLORS.error : indicador === 'baixa' ? COLORS.success : COLORS.textSecondary;

          return (
          <View key={item.id} style={{ ...ESTILO_CARTAO_BASE, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.produto}</Text>
              <View style={{ borderWidth: 1, borderColor: corIndicador, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: corIndicador, fontSize: 12, fontWeight: '700' }}>
                  {formatarPercentual(item.percentualVariacao)}
                </Text>
              </View>
            </View>
            <BarraHorizontal percentual={Math.min(Math.abs(item.percentualVariacao), 100)} cor={corIndicador} />
            <SparklinePreco
              minimo={item.menorPreco}
              medio={item.mediaPreco}
              maximo={item.maiorPreco}
              cor={corIndicador}
            />
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 5 }}>
              {traduzir('dashboard.compras.resumoVariacaoPreco', {
                ultimo: formatarValorPorIdioma(item.ultimoPreco),
                menor: formatarValorPorIdioma(item.menorPreco),
                media: formatarValorPorIdioma(item.mediaPreco),
              })}
            </Text>
            <Text style={{ color: corIndicador, fontSize: 10, fontWeight: '700', marginTop: 4 }}>
              {traduzir(`dashboard.compras.tendencia.${indicador}`)}
            </Text>
          </View>
          );
        })}
      </View>
    );
  }

  if (idWidget === 'comprasEconomiaPotencial') {
    if (!produtosComMelhorEconomia.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ width: '100%', gap: 10 }}>
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.economiaPotencialTotal')}
          conteudo={renderizarValorMonetario({
            valor: economiaPotencialTotal,
            cor: COLORS.success,
            tamanhoFonte: 22,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
          subtitulo={traduzir('dashboard.compras.economiaPotencialDescricao')}
        />
        {produtosComMelhorEconomia.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ ...ESTILO_CARTAO_BASE, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.produto}</Text>
              <View style={{ backgroundColor: COLORS.successSoft, borderRadius: 999, borderWidth: 1, borderColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.economiaUnitaria)}</Text>
              </View>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 5 }}>
              {traduzir('dashboard.compras.resumoEconomiaProduto', {
                ultimo: formatarValorPorIdioma(item.ultimoPreco),
                menor: formatarValorPorIdioma(item.menorPreco),
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return renderizarEstadoVazio(traduzir);
}
