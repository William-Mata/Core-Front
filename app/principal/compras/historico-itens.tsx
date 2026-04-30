import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { listarHistoricoItensCompraApi } from '../../../src/servicos/compras';
import { HistoricoItemCompra, UnidadeMedidaItemCompra } from '../../../src/tipos/compras.tipos';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../src/utils/formatacaoLocale';
import { notificarErro } from '../../../src/utils/notificacao';
import { COLORS } from '../../../src/styles/variables';

const opcoesUnidade: UnidadeMedidaItemCompra[] = ['unidade', 'kg', 'g', 'mg', 'l', 'ml', 'pacote', 'caixa'];
type PontoHistoricoPreco = { data: string; valor: number };

function normalizarDataIso(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return new Date().toISOString().split('T')[0];
  return data.toISOString().split('T')[0];
}

function extrairSerieHistorica(item: HistoricoItemCompra): PontoHistoricoPreco[] {
  return (item.historicoPrecos ?? [])
    .map((ponto) => ({ data: normalizarDataIso(ponto.data), valor: Number(ponto.valor ?? 0) }))
    .filter((ponto) => Number.isFinite(ponto.valor) && ponto.valor > 0 && ponto.data)
    .sort((a, b) => a.data.localeCompare(b.data));
}

function obterTendencia(ultimoPreco: number, mediaPreco: number): 'subida' | 'queda' | 'estavel' {
  if (mediaPreco <= 0) return 'estavel';
  const variacaoPercentual = ((ultimoPreco - mediaPreco) / mediaPreco) * 100;
  if (variacaoPercentual > 1) return 'subida';
  if (variacaoPercentual < -1) return 'queda';
  return 'estavel';
}

