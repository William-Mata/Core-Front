import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoArquivo } from '../../../src/componentes/comuns/CampoArquivo';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { ModalConfirmacao } from '../../../src/componentes/comuns/ModalConfirmacao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { avancarCompetencia, formatarCompetencia, obterCompetenciaAtual, obterIntervaloCompetencia, type CompetenciaFinanceira } from '../../../src/utils/competenciaFinanceira';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import { rateioConfereValorTotalExato, rateioNaoUltrapassaValorTotal } from '../../../src/utils/rateioValidacao';
import {
  RECORRENCIAS_FINANCEIRAS_BASE,
  LIMITE_RECORRENCIA_NORMAL,
  normalizarQuantidadeRecorrencia,
  quantidadeRecorrenciaNormalDentroDoLimite,
  normalizarRecorrenciaBaseFinanceira,
  normalizarRecorrenciaFinanceira,
  obterRotuloRecorrencia,
  obterValorRecorrencia,
  recorrenciaAceitaQuantidade,
  recorrenciaExigeQuantidade,
  type RecorrenciaFinanceiraBaseChave,
  type RecorrenciaFinanceiraChave,
} from '../../../src/utils/recorrenciaFinanceira';
import { SEPARADOR_AREA_SUBAREA, montarChaveAreaSubarea, separarAreaSubarea } from '../../../src/utils/rateioRelacional';
import { ehPagamentoParcelado } from '../../../src/utils/pagamentoParcelado';
import { montarDocumentosPayload, normalizarDocumentosApi, type DocumentoFinanceiro } from '../../../src/utils/documentoUpload';
import {
  aprovarDespesaPendenteApi,
  atualizarDespesaApi,
  cancelarDespesaApi,
  criarDespesaApi,
  efetivarDespesaApi,
  estornarDespesaApi,
  listarCartoesApi,
  listarContasBancariasApi,
  listarAmigosRateioApi,
  listarAreasSubareasRateioApi,
  listarDespesasApi,
  obterDespesaApi,
  rejeitarDespesaPendenteApi,
  type AmigoRateioApi,
  type AreaSubareaRateioApi,
  type CartaoOpcaoApi,
  type ContaBancariaOpcaoApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';

type StatusDespesa = 'pendente' | 'efetivada' | 'cancelada' | 'pendenteAprovacao' | 'rejeitada';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao';
type EscopoAcaoRecorrencia = 'apenasEsta' | 'estaEProximas' | 'todasPendentes';
type EscopoRecorrenciaApi = 1 | 2 | 3;

function obterEscopoRecorrenciaApi(escopo: EscopoAcaoRecorrencia): EscopoRecorrenciaApi {
  const mapaEscopoRecorrencia: Record<EscopoAcaoRecorrencia, EscopoRecorrenciaApi> = {
    apenasEsta: 1,
    estaEProximas: 2,
    todasPendentes: 3,
  };
  return mapaEscopoRecorrencia[escopo];
}

interface LogDespesa {
  id: number;
  data: string;
  acao: string;
  descricao: string;
}

interface DespesaRegistro {
  id: number;
  descricao: string;
  observacao: string;
  dataLancamento: string;
  dataVencimento: string;
  dataEfetivacao?: string;
  tipoDespesa: string;
  tipoPagamento: string;
  recorrencia: RecorrenciaFinanceiraChave;
  recorrenciaBase: RecorrenciaFinanceiraBaseChave;
  recorrenciaFixa: boolean;
  quantidadeRecorrencia: number | null;
  valorTotal: number;
  valorLiquido: number;
  desconto: number;
  acrescimo: number;
  imposto: number;
  juros: number;
  valorEfetivacao?: number;
  status: StatusDespesa;
  amigosRateio: string[];
  tipoRateioAmigos: 'comum' | 'igualitario';
  valorTotalRateioAmigos: number;
  rateioAmigosValores: Record<string, number>;
  areasRateio: string[];
  rateioAreasValores: Record<string, number>;
  rateiosAmigos?: Array<{ amigo: string; valor: number }>;
  rateiosAreaSubarea?: Array<{ area: string; subarea: string; valor: number }>;
  tiposRateio?: string[];
  contaBancaria?: string;
  contaBancariaId?: number;
  cartao?: string;
  cartaoId?: number;
  anexoDocumento: string;
  documentos: DocumentoFinanceiro[];
  logs: LogDespesa[];
}

interface DespesaForm {
  descricao: string;
  observacao: string;
  dataLancamento: string;
  dataVencimento: string;
  dataEfetivacao: string;
  tipoDespesa: string;
  tipoPagamento: string;
  recorrenciaBase: RecorrenciaFinanceiraBaseChave;
  recorrenciaFixa: boolean;
  quantidadeRecorrencia: string;
  valorTotal: string;
  valorLiquido: string;
  desconto: string;
  acrescimo: string;
  imposto: string;
  juros: string;
  valorEfetivacao: string;
  amigosRateio: string[];
  valorTotalRateioAmigos: string;
  rateioAmigosValores: Record<string, string>;
  areasRateio: string[];
  rateioAreasValores: Record<string, string>;
  contaBancaria: string;
  cartao: string;
  anexoDocumento: string;
  documentos: DocumentoFinanceiro[];
}

const tiposDespesa = ['alimentacao', 'transporte', 'moradia', 'lazer', 'saude', 'educacao', 'servicos'] as const;
const tiposPagamento = ['pix', 'cartaoCredito', 'cartaoDebito', 'boleto', 'transferencia', 'dinheiro'] as const;
type TipoRateioAmigos = 'comum' | 'igualitario';
const TIPO_RATEIO_AMIGOS_API: Record<TipoRateioAmigos, 1 | 2> = {
  comum: 1,
  igualitario: 2,
};

function extrairDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}

function formatarMoedaParaInput(valor: number, locale: string) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
}

function aplicarMascaraMoeda(valor: string, locale: string) {
  const numero = Number(extrairDigitos(valor) || '0') / 100;
  return formatarMoedaParaInput(numero, locale);
}

function converterTextoParaNumero(valor: string, locale: string) {
  const decimal = locale.startsWith('en') ? '.' : ',';
  const milhar = locale.startsWith('en') ? ',' : '.';
  const normalizado = valor.split(milhar).join('').replace(decimal, '.').replace(/[^\d.-]/g, '');
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function criarFormularioVazio(locale: string): DespesaForm {
  const hoje = new Date().toISOString().split('T')[0];
  return {
    descricao: '',
    observacao: '',
    dataLancamento: hoje,
    dataVencimento: '',
    dataEfetivacao: hoje,
    tipoDespesa: '',
    tipoPagamento: '',
    recorrenciaBase: 'unica',
    recorrenciaFixa: false,
    quantidadeRecorrencia: '',
    valorTotal: formatarMoedaParaInput(0, locale),
    valorLiquido: formatarMoedaParaInput(0, locale),
    desconto: formatarMoedaParaInput(0, locale),
    acrescimo: formatarMoedaParaInput(0, locale),
    imposto: formatarMoedaParaInput(0, locale),
    juros: formatarMoedaParaInput(0, locale),
    valorEfetivacao: formatarMoedaParaInput(0, locale),
    amigosRateio: [],
    valorTotalRateioAmigos: formatarMoedaParaInput(0, locale),
    rateioAmigosValores: {},
    areasRateio: [],
    rateioAreasValores: {},
    contaBancaria: '',
    cartao: '',
    anexoDocumento: '',
    documentos: [],
  };
}

function calcularValorLiquido(formulario: DespesaForm, locale: string) {
  const calculado =
    converterTextoParaNumero(formulario.valorTotal, locale) -
    converterTextoParaNumero(formulario.desconto, locale) +
    converterTextoParaNumero(formulario.acrescimo, locale) +
    converterTextoParaNumero(formulario.imposto, locale) +
    converterTextoParaNumero(formulario.juros, locale);
  return Math.max(0, Number(calculado.toFixed(2)));
}

function calcularRateioIgualitarioAmigos(amigosRateio: string[], valorTotalRateioAmigos: number, locale: string) {
  const quantidadeParticipantes = amigosRateio.length;
  if (quantidadeParticipantes === 0) return {};
  const valorTotalEmCentavos = Math.round(valorTotalRateioAmigos * 100);
  const valorBaseEmCentavos = Math.floor(valorTotalEmCentavos / quantidadeParticipantes);
  const centavosRestantes = valorTotalEmCentavos - (valorBaseEmCentavos * quantidadeParticipantes);
  return Object.fromEntries(
    amigosRateio.map((amigo, indice) => {
      const recebeCentavoExtra = indice >= quantidadeParticipantes - centavosRestantes;
      const valorRateio = (valorBaseEmCentavos + (recebeCentavoExtra ? 1 : 0)) / 100;
      return [amigo, formatarMoedaParaInput(valorRateio, locale)];
    }),
  );
}

function normalizarTipoRateioAmigos(valor: unknown): TipoRateioAmigos {
  if (valor === 2 || valor === '2') return 'igualitario';
  if (String(valor ?? '').toLowerCase().includes('igual')) return 'igualitario';
  return 'comum';
}

function normalizarStatusDespesa(status: unknown): StatusDespesa {
  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('aprov') || valor.includes('pendente_aprovacao') || valor.includes('pendenteaprovacao')) return 'pendenteAprovacao';
  if (valor.includes('rejeit')) return 'rejeitada';
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('cancel')) return 'cancelada';
  return 'pendente';
}

function normalizarTipoDespesa(valor: unknown): (typeof tiposDespesa)[number] {
  const texto = String(valor ?? '').trim().toLowerCase();
  const tipoEncontrado = tiposDespesa.find((tipo) => tipo.toLowerCase() === texto);
  return tipoEncontrado ?? 'servicos';
}

function normalizarTipoPagamento(valor: unknown): (typeof tiposPagamento)[number] {
  const texto = String(valor ?? '').trim().toLowerCase();
  const mapaTiposPagamentoApi: Record<string, (typeof tiposPagamento)[number]> = {
    pix: 'pix',
    boleto: 'boleto',
    transferencia: 'transferencia',
    dinheiro: 'dinheiro',
    cartaocredito: 'cartaoCredito',
    cartaodebito: 'cartaoDebito',
    credito: 'cartaoCredito',
    debito: 'cartaoDebito',
    teddoc: 'transferencia',
  };
  const chaveNormalizada = texto.replace(/[\s_-]/g, '');
  return mapaTiposPagamentoApi[chaveNormalizada] ?? 'dinheiro';
}


