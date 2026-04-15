import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Image, View, Text, ScrollView, TouchableOpacity, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Cabecalho } from '../../src/componentes/comuns/Cabecalho';
import { EsqueletoCarregamento } from '../../src/componentes/comuns/EsqueletoCarregamento';
import { usarTraducao } from '../../src/hooks/usarTraducao';
import { formatarDataPorIdioma, formatarMesPorIdioma, formatarValorPorIdioma } from '../../src/utils/formatacaoLocale';
import { obterIconeBanco, obterIconeBandeiraCartao, obterImagemBanco, obterImagemBandeiraCartao } from '../../src/utils/icones';
import { COLORS } from '../../src/styles/variables';
import {
  listarAreasSubareasSomaRateioApi,
  listarDespesasApi,
  listarCartoesDetalheApi,
  listarContasBancariasDetalheApi,
  listarHistoricoTransacoesApi,
  listarResumoHistoricoTransacoesApi,
  listarReceitasApi,
  listarReembolsosApi,
  type AreaSomaRateioApi,
  type HistoricoTransacaoApi,
  type ResumoHistoricoTransacoesApi,
  type RegistroFinanceiroApi,
} from '../../src/servicos/financeiro';
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
  id: string;
  tipo: TipoTransacao;
  rotuloTipo: string;
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
  referenciaIcone?: string;
  subtitulo: string;
  saldo: number;
}