export default function HistoricoItensCompraTela() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = usarTraducao();
  const [historico, setHistorico] = useState<HistoricoItemCompra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [itensExpandidos, setItensExpandidos] = useState<Record<string, boolean>>({});
  const [larguraGraficos, setLarguraGraficos] = useState<Record<string, number>>({});
  const [filtroDescricao, setFiltroDescricao] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const carregarHistorico = useCallback(async () => {
    try {
      setCarregando(true);
      setErroCarregamento('');
      const resposta = await listarHistoricoItensCompraApi({
        descricao: filtroDescricao.trim() || undefined,
        unidade: (filtroUnidade || undefined) as UnidadeMedidaItemCompra | undefined,
        dataInicio: filtroDataInicio.trim() || undefined,
        dataFim: filtroDataFim.trim() || undefined,
      });
      setHistorico(resposta);
    } catch {
      setErroCarregamento(t('compras.mensagens.erroCarregarHistorico'));
      notificarErro(t('compras.mensagens.erroCarregarHistorico'));
    } finally {
      setCarregando(false);
    }
  }, [filtroDataFim, filtroDataInicio, filtroDescricao, filtroUnidade, t]);

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  const totalOcorrencias = useMemo(
    () => historico.reduce((acumulado, item) => acumulado + item.totalOcorrencias, 0),
    [historico],
  );

  const alternarExpansao = useCallback((chave: string) => {
    setItensExpandidos((estadoAtual) => ({ ...estadoAtual, [chave]: !estadoAtual[chave] }));
  }, []);

  const atualizarLarguraGrafico = useCallback((chave: string, largura: number) => {
    setLarguraGraficos((estadoAtual) => {
      const larguraAtual = estadoAtual[chave] ?? 0;
      if (Math.abs(larguraAtual - largura) < 2) return estadoAtual;
      return { ...estadoAtual, [chave]: largura };
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: COLORS.bgSecondary,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.menu.historicoItens')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{t('compras.historico.titulo')}</Text>
          <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>{t('compras.historico.subtitulo')}</Text>
          <CampoTexto
            label={t('compras.historico.filtroDescricao')}
            value={filtroDescricao}
            onChangeText={setFiltroDescricao}
            placeholder={t('compras.historico.placeholderFiltroDescricao')}
          />
          <CampoSelect
            label={t('compras.historico.filtroUnidade')}
            value={filtroUnidade}
            onChange={setFiltroUnidade}
            options={[
              { value: '', label: t('compras.historico.todasUnidades') },
              ...opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) })),
            ]}
          />
          <CampoTexto
            label={t('compras.historico.filtroDataInicio')}
            value={filtroDataInicio}
            onChangeText={setFiltroDataInicio}
            placeholder={t('compras.historico.placeholderDataIso')}
          />
          <CampoTexto
            label={t('compras.historico.filtroDataFim')}
            value={filtroDataFim}
            onChangeText={setFiltroDataFim}
            placeholder={t('compras.historico.placeholderDataIso')}
          />
          <Botao titulo={t('comum.acoes.consultar')} onPress={() => void carregarHistorico()} tipo="secundario" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
            {t('compras.historico.totalOcorrencias')}: {totalOcorrencias}
          </Text>
        </View>

        {carregando ? (
          <View style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>{t('comum.carregando')}</Text>
          </View>
        ) : null}
        {!carregando && erroCarregamento ? (
          <View style={{ backgroundColor: COLORS.errorSoft, borderWidth: 1, borderColor: COLORS.error, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: COLORS.textPrimary }}>{erroCarregamento}</Text>
          </View>
        ) : null}
        {!carregando && !erroCarregamento && historico.length === 0 ? (
          <View style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.vazio')}</Text>
          </View>
        ) : null}

        <View style={{ gap: 12 }}>
          {historico.map((item) => (
            <View key={`${item.produtoId}-${item.unidade}`} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, overflow: 'hidden' }}>
              <TouchableOpacity
                onPress={() => alternarExpansao(`${item.produtoId}-${item.unidade}`)}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.accent, fontWeight: '700', fontSize: 15 }}>{item.descricao}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{t('compras.item.unidade')}: {t(`compras.unidades.${item.unidade}`)}</Text>
                  </View>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 20 }}>{itensExpandidos[`${item.produtoId}-${item.unidade}`] ? '-' : '+'}</Text>
                </View>
              </TouchableOpacity>

              <View style={{ padding: 12, gap: 10 }}>
                <View style={{ flexDirection: width > 960 ? 'row' : 'column', gap: 8 }}>
                  {[
                    { titulo: t('compras.historico.ultimoPreco'), valor: formatarValorPorIdioma(item.ultimoPreco), cor: COLORS.accent },
                    { titulo: t('compras.historico.menorPreco'), valor: formatarValorPorIdioma(item.menorPreco), cor: COLORS.success },
                    { titulo: t('compras.historico.maiorPreco'), valor: formatarValorPorIdioma(item.maiorPreco), cor: COLORS.error },
                    { titulo: t('compras.historico.mediaPreco'), valor: formatarValorPorIdioma(item.mediaPreco), cor: COLORS.info },
                  ].map((cartao) => (
                    <View key={cartao.titulo} style={{ flex: 1, backgroundColor: COLORS.bgTertiary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{cartao.titulo}</Text>
                      <Text style={{ color: cartao.cor, fontSize: 16, fontWeight: '700', marginTop: 3 }}>{cartao.valor}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.dataUltimoPreco')}: {formatarDataPorIdioma(item.dataUltimoPreco)}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.totalOcorrencias')}: {item.totalOcorrencias}</Text>
                </View>

                <View style={{ alignSelf: 'flex-start', backgroundColor: COLORS.bgTertiary, borderRadius: 999, borderWidth: 1, borderColor: COLORS.borderColor, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: obterTendencia(item.ultimoPreco, item.mediaPreco) === 'subida' ? COLORS.error : obterTendencia(item.ultimoPreco, item.mediaPreco) === 'queda' ? COLORS.success : COLORS.warning, fontSize: 12, fontWeight: '700' }}>
                    {obterTendencia(item.ultimoPreco, item.mediaPreco) === 'subida'
                      ? t('compras.historico.tendenciaSubida')
                      : obterTendencia(item.ultimoPreco, item.mediaPreco) === 'queda'
                        ? t('compras.historico.tendenciaQueda')
                        : t('compras.historico.tendenciaEstavel')}
                  </Text>
                </View>

                {itensExpandidos[`${item.produtoId}-${item.unidade}`] ? (
                  <View
                    onLayout={(evento) => atualizarLarguraGrafico(`${item.produtoId}-${item.unidade}`, evento.nativeEvent.layout.width)}
                    style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 10 }}
                  >
                    <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{t('compras.historico.graficoEvolucao')}</Text>
                    {extrairSerieHistorica(item).length > 0 ? (
                      larguraGraficos[`${item.produtoId}-${item.unidade}`] > 0 ? (
                        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                            <LineChart
                              data={extrairSerieHistorica(item).map((ponto) => ({ value: Number(ponto.valor.toFixed(2)), label: formatarDataPorIdioma(ponto.data) }))}
                              height={220}
                              parentWidth={Math.max(larguraGraficos[`${item.produtoId}-${item.unidade}`] - 32, 220)}
                              width={(() => {
                                const larguraContainer = Math.max(larguraGraficos[`${item.produtoId}-${item.unidade}`] - 40, 220);
                                const quantidadePontos = Math.max(extrairSerieHistorica(item).length, 1);
                                const espacamentoMinimo = 64;
                                const larguraMinimaComScroll = (quantidadePontos - 1) * espacamentoMinimo + 36;
                                return larguraMinimaComScroll > larguraContainer ? larguraMinimaComScroll : larguraContainer;
                              })()}
                              spacing={(() => {
                                const larguraContainer = Math.max(larguraGraficos[`${item.produtoId}-${item.unidade}`] - 40, 220);
                                const quantidadePontos = Math.max(extrairSerieHistorica(item).length, 1);
                                if (quantidadePontos <= 1) return 0;
                                const espacamentoMinimo = 64;
                                const larguraMinimaComScroll = (quantidadePontos - 1) * espacamentoMinimo + 36;
                                const larguraFinal = larguraMinimaComScroll > larguraContainer ? larguraMinimaComScroll : larguraContainer;
                                return (larguraFinal - 36) / (quantidadePontos - 1);
                              })()}
                              initialSpacing={8}
                              endSpacing={0}
                              curved
                              areaChart
                              color1={COLORS.accent}
                              startFillColor1={COLORS.accent}
                              endFillColor1={COLORS.accent}
                              startOpacity1={0.2}
                              endOpacity1={0.03}
                              thickness1={3}
                              yAxisThickness={0}
                              xAxisThickness={1}
                              xAxisColor={COLORS.borderColor}
                              rulesColor={COLORS.borderColor}
                              yAxisTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
                              xAxisLabelTextStyle={{ color: COLORS.textSecondary, fontSize: 10 }}
                              formatYLabel={(valor: string) => formatarValorPorIdioma(Number(valor))}
                              dataPointsColor1={COLORS.accent}
                              dataPointsRadius1={3}
                              pointerConfig={{
                                activatePointersInstantlyOnTouch: true,
                                persistPointer: true,
                                pointerColor: COLORS.accent,
                                pointerStripColor: COLORS.borderAccent,
                                pointerLabelWidth: 160,
                                pointerLabelHeight: 70,
                                pointerLabelComponent: (dados: Array<{ value?: number; label?: string }>) => (
                                  <View style={{ backgroundColor: COLORS.bgPrimary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 }}>
                                    <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' }}>
                                      {t('compras.historico.tooltipData')}: {dados?.[0]?.label ?? '-'}
                                    </Text>
                                    <Text style={{ color: COLORS.accent, fontSize: 11, marginTop: 4 }}>
                                      {t('compras.historico.tooltipValor')}: {formatarValorPorIdioma(dados?.[0]?.value ?? 0)}
                                    </Text>
                                  </View>
                                ),
                              }}
                            />
                          </ScrollView>
                        </ScrollView>
                      ) : null
                    ) : (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.historico.semSerieHistorica')}</Text>
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