function obterRotuloStatusDespesa(status: StatusDespesa, t: (chave: string) => string): string {
  const chave = `financeiro.despesa.status.${status}`;
  const traduzido = t(chave);
  if (traduzido && traduzido !== chave) return traduzido;

  switch (status) {
    case 'pendenteAprovacao':
      return t('financeiro.comum.status.pendenteAprovacao') !== 'financeiro.comum.status.pendenteAprovacao'
        ? t('financeiro.comum.status.pendenteAprovacao')
        : 'PENDENTE APROVACAO';
    case 'rejeitada':
      return t('financeiro.comum.status.rejeitada') !== 'financeiro.comum.status.rejeitada'
        ? t('financeiro.comum.status.rejeitada')
        : 'REJEITADA';
    default:
      return String(status).toUpperCase();
  }
}

function mapearDespesaApi(item: RegistroFinanceiroApi): DespesaRegistro {
  const dataBase = String(item.dataLancamento ?? item.data ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const valorBase = Number(item.valor ?? item.valorTotal ?? item.valorLiquido ?? 0);
  const desconto = Number(item.desconto ?? 0);
  const acrescimo = Number(item.acrescimo ?? 0);
  const imposto = Number(item.imposto ?? 0);
  const juros = Number(item.juros ?? 0);
  const valorLiquido = Number(item.valorLiquido ?? Math.max(0, valorBase - desconto + acrescimo + imposto + juros));
  const tipoRateioAmigos = normalizarTipoRateioAmigos(item.tipoRateioAmigos ?? item.TipoRateioAmigos);
  const valorTotalRateioAmigos = Number(item.valorTotalRateioAmigos ?? item.ValorTotalRateioAmigos ?? 0);

  const amigosRateioContratoAtual = Array.isArray(item.amigosRateio)
    ? (item.amigosRateio as Array<Record<string, unknown>>)
        .map((rateio) => ({
          amigo: String(rateio.nome ?? rateio.amigoNome ?? (rateio.amigoId ? `#${String(rateio.amigoId)}` : '')).trim(),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.amigo))
    : [];
  const amigosRateioLegado = Array.isArray(item.amigosRateio)
    ? (item.amigosRateio as unknown[]).filter((entrada): entrada is string => typeof entrada === 'string')
    : [];
  const rateioAmigosValoresLegado = (item.rateioAmigosValores as Record<string, number>) || {};
  const rateiosAmigosApi = Array.isArray(item.rateiosAmigos)
    ? (item.rateiosAmigos as Array<Record<string, unknown>>)
        .map((rateio) => ({
          amigo: String(rateio.amigo ?? rateio.nome ?? rateio.amigoNome ?? (rateio.amigoId ? `#${String(rateio.amigoId)}` : '')).trim(),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.amigo))
    : [];
  const rateiosAmigosConsolidados =
    rateiosAmigosApi.length > 0
      ? rateiosAmigosApi
      : amigosRateioContratoAtual.length > 0
        ? amigosRateioContratoAtual
        : amigosRateioLegado.map((amigo) => ({ amigo, valor: Number(rateioAmigosValoresLegado[amigo] ?? 0) }));
  const amigosRateio = rateiosAmigosConsolidados.map((rateio) => rateio.amigo);
  const rateioAmigosValores =
    rateiosAmigosConsolidados.length > 0
      ? Object.fromEntries(rateiosAmigosConsolidados.map((rateio) => [rateio.amigo, rateio.valor]))
      : Object.fromEntries(amigosRateio.map((amigo) => [amigo, Number(rateioAmigosValoresLegado[amigo] ?? 0)]));

  const areasSubAreasRateioContratoAtual = Array.isArray(item.areasSubAreasRateio)
    ? (item.areasSubAreasRateio as Array<Record<string, unknown>>)
        .map((rateio) => ({
          area: String(rateio.areaNome ?? rateio.area ?? '').trim(),
          subarea: String(rateio.subAreaNome ?? rateio.subarea ?? '').trim(),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.area) && Boolean(rateio.subarea))
    : [];
  const areasRateioLegadoBase = Array.isArray(item.areasRateio)
    ? (item.areasRateio as string[])
    : Array.isArray(item.tiposRateio)
      ? (item.tiposRateio as string[])
      : [];
  const rateioAreasValoresLegado = (item.rateioAreasValores as Record<string, number>) || {};
  const rateiosAreaSubareaApi = Array.isArray(item.rateiosAreaSubarea)
    ? (item.rateiosAreaSubarea as Array<Record<string, unknown>>)
        .map((rateio) => ({
          area: String(rateio.area ?? '').trim(),
          subarea: String(rateio.subarea ?? '').trim(),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.area) && Boolean(rateio.subarea))
    : [];
  const rateiosAreaSubareaConsolidados =
    rateiosAreaSubareaApi.length > 0 ? rateiosAreaSubareaApi : areasSubAreasRateioContratoAtual;
  const areasRateio =
    rateiosAreaSubareaConsolidados.length > 0
      ? rateiosAreaSubareaConsolidados.map((rateio) => montarChaveAreaSubarea(rateio.area, rateio.subarea))
      : areasRateioLegadoBase.map((area) =>
          area.includes(SEPARADOR_AREA_SUBAREA) ? area : montarChaveAreaSubarea(area, area),
        );
  const rateioAreasValores =
    rateiosAreaSubareaConsolidados.length > 0
      ? Object.fromEntries(
          rateiosAreaSubareaConsolidados.map((rateio) => [montarChaveAreaSubarea(rateio.area, rateio.subarea), rateio.valor]),
        )
      : Object.fromEntries(
          areasRateio.map((chave) => [
            chave,
            Number(rateioAreasValoresLegado[chave] ?? rateioAreasValoresLegado[chave.replace(SEPARADOR_AREA_SUBAREA, ' / ')] ?? 0),
          ]),
        );

  const documentos = normalizarDocumentosApi(item.documentos);
  const contaBancariaIdNormalizada = Number(item.contaBancariaId ?? NaN);
  const cartaoIdNormalizado = Number(item.cartaoId ?? NaN);
  const contaBancariaBruta = String(item.contaBancaria ?? '').trim();
  const cartaoBruto = String(item.cartao ?? '').trim();
  const contaBancariaNome = contaBancariaBruta && contaBancariaBruta !== String(contaBancariaIdNormalizada)
    ? contaBancariaBruta
    : undefined;
  const cartaoNome = cartaoBruto && cartaoBruto !== String(cartaoIdNormalizado)
    ? cartaoBruto
    : undefined;

  return {
    id: Number(item.id),
    descricao: String(item.descricao ?? item.titulo ?? `Despesa ${item.id}`),
    observacao: String(item.observacao ?? item.descricao ?? ''),
    dataLancamento: dataBase,
    dataVencimento: String(item.dataVencimento ?? dataBase).slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
    tipoDespesa: normalizarTipoDespesa(item.tipoDespesa ?? item.categoria),
    tipoPagamento: normalizarTipoPagamento(item.tipoPagamento),
    recorrencia: normalizarRecorrenciaFinanceira(item.recorrencia),
    recorrenciaBase: normalizarRecorrenciaBaseFinanceira(
      item.recorrencia ?? item.recorrenciaBase ?? item.frequenciaRecorrencia,
      'unica',
    ),
    recorrenciaFixa: Boolean(item.recorrenciaFixa) && normalizarRecorrenciaFinanceira(item.recorrencia ?? item.recorrenciaBase ?? item.frequenciaRecorrencia) !== 'unica',
    quantidadeRecorrencia: normalizarQuantidadeRecorrencia(item.quantidadeParcelas ?? item.quantidadeRecorrencia),
    valorTotal: valorBase,
    valorLiquido,
    desconto,
    acrescimo,
    imposto,
    juros,
    valorEfetivacao: item.valorEfetivacao ? Number(item.valorEfetivacao) : undefined,
    status: normalizarStatusDespesa(item.status),
    amigosRateio,
    tipoRateioAmigos,
    valorTotalRateioAmigos,
    rateioAmigosValores,
    areasRateio,
    rateioAreasValores,
    rateiosAmigos: amigosRateio.map((amigo) => ({ amigo, valor: Number(rateioAmigosValores[amigo] ?? 0) })),
    rateiosAreaSubarea: areasRateio.map((chave) => {
      const { area, subarea } = separarAreaSubarea(chave);
      return { area, subarea, valor: Number(rateioAreasValores[chave] ?? 0) };
    }),
    tiposRateio: areasRateio.map((chave) => separarAreaSubarea(chave).area),
    contaBancaria: contaBancariaNome,
    contaBancariaId: Number.isFinite(contaBancariaIdNormalizada) && contaBancariaIdNormalizada > 0
      ? contaBancariaIdNormalizada
      : undefined,
    cartao: cartaoNome,
    cartaoId: Number.isFinite(cartaoIdNormalizado) && cartaoIdNormalizado > 0
      ? cartaoIdNormalizado
      : undefined,
    anexoDocumento: documentos[0]?.nomeArquivo ?? String(item.anexoDocumento ?? ''),
    documentos,
    logs: Array.isArray(item.logs)
      ? (item.logs as LogDespesa[])
      : [{ id: 1, data: dataBase, acao: 'IMPORTADA', descricao: 'Registro carregado da API.' }],
  };
}

export default function TelaDespesa() {
  const router = useRouter();
  const { t } = usarTraducao();
  const { usuario, usuarioSimulado, estaSimulando } = usarAutenticacaoStore();
  const locale = obterLocaleAtivo();
  const participanteRateioLegado = t('financeiro.comum.campos.participanteRateioPadrao');
  const nomeUsuarioRateio = (estaSimulando ? usuarioSimulado?.nome : usuario?.nome) ?? usuario?.nome ?? '';
  const participanteRateioPadrao = nomeUsuarioRateio.trim() || participanteRateioLegado;
  const idUsuarioRateio = (estaSimulando ? usuarioSimulado?.id : usuario?.id) ?? usuario?.id ?? 0;
  const params = useLocalSearchParams();
  const idParamBruto = Array.isArray(params.id) ? params.id[0] : params.id;
  const idParam = idParamBruto ? Number(idParamBruto) : null;

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [versaoConsulta, setVersaoConsulta] = useState(0);
  const [competencia, setCompetencia] = useState<CompetenciaFinanceira>(() => obterCompetenciaAtual());
  const [modoTela, setModoTela] = useState<ModoTela>(idParam ? 'visualizacao' : 'lista');
  const [despesaSelecionadaId, setDespesaSelecionadaId] = useState<number | null>(idParam);
  const [despesas, setDespesas] = useState<DespesaRegistro[]>([]);
  const [formulario, setFormulario] = useState<DespesaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [tipoRateioAmigos, setTipoRateioAmigos] = useState<TipoRateioAmigos>('comum');
  const tipoRateioAmigosRef = useRef<TipoRateioAmigos>('comum');
  const [novoAmigoRateio, setNovoAmigoRateio] = useState(participanteRateioPadrao);
  const [novoValorAmigoRateio, setNovoValorAmigoRateio] = useState(() => formatarMoedaParaInput(0, locale));
  const [novaAreaRateio, setNovaAreaRateio] = useState('');
  const [novaSubareaRateio, setNovaSubareaRateio] = useState('');
  const [novoValorAreaRateio, setNovoValorAreaRateio] = useState(() => formatarMoedaParaInput(0, locale));
  const [opcoesAmigosRateioApi, setOpcoesAmigosRateioApi] = useState<AmigoRateioApi[]>([]);
  const [opcoesAreasSubareasApi, setOpcoesAreasSubareasApi] = useState<AreaSubareaRateioApi[]>([]);
  const [opcoesContasBancariasApi, setOpcoesContasBancariasApi] = useState<ContaBancariaOpcaoApi[]>([]);
  const [opcoesCartoesApi, setOpcoesCartoesApi] = useState<CartaoOpcaoApi[]>([]);
  const [secaoRateioExpandida, setSecaoRateioExpandida] = useState(true);
  const [despesaPendenteCancelamento, setDespesaPendenteCancelamento] = useState<DespesaRegistro | null>(null);
  const [despesaPendenteEdicaoRecorrente, setDespesaPendenteEdicaoRecorrente] = useState<DespesaRegistro | null>(null);
  const [escopoCancelamentoRecorrente, setEscopoCancelamentoRecorrente] = useState<EscopoAcaoRecorrencia>('apenasEsta');
  const [escopoEdicaoRecorrente, setEscopoEdicaoRecorrente] = useState<EscopoAcaoRecorrencia>('apenasEsta');
  const [salvandoDespesa, setSalvandoDespesa] = useState(false);
  const [cancelandoDespesa, setCancelandoDespesa] = useState(false);
  const definirTipoRateioAmigos = (valor: TipoRateioAmigos) => {
    tipoRateioAmigosRef.current = valor;
    setTipoRateioAmigos(valor);
  };

  const despesaSelecionada = despesas.find((despesa) => despesa.id === despesaSelecionadaId) ?? null;
  const areasCatalogo = useMemo(() => opcoesAreasSubareasApi.filter((item) => item.tipo === 'despesa'), [opcoesAreasSubareasApi]);
  const opcoesAmigosRateio = useMemo(() => {
    const amigosApi = Array.from(new Set(opcoesAmigosRateioApi.map((item) => item.nome).filter(Boolean))).sort();
    return [participanteRateioPadrao, ...amigosApi.filter((nome) => nome !== participanteRateioPadrao)];
  }, [opcoesAmigosRateioApi, participanteRateioPadrao]);
  const obterIdAmigoRateio = (amigoNome: string) => {
    if (amigoNome === participanteRateioPadrao || amigoNome === participanteRateioLegado) return idUsuarioRateio;
    return opcoesAmigosRateioApi.find((item) => item.nome === amigoNome)?.id ?? 0;
  };
  useEffect(() => {
    if (!opcoesAmigosRateio.includes(novoAmigoRateio)) {
      setNovoAmigoRateio(participanteRateioPadrao);
    }
  }, [novoAmigoRateio, opcoesAmigosRateio, participanteRateioPadrao]);
  const opcoesAreasRateio = useMemo(() => Array.from(new Set([...areasCatalogo.map((item) => item.nome), ...despesas.flatMap((despesa) => despesa.areasRateio.map((chave) => separarAreaSubarea(chave).area)).filter(Boolean)])).sort(), [areasCatalogo, despesas]);
  const mapaContasBancariasPorId = useMemo(
    () => new Map(opcoesContasBancariasApi.map((item) => [item.id, item.nome])),
    [opcoesContasBancariasApi],
  );
  const mapaCartoesPorId = useMemo(
    () => new Map(opcoesCartoesApi.map((item) => [item.id, item.nome])),
    [opcoesCartoesApi],
  );
  const opcoesContaBancaria = useMemo(
    () =>
      Array.from(
        new Set([
          ...opcoesContasBancariasApi.map((item) => item.nome),
          ...despesas.map((despesa) => {
            const nomeConta = despesa.contaBancaria?.trim();
            if (nomeConta) return nomeConta;
            if (!despesa.contaBancariaId) return '';
            return mapaContasBancariasPorId.get(despesa.contaBancariaId) ?? '';
          }),
        ].filter((conta) => Boolean(conta.trim()))),
      ).sort(),
    [opcoesContasBancariasApi, despesas, mapaContasBancariasPorId],
  );
  const opcoesCartao = useMemo(
    () =>
      Array.from(
        new Set([
          ...opcoesCartoesApi.map((item) => item.nome),
          ...despesas.map((despesa) => {
            const nomeCartao = despesa.cartao?.trim();
            if (nomeCartao) return nomeCartao;
            if (!despesa.cartaoId) return '';
            return mapaCartoesPorId.get(despesa.cartaoId) ?? '';
          }),
        ].filter((cartao) => Boolean(cartao.trim()))),
      ).sort(),
    [opcoesCartoesApi, despesas, mapaCartoesPorId],
  );
  const pagamentoComParcelas = ehPagamentoParcelado(formulario.tipoPagamento);
  const tipoPagamentoExigeContaBancaria = formulario.tipoPagamento === 'pix' || formulario.tipoPagamento === 'transferencia';
  const tipoPagamentoExigeCartao = formulario.tipoPagamento === 'cartaoCredito' || formulario.tipoPagamento === 'cartaoDebito';
  const contaBancariaIdSelecionada = useMemo(() => {
    const valorSelecionado = formulario.contaBancaria.trim();
    if (!valorSelecionado) return undefined;
    const idDireto = Number(valorSelecionado);
    if (Number.isFinite(idDireto) && idDireto > 0) return idDireto;
    const conta = opcoesContasBancariasApi.find((item) => item.nome === valorSelecionado);
    return conta?.id;
  }, [formulario.contaBancaria, opcoesContasBancariasApi]);
  const cartaoIdSelecionado = useMemo(() => {
    const valorSelecionado = formulario.cartao.trim();
    if (!valorSelecionado) return undefined;
    const idDireto = Number(valorSelecionado);
    if (Number.isFinite(idDireto) && idDireto > 0) return idDireto;
    const cartao = opcoesCartoesApi.find((item) => item.nome === valorSelecionado);
    return cartao?.id;
  }, [formulario.cartao, opcoesCartoesApi]);
  const tipoPagamentoComContaOuCartaoOpcional = Boolean(formulario.tipoPagamento) && !tipoPagamentoExigeContaBancaria && !tipoPagamentoExigeCartao;
  const ocultarContaBancariaPagamentoOpcional = tipoPagamentoComContaOuCartaoOpcional && Boolean(formulario.cartao);
  const ocultarCartaoPagamentoOpcional = tipoPagamentoComContaOuCartaoOpcional && Boolean(formulario.contaBancaria);
  const exibeContaBancariaPagamento = (tipoPagamentoExigeContaBancaria || tipoPagamentoComContaOuCartaoOpcional) && !ocultarContaBancariaPagamentoOpcional;
  const exibeCartaoPagamento = (tipoPagamentoExigeCartao || tipoPagamentoComContaOuCartaoOpcional) && !ocultarCartaoPagamentoOpcional;
  const quantidadeRecorrenciaObrigatoria = pagamentoComParcelas || (!formulario.recorrenciaFixa && recorrenciaExigeQuantidade(formulario.recorrenciaBase));
  const exibirQuantidadeRecorrencia = pagamentoComParcelas || (!formulario.recorrenciaFixa && recorrenciaAceitaQuantidade(formulario.recorrenciaBase));
  const rotuloQuantidadeRecorrencia = pagamentoComParcelas
    ? t('financeiro.comum.campos.quantidadeParcelas')
    : t('financeiro.comum.campos.quantidadeRecorrencia');

  const mensagemLimiteRecorrenciaNormal = t('financeiro.comum.mensagens.limiteRecorrenciaNormal').replace('{limite}', String(LIMITE_RECORRENCIA_NORMAL));
  const competenciaLabel = useMemo(() => formatarCompetencia(competencia, locale), [competencia, locale]);
  const competenciaConsulta = useMemo(() => `${String(competencia.ano)}-${String(competencia.mes).padStart(2, '0')}`, [competencia.ano, competencia.mes]);
  const opcoesEscopoCancelamentoRecorrencia = useMemo(() => ([
    { valor: 'apenasEsta', rotulo: t('financeiro.comum.opcoesEscopoCancelamentoRecorrencia.apenasEsta') },
    { valor: 'estaEProximas', rotulo: t('financeiro.comum.opcoesEscopoCancelamentoRecorrencia.estaEProximas') },
    { valor: 'todasPendentes', rotulo: t('financeiro.comum.opcoesEscopoCancelamentoRecorrencia.todasPendentes') },
  ]), [t]);
  const opcoesEscopoEdicaoRecorrencia = useMemo(() => ([
    { valor: 'apenasEsta', rotulo: t('financeiro.comum.opcoesEscopoEdicaoRecorrencia.apenasEsta') },
    { valor: 'estaEProximas', rotulo: t('financeiro.comum.opcoesEscopoEdicaoRecorrencia.estaEProximas') },
    { valor: 'todasPendentes', rotulo: t('financeiro.comum.opcoesEscopoEdicaoRecorrencia.todasPendentes') },
  ]), [t]);

  const opcoesSubareasRateio = useMemo(() => {
    if (!novaAreaRateio) return [];
    const subareasApi = areasCatalogo.find((item) => item.nome === novaAreaRateio)?.subAreas.map((item) => item.nome) ?? [];
    const subareasHistoricas = despesas
      .flatMap((despesa) => despesa.areasRateio)
      .map((chave) => separarAreaSubarea(chave))
      .filter((item) => item.area === novaAreaRateio)
      .map((item) => item.subarea);
    return Array.from(new Set([...subareasApi, ...subareasHistoricas].filter(Boolean))).sort();
  }, [novaAreaRateio, areasCatalogo, despesas]);

  const ehDespesaRecorrente = (despesa: DespesaRegistro | null) =>
    Boolean(
      despesa
      && (
        despesa.recorrenciaBase !== 'unica'
        || despesa.recorrenciaFixa
        || (despesa.quantidadeRecorrencia ?? 0) > 1
      ),
    );

  const carregarDespesasApi = async (signal?: AbortSignal) => {
    try {
      const periodoCompetencia = obterIntervaloCompetencia(competencia);
      const dataInicio = filtroAplicado.dataInicio || periodoCompetencia.dataInicio;
      const dataFim = filtroAplicado.dataFim || periodoCompetencia.dataFim;
      const dados = await listarDespesasApi({
        signal,
        id: filtroAplicado.id.trim() || undefined,
        descricao: filtroAplicado.descricao.trim() || undefined,
        dataInicio,
        dataFim,
        competencia: competenciaConsulta,
        VerificarUltimaRecorrencia: true,
      });
      setDespesas(dados.map(mapearDespesaApi));
    } catch {
      setDespesas([]);
    }
  };

  const carregarOpcoesRateioApi = async () => {
    const [resultadoAmigos, resultadoAreas, resultadoContas, resultadoCartoes] = await Promise.allSettled([
      listarAmigosRateioApi({ competencia: competenciaConsulta }),
      listarAreasSubareasRateioApi({ competencia: competenciaConsulta }),
      listarContasBancariasApi({ competencia: competenciaConsulta }),
      listarCartoesApi({ competencia: competenciaConsulta }),
    ]);

    setOpcoesAmigosRateioApi(resultadoAmigos.status === 'fulfilled' ? resultadoAmigos.value : []);
    setOpcoesAreasSubareasApi(resultadoAreas.status === 'fulfilled' ? resultadoAreas.value : []);
    setOpcoesContasBancariasApi(resultadoContas.status === 'fulfilled' ? resultadoContas.value : []);
    setOpcoesCartoesApi(resultadoCartoes.status === 'fulfilled' ? resultadoCartoes.value : []);
  };

  useEffect(() => {
    const controller = new AbortController();
    void carregarDespesasApi(controller.signal);
    return () => controller.abort();
  }, [competencia.ano, competencia.mes, filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, versaoConsulta]);

  useEffect(() => {
    void carregarOpcoesRateioApi();
  }, [competenciaConsulta]);

  useEffect(() => {
    if (!novaAreaRateio) return;
    if (opcoesSubareasRateio.length === 0) {
      setNovaSubareaRateio('');
      return;
    }
    if (!opcoesSubareasRateio.includes(novaSubareaRateio)) {
      setNovaSubareaRateio('');
    }
  }, [novaAreaRateio, novaSubareaRateio, opcoesSubareasRateio]);

  useEffect(() => {
    if (!idParam) return;
    setModoTela('visualizacao');
    void carregarDespesaPorId(idParam);
  }, [idParam]);

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((despesa) => {
      const bateId = !filtroAplicado.id || String(despesa.id).includes(filtroAplicado.id);
      const termo = filtroAplicado.descricao.trim().toLowerCase();
      const tipoTraduzido = t(`financeiro.despesa.tipoDespesa.${despesa.tipoDespesa}`).toLowerCase();
      const statusTraduzido = obterRotuloStatusDespesa(despesa.status, t).toLowerCase();
      const bateDescricao =
        !termo ||
        despesa.descricao.toLowerCase().includes(termo) ||
        despesa.observacao.toLowerCase().includes(termo) ||
        tipoTraduzido.includes(termo) ||
        statusTraduzido.includes(termo);
      const bateData = estaDentroIntervalo(despesa.dataLancamento, filtroAplicado.dataInicio, filtroAplicado.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [despesas, filtroAplicado, t]);

  const atualizarCampoMoeda = (campo: keyof DespesaForm, valor: string) => {
    setCamposInvalidos((atual) => ({ ...atual, [campo]: false }));
    setFormulario((atual) => {
      const atualizado = { ...atual, [campo]: aplicarMascaraMoeda(valor, locale) };
      const valorLiquido = calcularValorLiquido(atualizado, locale);
      return {
        ...atualizado,
        valorLiquido: formatarMoedaParaInput(valorLiquido, locale),
        valorEfetivacao: formatarMoedaParaInput(valorLiquido, locale),
      };
    });
  };

  const preencherFormulario = (despesa: DespesaRegistro) => {
    definirTipoRateioAmigos(despesa.tipoRateioAmigos);
    setFormulario({
      descricao: despesa.descricao,
      observacao: despesa.observacao,
      dataLancamento: despesa.dataLancamento,
      dataVencimento: despesa.dataVencimento,
      dataEfetivacao: despesa.dataEfetivacao || new Date().toISOString().split('T')[0],
      tipoDespesa: despesa.tipoDespesa,
      tipoPagamento: despesa.tipoPagamento,
      recorrenciaBase: despesa.recorrenciaBase,
      recorrenciaFixa: despesa.recorrenciaFixa,
      quantidadeRecorrencia: despesa.quantidadeRecorrencia ? String(despesa.quantidadeRecorrencia) : '',
      valorTotal: formatarMoedaParaInput(despesa.valorTotal, locale),
      valorLiquido: formatarMoedaParaInput(despesa.valorLiquido, locale),
      desconto: formatarMoedaParaInput(despesa.desconto, locale),
      acrescimo: formatarMoedaParaInput(despesa.acrescimo, locale),
      imposto: formatarMoedaParaInput(despesa.imposto, locale),
      juros: formatarMoedaParaInput(despesa.juros, locale),
      valorEfetivacao: formatarMoedaParaInput(despesa.valorEfetivacao ?? despesa.valorLiquido, locale),
      amigosRateio: despesa.amigosRateio,
      valorTotalRateioAmigos: formatarMoedaParaInput(despesa.valorTotalRateioAmigos, locale),
      rateioAmigosValores: Object.fromEntries(Object.entries(despesa.rateioAmigosValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      areasRateio: despesa.areasRateio,
      rateioAreasValores: Object.fromEntries(Object.entries(despesa.rateioAreasValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      contaBancaria: despesa.contaBancaria?.trim()
        ? despesa.contaBancaria
        : (despesa.contaBancariaId ? (mapaContasBancariasPorId.get(despesa.contaBancariaId) ?? '') : ''),
      cartao: despesa.cartao?.trim()
        ? despesa.cartao
        : (despesa.cartaoId ? (mapaCartoesPorId.get(despesa.cartaoId) ?? '') : ''),
      anexoDocumento: despesa.anexoDocumento,
      documentos: despesa.documentos,
    });
  };

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };


  const carregarDespesaPorId = async (id: number) => {
    try {
      const detalhe = await obterDespesaApi(id);
      const despesaCompleta = mapearDespesaApi(detalhe);
      setDespesas((atual) => {
        const indice = atual.findIndex((item) => item.id === despesaCompleta.id);
        if (indice < 0) return [...atual, despesaCompleta];
        const proximo = [...atual];
        proximo[indice] = despesaCompleta;
        return proximo;
      });
      setDespesaSelecionadaId(despesaCompleta.id);
      preencherFormulario(despesaCompleta);
      return despesaCompleta;
    } catch {
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const abrirNovo = () => {
    setDespesaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    setModoTela('novo');
  };

  const abrirVisualizacao = (despesa: DespesaRegistro) => {
    setModoTela('visualizacao');
    void carregarDespesaPorId(despesa.id);
  };

  const abrirEdicao = (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendente') {
      notificarErro( t('financeiro.despesa.mensagens.edicaoSomentePendente'));
      return;
    }
    setModoTela('edicao');
    void carregarDespesaPorId(despesa.id);
  };

  const abrirEfetivacao = (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendente') {
      notificarErro( t('financeiro.despesa.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setModoTela('efetivacao');
    void carregarDespesaPorId(despesa.id);
  };

  const serializarValores = (valores: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(valores)
        .filter(([, valor]) => Boolean(valor))
        .map(([chave, valor]) => [chave, converterTextoParaNumero(valor, locale)]),
    );

  const adicionarRateioAmigo = () => {
    const amigo = novoAmigoRateio.trim();
    if (!amigo) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
      return;
    }
    const amigoId = obterIdAmigoRateio(amigo);
    if (amigoId <= 0) {
      notificarErro('amigo_invalido');
      return;
    }
    const valorTotalRateioAmigos = converterTextoParaNumero(formulario.valorTotalRateioAmigos, locale);
    if (valorTotalRateioAmigos <= 0) {
      setCamposInvalidos((atual) => ({ ...atual, valorTotalRateioAmigos: true }));
      notificarErro(t('financeiro.despesa.mensagens.valorObrigatorio'));
      return;
    }
    if (tipoRateioAmigos === 'igualitario') {
      setFormulario((atual) => {
        const amigoExistente = atual.amigosRateio.find((nome) => obterIdAmigoRateio(nome) === amigoId);
        const chaveAmigo = amigoExistente ?? amigo;
        const amigosRateio = amigoExistente ? atual.amigosRateio : [...atual.amigosRateio, chaveAmigo];
        return {
          ...atual,
          amigosRateio,
          rateioAmigosValores: calcularRateioIgualitarioAmigos(amigosRateio, valorTotalRateioAmigos, locale),
        };
      });
      setNovoAmigoRateio(participanteRateioPadrao);
      setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
      return;
    }
    const valor = converterTextoParaNumero(novoValorAmigoRateio, locale);
    if (valor <= 0) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
      return;
    }
    const amigoExistente = formulario.amigosRateio.find((nome) => obterIdAmigoRateio(nome) === amigoId);
    const chaveAmigo = amigoExistente ?? amigo;
    const amigosRateioPropostos = amigoExistente ? formulario.amigosRateio : [...formulario.amigosRateio, chaveAmigo];
    const rateioAmigosValoresPropostos = {
      ...serializarValores(formulario.rateioAmigosValores),
      [chaveAmigo]: valor,
    };
    if (!rateioNaoUltrapassaValorTotal(valorTotalRateioAmigos, amigosRateioPropostos, rateioAmigosValoresPropostos)) {
      notificarErro(t('financeiro.comum.mensagens.rateioDeveBaterValorTotal'));
      return;
    }

    setFormulario((atual) => {
      const amigoExistenteAtual = atual.amigosRateio.find((nome) => obterIdAmigoRateio(nome) === amigoId);
      const chaveAmigoAtual = amigoExistenteAtual ?? amigo;
      const amigosRateio = amigoExistenteAtual ? atual.amigosRateio : [...atual.amigosRateio, chaveAmigoAtual];
      return {
        ...atual,
        amigosRateio,
        rateioAmigosValores: {
          ...atual.rateioAmigosValores,
          [chaveAmigoAtual]: formatarMoedaParaInput(valor, locale),
        },
      };
    });

    setNovoAmigoRateio(participanteRateioPadrao);
    setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
  };

  const aplicarRateioIgualitarioAmigos = () => {
    if (formulario.amigosRateio.length === 0) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
      return;
    }

    const valorTotalRateioAmigos = converterTextoParaNumero(formulario.valorTotalRateioAmigos, locale);
    if (valorTotalRateioAmigos <= 0) {
      notificarErro(t('financeiro.despesa.mensagens.valorObrigatorio'));
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      rateioAmigosValores: calcularRateioIgualitarioAmigos(atual.amigosRateio, valorTotalRateioAmigos, locale),
    }));
  };

  const removerRateioAmigo = (amigo: string) => {
    setFormulario((atual) => {
      const proximoValores = { ...atual.rateioAmigosValores };
      delete proximoValores[amigo];
      return {
        ...atual,
        amigosRateio: atual.amigosRateio.filter((nome) => nome !== amigo),
        rateioAmigosValores: proximoValores,
      };
    });
  };

  const adicionarRateioAreaSubarea = () => {
    const area = novaAreaRateio.trim();
    const subarea = novaSubareaRateio.trim();
    const valor = converterTextoParaNumero(novoValorAreaRateio, locale);

    if (!area || !subarea || valor <= 0) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
      return;
    }

    const chave = montarChaveAreaSubarea(area, subarea);

    setFormulario((atual) => {
      const areasRateio = atual.areasRateio.includes(chave) ? atual.areasRateio : [...atual.areasRateio, chave];
      return {
        ...atual,
        areasRateio,
        rateioAreasValores: {
          ...atual.rateioAreasValores,
          [chave]: formatarMoedaParaInput(valor, locale),
        },
      };
    });

    setNovaAreaRateio('');
    setNovaSubareaRateio('');
    setNovoValorAreaRateio(formatarMoedaParaInput(0, locale));
  };

  const removerRateioAreaSubarea = (chave: string) => {
    setFormulario((atual) => {
      const proximoValores = { ...atual.rateioAreasValores };
      delete proximoValores[chave];
      return {
        ...atual,
        areasRateio: atual.areasRateio.filter((item) => item !== chave),
        rateioAreasValores: proximoValores,
      };
    });
  };

  const validarFormularioBase = () => {
    const invalidos: Record<string, boolean> = {};
    const dataLancamento = formulario.dataLancamento;
    const dataVencimento = formulario.dataVencimento;
    const quantidadeRecorrencia = normalizarQuantidadeRecorrencia(formulario.quantidadeRecorrencia);

    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!dataLancamento) invalidos.dataLancamento = true;
    if (!dataVencimento) invalidos.dataVencimento = true;
    if (!formulario.tipoDespesa) invalidos.tipoDespesa = true;
    if (!formulario.tipoPagamento) invalidos.tipoPagamento = true;
    if (tipoPagamentoExigeContaBancaria && !contaBancariaIdSelecionada) invalidos.contaBancaria = true;
    if (tipoPagamentoExigeCartao && !cartaoIdSelecionado) invalidos.cartao = true;
    if (formulario.contaBancaria && formulario.cartao) {
      invalidos.contaBancaria = true;
      invalidos.cartao = true;
    }
    if (quantidadeRecorrenciaObrigatoria && !quantidadeRecorrencia) invalidos.quantidadeRecorrencia = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.despesa.mensagens.obrigatorio'));
      return null;
    }

    if (quantidadeRecorrenciaObrigatoria && !quantidadeRecorrencia) {
      setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: true }));
      notificarErro(t('financeiro.comum.mensagens.quantidadeRecorrenciaMaiorQueZero'));
      return null;
    }

    if (!formulario.recorrenciaFixa && formulario.recorrenciaBase !== 'unica' && !quantidadeRecorrenciaNormalDentroDoLimite(quantidadeRecorrencia)) {
      setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: true }));
      notificarErro(mensagemLimiteRecorrenciaNormal);
      return null;
    }


    if (dataIsoMaiorQue(dataLancamento, dataVencimento)) {
      setCamposInvalidos((atual) => ({ ...atual, dataVencimento: true }));
      notificarErro(t('financeiro.despesa.mensagens.dataVencimentoMaiorQueLancamento'));
      return null;
    }

    const valorTotal = converterTextoParaNumero(formulario.valorTotal, locale);
    if (!valorTotal) {
      setCamposInvalidos((atual) => ({ ...atual, valorTotal: true }));
      notificarErro( t('financeiro.despesa.mensagens.valorObrigatorio'));
      return null;
    }
    const valorLiquido = calcularValorLiquido(formulario, locale);
    const rateioAmigosValores = serializarValores(formulario.rateioAmigosValores);
    const rateioAreasValores = serializarValores(formulario.rateioAreasValores);

    if (formulario.amigosRateio.some((amigoNome) => obterIdAmigoRateio(amigoNome) <= 0)) {
      notificarErro('amigo_invalido');
      return;
    }

    let valorTotalRateioAmigos = 0;
    if (formulario.amigosRateio.length > 0) {
      valorTotalRateioAmigos = converterTextoParaNumero(formulario.valorTotalRateioAmigos, locale);
      if (valorTotalRateioAmigos <= 0) {
        setCamposInvalidos((atual) => ({ ...atual, valorTotalRateioAmigos: true }));
        notificarErro(t('financeiro.despesa.mensagens.valorObrigatorio'));
        return null;
      }
      if (valorTotalRateioAmigos <= valorLiquido) {
        setCamposInvalidos((atual) => ({ ...atual, valorTotalRateioAmigos: true }));
        notificarErro(t('financeiro.comum.mensagens.valorTotalRateioAmigosMaiorQueValorLiquido'));
        return null;
      }
    }

    if (!rateioConfereValorTotalExato(valorTotalRateioAmigos, formulario.amigosRateio, rateioAmigosValores)) {
      notificarErro(t('financeiro.comum.mensagens.rateioDeveBaterValorTotal'));
      return null;
    }

    if (!rateioConfereValorTotalExato(valorTotal, formulario.areasRateio, rateioAreasValores)) {
      notificarErro(t('financeiro.comum.mensagens.rateioDeveBaterValorTotal'));
      return null;
    }

    return {
      dataLancamento,
      dataVencimento,
      valorTotal,
      valorLiquido,
      desconto: converterTextoParaNumero(formulario.desconto, locale),
      acrescimo: converterTextoParaNumero(formulario.acrescimo, locale),
      imposto: converterTextoParaNumero(formulario.imposto, locale),
      juros: converterTextoParaNumero(formulario.juros, locale),
      quantidadeRecorrencia,
      valorTotalRateioAmigos,
      rateioAmigosValores: serializarValores(formulario.rateioAmigosValores),
      rateioAreasValores: serializarValores(formulario.rateioAreasValores),
    };
  };

  const resetarTela = () => {
    setModoTela('lista');
    setDespesaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    definirTipoRateioAmigos('comum');
    setNovoAmigoRateio(participanteRateioPadrao);
    setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
    setNovaAreaRateio('');
    setNovaSubareaRateio('');
    setNovoValorAreaRateio(formatarMoedaParaInput(0, locale));
    setDespesaPendenteEdicaoRecorrente(null);
    setEscopoEdicaoRecorrente('apenasEsta');
    setEscopoCancelamentoRecorrente('apenasEsta');
  };

  const salvarCadastroOuEdicao = async (escopoEdicao: EscopoAcaoRecorrencia = 'apenasEsta') => {
    const base = validarFormularioBase();
    if (!base) return;

    const amigos = formulario.amigosRateio
      .map((amigoNome) => {
        const amigoId = obterIdAmigoRateio(amigoNome);
        return {
          amigoId,
          valor: Number(base.rateioAmigosValores[amigoNome] ?? 0),
        };
      })
      .filter((item) => Number(item.amigoId) > 0 && item.valor > 0) as Array<{ amigoId: number; valor: number }>;

    const areasRateioPayload = formulario.areasRateio
      .map((chave) => {
        const { area, subarea } = separarAreaSubarea(chave);
        const areaCatalogo = areasCatalogo.find((item) => item.nome === area);
        const subAreaCatalogo = areaCatalogo?.subAreas.find((item) => item.nome === subarea);
        return areaCatalogo && subAreaCatalogo
          ? { areaId: areaCatalogo.id, subAreaId: subAreaCatalogo.id, valor: Number(base.rateioAreasValores[chave] ?? 0) }
          : null;
      })
      .filter((item) => item && item.valor > 0);

    if (areasRateioPayload.length !== formulario.areasRateio.length) {
      notificarErro('area_subarea_invalida');
      return;
    }

    const payloadBase = {
      descricao: formulario.descricao,
      observacao: formulario.observacao,
      dataLancamento: base.dataLancamento,
      dataVencimento: base.dataVencimento,
      tipoDespesa: formulario.tipoDespesa,
      tipoPagamento: formulario.tipoPagamento,
      contaBancariaId: contaBancariaIdSelecionada ?? null,
      cartaoId: cartaoIdSelecionado ?? null,
      recorrencia: obterValorRecorrencia(pagamentoComParcelas ? 'mensal' : formulario.recorrenciaBase),
      recorrenciaFixa: pagamentoComParcelas || formulario.recorrenciaBase === 'unica' ? false : formulario.recorrenciaFixa,
      quantidadeRecorrencia:
        pagamentoComParcelas || formulario.recorrenciaBase === 'unica' || formulario.recorrenciaFixa
          ? null
          : base.quantidadeRecorrencia,
      ...(pagamentoComParcelas ? { quantidadeParcelas: base.quantidadeRecorrencia } : {}),
      valorTotal: base.valorTotal,
      valorLiquido: base.valorLiquido,
      desconto: base.desconto,
      acrescimo: base.acrescimo,
      imposto: base.imposto,
      juros: base.juros,
      tipoRateioAmigos: TIPO_RATEIO_AMIGOS_API[tipoRateioAmigosRef.current],
      ...(formulario.amigosRateio.length > 0 ? { ValorTotalRateioAmigos: base.valorTotalRateioAmigos } : {}),
      amigosRateio: amigos,
      areasSubAreasRateio: areasRateioPayload,
      documentos: montarDocumentosPayload(formulario.documentos),
    };

    setSalvandoDespesa(true);
    try {
      if (modoTela === 'novo') {
        await criarDespesaApi(payloadBase);
        await carregarDespesasApi();
        const criouSerie = pagamentoComParcelas
          ? (base.quantidadeRecorrencia ?? 0) > 1
          : formulario.recorrenciaBase !== 'unica' && (formulario.recorrenciaFixa || (base.quantidadeRecorrencia ?? 0) > 1);
        notificarSucesso(criouSerie ? t('financeiro.comum.mensagens.primeiraOcorrenciaGerada') : t('financeiro.despesa.mensagens.criada'));
        resetarTela();
        return;
      }

      if (modoTela === 'edicao' && despesaSelecionada) {
        const escopoRecorrencia = obterEscopoRecorrenciaApi(escopoEdicao);
        await atualizarDespesaApi(despesaSelecionada.id, {
          ...payloadBase,
        }, {
          escopoRecorrencia,
        });
        await carregarDespesasApi();
        notificarSucesso(t('financeiro.despesa.mensagens.atualizada'));
        resetarTela();
        return;
      }
    } catch {
      return;
    } finally {
      setSalvandoDespesa(false);
    }
  };

  const iniciarFluxoSalvar = () => {
    if (modoTela === 'edicao' && ehDespesaRecorrente(despesaSelecionada)) {
      setDespesaPendenteEdicaoRecorrente(despesaSelecionada);
      setEscopoEdicaoRecorrente('apenasEsta');
      return;
    }
    void salvarCadastroOuEdicao();
  };

  const confirmarEdicaoRecorrente = async () => {
    const escopo = escopoEdicaoRecorrente;
    await salvarCadastroOuEdicao(escopo);
  };

  const validarEfetivacaoDespesa = () => {
    if (!despesaSelecionada) return null;

    const invalidos: Record<string, boolean> = {};
    const dataEfetivacao = formulario.dataEfetivacao;
    const valorTotal = converterTextoParaNumero(formulario.valorTotal, locale);

    if (!dataEfetivacao) invalidos.dataEfetivacao = true;
    if (!formulario.tipoPagamento) invalidos.tipoPagamento = true;
    if (valorTotal <= 0) invalidos.valorTotal = true;
    if (tipoPagamentoExigeContaBancaria && !contaBancariaIdSelecionada) invalidos.contaBancaria = true;
    if (tipoPagamentoExigeCartao && !cartaoIdSelecionado) invalidos.cartao = true;
    if (formulario.contaBancaria && formulario.cartao) {
      invalidos.contaBancaria = true;
      invalidos.cartao = true;
    }

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro(t('financeiro.despesa.mensagens.obrigatorioEfetivacao'));
      return null;
    }

    const dataLancamento = despesaSelecionada.dataLancamento || formulario.dataLancamento;
    if (dataIsoMaiorQue(dataLancamento, dataEfetivacao)) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: true }));
      notificarErro(t('financeiro.despesa.mensagens.dataEfetivacaoMaiorQueLancamento'));
      return null;
    }

    return {
      dataEfetivacao,
      valorTotal,
      desconto: converterTextoParaNumero(formulario.desconto, locale),
      acrescimo: converterTextoParaNumero(formulario.acrescimo, locale),
      imposto: converterTextoParaNumero(formulario.imposto, locale),
      juros: converterTextoParaNumero(formulario.juros, locale),
    };
  };

  const efetivarDespesa = async () => {
    if (!despesaSelecionada) return;
    if (despesaSelecionada.status !== 'pendente') {
      notificarErro(t('financeiro.despesa.mensagens.efetivacaoSomentePendente'));
      return;
    }

    const base = validarEfetivacaoDespesa();
    if (!base) return;

    try {
      await efetivarDespesaApi(despesaSelecionada.id, {
        dataEfetivacao: base.dataEfetivacao,
        tipoPagamento: formulario.tipoPagamento,
        valorTotal: base.valorTotal,
        desconto: base.desconto,
        acrescimo: base.acrescimo,
        imposto: base.imposto,
        juros: base.juros,
        contaBancariaId: contaBancariaIdSelecionada ?? null,
        cartaoId: cartaoIdSelecionado ?? null,
        documentos: montarDocumentosPayload(formulario.documentos),
      });
      await carregarDespesasApi();
      notificarSucesso(t('financeiro.despesa.mensagens.efetivada'));
      resetarTela();
      return;
    } catch {
      return;
    }
  };

  const cancelarDespesa = (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendente') {
      notificarErro( t('financeiro.despesa.mensagens.cancelamentoSomentePendente'));
      return;
    }

    setDespesaPendenteCancelamento(despesa);
    setEscopoCancelamentoRecorrente('apenasEsta');
  };

  const confirmarCancelamentoDespesa = async () => {
    if (!despesaPendenteCancelamento) return;
    const escopo = escopoCancelamentoRecorrente;
    const escopoRecorrencia = obterEscopoRecorrenciaApi(escopo);
    setCancelandoDespesa(true);
    try {
      await cancelarDespesaApi(despesaPendenteCancelamento.id, {
        escopoRecorrencia,
      });
      await carregarDespesasApi();
      notificarSucesso(t('financeiro.despesa.acoes.cancelarDespesa'));
      setDespesaPendenteCancelamento(null);
    } catch {
      return;
    } finally {
      setCancelandoDespesa(false);
    }
  };

  const estornarDespesa = async (despesa: DespesaRegistro) => {
    if (despesa.status !== 'efetivada') {
      notificarErro( t('financeiro.despesa.mensagens.estornoSomenteEfetivada'));
      return;
    }

    try {
      await estornarDespesaApi(despesa.id);
      await carregarDespesasApi();
      return;
    } catch {
      return;
    }
  };

  const aceitarDespesaPendenteAprovacao = async (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendenteAprovacao') return;
    try {
      await aprovarDespesaPendenteApi(despesa.id);
      await carregarDespesasApi();
      return;
    } catch {
      return;
    }
  };

  const rejeitarDespesaPendenteAprovacao = async (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendenteAprovacao') return;
    try {
      await rejeitarDespesaPendenteApi(despesa.id);
      await carregarDespesasApi();
      return;
    } catch {
      return;
    }
  };

  const renderCampoBloqueado = (label: string, valor: string) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{valor || '-'}</Text>
      </View>
    </View>
  );

  const renderTabelaRateioAmigos = (somenteLeitura: boolean) => {
    const linhas = formulario.amigosRateio.map((amigo) => ({
      amigo,
      valor: formulario.rateioAmigosValores[amigo] || formatarMoedaParaInput(0, locale),
    }));

    if (somenteLeitura) {
      const conteudo = linhas.map((linha) => `${linha.amigo}: ${linha.valor}`).join(' | ');
      return (
        <>
          {renderCampoBloqueado(t('financeiro.comum.campos.tipoRateio'), t(`financeiro.comum.opcoesTipoRateio.${tipoRateioAmigos}`))}
          {renderCampoBloqueado(t('financeiro.comum.campos.valorTotalRateioAmigos'), formulario.valorTotalRateioAmigos)}
          {renderCampoBloqueado(t('financeiro.despesa.campos.rateioAmigos'), conteudo)}
        </>
      );
    }

    return (
      <View style={{ marginBottom: 12 }}>
        <CampoSelect
          label={t('financeiro.comum.campos.tipoRateio')}
          placeholder={t('comum.acoes.selecionar')}
          options={[
            { value: 'comum', label: t('financeiro.comum.opcoesTipoRateio.comum') },
            { value: 'igualitario', label: t('financeiro.comum.opcoesTipoRateio.igualitario') },
          ]}
          value={tipoRateioAmigos}
          onChange={(valor) => definirTipoRateioAmigos(valor as TipoRateioAmigos)}
        />
        <CampoTexto
          label={t('financeiro.comum.campos.valorTotalRateioAmigos')}
          placeholder={t('financeiro.despesa.placeholders.valor')}
          value={formulario.valorTotalRateioAmigos}
          onChangeText={(valor) => {
            setCamposInvalidos((atual) => ({ ...atual, valorTotalRateioAmigos: false }));
            atualizarCampoMoeda('valorTotalRateioAmigos', valor);
          }}
          error={camposInvalidos.valorTotalRateioAmigos}
          keyboardType="numeric"
          estilo={{ marginBottom: 8 }}
        />
        <CampoSelect
          label={t('financeiro.comum.campos.amigo')}
          placeholder={t('comum.acoes.selecionar')}
          options={opcoesAmigosRateio.map((amigo) => ({ value: amigo, label: amigo }))}
          value={novoAmigoRateio}
          onChange={setNovoAmigoRateio}
        />
        {tipoRateioAmigos === 'comum'
          ? (
            <CampoTexto
              label={t('dashboard.colunas.valor')}
              placeholder={t('financeiro.despesa.placeholders.valor')}
              value={novoValorAmigoRateio}
              onChangeText={(valor) => setNovoValorAmigoRateio(aplicarMascaraMoeda(valor, locale))}
              keyboardType="numeric"
              estilo={{ marginBottom: 8 }}
            />
          )
          : null}
        <Botao titulo={t('comum.acoes.confirmar')} onPress={adicionarRateioAmigo} tipo="secundario" estilo={{ marginBottom: 8 }} />
        {tipoRateioAmigos === 'comum'
          ? <Botao titulo={t('financeiro.comum.acoes.rateioIgualitario')} onPress={aplicarRateioIgualitarioAmigos} tipo="secundario" estilo={{ marginBottom: 8 }} />
          : null}
        {linhas.map((linha) => (
          <View key={linha.amigo} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{linha.amigo}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{linha.valor}</Text>
            </View>
            <TouchableOpacity onPress={() => removerRateioAmigo(linha.amigo)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.remover')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderTabelaRateioAreaSubarea = (somenteLeitura: boolean) => {
    const linhas = formulario.areasRateio.map((chave) => {
      const { area, subarea } = separarAreaSubarea(chave);
      return {
        chave,
        area,
        subarea,
        valor: formulario.rateioAreasValores[chave] || formatarMoedaParaInput(0, locale),
      };
    });
    const opcoesArea = opcoesAreasRateio;

    if (somenteLeitura) {
      const conteudo = linhas.map((linha) => `${linha.area} / ${linha.subarea}: ${linha.valor}`).join(' | ');
      return renderCampoBloqueado(t('financeiro.despesa.campos.rateioTipoDespesa'), conteudo);
    }

    return (
      <View style={{ marginBottom: 12 }}>
        <CampoSelect
          label={t('dashboard.colunas.areaSubarea')}
          placeholder={t('comum.acoes.selecionar')}
          options={opcoesArea.map((area) => ({ value: area, label: area }))}
          value={novaAreaRateio}
          onChange={setNovaAreaRateio}
        />
        <CampoSelect
          label={t('financeiro.comum.campos.subarea')}
          placeholder={t('comum.acoes.selecionar')}
          options={opcoesSubareasRateio.map((subarea) => ({ value: subarea, label: subarea }))}
          value={novaSubareaRateio}
          onChange={setNovaSubareaRateio}
        />
        <CampoTexto
          label={t('dashboard.colunas.valor')}
          placeholder={t('financeiro.despesa.placeholders.valor')}
          value={novoValorAreaRateio}
          onChangeText={(valor) => setNovoValorAreaRateio(aplicarMascaraMoeda(valor, locale))}
          keyboardType="numeric"
          estilo={{ marginBottom: 8 }}
        />
        <Botao titulo={t('comum.acoes.confirmar')} onPress={adicionarRateioAreaSubarea} tipo="secundario" estilo={{ marginBottom: 8 }} />
        {linhas.map((linha) => (
          <View key={linha.chave} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{linha.area} / {linha.subarea}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{linha.valor}</Text>
            </View>
            <TouchableOpacity onPress={() => removerRateioAreaSubarea(linha.chave)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.remover')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderFormularioBase = (somenteLeitura: boolean) => (
    <>
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.descricao'), formulario.descricao) : <CampoTexto label={t('financeiro.despesa.campos.descricao')} placeholder={t('financeiro.despesa.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.observacao'), formulario.observacao) : <CampoTexto label={t('financeiro.despesa.campos.observacao')} placeholder={t('financeiro.despesa.placeholders.observacao')} value={formulario.observacao} onChangeText={(observacao) => setFormulario((atual) => ({ ...atual, observacao }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.dataLancamento'), formulario.dataLancamento ? formatarDataPorIdioma(formulario.dataLancamento) : '') : <CampoData label={t('financeiro.despesa.campos.dataLancamento')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataLancamento} onChange={(dataLancamento) => { setCamposInvalidos((atual) => ({ ...atual, dataLancamento: false })); setFormulario((atual) => ({ ...atual, dataLancamento })); }} error={camposInvalidos.dataLancamento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.dataVencimento'), formulario.dataVencimento ? formatarDataPorIdioma(formulario.dataVencimento) : '') : <CampoData label={t('financeiro.despesa.campos.dataVencimento')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataVencimento} onChange={(dataVencimento) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimento: false })); setFormulario((atual) => ({ ...atual, dataVencimento })); }} error={camposInvalidos.dataVencimento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.tipoDespesa'), formulario.tipoDespesa ? t(`financeiro.despesa.tipoDespesa.${formulario.tipoDespesa}`) : '') : <CampoSelect label={t('financeiro.despesa.campos.tipoDespesa')} placeholder={t('comum.acoes.selecionar')} options={tiposDespesa.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoDespesa.${tipo}`) }))} value={formulario.tipoDespesa} onChange={(tipoDespesa) => { setCamposInvalidos((atual) => ({ ...atual, tipoDespesa: false })); setFormulario((atual) => ({ ...atual, tipoDespesa })); }} error={camposInvalidos.tipoDespesa} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.tipoPagamento'), formulario.tipoPagamento ? t(`financeiro.despesa.tipoPagamento.${formulario.tipoPagamento}`) : '') : <CampoSelect label={t('financeiro.despesa.campos.tipoPagamento')} placeholder={t('comum.acoes.selecionar')} options={tiposPagamento.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoPagamento.${tipo}`) }))} value={formulario.tipoPagamento} onChange={(tipoPagamento) => { setCamposInvalidos((atual) => ({ ...atual, tipoPagamento: false, quantidadeRecorrencia: false, contaBancaria: false, cartao: false })); setFormulario((atual) => { const exigeContaBancaria = tipoPagamento === 'pix' || tipoPagamento === 'transferencia'; const exigeCartao = tipoPagamento === 'cartaoCredito' || tipoPagamento === 'cartaoDebito'; const contaOuCartaoOpcional = !exigeContaBancaria && !exigeCartao; return { ...atual, tipoPagamento, recorrenciaBase: ehPagamentoParcelado(tipoPagamento) ? 'mensal' : atual.recorrenciaBase, contaBancaria: exigeContaBancaria || contaOuCartaoOpcional ? atual.contaBancaria : '', cartao: exigeCartao || contaOuCartaoOpcional ? atual.cartao : '' }; }); }} error={camposInvalidos.tipoPagamento} />}
      {exibeContaBancariaPagamento ? (somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.contaBancaria'), formulario.contaBancaria) : <CampoSelect label={t('financeiro.despesa.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancaria.map((conta) => ({ value: conta, label: conta }))} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false, cartao: false })); setFormulario((atual) => ({ ...atual, contaBancaria, cartao: contaBancaria ? '' : atual.cartao })); }} error={camposInvalidos.contaBancaria} obrigatorio={tipoPagamentoExigeContaBancaria} />) : null}
      {exibeCartaoPagamento ? (somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.cartao'), formulario.cartao) : <CampoSelect label={t('financeiro.despesa.campos.cartao')} placeholder={t('comum.acoes.selecionar')} options={opcoesCartao.map((cartao) => ({ value: cartao, label: cartao }))} value={formulario.cartao} onChange={(cartao) => { setCamposInvalidos((atual) => ({ ...atual, cartao: false, contaBancaria: false })); setFormulario((atual) => ({ ...atual, cartao, contaBancaria: cartao ? '' : atual.contaBancaria })); }} error={camposInvalidos.cartao} obrigatorio={tipoPagamentoExigeCartao} />) : null}
      {pagamentoComParcelas ? null : (somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.recorrencia'), obterRotuloRecorrencia(formulario.recorrenciaBase, locale)) : <CampoSelect label={t('financeiro.despesa.campos.recorrencia')} placeholder={t('comum.acoes.selecionar')} options={RECORRENCIAS_FINANCEIRAS_BASE.map((item) => ({ value: item.chave, label: obterRotuloRecorrencia(item.chave, locale) }))} value={formulario.recorrenciaBase} onChange={(recorrenciaBase) => setFormulario((atual) => ({ ...atual, recorrenciaBase: recorrenciaBase as RecorrenciaFinanceiraBaseChave, recorrenciaFixa: recorrenciaBase === 'unica' ? false : atual.recorrenciaFixa, quantidadeRecorrencia: recorrenciaBase === 'unica' ? '' : atual.quantidadeRecorrencia }))} />)}
      {pagamentoComParcelas ? null : (somenteLeitura ? renderCampoBloqueado(t('financeiro.comum.campos.modoRecorrencia'), formulario.recorrenciaFixa ? t('financeiro.comum.opcoesRecorrencia.fixa') : t('financeiro.comum.opcoesRecorrencia.normal')) : <CampoSelect label={t('financeiro.comum.campos.modoRecorrencia')} placeholder={t('comum.acoes.selecionar')} options={formulario.recorrenciaBase === 'unica' ? [{ value: 'normal', label: t('financeiro.comum.opcoesRecorrencia.normal') }] : [{ value: 'normal', label: t('financeiro.comum.opcoesRecorrencia.normal') }, { value: 'fixa', label: t('financeiro.comum.opcoesRecorrencia.fixa') }]} value={formulario.recorrenciaFixa ? 'fixa' : 'normal'} onChange={(modo) => setFormulario((atual) => { const recorrenciaFixa = atual.recorrenciaBase !== 'unica' && modo === 'fixa'; return { ...atual, recorrenciaFixa, quantidadeRecorrencia: recorrenciaFixa ? '' : atual.quantidadeRecorrencia }; })} />)}
      {somenteLeitura ? (exibirQuantidadeRecorrencia ? renderCampoBloqueado(rotuloQuantidadeRecorrencia, formulario.quantidadeRecorrencia || '-') : null) : (exibirQuantidadeRecorrencia ? <CampoTexto label={rotuloQuantidadeRecorrencia} placeholder='1' value={formulario.quantidadeRecorrencia} onChangeText={(quantidadeRecorrencia) => { setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: false })); setFormulario((atual) => ({ ...atual, quantidadeRecorrencia: quantidadeRecorrencia.replace(/[^\d]/g, '') })); }} error={camposInvalidos.quantidadeRecorrencia} obrigatorio={quantidadeRecorrenciaObrigatoria} keyboardType='numeric' estilo={{ marginBottom: 12 }} /> : null)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.valorTotal'), formulario.valorTotal) : <CampoTexto label={t('financeiro.despesa.campos.valorTotal')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.desconto'), formulario.desconto) : <CampoTexto label={t('financeiro.despesa.campos.desconto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.acrescimo'), formulario.acrescimo) : <CampoTexto label={t('financeiro.despesa.campos.acrescimo')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.imposto'), formulario.imposto) : <CampoTexto label={t('financeiro.despesa.campos.imposto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.juros'), formulario.juros) : <CampoTexto label={t('financeiro.despesa.campos.juros')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {renderCampoBloqueado(t('financeiro.despesa.campos.valorLiquido'), formulario.valorLiquido)}
      <View style={{ marginTop: 6, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor }}>
        <TouchableOpacity
          onPress={() => setSecaoRateioExpandida((atual) => !atual)}
          style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '800' }}>{secaoRateioExpandida ? '-' : '+'} {t('financeiro.comum.campos.rateio')}</Text>
        </TouchableOpacity>
        {secaoRateioExpandida ? (
          <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 10 }}>
            {renderTabelaRateioAmigos(somenteLeitura)}
            {renderTabelaRateioAreaSubarea(somenteLeitura)}
          </View>
        ) : null}
      </View>
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.anexoDocumento'), formulario.anexoDocumento) : <CampoArquivo label={t('financeiro.despesa.campos.anexoDocumento')} placeholder={t('financeiro.despesa.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento, documentos: anexoDocumento ? atual.documentos : [] }))} onSelecionarArquivo={(documento) => setFormulario((atual) => ({ ...atual, documentos: documento ? [documento] : [] }))} estilo={{ marginBottom: 12 }} />}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.despesa.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoTela === 'lista' ? router.back() : resetarTela())}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {modoTela === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.despesa.nova')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
            <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => setCompetencia((atual) => avancarCompetencia(atual, -1))}
                  style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={{ color: COLORS.accent, fontSize: 16, fontWeight: '700' }}>{competenciaLabel}</Text>
                <TouchableOpacity
                  onPress={() => setCompetencia((atual) => avancarCompetencia(atual, 1))}
                  style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>{'>'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />
            <Botao titulo={t('comum.acoes.consultar')} onPress={consultarFiltros} tipo='secundario' estilo={{ marginBottom: 12 }} />
            <View>
              {despesasFiltradas.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('financeiro.despesa.vazio')}</Text> : despesasFiltradas.map((despesa) => (
                <View key={despesa.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{despesa.id} {despesa.descricao}</Text>
                    <Text style={{ color: despesa.status === 'efetivada' ? COLORS.success : despesa.status === 'cancelada' ? COLORS.error : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{obterRotuloStatusDespesa(despesa.status, t)}</Text>
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>{t(`financeiro.despesa.tipoDespesa.${despesa.tipoDespesa}`)} | {formatarDataPorIdioma(despesa.dataVencimento)} | {formatarValorPorIdioma(despesa.valorLiquido)}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{despesa.observacao || t('financeiro.despesa.mensagens.semObservacao')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                    <TouchableOpacity onPress={() => abrirVisualizacao(despesa)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('financeiro.despesa.acoes.visualizar')}</Text></TouchableOpacity>
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEdicao(despesa)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEfetivacao(despesa)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.despesa.acoes.efetivar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => cancelarDespesa(despesa)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.error, fontSize: 12 }}>{t('financeiro.despesa.acoes.cancelarDespesa')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendenteAprovacao' ? <TouchableOpacity onPress={() => aceitarDespesaPendenteAprovacao(despesa)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.comum.acoes.aceitar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendenteAprovacao' ? <TouchableOpacity onPress={() => rejeitarDespesaPendenteAprovacao(despesa)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.error, fontSize: 12 }}>{t('financeiro.comum.acoes.rejeitar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'efetivada' ? <TouchableOpacity onPress={() => estornarDespesa(despesa)} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.despesa.acoes.estornar')}</Text></TouchableOpacity> : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
        {(modoTela === 'novo' || modoTela === 'edicao') ? (
          <>
            {renderFormularioBase(false)}
            {modoTela === 'edicao' && ehDespesaRecorrente(despesaSelecionada) ? (
              <View style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                  {t('financeiro.comum.mensagens.edicaoApenasPendentes')}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  {t('financeiro.comum.mensagens.edicaoReplicaPendentes')}
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', marginTop: 8, marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao
                titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')}
                onPress={iniciarFluxoSalvar}
                tipo="primario"
                estilo={{ flex: 1, marginHorizontal: 5 }}
                carregando={salvandoDespesa}
              />
            </View>
          </>
        ) : null}

        {modoTela === 'efetivacao' ? (
          <>
            {renderCampoBloqueado(t('financeiro.despesa.campos.valorLiquido'), formulario.valorLiquido)}
            {renderCampoBloqueado(t('financeiro.despesa.campos.valorEfetivacao'), formulario.valorEfetivacao)}
            <CampoData label={t('financeiro.despesa.campos.dataEfetivacao')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataEfetivacao} onChange={(dataEfetivacao) => { setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: false })); setFormulario((atual) => ({ ...atual, dataEfetivacao })); }} error={camposInvalidos.dataEfetivacao} estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.despesa.campos.tipoPagamento')} placeholder={t('comum.acoes.selecionar')} options={tiposPagamento.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoPagamento.${tipo}`) }))} value={formulario.tipoPagamento} onChange={(tipoPagamento) => { setCamposInvalidos((atual) => ({ ...atual, tipoPagamento: false, contaBancaria: false, cartao: false })); setFormulario((atual) => { const exigeContaBancaria = tipoPagamento === 'pix' || tipoPagamento === 'transferencia'; const exigeCartao = tipoPagamento === 'cartaoCredito' || tipoPagamento === 'cartaoDebito'; const contaOuCartaoOpcional = !exigeContaBancaria && !exigeCartao; return { ...atual, tipoPagamento, contaBancaria: exigeContaBancaria || contaOuCartaoOpcional ? atual.contaBancaria : '', cartao: exigeCartao || contaOuCartaoOpcional ? atual.cartao : '' }; }); }} error={camposInvalidos.tipoPagamento} />
            {exibeContaBancariaPagamento ? <CampoSelect label={t('financeiro.despesa.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancaria.map((conta) => ({ value: conta, label: conta }))} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false, cartao: false })); setFormulario((atual) => ({ ...atual, contaBancaria, cartao: contaBancaria ? '' : atual.cartao })); }} error={camposInvalidos.contaBancaria} obrigatorio={tipoPagamentoExigeContaBancaria} /> : null}
            {exibeCartaoPagamento ? <CampoSelect label={t('financeiro.despesa.campos.cartao')} placeholder={t('comum.acoes.selecionar')} options={opcoesCartao.map((cartao) => ({ value: cartao, label: cartao }))} value={formulario.cartao} onChange={(cartao) => { setCamposInvalidos((atual) => ({ ...atual, cartao: false, contaBancaria: false })); setFormulario((atual) => ({ ...atual, cartao, contaBancaria: cartao ? '' : atual.contaBancaria })); }} error={camposInvalidos.cartao} obrigatorio={tipoPagamentoExigeCartao} /> : null}
            <CampoTexto label={t('financeiro.despesa.campos.valorTotal')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => atualizarCampoMoeda('valorTotal', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.desconto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.acrescimo')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.imposto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.juros')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoArquivo label={t('financeiro.despesa.campos.anexoDocumento')} placeholder={t('financeiro.despesa.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento, documentos: anexoDocumento ? atual.documentos : [] }))} onSelecionarArquivo={(documento) => setFormulario((atual) => ({ ...atual, documentos: documento ? [documento] : [] }))} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={t('financeiro.despesa.acoes.confirmarEfetivacao')} onPress={efetivarDespesa} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && despesaSelecionada ? (
          <>
            {renderFormularioBase(true)}
            {renderCampoBloqueado(t('financeiro.despesa.campos.status'), obterRotuloStatusDespesa(despesaSelecionada.status, t))}
            {renderCampoBloqueado(t('financeiro.despesa.campos.dataEfetivacao'), despesaSelecionada.dataEfetivacao ? formatarDataPorIdioma(despesaSelecionada.dataEfetivacao) : '')}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('financeiro.despesa.logs.titulo')}</Text>
              <View>
                {despesaSelecionada.logs.map((log) => (
                  <View key={log.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{log.acao}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{log.descricao}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{formatarDataPorIdioma(log.data)}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" />
          </>
        ) : null}
      </ScrollView>
      <ModalConfirmacao
        visivel={Boolean(despesaPendenteCancelamento)}
        titulo={t('comum.confirmacao')}
        mensagem={t('financeiro.despesa.mensagens.confirmarCancelamento')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        opcoes={opcoesEscopoCancelamentoRecorrencia}
        valorSelecionado={escopoCancelamentoRecorrente}
        onSelecionarOpcao={(valor) => setEscopoCancelamentoRecorrente(valor as EscopoAcaoRecorrencia)}
        observacao={
          ehDespesaRecorrente(despesaPendenteCancelamento)
            ? despesaPendenteCancelamento?.recorrenciaFixa
              ? `${t('financeiro.comum.mensagens.cancelamentoApenasPendentes')} ${t('financeiro.comum.mensagens.cancelamentoFixaTodasPendentes')}`
              : t('financeiro.comum.mensagens.cancelamentoApenasPendentes')
            : undefined
        }
        carregando={cancelandoDespesa}
        onCancelar={() => setDespesaPendenteCancelamento(null)}
        onConfirmar={() => void confirmarCancelamentoDespesa()}
      />
      <ModalConfirmacao
        visivel={Boolean(despesaPendenteEdicaoRecorrente)}
        titulo={t('comum.confirmacao')}
        mensagem={t('financeiro.comum.mensagens.confirmarEdicaoRecorrente')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        opcoes={opcoesEscopoEdicaoRecorrencia}
        valorSelecionado={escopoEdicaoRecorrente}
        onSelecionarOpcao={(valor) => setEscopoEdicaoRecorrente(valor as EscopoAcaoRecorrencia)}
        observacao={ehDespesaRecorrente(despesaPendenteEdicaoRecorrente) ? `${t('financeiro.comum.mensagens.edicaoApenasPendentes')} ${t('financeiro.comum.mensagens.edicaoReplicaPendentes')}` : undefined}
        carregando={salvandoDespesa}
        onCancelar={() => setDespesaPendenteEdicaoRecorrente(null)}
        onConfirmar={() => void confirmarEdicaoRecorrente()}
      />
    </View>
  );
}