function renderTextoComIconeContaCartao(tipo: TipoContaBalanco, valor?: string, tamanhoFonte = 12, pesoFonte?: '400' | '500' | '600' | '700', referenciaIcone?: string): ReactElement {
  const texto = String(valor ?? '').trim();
  if (!texto) return <Text style={{ color: COLORS.textPrimary, fontSize: tamanhoFonte, fontWeight: pesoFonte }}>-</Text>;
  const baseIcone = String(referenciaIcone ?? texto).trim() || texto;
  const imagem = tipo === 'conta' ? obterImagemBanco(baseIcone) : obterImagemBandeiraCartao(baseIcone);
  const icone = tipo === 'conta' ? obterIconeBanco(baseIcone) : obterIconeBandeiraCartao(baseIcone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {imagem ? <Image source={imagem} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" /> : <Text style={{ marginRight: 6, fontSize: 13 }}>{icone}</Text>}
      <Text style={{ color: COLORS.textPrimary, fontSize: tamanhoFonte, fontWeight: pesoFonte, flex: 1 }}>{texto}</Text>
    </View>
  );
}

interface ResumoFinanceiroWidget {
  totalReceitas: number;
  totalDespesas: number;
  totalReembolsos: number;
  totalEstornos: number;
  saldo: number;
}

interface ItemAreaSubarea {
  id: string;
  area: string;
  subarea: string;
  receitas: number;
  despesas: number;
}

interface ResumoMensalGraficoAnual {
  mes: string;
  receitas: number;
  despesas: number;
  reembolsos: number;
  estornos: number;
}

interface PieAreaItem {
  value: number;
  color: string;
  text: string;
  area: string;
  subarea: string;
}

const CORES_RECEITA = [COLORS.success, COLORS.info, '#23c4a8', '#5dd39e', '#2dd4bf', '#14b8a6'];
const CORES_DESPESA = [COLORS.error, COLORS.warning, '#fb7185', '#f97316', '#ef4444', '#f59e0b'];
const INDICE_MES_POR_NOME: Record<string, number> = {
  janeiro: 0,
  january: 0,
  enero: 0,
  fevereiro: 1,
  february: 1,
  febrero: 1,
  marco: 2,
  march: 2,
  marzo: 2,
  abril: 3,
  april: 3,
  mayo: 4,
  may: 4,
  junho: 5,
  june: 5,
  junio: 5,
  julho: 6,
  july: 6,
  julio: 6,
  agosto: 7,
  august: 7,
  setembro: 8,
  september: 8,
  setiembre: 8,
  octubre: 9,
  october: 9,
  outubro: 9,
  novembro: 10,
  november: 10,
  diciembre: 11,
  december: 11,
  dezembro: 11,
};

function obterEstiloTipoTransacao(tipo: TipoTransacao) {
  if (tipo === 'despesa') {
    return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
  }
  if (tipo === 'receita') {
    return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
  }
  if (tipo === 'reembolso') {
    return { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };
  }
  return { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' };
}

function mapearRotuloTipoTransacaoHistorico(valor: unknown, t: (chave: string) => string): string {
  const tipoNormalizado = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

  if (tipoNormalizado.includes('estorno') && tipoNormalizado.includes('reembolso')) {
    return `${t('dashboard.tipos.estorno')} ${t('dashboard.tipos.reembolso')}`;
  }
  if (tipoNormalizado.includes('estorno') && tipoNormalizado.includes('receita')) {
    return `${t('dashboard.tipos.estorno')} ${t('dashboard.tipos.receita')}`;
  }
  if (tipoNormalizado.includes('estorno') && tipoNormalizado.includes('despesa')) {
    return `${t('dashboard.tipos.estorno')} ${t('dashboard.tipos.despesa')}`;
  }
  if (tipoNormalizado.includes('estorno')) return t('dashboard.tipos.estorno');
  if (tipoNormalizado.includes('reembolso')) return t('dashboard.tipos.reembolso');
  if (tipoNormalizado.includes('receita')) return t('dashboard.tipos.receita');
  if (tipoNormalizado.includes('despesa')) return t('dashboard.tipos.despesa');

  return t('dashboard.tipos.despesa');
}

function erroCancelado(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const erroTipado = erro as { code?: string; name?: string };
  return erroTipado.code === 'ERR_CANCELED' || erroTipado.name === 'CanceledError';
}

function normalizarNomeMes(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function obterIndiceMesResumo(mes: string, indicePadrao: number): number {
  const indicePorNome = INDICE_MES_POR_NOME[normalizarNomeMes(mes)];
  if (typeof indicePorNome === 'number') return indicePorNome;
  return indicePadrao;
}

function montarResumoMensalVazio(ano: number): ResumoMensalGraficoAnual[] {
  return Array.from({ length: 12 }, (_, indice) => ({
    mes: formatarMesPorIdioma(new Date(ano, indice, 1)),
    receitas: 0,
    despesas: 0,
    reembolsos: 0,
    estornos: 0,
  }));
}

function normalizarNumeroMonetario(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor !== 'string') return 0;
  const textoOriginal = valor.trim();
  if (!textoOriginal) return 0;
  const textoLimpo = textoOriginal.replace(/[^\d,.-]/g, '');
  if (!textoLimpo) return 0;

  let textoNormalizado = textoLimpo;
  const possuiVirgula = textoLimpo.includes(',');
  const possuiPonto = textoLimpo.includes('.');

  if (possuiVirgula && possuiPonto) {
    textoNormalizado = textoLimpo.lastIndexOf(',') > textoLimpo.lastIndexOf('.')
      ? textoLimpo.replace(/\./g, '').replace(',', '.')
      : textoLimpo.replace(/,/g, '');
  } else if (possuiVirgula) {
    textoNormalizado = textoLimpo.replace(',', '.');
  }

  const numero = Number(textoNormalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarValorSerieAnual(valor: unknown): number {
  return Number(Math.abs(normalizarNumeroMonetario(valor)).toFixed(2));
}

function normalizarCodigoPagamento(valor: unknown): string {
  const pagamento = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
  if (
    pagamento === 'CREDITO' ||
    pagamento === 'CARTAO_CREDITO' ||
    pagamento === 'CARTAODE_CREDITO' ||
    pagamento === 'CARTAOCREDITO'
  ) return 'CARTAO_CREDITO';
  if (
    pagamento === 'DEBITO' ||
    pagamento === 'CARTAO_DEBITO' ||
    pagamento === 'CARTAODE_DEBITO' ||
    pagamento === 'CARTAODEBITO'
  ) return 'CARTAO_DEBITO';
  if (pagamento === 'PIX') return 'PIX';
  if (pagamento === 'TRANSFERENCIA' || pagamento === 'TED' || pagamento === 'DOC' || pagamento === 'TED_DOC' || pagamento === 'TRANSFERENCIA_BANCARIA') return 'TRANSFERENCIA';
  if (pagamento === 'BOLETO') return 'BOLETO';
  if (pagamento === 'DINHEIRO') return 'DINHEIRO';
  return '';
}

function formatarTipoPagamentoNaoMapeado(valor: unknown): string {
  const texto = String(valor ?? '').trim();
  if (!texto) return '-';
  const textoNormalizado = texto.replace(/[_-]+/g, ' ').toLowerCase();
  return textoNormalizado.replace(/\b\w/g, (char) => char.toUpperCase());
}

function traduzirTipoPagamento(valor: unknown, t: (chave: string) => string): string {
  const codigoPagamento = normalizarCodigoPagamento(valor);
  if (codigoPagamento) return t(`dashboard.pagamento.${codigoPagamento}`);
  return formatarTipoPagamentoNaoMapeado(valor);
}

function mapearTipoTransacaoHistorico(valor: unknown): TipoTransacao {
  const tipo = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
  if (tipo.includes('estorno')) return 'estorno';
  if (tipo === 'despesa') return 'despesa';
  if (tipo === 'receita') return 'receita';
  if (tipo === 'reembolso') return 'reembolso';
  if (tipo.includes('despesa')) return 'despesa';
  if (tipo.includes('receita')) return 'receita';
  if (tipo.includes('reembolso')) return 'reembolso';
  return 'despesa';
}

function extrairTextoNome(valor: unknown): string | undefined {
  if (typeof valor === 'string') {
    const texto = valor.trim();
    return texto ? texto : undefined;
  }
  if (!valor || typeof valor !== 'object') return undefined;
  const registro = valor as Record<string, unknown>;
  const nome = String(registro.nome ?? registro.descricao ?? registro.titulo ?? '').trim();
  return nome ? nome : undefined;
}

function mapearTransacoesApiParaDashboard(
  itens: RegistroFinanceiroApi[],
  tipo: TipoTransacao,
  t: (chave: string) => string,
): Transacao[] {
  return itens.map((item, indice) => {
    const codigoPagamento = normalizarCodigoPagamento(item.tipoPagamento ?? item.tipoRecebimento) || 'DINHEIRO';

    const data = String(item.dataEfetivacao ?? item.dataLancamento ?? item.data ?? new Date().toISOString().split('T')[0]).slice(0, 10);
    const area = String(item.area ?? item.categoria ?? t('dashboard.areas.OPERACOES'));
    const subarea = String(item.subarea ?? item.descricao ?? item.titulo ?? t('dashboard.subareas.SUPRIMENTOS'));

    return {
      id: String(item.id ?? indice + 1),
      tipo,
      rotuloTipo: t(`dashboard.tipos.${tipo}`),
      valor: Number(item.valor ?? item.valorLiquido ?? item.valorTotal ?? 0),
      descricao: String(item.descricao ?? item.titulo ?? `${t('dashboard.tipos.' + tipo)} #${item.id ?? indice + 1}`),
      dataEfetivacao: data,
      codigoPagamento,
      tipoPagamento: traduzirTipoPagamento(item.tipoPagamento ?? item.tipoRecebimento, t),
      contaBancaria: item.contaBancaria ? String(item.contaBancaria) : undefined,
      cartao: item.cartao ? String(item.cartao) : undefined,
      area,
      subarea,
    };
  });
}

function mapearHistoricoTransacoesApiParaDashboard(
  itens: HistoricoTransacaoApi[],
  t: (chave: string) => string,
): Transacao[] {
  return itens.map((item, indice) => {
    const idTransacao = String(item.idTransacao ?? item.IdTransacao ?? item.idOrigem ?? indice + 1);
    const tipo = mapearTipoTransacaoHistorico(item.tipoTransacao);
    const codigoPagamento = normalizarCodigoPagamento(item.tipoPagamento);
    const descricaoTipo = extrairTextoNome(item.tipoDespesa) ?? extrairTextoNome(item.tipoReceita) ?? '-';

    return {
      id: idTransacao,
      tipo,
      rotuloTipo: mapearRotuloTipoTransacaoHistorico(item.tipoTransacao, t),
      valor: Number(item.valor ?? 0),
      descricao: String(item.descricao ?? `${t('dashboard.tipos.' + tipo)} #${idTransacao}`),
      dataEfetivacao: String(item.dataEfetivacao ?? new Date().toISOString().split('T')[0]).slice(0, 10),
      codigoPagamento,
      tipoPagamento: traduzirTipoPagamento(item.tipoPagamento, t),
      contaBancaria: extrairTextoNome(item.contaBancaria),
      cartao: extrairTextoNome(item.cartao),
      area: t(`dashboard.tipos.${tipo}`),
      subarea: descricaoTipo,
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
  const [indiceReceitaSelecionada, setIndiceReceitaSelecionada] = useState(-1);
  const [indiceDespesaSelecionada, setIndiceDespesaSelecionada] = useState(-1);
  const [seriesVisiveis, setSeriesVisiveis] = useState({
    receitas: true,
    despesas: true,
    reembolsos: true,
    estornos: true,
  });
  const [larguraGraficoAnualDisponivel, setLarguraGraficoAnualDisponivel] = useState(0);
  const [larguraTabelaUltimasTransacoes, setLarguraTabelaUltimasTransacoes] = useState(0);
  const [transacoesApi, setTransacoesApi] = useState<Transacao[]>([]);
  const [ultimasTransacoesApi, setUltimasTransacoesApi] = useState<Transacao[]>([]);
  const [itensBalancoApi, setItensBalancoApi] = useState<ItemBalanco[]>([]);
  const [resumoApi, setResumoApi] = useState<ResumoHistoricoTransacoesApi | null>(null);
  const [itensAreaSubareaApi, setItensAreaSubareaApi] = useState<ItemAreaSubarea[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const carregarDashboard = async () => {
      setCarregando(true);
      try {
        const [despesasApi, receitasApi, reembolsosApi] = await Promise.all([
          listarDespesasApi({ signal: controller.signal, desconsiderarCancelados: true }),
          listarReceitasApi({ signal: controller.signal, desconsiderarCancelados: true }),
          listarReembolsosApi({ signal: controller.signal, desconsiderarCancelados: true }),
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

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const carregarBalancoGeral = async () => {
      try {
        const [contasApi, cartoesApi] = await Promise.all([
          listarContasBancariasDetalheApi({ signal: controller.signal }),
          listarCartoesDetalheApi({ signal: controller.signal }),
        ]);
        if (!ativo) return;

        const contas: ItemBalanco[] = contasApi
          .map((item, indice) => {
            const nome = String(item.descricao ?? item.nome ?? item.conta ?? '').trim();
            const referenciaIcone = String(item.banco ?? item.nomeBanco ?? '').trim();
            const saldo = Number(item.saldoAtual ?? item.saldoInicial ?? 0);
            return {
              id: `conta-${item.id ?? indice}-${nome || indice}`,
              tipo: 'conta' as const,
              nome: nome || `${t('dashboard.tiposBalanco.conta')} #${indice + 1}`,
              referenciaIcone: referenciaIcone || nome,
              subtitulo: t('dashboard.saldoAtualConta'),
              saldo: Number.isFinite(saldo) ? saldo : 0,
            };
          })
          .filter((item) => item.nome.length > 0);

        const cartoes: ItemBalanco[] = cartoesApi
          .map((item, indice) => {
            const nome = String(item.descricao ?? item.nome ?? item.cartao ?? '').trim();
            const referenciaIcone = String(item.bandeira ?? item.nomeBandeira ?? '').trim();
            const saldoDisponivel = Number(item.saldoDisponivel ?? item.limiteDisponivel ?? item.limite ?? 0);
            return {
              id: `cartao-${item.id ?? indice}-${nome || indice}`,
              tipo: 'cartao' as const,
              nome: nome || `${t('dashboard.tiposBalanco.cartao')} #${indice + 1}`,
              referenciaIcone: referenciaIcone || nome,
              subtitulo: t('dashboard.saldoDisponivelCartao'),
              saldo: Number.isFinite(saldoDisponivel) ? saldoDisponivel : 0,
            };
          })
          .filter((item) => item.nome.length > 0);

        setItensBalancoApi([...contas, ...cartoes]);
      } catch (erro) {
        if (erroCancelado(erro)) return;
        if (!ativo) return;
        setItensBalancoApi([]);
      }
    };

    void carregarBalancoGeral();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [idiomaAtual]);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const carregarResumoHistorico = async () => {
      try {
        const resumoHistorico = await listarResumoHistoricoTransacoesApi({ signal: controller.signal });
        if (!ativo) return;
        setResumoApi(resumoHistorico);
      } catch (erro) {
        if (erroCancelado(erro)) return;
        if (!ativo) return;
        setResumoApi(null);
      }
    };

    void carregarResumoHistorico();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const mapearItensAreaSubarea = (
      lista: AreaSomaRateioApi[],
      tipo: 'despesa' | 'receita',
    ): ItemAreaSubarea[] => {
      const itens: ItemAreaSubarea[] = [];
      for (const area of lista) {
        for (const subArea of area.subAreas ?? []) {
          const valorSubArea = Number(subArea.valorTotalRateio ?? 0);
          itens.push({
            id: `${tipo}-${area.id}-${subArea.id}`,
            area: area.nome,
            subarea: subArea.nome,
            receitas: tipo === 'receita' ? valorSubArea : 0,
            despesas: tipo === 'despesa' ? valorSubArea : 0,
          });
        }
      }
      return itens;
    };

    const carregarAreasSubareasSomaRateio = async () => {
      try {
        const [areasDespesas, areasReceitas] = await Promise.all([
          listarAreasSubareasSomaRateioApi({ signal: controller.signal, tipo: 'Despesa' }),
          listarAreasSubareasSomaRateioApi({ signal: controller.signal, tipo: 'Receita' }),
        ]);
        if (!ativo) return;
        setItensAreaSubareaApi([
          ...mapearItensAreaSubarea(areasDespesas, 'despesa'),
          ...mapearItensAreaSubarea(areasReceitas, 'receita'),
        ]);
      } catch (erro) {
        if (erroCancelado(erro)) return;
        if (!ativo) return;
        setItensAreaSubareaApi([]);
      }
    };

    void carregarAreasSubareasSomaRateio();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const idEstilo = 'scroll-historico-transacoes-tema';
    if (document.getElementById(idEstilo)) return;

    const estilo = document.createElement('style');
    estilo.id = idEstilo;
    estilo.textContent = `
      @keyframes badgeTipoTransacaoShine {
        0% {
          left: -65%;
        }
        100% {
          left: 130%;
        }
      }
      [data-testid="badge-tipo-transacao"] {
        position: relative;
        overflow: hidden;
      }
      [data-testid="badge-tipo-transacao"]::after {
        content: '';
        position: absolute;
        top: -6px;
        bottom: -6px;
        left: -65%;
        width: 55%;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.38), rgba(255,255,255,0));
        transform: skewX(-18deg);
        animation: badgeTipoTransacaoShine 1.5s linear infinite;
        pointer-events: none;
      }
    `;

    document.head.appendChild(estilo);
  }, []);

  const transacoes = transacoesApi;
  const transacoesUltimas = ultimasTransacoesApi;

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    const carregarHistoricoTransacoes = async () => {
      try {
        const historicoApi = await listarHistoricoTransacoesApi({
          signal: controller.signal,
          quantidadeRegistros: 50,
          ordemRegistros: 'MaisRecentes',
        });

        if (!ativo) return;
        setUltimasTransacoesApi(mapearHistoricoTransacoesApiParaDashboard(historicoApi, t));
      } catch (erro) {
        if (erroCancelado(erro)) return;
        if (!ativo) return;
        setUltimasTransacoesApi([]);
      }
    };

    void carregarHistoricoTransacoes();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [idiomaAtual]);

  const contasCartoes = itensBalancoApi;

  const transacoesFiltradas = transacoes;

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
  const propsContainerScrollHistoricoWeb: any = Platform.OS === 'web' ? { className: 'scroll-historico-transacoes' } : {};
  const propsScrollHistoricoWeb: any = Platform.OS === 'web' ? { className: 'scroll-historico-transacoes' } : {};
  const largurasColunasUltimasTransacoes = useMemo(() => {
    const larguraBase = {
      id: 90,
      tipo: 130,
      valor: 120,
      descricao: 210,
      dataEfetivacao: 130,
      tipoPagamento: 160,
      contaBancaria: 180,
      cartao: 170,
      tipoDespesaReceita: 170,
    };
    const larguraBaseTotal =
      larguraBase.id +
      larguraBase.tipo +
      larguraBase.valor +
      larguraBase.descricao +
      larguraBase.dataEfetivacao +
      larguraBase.tipoPagamento +
      larguraBase.contaBancaria +
      larguraBase.cartao +
      larguraBase.tipoDespesaReceita;

    const larguraDisponivel = larguraTabelaUltimasTransacoes > 0 ? larguraTabelaUltimasTransacoes : Math.max(width - 120, larguraBaseTotal);
    const fatorExpansao = Math.max(1, larguraDisponivel / larguraBaseTotal);

    const larguras = {
      id: Math.round(larguraBase.id * fatorExpansao),
      tipo: Math.round(larguraBase.tipo * fatorExpansao),
      valor: Math.round(larguraBase.valor * fatorExpansao),
      descricao: Math.round(larguraBase.descricao * fatorExpansao),
      dataEfetivacao: Math.round(larguraBase.dataEfetivacao * fatorExpansao),
      tipoPagamento: Math.round(larguraBase.tipoPagamento * fatorExpansao),
      contaBancaria: Math.round(larguraBase.contaBancaria * fatorExpansao),
      cartao: Math.round(larguraBase.cartao * fatorExpansao),
      tipoDespesaReceita: Math.round(larguraBase.tipoDespesaReceita * fatorExpansao),
    };

    return {
      ...larguras,
      larguraTotal:
        larguras.id +
        larguras.tipo +
        larguras.valor +
        larguras.descricao +
        larguras.dataEfetivacao +
        larguras.tipoPagamento +
        larguras.contaBancaria +
        larguras.cartao +
        larguras.tipoDespesaReceita,
    };
  }, [larguraTabelaUltimasTransacoes, width]);

  const itensAreaSubarea = useMemo<ItemAreaSubarea[]>(
    () =>
      [...itensAreaSubareaApi]
        .sort((a, b) => b.receitas + b.despesas - (a.receitas + a.despesas))
        .slice(0, 30),
    [itensAreaSubareaApi],
  );

  const dadosPieAreaSubareaReceitas = useMemo<PieAreaItem[]>(
    () =>
      itensAreaSubarea
        .filter((item) => item.receitas > 0)
        .map((item, indice) => ({
          value: Number(item.receitas.toFixed(2)),
          color: CORES_RECEITA[indice % CORES_RECEITA.length],
          text: `${item.area} / ${item.subarea}`,
          area: item.area,
          subarea: item.subarea,
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
          text: `${item.area} / ${item.subarea}`,
          area: item.area,
          subarea: item.subarea,
        })),
    [itensAreaSubarea],
  );

  useEffect(() => {
    if (indiceReceitaSelecionada >= dadosPieAreaSubareaReceitas.length) {
      setIndiceReceitaSelecionada(-1);
    }
  }, [dadosPieAreaSubareaReceitas.length, indiceReceitaSelecionada]);

  useEffect(() => {
    if (indiceDespesaSelecionada >= dadosPieAreaSubareaDespesas.length) {
      setIndiceDespesaSelecionada(-1);
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

  const resumo = useMemo<ResumoFinanceiroWidget>(() => {
    return {
      totalReceitas: Number(resumoApi?.totalReceitas ?? 0),
      totalDespesas: Number(resumoApi?.totalDespesas ?? 0),
      totalReembolsos: Number(resumoApi?.totalReembolsos ?? 0),
      totalEstornos: Number(resumoApi?.totalEstornos ?? 0),
      saldo: Number(resumoApi?.totalGeral ?? 0),
    };
  }, [resumoApi]);

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
    const itemSelecionadoValido = indiceSelecionado >= 0 && indiceSelecionado < dados.length;
    const itemSelecionado = itemSelecionadoValido ? dados[indiceSelecionado] : null;
    const valorTotal = dados.reduce((acumulador, item) => acumulador + item.value, 0);
    const valorMaximo = dados.reduce((acumulador, item) => (item.value > acumulador ? item.value : acumulador), 0);
    const percentualSelecionado = itemSelecionado && valorTotal > 0 ? (itemSelecionado.value / valorTotal) * 100 : 0;

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
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            gap: 12,
          }}
        >
          {dados.length > 0 ? (
            <>
              {itemSelecionado ? (
                <View
                  style={{
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.borderAccent,
                    backgroundColor: COLORS.bgPrimary,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: itemSelecionado.color }} />
                    <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>
                      {itemSelecionado.subarea}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                    {itemSelecionado.area}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ color: itemSelecionado.color, fontSize: 12, fontWeight: '700' }}>
                      {formatarValorPorIdioma(itemSelecionado.value)}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>
                      {`${percentualSelecionado.toFixed(percentualSelecionado < 10 ? 1 : 0)}%`}
                    </Text>
                  </View>
                </View>
              ) : null}
              <ScrollView
                style={{
                  width: '100%',
                  maxHeight: width > 980 ? 340 : 300,
                }}
                contentContainerStyle={{ gap: 8 }}
                showsVerticalScrollIndicator
              >
                {dados.map((item, indice) => (
                  <Pressable
                    key={`${titulo}-${item.area}-${item.subarea}`}
                    onPress={() => aoSelecionar(indice)}
                    onHoverIn={Platform.OS === 'web' ? () => aoSelecionar(indice) : undefined}
                    hitSlop={8}
                    style={({ pressed }) => {
                      const itemSelecionadoAtual = indice === indiceSelecionado;
                      const emDestaque = itemSelecionadoAtual || pressed;
                      return {
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: itemSelecionadoAtual ? item.color : emDestaque ? COLORS.borderAccent : COLORS.borderColor,
                        backgroundColor: itemSelecionadoAtual ? COLORS.bgHover : emDestaque ? COLORS.bgSecondary : COLORS.bgTertiary,
                      };
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: item.color }} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: indice === indiceSelecionado ? '700' : '600' }}>
                              {item.subarea}
                            </Text>
                            <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 1 }}>
                              {item.area}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: item.color, fontSize: 11, fontWeight: '700' }}>
                          {formatarValorPorIdioma(item.value)}
                        </Text>
                      </View>
                      <View style={{ marginTop: 7, height: 8, borderRadius: 999, backgroundColor: COLORS.bgPrimary, overflow: 'hidden' }}>
                        <View
                          style={{
                            height: '100%',
                            width: `${Math.min(Math.max(valorTotal > 0 ? (item.value / valorTotal) * 100 : 0, item.value > 0 ? 4 : 0), 100)}%`,
                            backgroundColor: item.color,
                            borderRadius: 999,
                          }}
                        />
                      </View>
                      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                          {`${valorTotal > 0 ? ((item.value / valorTotal) * 100).toFixed(((item.value / valorTotal) * 100) < 10 ? 1 : 0) : '0'}%`}
                        </Text>
                      </View>
                    </View>
                    {indice === indiceSelecionado ? (
                      <View style={{ width: 2, borderRadius: 999, backgroundColor: item.color, marginLeft: 8 }} />
                    ) : null}
                  </Pressable>
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
      const dadosReceitas = dadosAnuais.map((item) => ({ value: normalizarValorSerieAnual(item.receitas), label: item.mes }));
      const dadosDespesas = dadosAnuais.map((item) => ({ value: normalizarValorSerieAnual(item.despesas), label: item.mes }));
      const dadosReembolsos = dadosAnuais.map((item) => ({ value: normalizarValorSerieAnual(item.reembolsos), label: item.mes }));
      const dadosEstornos = dadosAnuais.map((item) => ({ value: normalizarValorSerieAnual(item.estornos), label: item.mes }));
      const maiorValorSeries = Math.max(
        0,
        ...dadosReceitas.map((item) => item.value),
        ...dadosDespesas.map((item) => item.value),
        ...dadosReembolsos.map((item) => item.value),
        ...dadosEstornos.map((item) => item.value),
      );
      const maximoEscalaAnual = maiorValorSeries > 0
        ? Number((Math.ceil((maiorValorSeries * 1.15) / 10) * 10).toFixed(2))
        : 10;
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
                maxValue={maximoEscalaAnual}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={{ gap: 12, paddingRight: 6 }}
            testID="dashboard-balanco-geral-scroll"
          >
            {contasCartoes.length > 0 ? (
              contasCartoes.map((item) => (
                <View
                  key={item.id}
                  style={{
                    width: width > 1100 ? 300 : 260,
                    backgroundColor: COLORS.bgSecondary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.borderColor,
                    padding: 14,
                  }}
                >
                  <View style={{ minHeight: 18, justifyContent: 'center' }}>
                    {renderTextoComIconeContaCartao(item.tipo, item.nome, 13, '700', item.referenciaIcone)}
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>{item.tipo === 'conta' ? t('dashboard.tiposBalanco.conta') : t('dashboard.tiposBalanco.cartao')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 10 }}>{item.subtitulo}</Text>
                  <Text style={{ color: item.saldo >= 0 ? COLORS.success : COLORS.error, fontSize: 20, fontWeight: '700', marginTop: 6 }}>{formatarValorPorIdioma(item.saldo)}</Text>
                </View>
              ))
            ) : (
              <View style={{ width: Math.max(width - 72, 260), backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, padding: 14 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.widgetGraficoInfo')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>{t('dashboard.ultimasTransacoes')}</Text>
        <View
          style={{ width: '100%' }}
          {...propsContainerScrollHistoricoWeb}
          onLayout={(evento) => {
            const larguraMedida = evento.nativeEvent.layout.width;
            if (Math.abs(larguraMedida - larguraTabelaUltimasTransacoes) > 2) {
              setLarguraTabelaUltimasTransacoes(larguraMedida);
            }
          }}
        >
          <ScrollView
            horizontal
            testID="dashboard-ultimas-transacoes-scroll"
            showsHorizontalScrollIndicator
            nestedScrollEnabled
            style={{ width: '100%' }}
            contentContainerStyle={{ minWidth: '100%' }}
            {...propsScrollHistoricoWeb}
          >
            <View style={{ minWidth: largurasColunasUltimasTransacoes.larguraTotal, flex: 1 }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingBottom: 8, marginBottom: 8 }}>
              <Text style={{ width: largurasColunasUltimasTransacoes.id, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.id')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.tipo, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.tipo')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.valor, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.valor')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.descricao, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.descricao')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.dataEfetivacao, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.dataEfetivacao')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.tipoPagamento, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.tipoPagamento')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.contaBancaria, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.contaBancaria')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.cartao, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.cartao')}</Text>
              <Text style={{ width: largurasColunasUltimasTransacoes.tipoDespesaReceita, color: COLORS.textSecondary, fontSize: 12 }}>{t('dashboard.colunas.areaSubarea')}</Text>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {transacoesUltimas.slice(0, 100).map((item, indice) => (
                <View key={`${item.tipo}-${item.id}-${item.dataEfetivacao}-${indice}`} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingVertical: 8 }}>
                  <Text style={{ width: largurasColunasUltimasTransacoes.id, color: COLORS.textPrimary, fontSize: 12 }}>#{item.id}</Text>
                  <View style={{ width: largurasColunasUltimasTransacoes.tipo, justifyContent: 'center' }}>
                    <View
                      testID="badge-tipo-transacao"
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: obterEstiloTipoTransacao(item.tipo).corBorda,
                        backgroundColor: obterEstiloTipoTransacao(item.tipo).corFundo,
                      }}
                    >
                      <Text style={{ color: obterEstiloTipoTransacao(item.tipo).corTexto, fontSize: 11, fontWeight: '700' }}>
                        {item.rotuloTipo}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ width: largurasColunasUltimasTransacoes.valor, color: item.tipo === 'despesa' ? COLORS.error : COLORS.success, fontSize: 12, fontWeight: '600' }}>{formatarValorPorIdioma(item.valor)}</Text>
                  <Text style={{ width: largurasColunasUltimasTransacoes.descricao, color: COLORS.textPrimary, fontSize: 12 }}>{item.descricao}</Text>
                  <Text style={{ width: largurasColunasUltimasTransacoes.dataEfetivacao, color: COLORS.textPrimary, fontSize: 12 }}>{formatarDataPorIdioma(item.dataEfetivacao)}</Text>
                  <Text style={{ width: largurasColunasUltimasTransacoes.tipoPagamento, color: COLORS.textPrimary, fontSize: 12 }}>{item.tipoPagamento}</Text>
                  <View style={{ width: largurasColunasUltimasTransacoes.contaBancaria }}>
                    {renderTextoComIconeContaCartao('conta', item.contaBancaria, 12)}
                  </View>
                  <View style={{ width: largurasColunasUltimasTransacoes.cartao }}>
                    {renderTextoComIconeContaCartao('cartao', item.cartao, 12)}
                  </View>
                  <Text style={{ width: largurasColunasUltimasTransacoes.tipoDespesaReceita, color: COLORS.textPrimary, fontSize: 12 }}>{item.subarea}</Text>
                </View>
              ))}
            </ScrollView>
            </View>
          </ScrollView>
        </View>
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
