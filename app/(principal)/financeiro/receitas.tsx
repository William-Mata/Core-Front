import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoArquivo } from '../../../src/componentes/comuns/CampoArquivo';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { ModalConfirmacao } from '../../../src/componentes/comuns/ModalConfirmacao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { MenuAcoesItem, type OpcaoMenuAcoesItem } from '../../../src/componentes/comuns/MenuAcoesItem';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataHoraPorIdioma, formatarDataPorIdioma, formatarValorPorIdioma, normalizarIsoDataHora, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { aplicarMascaraCompetencia, avancarCompetencia, desserializarCompetencia, formatarCompetencia, formatarCompetenciaParaEntrada, obterCompetenciaAtual, obterCompetenciaPorData, serializarCompetencia, type CompetenciaFinanceira } from '../../../src/utils/competenciaFinanceira';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import { podeAlterarTransacaoVinculadaAFatura, resolverStatusOperacionalTransacaoFatura } from '../../../src/utils/acoesFaturaCartao';
import { rateioConfereValorTotalExato, rateioNaoUltrapassaValorTotal } from '../../../src/utils/rateioValidacao';
import { obterIconeBanco, obterIconeBandeiraCartao, obterImagemBanco, obterImagemBandeiraCartao } from '../../../src/utils/icones';
import { compararPorLancamentoEfetivacaoDecrescente } from '../../../src/utils/ordenacaoLancamentoFinanceiro';
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
import { montarDocumentosPayload, normalizarDocumentosApi, type DocumentoFinanceiro } from '../../../src/utils/documentoUpload';
import {
  aprovarReceitaPendenteApi,
  atualizarReceitaApi,
  cancelarReceitaApi,
  criarReceitaApi,
  efetivarReceitaApi,
  estornarReceitaApi,
  listarDetalhesFaturasCartaoApi,
  listarCartoesApi,
  listarContasBancariasApi,
  listarAmigosRateioApi,
  listarAreasSubareasRateioApi,
  listarReceitasApi,
  obterReceitaApi,
  rejeitarReceitaPendenteApi,
  type AmigoRateioApi,
  type AreaSubareaRateioApi,
  type CartaoOpcaoApi,
  type ContaBancariaOpcaoApi,
  type FaturaCartaoDetalheApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';

type StatusReceita = 'pendente' | 'efetivada' | 'estornada' | 'cancelada' | 'pendenteAprovacao' | 'rejeitada';
type StatusFaturaCartao = 'aberta' | 'fechada' | 'efetivada' | 'estornada';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao' | 'estorno';
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

interface LogReceita {
  id: number;
  data: string;
  acao: string;
  descricao: string;
}

interface ReceitaRegistro {
  id: number;
  descricao: string;
  observacao: string;
  dataLancamento: string;
  competencia?: string;
  dataVencimento: string;
  dataEfetivacao?: string;
  tipoReceita: string;
  tipoRecebimento: string;
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
  status: StatusReceita;
  amigosRateio: string[];
  tipoRateioAmigos: 'comum' | 'igualitario';
  valorTotalRateioAmigos: number;
  rateioAmigosValores: Record<string, number>;
  areasRateio: string[];
  rateioAreasValores: Record<string, number>;
  rateiosAmigos?: Array<{ amigo: string; valor: number }>;
  rateiosAreaSubarea?: Array<{ area: string; subarea: string; valor: number }>;
  contaBancaria?: string;
  contaBancariaId?: number;
  contaDestino?: string;
  contaDestinoId?: number;
  cartao?: string;
  cartaoId?: number;
  faturaCartaoId?: number;
  faturaId?: number;
  ehFatura?: boolean;
  statusFaturaCartao?: StatusFaturaCartao;
  receitasVinculadasIds?: number[];
  anexoDocumento: string;
  documentos: DocumentoFinanceiro[];
  logs: LogReceita[];
}

interface ReceitaForm {
  descricao: string;
  observacao: string;
  observacaoEfetivacao: string;
  observacaoEstorno: string;
  dataLancamento: string;
  competencia: string;
  dataVencimento: string;
  dataEfetivacao: string;
  dataEstorno: string;
  tipoReceita: string;
  tipoRecebimento: string;
  recorrenciaBase: RecorrenciaFinanceiraBaseChave;
  recorrenciaFixa: boolean;
  quantidadeRecorrencia: string;
  interpretacaoValorParcelado: InterpretacaoValorParcelado;
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
  contaDestino: string;
  cartao: string;
  anexoDocumento: string;
  documentos: DocumentoFinanceiro[];
  ocultarEfetivacaoEstornoRegistros: boolean;
}

interface GrupoFaturaReceita {
  fatura: ReceitaRegistro;
  receitasVinculadas: ReceitaRegistro[];
  valorTotalGrupo: number;
  valorTotalFatura: number;
  valorTotalTransacoes: number;
  cartaoId?: number;
  competencia?: string;
  statusFaturaCartao: StatusFaturaCartao;
}

const tiposReceita = ['salario', 'freelance', 'reembolso', 'investimento', 'bonus', 'outros', 'vendas', 'alugueis', 'beneficios', 'rendasExtras'] as const;
const tiposRecebimento = ['pix', 'transferencia', 'dinheiro', 'boleto', 'cartaoCredito', 'cartaoDebito'] as const;
type TipoRateioAmigos = 'comum' | 'igualitario';
type InterpretacaoValorParcelado = 'valorParcela' | 'valorTotalTransacao';
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

function normalizarDescricaoMaiuscula(descricao: string, locale: string) {
  return descricao.toLocaleUpperCase(locale);
}

function criarFormularioVazio(locale: string): ReceitaForm {
  const hoje = new Date().toISOString().split('T')[0];
  const hojeComHoraZerada = `${hoje}T00:00`;
  return {
    descricao: '',
    observacao: '',
    observacaoEfetivacao: '',
    observacaoEstorno: '',
    dataLancamento: hojeComHoraZerada,
    competencia: formatarCompetenciaParaEntrada(obterCompetenciaAtual(), locale),
    dataVencimento: '',
    dataEfetivacao: hojeComHoraZerada,
    dataEstorno: hojeComHoraZerada,
    tipoReceita: '',
    tipoRecebimento: '',
    recorrenciaBase: 'unica',
    recorrenciaFixa: false,
    quantidadeRecorrencia: '',
    interpretacaoValorParcelado: 'valorParcela',
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
    contaDestino: '',
    cartao: '',
    anexoDocumento: '',
    documentos: [],
    ocultarEfetivacaoEstornoRegistros: true,
  };
}

function calcularValorTotalPorInterpretacaoParcelamento(
  valorTotalInformado: number,
  tipoRecebimento: string,
  quantidadeParcelas: number,
  interpretacaoValorParcelado: InterpretacaoValorParcelado,
) {
  const exibeOpcaoInterpretacao = tipoRecebimento === 'cartaoCredito' && quantidadeParcelas > 1;
  if (!exibeOpcaoInterpretacao) return valorTotalInformado;
  if (interpretacaoValorParcelado === 'valorParcela') return valorTotalInformado;
  return Number((valorTotalInformado / quantidadeParcelas).toFixed(2));
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

function normalizarStatusReceita(status: unknown): StatusReceita {
  const valor = String(status ?? '').toLowerCase();
  if (valor === '2') return 'efetivada';
  if (valor === '3') return 'estornada';
  if (valor.includes('aprov') || valor.includes('pendente_aprovacao') || valor.includes('pendenteaprovacao')) return 'pendenteAprovacao';
  if (valor.includes('rejeit')) return 'rejeitada';
  if (valor.includes('estorn') || valor.includes('revers')) return 'estornada';
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('cancel')) return 'cancelada';
  if (valor.includes('pago') || valor.includes('liquid') || valor.includes('conclu')) return 'efetivada';
  return 'pendente';
}

function normalizarStatusFaturaCartao(status: unknown): StatusFaturaCartao {
  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('estorn')) return 'estornada';
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('fech')) return 'fechada';
  return 'aberta';
}

function normalizarTipoReceita(valor: unknown): (typeof tiposReceita)[number] {
  const normalizarTexto = (textoBruto: string) =>
    textoBruto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, '');

  const texto = normalizarTexto(String(valor ?? ''));
  const mapaTipoReceitaApi: Record<string, (typeof tiposReceita)[number]> = {
    '1': 'salario',
    '2': 'freelance',
    '3': 'reembolso',
    '4': 'investimento',
    '5': 'bonus',
    '6': 'outros',
    '7': 'vendas',
    '8': 'alugueis',
    '9': 'beneficios',
    '10': 'rendasExtras',
  };
  if (mapaTipoReceitaApi[texto]) return mapaTipoReceitaApi[texto];
  const tipoEncontrado = tiposReceita.find((tipo) => normalizarTexto(tipo) === texto);
  return tipoEncontrado ?? 'outros';
}

function normalizarTipoRecebimento(valor: unknown): (typeof tiposRecebimento)[number] {
  const texto = String(valor ?? '').trim().toLowerCase();
  const mapaTipoRecebimentoApi: Record<string, (typeof tiposRecebimento)[number]> = {
    '1': 'pix',
    '2': 'transferencia',
    '3': 'dinheiro',
    '4': 'boleto',
    '5': 'cartaoCredito',
    '6': 'cartaoDebito',
  };
  if (mapaTipoRecebimentoApi[texto]) return mapaTipoRecebimentoApi[texto];
  const chaveNormalizada = texto.replace(/[\s_-]/g, '');
  const tipoEncontrado = tiposRecebimento.find((tipo) => tipo.toLowerCase() === chaveNormalizada);
  return tipoEncontrado ?? 'dinheiro';
}

function normalizarTipoCartaoOpcao(valor: unknown): 'credito' | 'debito' {
  const tipo = String(valor ?? '').trim().toLowerCase();
  return tipo.includes('debi') ? 'debito' : 'credito';
}


function obterRotuloStatusReceita(status: StatusReceita, t: (chave: string) => string): string {
  const chave = `financeiro.receita.status.${status}`;
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

function mapearReceitaApi(item: RegistroFinanceiroApi): ReceitaRegistro {
  const itemRegistro = item as Record<string, unknown>;
  const paraNumeroOpcional = (valor: unknown): number | undefined => {
    const numero = Number(valor ?? NaN);
    return Number.isFinite(numero) && numero > 0 ? numero : undefined;
  };
  const extrairIdsVinculados = (valor: unknown): number[] => {
    if (!Array.isArray(valor)) return [];
    return valor
      .map((entrada) => {
        if (typeof entrada === 'number' || typeof entrada === 'string') return Number(entrada);
        if (entrada && typeof entrada === 'object') {
          const registro = entrada as Record<string, unknown>;
          return Number(registro.id ?? registro.receitaId ?? NaN);
        }
        return NaN;
      })
      .filter((numero): numero is number => Number.isFinite(numero) && numero > 0);
  };
  const dataBase = normalizarIsoDataHora(String(item.dataLancamento ?? item.data ?? new Date().toISOString().slice(0, 10)), '00:00');
  const competenciaBase = String(item.competencia ?? serializarCompetencia(obterCompetenciaPorData(dataBase))).slice(0, 7);
  const valorBase = Number(item.valor ?? item.valorTotal ?? item.valorLiquido ?? 0);
  const desconto = Number(item.desconto ?? 0);
  const acrescimo = Number(item.acrescimo ?? 0);
  const imposto = Number(item.imposto ?? 0);
  const juros = Number(item.juros ?? 0);
  const valorLiquido = Number(item.valorLiquido ?? Math.max(0, valorBase - desconto + acrescimo + imposto + juros));
  const tipoRateioAmigos = normalizarTipoRateioAmigos(item.tipoRateioAmigos ?? item.TipoRateioAmigos);
  const valorTotalRateioAmigos = Number(item.valorTotalRateioAmigos ?? item.ValorTotalRateioAmigos ?? 0);
  const amigosRateioEntrada =
    Array.isArray(item.amigosRateio)
      ? (item.amigosRateio as unknown[])
      : (Array.isArray(itemRegistro.AmigosRateio) ? (itemRegistro.AmigosRateio as unknown[]) : []);
  const rateiosAmigosEntrada =
    Array.isArray(item.rateiosAmigos)
      ? (item.rateiosAmigos as unknown[])
      : (Array.isArray(itemRegistro.RateiosAmigos) ? (itemRegistro.RateiosAmigos as unknown[]) : []);
  const areasSubAreasRateioEntrada =
    Array.isArray(item.areasSubAreasRateio)
      ? (item.areasSubAreasRateio as unknown[])
      : (Array.isArray(itemRegistro.AreasSubAreasRateio) ? (itemRegistro.AreasSubAreasRateio as unknown[]) : []);
  const rateiosAreaSubareaEntrada =
    Array.isArray(item.rateiosAreaSubarea)
      ? (item.rateiosAreaSubarea as unknown[])
      : (Array.isArray(itemRegistro.RateiosAreaSubarea) ? (itemRegistro.RateiosAreaSubarea as unknown[]) : []);

  const extrairNomeAmigoRateio = (rateio: Record<string, unknown>) => {
    const amigoRegistro = rateio.amigo && typeof rateio.amigo === 'object'
      ? (rateio.amigo as Record<string, unknown>)
      : null;
    const amigoValor = typeof rateio.amigo === 'string' || typeof rateio.amigo === 'number' ? rateio.amigo : '';
    const amigoId = Number(rateio.amigoId ?? rateio.AmigoId ?? amigoRegistro?.id ?? amigoRegistro?.Id ?? NaN);
    return String(
      rateio.nome
      ?? rateio.amigoNome
      ?? amigoRegistro?.nome
      ?? amigoRegistro?.Nome
      ?? amigoValor
      ?? (Number.isFinite(amigoId) && amigoId > 0 ? `#${String(amigoId)}` : ''),
    ).trim();
  };
  const extrairAreaSubareaRateio = (rateio: Record<string, unknown>) => {
    const areaRegistro = rateio.area && typeof rateio.area === 'object'
      ? (rateio.area as Record<string, unknown>)
      : null;
    const subAreaRegistro = rateio.subArea && typeof rateio.subArea === 'object'
      ? (rateio.subArea as Record<string, unknown>)
      : (rateio.subarea && typeof rateio.subarea === 'object'
        ? (rateio.subarea as Record<string, unknown>)
        : null);
    const areaValor = typeof rateio.area === 'string' || typeof rateio.area === 'number' ? rateio.area : '';
    const subareaValor = typeof rateio.subarea === 'string' || typeof rateio.subarea === 'number' ? rateio.subarea : '';
    const areaId = Number(rateio.areaId ?? rateio.AreaId ?? areaRegistro?.id ?? areaRegistro?.Id ?? NaN);
    const subareaId = Number(rateio.subAreaId ?? rateio.subareaId ?? rateio.SubAreaId ?? rateio.SubareaId ?? subAreaRegistro?.id ?? subAreaRegistro?.Id ?? NaN);
    return {
      area: String(
        rateio.areaNome
        ?? rateio.AreaNome
        ?? areaRegistro?.nome
        ?? areaRegistro?.Nome
        ?? areaValor
        ?? (Number.isFinite(areaId) && areaId > 0 ? `#${String(areaId)}` : ''),
      ).trim(),
      subarea: String(
        rateio.subAreaNome
        ?? rateio.SubAreaNome
        ?? subAreaRegistro?.nome
        ?? subAreaRegistro?.Nome
        ?? subareaValor
        ?? (Number.isFinite(subareaId) && subareaId > 0 ? `#${String(subareaId)}` : ''),
      ).trim(),
    };
  };

  const amigosRateioContratoAtual = amigosRateioEntrada.length > 0
    ? (amigosRateioEntrada as Array<Record<string, unknown>>)
        .map((rateio) => ({
          amigo: extrairNomeAmigoRateio(rateio),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.amigo))
    : [];
  const amigosRateioLegado = amigosRateioEntrada.length > 0
    ? amigosRateioEntrada.filter((entrada): entrada is string => typeof entrada === 'string')
    : [];
  const rateioAmigosValoresLegado =
    ((item.rateioAmigosValores as Record<string, number>) || (itemRegistro.RateioAmigosValores as Record<string, number>) || {});
  const rateiosAmigosApi = rateiosAmigosEntrada.length > 0
    ? (rateiosAmigosEntrada as Array<Record<string, unknown>>)
        .map((rateio) => ({ amigo: extrairNomeAmigoRateio(rateio), valor: Number(rateio.valor ?? 0) }))
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

  const areasSubAreasRateioContratoAtual = areasSubAreasRateioEntrada.length > 0
    ? (areasSubAreasRateioEntrada as Array<Record<string, unknown>>)
        .map((rateio) => {
          const { area, subarea } = extrairAreaSubareaRateio(rateio);
          return {
            area,
            subarea,
            valor: Number(rateio.valor ?? 0),
          };
        })
        .filter((rateio) => Boolean(rateio.area) && Boolean(rateio.subarea))
    : [];
  const areasRateioLegadoBase = Array.isArray(item.areasRateio)
    ? (item.areasRateio as string[])
    : Array.isArray(itemRegistro.AreasRateio)
      ? (itemRegistro.AreasRateio as string[])
      : [];
  const rateioAreasValoresLegado =
    ((item.rateioAreasValores as Record<string, number>) || (itemRegistro.RateioAreasValores as Record<string, number>) || {});
  const rateiosAreaSubareaApi = rateiosAreaSubareaEntrada.length > 0
    ? (rateiosAreaSubareaEntrada as Array<Record<string, unknown>>)
        .map((rateio) => {
          const { area, subarea } = extrairAreaSubareaRateio(rateio);
          return {
            area,
            subarea,
            valor: Number(rateio.valor ?? 0),
          };
        })
        .filter((rateio) => Boolean(rateio.area) && Boolean(rateio.subarea))
    : [];
  const rateiosAreaSubareaConsolidados =
    rateiosAreaSubareaApi.length > 0 ? rateiosAreaSubareaApi : areasSubAreasRateioContratoAtual;
  const areasRateio =
    rateiosAreaSubareaConsolidados.length > 0
      ? rateiosAreaSubareaConsolidados.map((rateio) => montarChaveAreaSubarea(rateio.area, rateio.subarea))
      : areasRateioLegadoBase.map((area) => {
          if (area.includes(SEPARADOR_AREA_SUBAREA)) return area;
          if (area.includes(' / ')) {
            const [nomeArea = '', nomeSubarea = ''] = area.split(' / ');
            return montarChaveAreaSubarea(nomeArea, nomeSubarea || nomeArea);
          }
          return montarChaveAreaSubarea(area, area);
        });
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
  const contaBancariaIdNormalizado = Number(item.contaBancariaId ?? NaN);
  const contaDestinoIdNormalizado = Number(item.contaDestinoId ?? NaN);
  const cartaoIdNormalizado = Number(item.cartaoId ?? NaN);
  const contaBancariaBruta = String(item.contaBancaria ?? '').trim();
  const contaDestinoBruta = String(item.contaDestino ?? '').trim();
  const cartaoBruto = String(item.cartao ?? '').trim();
  const contaBancariaNome = contaBancariaBruta && contaBancariaBruta !== String(contaBancariaIdNormalizado)
    ? contaBancariaBruta
    : undefined;
  const contaDestinoNome = contaDestinoBruta && contaDestinoBruta !== String(contaDestinoIdNormalizado)
    ? contaDestinoBruta
    : undefined;
  const cartaoNome = cartaoBruto && cartaoBruto !== String(cartaoIdNormalizado)
    ? cartaoBruto
    : undefined;
  const faturaCartaoRegistro = item.faturaCartao && typeof item.faturaCartao === 'object'
    ? (item.faturaCartao as Record<string, unknown>)
    : null;
  const faturaCartaoId = paraNumeroOpcional(item.faturaCartaoId ?? faturaCartaoRegistro?.id ?? faturaCartaoRegistro?.faturaCartaoId);
  const faturaIdDireta = paraNumeroOpcional(item.faturaId ?? item.idFatura ?? item.faturaReferenciaId ?? faturaCartaoId);
  const faturaRegistro = item.fatura && typeof item.fatura === 'object'
    ? (item.fatura as Record<string, unknown>)
    : null;
  const faturaIdRelacionada = paraNumeroOpcional(faturaRegistro?.id ?? faturaRegistro?.faturaId);
  const receitasVinculadasIds = [
    ...extrairIdsVinculados(item.receitasVinculadas),
    ...extrairIdsVinculados(item.receitas),
    ...extrairIdsVinculados(item.transacoes),
  ].filter((id, indice, lista) => lista.indexOf(id) === indice);
  const tipoReceitaBruto = String(item.tipoReceita ?? item.tipoLancamento ?? item.tipo ?? '').toLowerCase();
  const ehFatura = Boolean(item.ehFatura)
    || tipoReceitaBruto.includes('fatura')
    || receitasVinculadasIds.length > 0;
  const faturaId = faturaIdDireta ?? faturaIdRelacionada;
  const statusFaturaCartao = (ehFatura || Boolean(faturaCartaoId))
    ? normalizarStatusFaturaCartao(item.statusFaturaCartao ?? item.statusFatura ?? item.status)
    : undefined;

  return {
    id: Number(item.id),
    descricao: String(item.descricao ?? item.titulo ?? `Receita ${item.id}`),
    observacao: String(item.observacao ?? item.descricao ?? ''),
    dataLancamento: dataBase,
    competencia: competenciaBase,
    dataVencimento: String(item.dataVencimento ?? dataBase).slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? normalizarIsoDataHora(String(item.dataEfetivacao), '00:00') : (faturaCartaoId ? dataBase : undefined),
    tipoReceita: normalizarTipoReceita(item.tipoReceita ?? item.categoria),
    tipoRecebimento: normalizarTipoRecebimento(item.tipoRecebimento ?? item.tipoPagamento),
    recorrencia: normalizarRecorrenciaFinanceira(item.recorrencia),
    recorrenciaBase: normalizarRecorrenciaBaseFinanceira(
      item.recorrencia ?? item.recorrenciaBase ?? item.frequenciaRecorrencia,
      'unica',
    ),
    recorrenciaFixa: Boolean(item.recorrenciaFixa) && normalizarRecorrenciaFinanceira(item.recorrencia ?? item.recorrenciaBase ?? item.frequenciaRecorrencia) !== 'unica',
    quantidadeRecorrencia: normalizarQuantidadeRecorrencia(item.quantidadeRecorrencia),
    valorTotal: valorBase,
    valorLiquido,
    desconto,
    acrescimo,
    imposto,
    juros,
    valorEfetivacao: item.valorEfetivacao ? Number(item.valorEfetivacao) : undefined,
    status: normalizarStatusReceita(item.status),
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
    contaBancaria: contaBancariaNome,
    contaBancariaId: Number.isFinite(contaBancariaIdNormalizado) && contaBancariaIdNormalizado > 0
      ? contaBancariaIdNormalizado
      : undefined,
    contaDestino: contaDestinoNome,
    contaDestinoId: Number.isFinite(contaDestinoIdNormalizado) && contaDestinoIdNormalizado > 0
      ? contaDestinoIdNormalizado
      : undefined,
    cartao: cartaoNome,
    cartaoId: Number.isFinite(cartaoIdNormalizado) && cartaoIdNormalizado > 0
      ? cartaoIdNormalizado
      : undefined,
    faturaCartaoId,
    faturaId,
    ehFatura,
    statusFaturaCartao,
    receitasVinculadasIds,
    anexoDocumento: documentos[0]?.nomeArquivo ?? String(item.anexoDocumento ?? ''),
    documentos,
    logs: Array.isArray(item.logs)
      ? (item.logs as LogReceita[])
      : [{ id: 1, data: dataBase, acao: 'IMPORTADA', descricao: 'Registro carregado da API.' }],
  };
}

export default function TelaReceita() {
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
  const [receitaSelecionadaId, setReceitaSelecionadaId] = useState<number | null>(idParam);
  const [receitas, setReceitas] = useState<ReceitaRegistro[]>([]);
  const [detalhesFaturasCartao, setDetalhesFaturasCartao] = useState<FaturaCartaoDetalheApi[]>([]);
  const [formulario, setFormulario] = useState<ReceitaForm>(() => criarFormularioVazio(locale));
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
  const [receitaPendenteCancelamento, setReceitaPendenteCancelamento] = useState<ReceitaRegistro | null>(null);
  const [receitaPendenteEdicaoRecorrente, setReceitaPendenteEdicaoRecorrente] = useState<ReceitaRegistro | null>(null);
  const [escopoCancelamentoRecorrente, setEscopoCancelamentoRecorrente] = useState<EscopoAcaoRecorrencia>('apenasEsta');
  const [escopoEdicaoRecorrente, setEscopoEdicaoRecorrente] = useState<EscopoAcaoRecorrencia>('apenasEsta');
  const [faturasExpandidas, setFaturasExpandidas] = useState<number[]>([]);
  const [salvandoReceita, setSalvandoReceita] = useState(false);
  const [cancelandoReceita, setCancelandoReceita] = useState(false);
  const [menuAcoesAbertoReceitaId, setMenuAcoesAbertoReceitaId] = useState<number | null>(null);
  const definirTipoRateioAmigos = (valor: TipoRateioAmigos) => {
    tipoRateioAmigosRef.current = valor;
    setTipoRateioAmigos(valor);
  };

  const receitaSelecionada = receitas.find((receita) => receita.id === receitaSelecionadaId) ?? null;
  const tipoRecebimentoPermiteContaDestino = formulario.tipoRecebimento === 'transferencia' || formulario.tipoRecebimento === 'pix';
  const tipoRecebimentoExigeContaBancaria = formulario.tipoRecebimento === 'pix' || formulario.tipoRecebimento === 'transferencia';
  const tipoRecebimentoExigeCartao = formulario.tipoRecebimento === 'cartaoCredito' || formulario.tipoRecebimento === 'cartaoDebito';
  const tipoCartaoFiltrado = useMemo<'credito' | 'debito' | null>(() => {
    if (formulario.tipoRecebimento === 'cartaoDebito') return 'debito';
    if (formulario.tipoRecebimento === 'cartaoCredito') return 'credito';
    return null;
  }, [formulario.tipoRecebimento]);
  const opcoesCartoesApiCompativeis = useMemo(
    () =>
      opcoesCartoesApi.filter(
        (item) => !tipoCartaoFiltrado || normalizarTipoCartaoOpcao(item.tipo) === tipoCartaoFiltrado,
      ),
    [opcoesCartoesApi, tipoCartaoFiltrado],
  );
  const ocultarDataVencimentoCartaoCredito = formulario.tipoRecebimento === 'cartaoCredito';
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
    const cartao = opcoesCartoesApiCompativeis.find((item) => item.nome === valorSelecionado);
    return cartao?.id;
  }, [formulario.cartao, opcoesCartoesApiCompativeis]);
  const contaDestinoIdSelecionada = useMemo(() => {
    const valorSelecionado = formulario.contaDestino.trim();
    if (!valorSelecionado) return undefined;
    const idDireto = Number(valorSelecionado);
    if (Number.isFinite(idDireto) && idDireto > 0) return idDireto;
    const conta = opcoesContasBancariasApi.find((item) => item.nome === valorSelecionado);
    return conta?.id;
  }, [formulario.contaDestino, opcoesContasBancariasApi]);
  const referenciaContaBancariaSelecionada = useMemo(() => {
    if (contaBancariaIdSelecionada) {
      const conta = opcoesContasBancariasApi.find((item) => item.id === contaBancariaIdSelecionada);
      if (conta) return conta.banco ?? conta.nome;
    }
    return '';
  }, [contaBancariaIdSelecionada, opcoesContasBancariasApi]);
  const referenciaContaDestinoSelecionada = useMemo(() => {
    if (contaDestinoIdSelecionada) {
      const conta = opcoesContasBancariasApi.find((item) => item.id === contaDestinoIdSelecionada);
      if (conta) return conta.banco ?? conta.nome;
    }
    return '';
  }, [contaDestinoIdSelecionada, opcoesContasBancariasApi]);
  const referenciaCartaoSelecionado = useMemo(() => {
    if (cartaoIdSelecionado) {
      const cartao = opcoesCartoesApi.find((item) => item.id === cartaoIdSelecionado);
      if (cartao) return cartao.bandeira ?? cartao.nome;
    }
    return '';
  }, [cartaoIdSelecionado, opcoesCartoesApi]);
  const tipoRecebimentoComContaOuCartaoOpcional = Boolean(formulario.tipoRecebimento) && !tipoRecebimentoExigeContaBancaria && !tipoRecebimentoExigeCartao;
  const ocultarContaBancariaRecebimentoOpcional = tipoRecebimentoComContaOuCartaoOpcional && Boolean(formulario.cartao);
  const ocultarCartaoRecebimentoOpcional = tipoRecebimentoComContaOuCartaoOpcional && Boolean(formulario.contaBancaria);
  const exibeContaBancaria = (tipoRecebimentoExigeContaBancaria || tipoRecebimentoComContaOuCartaoOpcional) && !ocultarContaBancariaRecebimentoOpcional;
  const exibeCartaoRecebimento = (tipoRecebimentoExigeCartao || tipoRecebimentoComContaOuCartaoOpcional) && !ocultarCartaoRecebimentoOpcional;
  const exibeContaDestinoRecebimento = tipoRecebimentoPermiteContaDestino;
  const areasCatalogo = useMemo(() => opcoesAreasSubareasApi.filter((item) => item.tipo === 'receita'), [opcoesAreasSubareasApi]);
  
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
  const opcoesAreasRateio = useMemo(() => Array.from(new Set([...areasCatalogo.map((item) => item.nome), ...receitas.flatMap((receita) => receita.areasRateio.map((chave) => separarAreaSubarea(chave).area)).filter(Boolean)])).sort(), [areasCatalogo, receitas]);
  const opcoesSubareasRateio = useMemo(() => {
    if (!novaAreaRateio) return [];
    const subareasApi = areasCatalogo.find((item) => item.nome === novaAreaRateio)?.subAreas.map((item) => item.nome) ?? [];
    const subareasHistoricas = receitas
      .flatMap((receita) => receita.areasRateio)
      .map((chave) => separarAreaSubarea(chave))
      .filter((item) => item.area === novaAreaRateio)
      .map((item) => item.subarea);
    return Array.from(new Set([...subareasApi, ...subareasHistoricas].filter(Boolean))).sort();
  }, [novaAreaRateio, areasCatalogo, receitas]);
  const mapaContasBancariasPorId = useMemo(
    () => new Map(opcoesContasBancariasApi.map((item) => [item.id, item.nome])),
    [opcoesContasBancariasApi],
  );
  const mapaReferenciaContaPorNome = useMemo(
    () => new Map(opcoesContasBancariasApi.map((item) => [item.nome, item.banco ?? item.nome])),
    [opcoesContasBancariasApi],
  );
  const mapaCartoesPorId = useMemo(
    () => new Map(opcoesCartoesApi.map((item) => [item.id, item.nome])),
    [opcoesCartoesApi],
  );
  const mapaReferenciaCartaoPorNome = useMemo(
    () => new Map(opcoesCartoesApi.map((item) => [item.nome, item.bandeira ?? item.nome])),
    [opcoesCartoesApi],
  );
  const opcoesContaBancaria = useMemo(
    () =>
      Array.from(
        new Set([
          ...opcoesContasBancariasApi.map((item) => item.nome),
          ...receitas.map((receita) => {
            const nomeConta = receita.contaBancaria?.trim() || receita.contaDestino?.trim();
            if (nomeConta) return nomeConta;
            const contaId = receita.contaBancariaId ?? receita.contaDestinoId;
            if (!contaId) return '';
            return mapaContasBancariasPorId.get(contaId) ?? '';
          }),
        ].filter((conta) => Boolean(conta.trim()))),
      ).sort(),
    [opcoesContasBancariasApi, receitas, mapaContasBancariasPorId],
  );
  const opcoesCartao = useMemo(
    () =>
      Array.from(
        new Set([
          ...opcoesCartoesApiCompativeis.map((item) => item.nome),
          ...(tipoCartaoFiltrado
            ? []
            : receitas.map((receita) => {
              const nomeCartao = receita.cartao?.trim();
              if (nomeCartao) return nomeCartao;
              if (!receita.cartaoId) return '';
              return mapaCartoesPorId.get(receita.cartaoId) ?? '';
            })),
        ].filter((cartao) => Boolean(cartao.trim()))),
      ).sort(),
    [opcoesCartoesApiCompativeis, tipoCartaoFiltrado, receitas, mapaCartoesPorId],
  );
  const opcoesContaBancariaSelect = useMemo(
    () =>
      opcoesContaBancaria.map((conta) => {
        const referencia = mapaReferenciaContaPorNome.get(conta) ?? conta;
        return { value: conta, label: conta, icone: obterIconeBanco(referencia), imagem: obterImagemBanco(referencia) };
      }),
    [opcoesContaBancaria, mapaReferenciaContaPorNome],
  );
  const opcoesContaDestinoSelect = useMemo(
    () => opcoesContaBancariaSelect.filter((opcao) => opcao.value !== formulario.contaBancaria),
    [opcoesContaBancariaSelect, formulario.contaBancaria],
  );
  const opcoesCartaoSelect = useMemo(
    () =>
      opcoesCartao.map((cartao) => {
        const referencia = mapaReferenciaCartaoPorNome.get(cartao) ?? cartao;
        return { value: cartao, label: cartao, icone: obterIconeBandeiraCartao(referencia), imagem: obterImagemBandeiraCartao(referencia) };
      }),
    [opcoesCartao, mapaReferenciaCartaoPorNome],
  );
  useEffect(() => {
    const cartaoSelecionado = formulario.cartao.trim();
    if (!cartaoSelecionado) return;
    const cartaoCompativel = opcoesCartaoSelect.some((opcao) => opcao.value === cartaoSelecionado);
    if (cartaoCompativel) return;
    setFormulario((atual) => (atual.cartao ? { ...atual, cartao: '' } : atual));
  }, [formulario.cartao, opcoesCartaoSelect]);
  const quantidadeRecorrenciaObrigatoria = !formulario.recorrenciaFixa && recorrenciaExigeQuantidade(formulario.recorrenciaBase);
  const exibirQuantidadeRecorrencia = !formulario.recorrenciaFixa && recorrenciaAceitaQuantidade(formulario.recorrenciaBase);
  const rotuloQuantidadeRecorrencia = t('financeiro.comum.campos.quantidadeRecorrencia');
  const quantidadeParcelasInformada = normalizarQuantidadeRecorrencia(formulario.quantidadeRecorrencia) ?? 0;
  const exibeInterpretacaoValorParcelado = formulario.tipoRecebimento === 'cartaoCredito' && quantidadeParcelasInformada > 1;
  const calcularValorLiquidoComInterpretacao = (formularioAtualizado: ReceitaForm) => {
    const quantidadeParcelas = normalizarQuantidadeRecorrencia(formularioAtualizado.quantidadeRecorrencia) ?? 0;
    const valorTotalInformado = converterTextoParaNumero(formularioAtualizado.valorTotal, locale);
    const valorTotal = calcularValorTotalPorInterpretacaoParcelamento(
      valorTotalInformado,
      formularioAtualizado.tipoRecebimento,
      quantidadeParcelas,
      formularioAtualizado.interpretacaoValorParcelado,
    );
    const desconto = converterTextoParaNumero(formularioAtualizado.desconto, locale);
    const acrescimo = converterTextoParaNumero(formularioAtualizado.acrescimo, locale);
    const imposto = converterTextoParaNumero(formularioAtualizado.imposto, locale);
    const juros = converterTextoParaNumero(formularioAtualizado.juros, locale);
    return Math.max(0, Number((valorTotal - desconto + acrescimo + imposto + juros).toFixed(2)));
  };
  const mensagemLimiteRecorrenciaNormal = t('financeiro.comum.mensagens.limiteRecorrenciaNormal').replace('{limite}', String(LIMITE_RECORRENCIA_NORMAL));
  const competenciaLabel = useMemo(() => formatarCompetencia(competencia, locale), [competencia, locale]);
  const competenciaConsulta = useMemo(() => serializarCompetencia(competencia), [competencia]);
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

  const ehReceitaRecorrente = (receita: ReceitaRegistro | null) =>
    Boolean(
      receita
      && (
        receita.recorrenciaBase !== 'unica'
        || receita.recorrenciaFixa
        || (receita.quantidadeRecorrencia ?? 0) > 1
      ),
    );

  const carregarReceitasApi = async (signal?: AbortSignal) => {
    try {
      const dataInicio = filtroAplicado.dataInicio.trim() || undefined;
      const dataFim = filtroAplicado.dataFim.trim() || undefined;
      const opcoesConsulta = {
        signal,
        id: filtroAplicado.id.trim() || undefined,
        descricao: filtroAplicado.descricao.trim() || undefined,
        dataInicio,
        dataFim,
        competencia: competenciaConsulta,
        desconsiderarVinculadosCartaoCredito: true,
        verificarUltimaRecorrencia: true,
      };
      const [dados, detalhesFatura] = await Promise.all([
        listarReceitasApi(opcoesConsulta),
        listarDetalhesFaturasCartaoApi({
          signal,
          competencia: competenciaConsulta,
          tipoTransacao: 'receita',
        }).catch(() => [] as FaturaCartaoDetalheApi[]),
      ]);
      setReceitas(dados.map(mapearReceitaApi));
      setDetalhesFaturasCartao(detalhesFatura);
    } catch {
      setReceitas([]);
      setDetalhesFaturasCartao([]);
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
    void carregarReceitasApi(controller.signal);
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
    void carregarReceitaPorId(idParam);
  }, [idParam]);

  const receitasFiltradas = useMemo(() => {
    return receitas.filter((receita) => {
      const bateId = !filtroAplicado.id || String(receita.id).includes(filtroAplicado.id);
      const termo = filtroAplicado.descricao.trim().toLowerCase();
      const tipoTraduzido = t(`financeiro.receita.tipoReceita.${receita.tipoReceita}`).toLowerCase();
      const statusTraduzido = obterRotuloStatusReceita(receita.status, t).toLowerCase();
      const bateDescricao =
        !termo ||
        receita.descricao.toLowerCase().includes(termo) ||
        receita.observacao.toLowerCase().includes(termo) ||
        tipoTraduzido.includes(termo) ||
        statusTraduzido.includes(termo);
      const bateData = estaDentroIntervalo(receita.dataLancamento, filtroAplicado.dataInicio, filtroAplicado.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [receitas, filtroAplicado, t]);

  const receitaBateFiltroLista = (receita: ReceitaRegistro) => {
    const bateId = !filtroAplicado.id || String(receita.id).includes(filtroAplicado.id);
    const termo = filtroAplicado.descricao.trim().toLowerCase();
    const tipoTraduzido = t(`financeiro.receita.tipoReceita.${receita.tipoReceita}`).toLowerCase();
    const statusTraduzido = obterRotuloStatusReceita(receita.status, t).toLowerCase();
    const bateDescricao =
      !termo
      || receita.descricao.toLowerCase().includes(termo)
      || receita.observacao.toLowerCase().includes(termo)
      || tipoTraduzido.includes(termo)
      || statusTraduzido.includes(termo);
    const bateData = estaDentroIntervalo(receita.dataLancamento, filtroAplicado.dataInicio, filtroAplicado.dataFim);
    return bateId && bateDescricao && bateData;
  };

  const gruposFaturaApi = useMemo<GrupoFaturaReceita[]>(() => {
    const mapaStatusPorReceitaId = new Map(receitas.map((receita) => [receita.id, receita.status]));
    return detalhesFaturasCartao
      .map((detalhe) => {
        const statusFaturaCartao = normalizarStatusFaturaCartao(detalhe.status);
        const receitasVinculadas = detalhe.transacoes
          .map((transacao) => {
            const transacaoId = Number((transacao as Record<string, unknown>).id ?? (transacao as Record<string, unknown>).transacaoId ?? 0);
            const statusTransacaoLista = mapaStatusPorReceitaId.get(transacaoId);
            return mapearReceitaApi({
            ...transacao,
            faturaCartaoId: detalhe.faturaCartaoId,
            faturaId: detalhe.faturaCartaoId,
            statusFaturaCartao,
              status: statusTransacaoLista ?? resolverStatusOperacionalTransacaoFatura(transacao as Record<string, unknown>, statusFaturaCartao),
            });
          })
          .filter(receitaBateFiltroLista)
          .sort(compararPorLancamentoEfetivacaoDecrescente);
        const dataBase = detalhe.competencia
          ? normalizarIsoDataHora(`${detalhe.competencia}-01`, '00:00')
          : normalizarIsoDataHora(new Date().toISOString().slice(0, 10), '00:00');
        const valorTotalTransacoes = Number.isFinite(detalhe.valorTotalTransacoes) ? detalhe.valorTotalTransacoes : receitasVinculadas.reduce((total, item) => total + item.valorLiquido, 0);
        const valorTotalFatura = Number.isFinite(detalhe.valorTotal) ? detalhe.valorTotal : valorTotalTransacoes;
        const fatura = mapearReceitaApi({
          id: detalhe.faturaCartaoId * -1,
          faturaCartaoId: detalhe.faturaCartaoId,
          ehFatura: true,
          statusFaturaCartao,
          descricao: `${t('financeiro.cartao.faturaTitulo')} ${detalhe.competencia || ''}`.trim(),
          observacao: '',
          dataLancamento: dataBase,
          dataVencimento: dataBase,
          dataEfetivacao: dataBase,
          tipoReceita: 'outros',
          tipoRecebimento: 'cartaoCredito',
          valorTotal: valorTotalTransacoes,
          valorLiquido: valorTotalTransacoes,
          status: statusFaturaCartao === 'efetivada' ? 'efetivada' : 'pendente',
          receitasVinculadas: receitasVinculadas.map((item) => ({ id: item.id })),
        });
        return {
          fatura,
          receitasVinculadas,
          valorTotalGrupo: valorTotalTransacoes,
          valorTotalFatura,
          valorTotalTransacoes,
          cartaoId: detalhe.cartaoId,
          competencia: detalhe.competencia,
          statusFaturaCartao,
        };
      })
      .sort((a, b) => compararPorLancamentoEfetivacaoDecrescente(a.fatura, b.fatura));
  }, [detalhesFaturasCartao, receitas, filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, t]);
  const gruposFatura = gruposFaturaApi;
  const mapaGrupoPorFaturaId = useMemo(
    () => new Map(gruposFatura.map((grupo) => [grupo.fatura.id, grupo])),
    [gruposFatura],
  );
  const idsReceitasVinculadasAFatura = useMemo(() => {
    const ids = new Set<number>();
    gruposFatura.forEach((grupo) => {
      grupo.receitasVinculadas.forEach((receita) => ids.add(receita.id));
    });
    receitasFiltradas
      .filter((receita) => Boolean(receita.faturaCartaoId))
      .forEach((receita) => ids.add(receita.id));
    return ids;
  }, [gruposFatura, receitasFiltradas]);
  const receitasListaPrincipal = useMemo(() => {
    const idsPaisFaturas = new Set(gruposFatura.map((grupo) => grupo.fatura.id));
    const receitasNaoVinculadas = receitasFiltradas.filter(
      (receita) => !idsReceitasVinculadasAFatura.has(receita.id) && !receita.faturaCartaoId,
    );
    const faturasOrdenadas = [...gruposFatura.map((grupo) => grupo.fatura)].sort(compararPorLancamentoEfetivacaoDecrescente);
    const receitasOrdenadas = receitasNaoVinculadas
      .filter((receita) => !idsPaisFaturas.has(receita.id))
      .sort(compararPorLancamentoEfetivacaoDecrescente);
    return [
      ...faturasOrdenadas,
      ...receitasOrdenadas,
    ];
  }, [gruposFatura, idsReceitasVinculadasAFatura, receitasFiltradas]);
  const totalListaPrincipal = useMemo(() => {
    const idsPaisFaturas = new Set(gruposFatura.map((grupo) => grupo.fatura.id));
    const totalFaturas = gruposFatura.reduce((total, grupo) => total + grupo.valorTotalGrupo, 0);
    const totalTransacoesComuns = receitasListaPrincipal
      .filter((receita) => !idsPaisFaturas.has(receita.id))
      .reduce((total, receita) => total + receita.valorLiquido, 0);
    return totalFaturas + totalTransacoesComuns;
  }, [gruposFatura, receitasListaPrincipal]);

  const atualizarCampoMoeda = (campo: keyof ReceitaForm, valor: string) => {
    setCamposInvalidos((atual) => ({ ...atual, [campo]: false }));
    setFormulario((atual) => {
      const atualizado = { ...atual, [campo]: aplicarMascaraMoeda(valor, locale) };
      const valorLiquido = calcularValorLiquidoComInterpretacao(atualizado);
      return {
        ...atualizado,
        valorLiquido: formatarMoedaParaInput(valorLiquido, locale),
        valorEfetivacao: formatarMoedaParaInput(valorLiquido, locale),
      };
    });
  };

  const mapaNomeAmigoRateioPorId = useMemo(
    () => new Map(opcoesAmigosRateioApi.map((item) => [item.id, item.nome])),
    [opcoesAmigosRateioApi],
  );
  const mapaNomeAreaRateioPorId = useMemo(
    () => new Map(areasCatalogo.map((item) => [item.id, item.nome])),
    [areasCatalogo],
  );
  const mapaNomeSubareaRateioPorAreaIdEId = useMemo(
    () =>
      new Map(
        areasCatalogo.flatMap((item) => item.subAreas.map((subArea) => [`${item.id}:${subArea.id}`, subArea.nome] as const)),
      ),
    [areasCatalogo],
  );
  const extrairIdRateioPorTexto = (valor: string): number | null => {
    const texto = String(valor ?? '').trim();
    if (!texto) return null;
    const textoSemPrefixo = texto.startsWith('#') ? texto.slice(1) : texto;
    const numero = Number(textoSemPrefixo);
    return Number.isFinite(numero) && numero > 0 ? numero : null;
  };

  const preencherFormulario = (receita: ReceitaRegistro) => {
    const resolverNomeAmigoRateio = (valor: string) => {
      const amigoId = extrairIdRateioPorTexto(valor);
      if (!amigoId) return valor;
      return mapaNomeAmigoRateioPorId.get(amigoId) ?? valor;
    };
    const resolverChaveAreaSubareaRateio = (chave: string) => {
      const { area, subarea } = separarAreaSubarea(chave);
      const areaId = extrairIdRateioPorTexto(area);
      const subareaId = extrairIdRateioPorTexto(subarea);
      const areaNormalizada = areaId ? (mapaNomeAreaRateioPorId.get(areaId) ?? area) : area;
      if (!subareaId) return montarChaveAreaSubarea(areaNormalizada, subarea);
      if (areaId) {
        const subareaNormalizada = mapaNomeSubareaRateioPorAreaIdEId.get(`${areaId}:${subareaId}`) ?? subarea;
        return montarChaveAreaSubarea(areaNormalizada, subareaNormalizada);
      }
      const entradaSubarea = Array.from(mapaNomeSubareaRateioPorAreaIdEId.entries())
        .find(([chaveSubarea]) => chaveSubarea.endsWith(`:${subareaId}`));
      return montarChaveAreaSubarea(areaNormalizada, entradaSubarea?.[1] ?? subarea);
    };
    const amigosRateioNormalizado = Array.from(
      new Set(receita.amigosRateio.map(resolverNomeAmigoRateio).filter((valor) => Boolean(String(valor).trim()))),
    );
    const rateioAmigosValoresNormalizado = Object.entries(receita.rateioAmigosValores).reduce<Record<string, number>>(
      (acumulado, [chave, valor]) => {
        const chaveNormalizada = resolverNomeAmigoRateio(chave);
        if (!chaveNormalizada) return acumulado;
        acumulado[chaveNormalizada] = Number(acumulado[chaveNormalizada] ?? 0) + Number(valor ?? 0);
        return acumulado;
      },
      {},
    );
    const areasRateioNormalizado = Array.from(
      new Set(receita.areasRateio.map(resolverChaveAreaSubareaRateio).filter((valor) => Boolean(String(valor).trim()))),
    );
    const rateioAreasValoresNormalizado = Object.entries(receita.rateioAreasValores).reduce<Record<string, number>>(
      (acumulado, [chave, valor]) => {
        const chaveNormalizada = resolverChaveAreaSubareaRateio(chave);
        if (!chaveNormalizada) return acumulado;
        acumulado[chaveNormalizada] = Number(acumulado[chaveNormalizada] ?? 0) + Number(valor ?? 0);
        return acumulado;
      },
      {},
    );

    definirTipoRateioAmigos(receita.tipoRateioAmigos);
    setFormulario({
      descricao: normalizarDescricaoMaiuscula(receita.descricao, locale),
      observacao: receita.observacao,
      dataLancamento: receita.dataLancamento,
      competencia: formatarCompetenciaParaEntrada(desserializarCompetencia(receita.competencia) ?? obterCompetenciaPorData(receita.dataLancamento), locale),
      dataVencimento: receita.dataVencimento,
      dataEfetivacao: receita.dataEfetivacao || `${new Date().toISOString().split('T')[0]}T00:00`,
      dataEstorno: `${new Date().toISOString().split('T')[0]}T00:00`,
      tipoReceita: receita.tipoReceita,
      tipoRecebimento: receita.tipoRecebimento,
      recorrenciaBase: receita.recorrenciaBase,
      recorrenciaFixa: receita.recorrenciaFixa,
      quantidadeRecorrencia: receita.quantidadeRecorrencia ? String(receita.quantidadeRecorrencia) : '',
      interpretacaoValorParcelado: 'valorParcela',
      valorTotal: formatarMoedaParaInput(receita.valorTotal, locale),
      valorLiquido: formatarMoedaParaInput(receita.valorLiquido, locale),
      desconto: formatarMoedaParaInput(receita.desconto, locale),
      acrescimo: formatarMoedaParaInput(receita.acrescimo, locale),
      imposto: formatarMoedaParaInput(receita.imposto, locale),
      juros: formatarMoedaParaInput(receita.juros, locale),
      valorEfetivacao: formatarMoedaParaInput(receita.valorEfetivacao ?? receita.valorLiquido, locale),
      amigosRateio: amigosRateioNormalizado,
      valorTotalRateioAmigos: formatarMoedaParaInput(receita.valorTotalRateioAmigos, locale),
      rateioAmigosValores: Object.fromEntries(Object.entries(rateioAmigosValoresNormalizado).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      areasRateio: areasRateioNormalizado,
      rateioAreasValores: Object.fromEntries(Object.entries(rateioAreasValoresNormalizado).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      contaBancaria: receita.contaBancaria?.trim()
        ? receita.contaBancaria
        : (receita.contaBancariaId ? (mapaContasBancariasPorId.get(receita.contaBancariaId) ?? '') : ''),
      contaDestino: receita.contaDestino?.trim()
        ? receita.contaDestino
        : (receita.contaDestinoId ? (mapaContasBancariasPorId.get(receita.contaDestinoId) ?? '') : ''),
      cartao: receita.cartao?.trim()
        ? receita.cartao
        : (receita.cartaoId ? (mapaCartoesPorId.get(receita.cartaoId) ?? '') : ''),
      anexoDocumento: receita.anexoDocumento,
      documentos: receita.documentos,
      observacaoEfetivacao: '',
      observacaoEstorno: '',
      ocultarEfetivacaoEstornoRegistros: true,
    });
  };

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };


  const carregarReceitaPorId = async (id: number) => {
    try {
      const detalhe = await obterReceitaApi(id);
      const receitaCompleta = mapearReceitaApi(detalhe);
      setReceitas((atual) => {
        const indice = atual.findIndex((item) => item.id === receitaCompleta.id);
        if (indice < 0) return [...atual, receitaCompleta];
        const proximo = [...atual];
        proximo[indice] = receitaCompleta;
        return proximo;
      });
      setReceitaSelecionadaId(receitaCompleta.id);
      preencherFormulario(receitaCompleta);
      return receitaCompleta;
    } catch {
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const resetarTela = () => {
    setModoTela('lista');
    setReceitaSelecionadaId(null);
    setFormulario((atual) => ({
      ...criarFormularioVazio(locale),
      competencia: formatarCompetenciaParaEntrada(competencia, locale),
    }));
    definirTipoRateioAmigos('comum');
    setNovoAmigoRateio(participanteRateioPadrao);
    setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
    setNovaAreaRateio('');
    setNovaSubareaRateio('');
    setNovoValorAreaRateio(formatarMoedaParaInput(0, locale));
    setReceitaPendenteEdicaoRecorrente(null);
    setEscopoEdicaoRecorrente('apenasEsta');
    setEscopoCancelamentoRecorrente('apenasEsta');
  };

  const abrirNovo = () => {
    setReceitaSelecionadaId(null);
    setFormulario((atual) => ({
      ...criarFormularioVazio(locale),
      competencia: formatarCompetenciaParaEntrada(competencia, locale),
    }));
    setModoTela('novo');
  };

  const abrirVisualizacao = (receita: ReceitaRegistro) => {
    setModoTela('visualizacao');
    void carregarReceitaPorId(receita.id);
  };

  const abrirEdicao = (receita: ReceitaRegistro) => {
    if (!podeAlterarTransacaoVinculadaAFatura(receita.faturaCartaoId, receita.id, receita.statusFaturaCartao)) {
      return;
    }
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.edicaoSomentePendente'));
      return;
    }
    setModoTela('edicao');
    void carregarReceitaPorId(receita.id);
  };

  const combinarRateiosParaDuplicacao = (receitaDetalhada: ReceitaRegistro, receitaOrigem: ReceitaRegistro): ReceitaRegistro => {
    const preservarRateioAmigosOrigem = receitaDetalhada.amigosRateio.length === 0 && receitaOrigem.amigosRateio.length > 0;
    const preservarRateioAreasOrigem = receitaDetalhada.areasRateio.length === 0 && receitaOrigem.areasRateio.length > 0;
    if (!preservarRateioAmigosOrigem && !preservarRateioAreasOrigem) return receitaDetalhada;

    const amigosRateio = preservarRateioAmigosOrigem ? [...receitaOrigem.amigosRateio] : receitaDetalhada.amigosRateio;
    const rateioAmigosValores = preservarRateioAmigosOrigem
      ? { ...receitaOrigem.rateioAmigosValores }
      : receitaDetalhada.rateioAmigosValores;
    const areasRateio = preservarRateioAreasOrigem ? [...receitaOrigem.areasRateio] : receitaDetalhada.areasRateio;
    const rateioAreasValores = preservarRateioAreasOrigem
      ? { ...receitaOrigem.rateioAreasValores }
      : receitaDetalhada.rateioAreasValores;

    return {
      ...receitaDetalhada,
      tipoRateioAmigos: preservarRateioAmigosOrigem ? receitaOrigem.tipoRateioAmigos : receitaDetalhada.tipoRateioAmigos,
      valorTotalRateioAmigos: preservarRateioAmigosOrigem ? receitaOrigem.valorTotalRateioAmigos : receitaDetalhada.valorTotalRateioAmigos,
      amigosRateio,
      rateioAmigosValores,
      areasRateio,
      rateioAreasValores,
      rateiosAmigos: amigosRateio.map((amigo) => ({ amigo, valor: Number(rateioAmigosValores[amigo] ?? 0) })),
      rateiosAreaSubarea: areasRateio.map((chave) => {
        const { area, subarea } = separarAreaSubarea(chave);
        return { area, subarea, valor: Number(rateioAreasValores[chave] ?? 0) };
      }),
    };
  };

  const abrirDuplicacao = async (receita: ReceitaRegistro) => {
    const receitaCompleta = await carregarReceitaPorId(receita.id);
    if (!receitaCompleta) return;
    preencherFormulario(combinarRateiosParaDuplicacao(receitaCompleta, receita));
    setReceitaSelecionadaId(null);
    setModoTela('novo');
  };

  const abrirEfetivacao = (receita: ReceitaRegistro) => {
    if (!podeAlterarTransacaoVinculadaAFatura(receita.faturaCartaoId, receita.id, receita.statusFaturaCartao)) {
      return;
    }
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setModoTela('efetivacao');
    void carregarReceitaPorId(receita.id);
  };

  const abrirEstorno = (receita: ReceitaRegistro) => {
    if (!podeAlterarTransacaoVinculadaAFatura(receita.faturaCartaoId, receita.id, receita.statusFaturaCartao)) {
      return;
    }
    if (receita.status !== 'efetivada') {
      notificarErro( t('financeiro.receita.mensagens.estornoSomenteEfetivada'));
      return;
    }
    setModoTela('estorno');
    void carregarReceitaPorId(receita.id);
  };

  const serializarValores = (valores: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(valores)
        .filter(([, valor]) => valor)
        .map(([chave, valor]) => [chave, converterTextoParaNumero(valor, locale)]),
    );

  const adicionarRateioAmigo = () => {
    const amigo = novoAmigoRateio.trim();
    if (!amigo) {
      notificarErro(t('financeiro.receita.mensagens.obrigatorio'));
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
      notificarErro(t('financeiro.receita.mensagens.valorObrigatorio'));
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
      notificarErro(t('financeiro.receita.mensagens.obrigatorio'));
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
      notificarErro(t('financeiro.receita.mensagens.obrigatorio'));
      return;
    }

    const valorTotalRateioAmigos = converterTextoParaNumero(formulario.valorTotalRateioAmigos, locale);
    if (valorTotalRateioAmigos <= 0) {
      notificarErro(t('financeiro.receita.mensagens.valorObrigatorio'));
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
      notificarErro(t('financeiro.receita.mensagens.obrigatorio'));
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
    const dataVencimento = ocultarDataVencimentoCartaoCredito ? '' : formulario.dataVencimento;
    const quantidadeRecorrencia = normalizarQuantidadeRecorrencia(formulario.quantidadeRecorrencia);
    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!formulario.dataLancamento) invalidos.dataLancamento = true;
    if (!ocultarDataVencimentoCartaoCredito && !dataVencimento) invalidos.dataVencimento = true;
    if (!formulario.tipoReceita) invalidos.tipoReceita = true;
    if (!formulario.tipoRecebimento) invalidos.tipoRecebimento = true;
    if (tipoRecebimentoExigeContaBancaria && !contaBancariaIdSelecionada) invalidos.contaBancaria = true;
    if (tipoRecebimentoExigeCartao && !cartaoIdSelecionado) invalidos.cartao = true;
    if (formulario.contaBancaria && formulario.cartao) {
      invalidos.contaBancaria = true;
      invalidos.cartao = true;
    }
    if (quantidadeRecorrenciaObrigatoria && !quantidadeRecorrencia) invalidos.quantidadeRecorrencia = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.receita.mensagens.obrigatorio'));
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


    if (!ocultarDataVencimentoCartaoCredito && dataIsoMaiorQue(formulario.dataLancamento, dataVencimento)) {
      setCamposInvalidos((atual) => ({ ...atual, dataVencimento: true }));
      notificarErro(t('financeiro.receita.mensagens.dataVencimentoMaiorQueLancamento'));
      return null;
    }

    if (!formulario.competencia.trim()) {
      notificarErro(t('financeiro.comum.mensagens.competenciaObrigatoria'));
      return null;
    }

    if (tipoRecebimentoExigeContaBancaria && !contaBancariaIdSelecionada) {
      setCamposInvalidos((atual) => ({ ...atual, contaBancaria: true }));
      notificarErro( t('financeiro.receita.mensagens.contaObrigatoria'));
      return null;
    }

    const valorTotalInformado = converterTextoParaNumero(formulario.valorTotal, locale);
    const valorTotal = calcularValorTotalPorInterpretacaoParcelamento(
      valorTotalInformado,
      formulario.tipoRecebimento,
      quantidadeRecorrencia ?? 0,
      formulario.interpretacaoValorParcelado,
    );
    if (!valorTotal) {
      setCamposInvalidos((atual) => ({ ...atual, valorTotal: true }));
      notificarErro( t('financeiro.receita.mensagens.valorObrigatorio'));
      return null;
    }
    const desconto = converterTextoParaNumero(formulario.desconto, locale);
    const acrescimo = converterTextoParaNumero(formulario.acrescimo, locale);
    const imposto = converterTextoParaNumero(formulario.imposto, locale);
    const juros = converterTextoParaNumero(formulario.juros, locale);
    const valorLiquido = Math.max(0, Number((valorTotal - desconto + acrescimo + imposto + juros).toFixed(2)));
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
        notificarErro(t('financeiro.receita.mensagens.valorObrigatorio'));
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
      dataLancamento: formulario.dataLancamento,
      competencia: formulario.competencia.trim() || serializarCompetencia(obterCompetenciaPorData(formulario.dataLancamento)),
      dataVencimento: ocultarDataVencimentoCartaoCredito ? undefined : dataVencimento,
      valorTotal,
      valorLiquido,
      desconto,
      acrescimo,
      imposto,
      juros,
      quantidadeRecorrencia,
      valorTotalRateioAmigos,
      rateioAmigosValores: serializarValores(formulario.rateioAmigosValores),
      rateioAreasValores: serializarValores(formulario.rateioAreasValores),
    };
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
      descricao: normalizarDescricaoMaiuscula(formulario.descricao, locale),
      observacao: formulario.observacao,
      dataLancamento: formulario.dataLancamento,
      competencia: base.competencia,
      dataVencimento: base.dataVencimento,
      tipoReceita: formulario.tipoReceita,
      tipoRecebimento: formulario.tipoRecebimento,
      contaBancariaId: contaBancariaIdSelecionada ?? null,
      ...(tipoRecebimentoPermiteContaDestino ? { contaDestinoId: contaDestinoIdSelecionada ?? null } : {}),
      cartaoId: cartaoIdSelecionado ?? null,
      recorrencia: obterValorRecorrencia(formulario.recorrenciaBase),
      recorrenciaFixa: formulario.recorrenciaBase === 'unica' ? false : formulario.recorrenciaFixa,
      quantidadeRecorrencia:
        formulario.recorrenciaBase === 'unica' || formulario.recorrenciaFixa
          ? null
          : base.quantidadeRecorrencia,
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

    setSalvandoReceita(true);
    try {
      if (modoTela === 'novo') {
        await criarReceitaApi(payloadBase);
        await carregarReceitasApi();
        const criouSerie = formulario.recorrenciaBase !== 'unica' && (formulario.recorrenciaFixa || (base.quantidadeRecorrencia ?? 0) > 1);
        notificarSucesso(criouSerie ? t('financeiro.comum.mensagens.primeiraOcorrenciaGerada') : t('financeiro.receita.mensagens.criada'));
        resetarTela();
        return;
      }

      if (modoTela === 'edicao' && receitaSelecionada) {
        const escopoRecorrencia = obterEscopoRecorrenciaApi(escopoEdicao);
        await atualizarReceitaApi(receitaSelecionada.id, {
          ...payloadBase,
        }, {
          escopoRecorrencia,
        });
        await carregarReceitasApi();
        notificarSucesso(t('financeiro.receita.mensagens.atualizada'));
        resetarTela();
        return;
      }
    } catch {
      return;
    } finally {
      setSalvandoReceita(false);
    }
  };

  const iniciarFluxoSalvar = () => {
    if (modoTela === 'edicao' && ehReceitaRecorrente(receitaSelecionada)) {
      setReceitaPendenteEdicaoRecorrente(receitaSelecionada);
      setEscopoEdicaoRecorrente('apenasEsta');
      return;
    }
    void salvarCadastroOuEdicao();
  };

  const confirmarEdicaoRecorrente = async () => {
    const escopo = escopoEdicaoRecorrente;
    await salvarCadastroOuEdicao(escopo);
  };

  const efetivarReceita = async () => {
    if (!receitaSelecionada) return;
    if (!podeAlterarTransacaoVinculadaAFatura(receitaSelecionada.faturaCartaoId, receitaSelecionada.id, receitaSelecionada.statusFaturaCartao)) {
      return;
    }
    if (receitaSelecionada.status !== 'pendente') {
      notificarErro(t('financeiro.receita.mensagens.efetivacaoSomentePendente'));
      return;
    }
    const base = validarFormularioBase();
    if (!base || !formulario.dataEfetivacao || !formulario.tipoRecebimento) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: !formulario.dataEfetivacao, tipoRecebimento: !formulario.tipoRecebimento }));
      notificarErro( t('financeiro.receita.mensagens.obrigatorioEfetivacao'));
      return;
    }

    if (dataIsoMaiorQue(base.dataLancamento, formulario.dataEfetivacao)) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: true }));
      notificarErro(t('financeiro.receita.mensagens.dataEfetivacaoMaiorQueLancamento'));
      return;
    }

    if (tipoRecebimentoExigeContaBancaria && !contaBancariaIdSelecionada) {
      setCamposInvalidos((atual) => ({ ...atual, contaBancaria: true }));
      notificarErro( t('financeiro.receita.mensagens.contaObrigatoria'));
      return;
    }

    try {
      await efetivarReceitaApi(receitaSelecionada.id, {
        dataEfetivacao: formulario.dataEfetivacao,
        observacaoHistorico: formulario.observacaoEfetivacao.trim(),
        tipoRecebimento: formulario.tipoRecebimento,
        valorTotal: base.valorTotal,
        desconto: base.desconto,
        acrescimo: base.acrescimo,
        imposto: base.imposto,
        juros: base.juros,
        contaBancariaId: contaBancariaIdSelecionada ?? null,
        ...(tipoRecebimentoPermiteContaDestino ? { contaDestinoId: contaDestinoIdSelecionada ?? null } : {}),
        cartaoId: cartaoIdSelecionado ?? null,
        documentos: montarDocumentosPayload(formulario.documentos),
      });
      await carregarReceitasApi();
      notificarSucesso(t('financeiro.receita.mensagens.efetivada'));
      resetarTela();
      return;
    } catch {
      return;
    }
  };

  const cancelarReceita = (receita: ReceitaRegistro) => {
    if (!podeAlterarTransacaoVinculadaAFatura(receita.faturaCartaoId, receita.id, receita.statusFaturaCartao)) {
      return;
    }
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.cancelamentoSomentePendente'));
      return;
    }

    setReceitaPendenteCancelamento(receita);
    setEscopoCancelamentoRecorrente('apenasEsta');
  };

  const confirmarCancelamentoReceita = async () => {
    if (!receitaPendenteCancelamento) return;
    const escopo = escopoCancelamentoRecorrente;
    const escopoRecorrencia = obterEscopoRecorrenciaApi(escopo);
    setCancelandoReceita(true);
    try {
      await cancelarReceitaApi(receitaPendenteCancelamento.id, {
        escopoRecorrencia,
      });
      await carregarReceitasApi();
      notificarSucesso(t('comum.acoes.cancelar'));
      setReceitaPendenteCancelamento(null);
    } catch {
      return;
    } finally {
      setCancelandoReceita(false);
    }
  };

  const estornarReceita = async () => {
    if (!receitaSelecionada) return;
    if (!podeAlterarTransacaoVinculadaAFatura(receitaSelecionada.faturaCartaoId, receitaSelecionada.id, receitaSelecionada.statusFaturaCartao)) {
      return;
    }
    if (receitaSelecionada.status !== 'efetivada') {
      notificarErro( t('financeiro.receita.mensagens.estornoSomenteEfetivada'));
      return;
    }
    if (!formulario.dataEstorno) {
      setCamposInvalidos((atual) => ({ ...atual, dataEstorno: true }));
      notificarErro(t('financeiro.receita.mensagens.obrigatorioEstorno'));
      return;
    }
    if (dataIsoMaiorQue(receitaSelecionada.dataLancamento, formulario.dataEstorno)) {
      setCamposInvalidos((atual) => ({ ...atual, dataEstorno: true }));
      notificarErro(t('financeiro.receita.mensagens.dataEfetivacaoMaiorQueLancamento'));
      return;
    }
    if (receitaSelecionada.dataEfetivacao && dataIsoMaiorQue(receitaSelecionada.dataEfetivacao, formulario.dataEstorno)) {
      setCamposInvalidos((atual) => ({ ...atual, dataEstorno: true }));
      notificarErro(t('financeiro.receita.mensagens.dataEfetivacaoMaiorQueLancamento'));
      return;
    }

    try {
      await estornarReceitaApi(receitaSelecionada.id, {
        dataEstorno: formulario.dataEstorno,
        observacaoHistorico: formulario.observacaoEstorno.trim(),
        ocultarDoHistorico: formulario.ocultarEfetivacaoEstornoRegistros,
      });
      await carregarReceitasApi();
      notificarSucesso(t('financeiro.receita.mensagens.estornada'));
      resetarTela();
      return;
    } catch {
      return;
    }
  };

  const aceitarReceitaPendenteAprovacao = async (receita: ReceitaRegistro) => {
    if (receita.status !== 'pendenteAprovacao') return;
    try {
      await aprovarReceitaPendenteApi(receita.id);
      await carregarReceitasApi();
      return;
    } catch {
      return;
    }
  };

  const rejeitarReceitaPendenteAprovacao = async (receita: ReceitaRegistro) => {
    if (receita.status !== 'pendenteAprovacao') return;
    try {
      await rejeitarReceitaPendenteApi(receita.id);
      await carregarReceitasApi();
      return;
    } catch {
      return;
    }
  };

  const alternarExpansaoFatura = (faturaId: number) => {
    setFaturasExpandidas((atual) =>
      atual.includes(faturaId)
        ? atual.filter((id) => id !== faturaId)
        : [...atual, faturaId],
    );
  };

  const obterCorStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    if (status === 'efetivada') return COLORS.success;
    if (status === 'estornada') return COLORS.warning;
    return COLORS.warning;
  };

  const obterEstiloBadgeStatusReceita = (status: StatusReceita) => {
    if (status === 'efetivada') return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
    if (status === 'cancelada' || status === 'rejeitada') return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    return { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' };
  };

  const obterRotuloStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => String(status ?? 'aberta').toUpperCase();
  const obterEstiloBadgeStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    if (status === 'efetivada') return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
    if (status === 'estornada') return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    if (status === 'fechada') return { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };
    return { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' };
  };
  const renderBadgeStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    const estilo = obterEstiloBadgeStatusFaturaCartao(status);
    return (
      <DistintivoStatus
        testID="badge-tipo-transacao"
        rotulo={obterRotuloStatusFaturaCartao(status)}
        corTexto={estilo.corTexto}
        corBorda={estilo.corBorda}
        corFundo={estilo.corFundo}
      />
    );
  };

  const renderAcoesReceita = (
    receita: ReceitaRegistro,
    opcoes?: { ocultarAcoesOperacionais?: boolean; podeEfetivar?: boolean; ocultarTodasAcoes?: boolean; ocultarEfetivacaoEstorno?: boolean },
  ) => {
    const podeAlterar = podeAlterarTransacaoVinculadaAFatura(receita.faturaCartaoId, receita.id, receita.statusFaturaCartao);
    const opcoesMenu: OpcaoMenuAcoesItem[] = [];

    if (!(receita.ehFatura && !receita.faturaCartaoId)) {
      opcoesMenu.push({
        id: `receita-${receita.id}-visualizar`,
        rotulo: t('financeiro.receita.acoes.visualizar'),
        aoPressionar: () => abrirVisualizacao(receita),
      });
      opcoesMenu.push({
        id: `receita-${receita.id}-duplicar`,
        rotulo: t('comum.acoes.duplicar'),
        aoPressionar: () => abrirDuplicacao(receita),
      });

      if (receita.status === 'pendente' && !opcoes?.ocultarAcoesOperacionais && podeAlterar) {
        opcoesMenu.push({
          id: `receita-${receita.id}-editar`,
          rotulo: t('comum.acoes.editar'),
          aoPressionar: () => abrirEdicao(receita),
        });
      }
      if (receita.status === 'pendente' && (opcoes?.podeEfetivar ?? true) && !opcoes?.ocultarEfetivacaoEstorno && podeAlterar) {
        opcoesMenu.push({
          id: `receita-${receita.id}-efetivar`,
          rotulo: t('financeiro.receita.acoes.efetivar'),
          aoPressionar: () => abrirEfetivacao(receita),
        });
      }
      if (receita.status === 'pendente' && !opcoes?.ocultarAcoesOperacionais && podeAlterar) {
        opcoesMenu.push({
          id: `receita-${receita.id}-cancelar`,
          rotulo: t('comum.acoes.cancelar'),
          perigosa: true,
          aoPressionar: () => void cancelarReceita(receita),
        });
      }
      if (receita.status === 'pendenteAprovacao' && !receita.faturaCartaoId) {
        opcoesMenu.push({
          id: `receita-${receita.id}-aceitar`,
          rotulo: t('financeiro.comum.acoes.aceitar'),
          aoPressionar: () => void aceitarReceitaPendenteAprovacao(receita),
        });
        opcoesMenu.push({
          id: `receita-${receita.id}-rejeitar`,
          rotulo: t('financeiro.comum.acoes.rejeitar'),
          perigosa: true,
          aoPressionar: () => void rejeitarReceitaPendenteAprovacao(receita),
        });
      }
      if (receita.status === 'efetivada' && !opcoes?.ocultarEfetivacaoEstorno && podeAlterar) {
        opcoesMenu.push({
          id: `receita-${receita.id}-estornar`,
          rotulo: t('financeiro.receita.acoes.estornar'),
          perigosa: true,
          aoPressionar: () => abrirEstorno(receita),
        });
      }
    }

    return (
    opcoes?.ocultarTodasAcoes ? null : (
      <View style={{ alignItems: 'flex-end' }}>
        <MenuAcoesItem
          aberto={menuAcoesAbertoReceitaId === receita.id}
          aoAlternar={() => setMenuAcoesAbertoReceitaId((atual) => (atual === receita.id ? null : receita.id))}
          aoFechar={() => setMenuAcoesAbertoReceitaId(null)}
          tituloMenu={t('compras.acoes.menuAcoes')}
          opcoes={opcoesMenu}
        />
      </View>
    )
    );
  };

  const renderCartaoReceita = (
    receita: ReceitaRegistro,
    opcoes?: { margemInferior?: number; ocultarAcoesOperacionais?: boolean; podeEfetivar?: boolean; ocultarTodasAcoes?: boolean; ocultarEfetivacaoEstorno?: boolean },
  ) => {
    const corStatus = receita.ehFatura
      ? obterCorStatusFaturaCartao(receita.statusFaturaCartao)
      : (receita.status === 'efetivada' ? COLORS.success : receita.status === 'cancelada' ? COLORS.error : COLORS.warning);
    const rotuloStatus = receita.ehFatura
      ? obterRotuloStatusFaturaCartao(receita.statusFaturaCartao)
      : obterRotuloStatusReceita(receita.status, t);
    const estiloBadge = receita.ehFatura
      ? obterEstiloBadgeStatusFaturaCartao(receita.statusFaturaCartao)
      : obterEstiloBadgeStatusReceita(receita.status);

    return (
      <View
        key={receita.id}
        style={{
          position: 'relative',
          zIndex: menuAcoesAbertoReceitaId === receita.id ? 80 : 1,
          elevation: menuAcoesAbertoReceitaId === receita.id ? 24 : 1,
          overflow: 'visible',
          backgroundColor: COLORS.bgTertiary,
          borderWidth: 1,
          borderColor: COLORS.borderColor,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 10,
          marginBottom: opcoes?.margemInferior ?? 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
            position: 'relative',
            zIndex: menuAcoesAbertoReceitaId === receita.id ? 90 : 1,
            elevation: menuAcoesAbertoReceitaId === receita.id ? 26 : 1,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 }}>
              #{receita.id} {receita.descricao}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>
              {[t(`financeiro.receita.tipoReceita.${receita.tipoReceita}`), receita.tipoRecebimento === 'cartaoCredito' ? null : formatarDataPorIdioma(receita.dataVencimento)].filter(Boolean).join(' | ')}
            </Text>
            <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 3 }}>
              {receita.observacao || t('financeiro.receita.mensagens.semObservacao')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 30, alignSelf: 'flex-end' }}>
              <View style={{ height: 30, justifyContent: 'center' }}>
                <DistintivoStatus
                  rotulo={rotuloStatus}
                  corTexto={estiloBadge.corTexto}
                  corBorda={estiloBadge.corBorda}
                  corFundo={estiloBadge.corFundo}
                />
              </View>
              <View style={{ height: 30, justifyContent: 'center' }}>
                {renderAcoesReceita(receita, {
                  ocultarAcoesOperacionais: opcoes?.ocultarAcoesOperacionais,
                  podeEfetivar: opcoes?.podeEfetivar,
                  ocultarTodasAcoes: opcoes?.ocultarTodasAcoes,
                  ocultarEfetivacaoEstorno: opcoes?.ocultarEfetivacaoEstorno,
                })}
              </View>
            </View>
            <Text style={{ color: COLORS.accent, fontSize: 17, fontWeight: '800' }}>
              {formatarValorPorIdioma(receita.valorLiquido)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  const renderCartaoFaturaReceita = (grupo: GrupoFaturaReceita, expandida: boolean) => {
    const cartaoDescricao = grupo.cartaoId ? (mapaCartoesPorId.get(grupo.cartaoId) ?? '-') : '-';
    const referenciaBandeira = cartaoDescricao !== '-'
      ? (mapaReferenciaCartaoPorNome.get(cartaoDescricao) ?? cartaoDescricao)
      : '';
    const imagemBandeira = referenciaBandeira ? obterImagemBandeiraCartao(referenciaBandeira) : null;
    const iconeBandeira = referenciaBandeira ? obterIconeBandeiraCartao(referenciaBandeira) : '';
    const competenciaFatura = grupo.competencia
      ? formatarCompetencia(desserializarCompetencia(grupo.competencia) ?? competencia, locale)
      : competenciaLabel;

    return (
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 12, padding: 12, marginBottom: expandida ? 8 : 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
         <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>
            {`#${grupo.fatura.faturaCartaoId ?? Math.abs(grupo.fatura.id)} ${t('financeiro.cartao.faturaTitulo')} - ${competenciaFatura}`}
          </Text>
          {renderBadgeStatusFaturaCartao(grupo.statusFaturaCartao)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          {cartaoDescricao !== '-' ? (
            imagemBandeira
              ? <Image source={imagemBandeira} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" />
              : <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 13 }}>{iconeBandeira}</Text>
          ) : null}
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>{`${t('financeiro.receita.campos.cartao')}: ${referenciaBandeira || '-'} | ${cartaoDescricao}`}</Text>
        </View>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6}}>{`${t('dashboard.colunas.valor')} ${t('dashboard.ultimasTransacoes')} :  ${formatarValorPorIdioma(grupo.valorTotalTransacoes)}`}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6}}>{`${t('dashboard.colunas.valor')} ${t('financeiro.cartao.totalFatura')} :  ${formatarValorPorIdioma(grupo.valorTotalFatura)}`}</Text>
        <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor }}>
          <TouchableOpacity onPress={() => alternarExpansaoFatura(grupo.fatura.id)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginBottom: 10 }}>
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{`${t('financeiro.cartao.acoes.fatura')} (${grupo.receitasVinculadas.length})`}</Text>
          </TouchableOpacity>
        </View>
        {expandida ? (
          <View style={{ borderLeftWidth: 2, borderLeftColor: COLORS.borderAccent, marginLeft: 8, paddingLeft: 10, marginBottom: 10, maxHeight: 320 }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {[...grupo.receitasVinculadas]
                .sort(compararPorLancamentoEfetivacaoDecrescente)
                .map((receitaVinculada) => renderCartaoReceita(receitaVinculada, { margemInferior: 8 }))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  const renderCampoBloqueado = (label: string, valor: string) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{valor || '-'}</Text>
      </View>
    </View>
  );
  const renderCampoBloqueadoContaCartao = (label: string, valor: string, tipo: 'conta' | 'cartao', referencia?: string) => {
    const nome = (valor || '').trim();
    const valorReferencia = (referencia || nome || '').trim();
    const imagem = tipo === 'conta' ? obterImagemBanco(valorReferencia) : obterImagemBandeiraCartao(valorReferencia);
    const icone = tipo === 'conta' ? obterIconeBanco(valorReferencia) : obterIconeBandeiraCartao(valorReferencia);
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          {nome ? (
            imagem
              ? <Image source={imagem} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" />
              : <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 13 }}>{icone}</Text>
          ) : null}
          <Text style={{ color: COLORS.textPrimary, fontSize: 14, flex: 1 }}>{nome || '-'}</Text>
        </View>
      </View>
    );
  };

  const renderCampoBloqueadoStatus = (label: string, rotulo: string, estilo: { corTexto: string; corBorda: string; corFundo: string }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <DistintivoStatus rotulo={rotulo} corTexto={estilo.corTexto} corBorda={estilo.corBorda} corFundo={estilo.corFundo} />
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
          {renderCampoBloqueado(t('financeiro.receita.campos.rateioAmigosValores'), conteudo)}
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
          placeholder={t('financeiro.receita.placeholders.valor')}
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
              placeholder={t('financeiro.receita.placeholders.valor')}
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
      return renderCampoBloqueado(t('financeiro.receita.campos.rateioAreaSubareaValores'), conteudo);
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
          placeholder={t('financeiro.receita.placeholders.valor')}
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
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.descricao'), formulario.descricao) : <CampoTexto label={t('financeiro.receita.campos.descricao')} placeholder={t('financeiro.receita.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} forcarMaiusculo estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.observacao'), formulario.observacao) : <CampoTexto label={t('financeiro.receita.campos.observacao')} placeholder={t('financeiro.receita.placeholders.observacao')} value={formulario.observacao} onChangeText={(observacao) => setFormulario((atual) => ({ ...atual, observacao }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.tipoReceita'), formulario.tipoReceita ? t(`financeiro.receita.tipoReceita.${formulario.tipoReceita}`) : '') : <CampoSelect label={t('financeiro.receita.campos.tipoReceita')} placeholder={t('comum.acoes.selecionar')} options={tiposReceita.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoReceita.${tipo}`) }))} value={formulario.tipoReceita} onChange={(tipoReceita) => { setCamposInvalidos((atual) => ({ ...atual, tipoReceita: false })); setFormulario((atual) => ({ ...atual, tipoReceita })); }} error={camposInvalidos.tipoReceita} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.tipoRecebimento'), formulario.tipoRecebimento ? t(`financeiro.receita.tipoRecebimento.${formulario.tipoRecebimento}`) : '') : <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={formulario.tipoRecebimento} onChange={(tipoRecebimento) => { setCamposInvalidos((atual) => ({ ...atual, tipoRecebimento: false, contaBancaria: false, contaDestino: false, cartao: false })); setFormulario((atual) => { const exigeContaBancaria = tipoRecebimento === 'pix' || tipoRecebimento === 'transferencia'; const exigeCartao = tipoRecebimento === 'cartaoCredito' || tipoRecebimento === 'cartaoDebito'; const contaOuCartaoOpcional = !exigeContaBancaria && !exigeCartao; return { ...atual, tipoRecebimento, contaBancaria: exigeContaBancaria || contaOuCartaoOpcional ? atual.contaBancaria : '', contaDestino: tipoRecebimento === 'transferencia' || tipoRecebimento === 'pix' ? atual.contaDestino : '', cartao: exigeCartao || contaOuCartaoOpcional ? atual.cartao : '' }; }); }} error={camposInvalidos.tipoRecebimento} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.recorrencia'), obterRotuloRecorrencia(formulario.recorrenciaBase, locale)) : <CampoSelect label={t('financeiro.receita.campos.recorrencia')} placeholder={t('comum.acoes.selecionar')} options={RECORRENCIAS_FINANCEIRAS_BASE.map((item) => ({ value: item.chave, label: obterRotuloRecorrencia(item.chave, locale) }))} value={formulario.recorrenciaBase} onChange={(recorrenciaBase) => setFormulario((atual) => ({ ...atual, recorrenciaBase: recorrenciaBase as RecorrenciaFinanceiraBaseChave, recorrenciaFixa: recorrenciaBase === 'unica' ? false : atual.recorrenciaFixa, quantidadeRecorrencia: recorrenciaBase === 'unica' ? '' : atual.quantidadeRecorrencia }))} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.comum.campos.modoRecorrencia'), formulario.recorrenciaFixa ? t('financeiro.comum.opcoesRecorrencia.fixa') : t('financeiro.comum.opcoesRecorrencia.normal')) : <CampoSelect label={t('financeiro.comum.campos.modoRecorrencia')} placeholder={t('comum.acoes.selecionar')} options={formulario.recorrenciaBase === 'unica' ? [{ value: 'normal', label: t('financeiro.comum.opcoesRecorrencia.normal') }] : [{ value: 'normal', label: t('financeiro.comum.opcoesRecorrencia.normal') }, { value: 'fixa', label: t('financeiro.comum.opcoesRecorrencia.fixa') }]} value={formulario.recorrenciaFixa ? 'fixa' : 'normal'} onChange={(modo) => setFormulario((atual) => { const recorrenciaFixa = atual.recorrenciaBase !== 'unica' && modo === 'fixa'; return { ...atual, recorrenciaFixa, quantidadeRecorrencia: recorrenciaFixa ? '' : atual.quantidadeRecorrencia }; })} />}
      {somenteLeitura ? (exibirQuantidadeRecorrencia ? renderCampoBloqueado(t('financeiro.comum.campos.quantidadeRecorrencia'), formulario.quantidadeRecorrencia || '-') : null) : (exibirQuantidadeRecorrencia ? <CampoTexto label={t('financeiro.comum.campos.quantidadeRecorrencia')} placeholder='1' value={formulario.quantidadeRecorrencia} onChangeText={(quantidadeRecorrencia) => { setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: false })); setFormulario((atual) => { const atualizado = { ...atual, quantidadeRecorrencia: quantidadeRecorrencia.replace(/[^\d]/g, '') }; const valorLiquido = calcularValorLiquidoComInterpretacao(atualizado); return { ...atualizado, valorLiquido: formatarMoedaParaInput(valorLiquido, locale), valorEfetivacao: formatarMoedaParaInput(valorLiquido, locale) }; }); }} error={camposInvalidos.quantidadeRecorrencia} obrigatorio={quantidadeRecorrenciaObrigatoria} keyboardType='numeric' estilo={{ marginBottom: 12 }} /> : null)}
      {exibeContaBancaria ? somenteLeitura ? renderCampoBloqueadoContaCartao(t('financeiro.receita.campos.contaBancaria'), formulario.contaBancaria, 'conta', referenciaContaBancariaSelecionada) : <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancariaSelect} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false, cartao: false })); setFormulario((atual) => ({ ...atual, contaBancaria, contaDestino: atual.contaDestino === contaBancaria ? '' : atual.contaDestino, cartao: contaBancaria ? '' : atual.cartao })); }} error={camposInvalidos.contaBancaria} obrigatorio={tipoRecebimentoExigeContaBancaria} /> : null}
      {exibeContaDestinoRecebimento ? (somenteLeitura ? renderCampoBloqueadoContaCartao(t('financeiro.receita.campos.contaDestino'), formulario.contaDestino, 'conta', referenciaContaDestinoSelecionada) : <CampoSelect label={t('financeiro.receita.campos.contaDestino')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaDestinoSelect} value={formulario.contaDestino} onChange={(contaDestino) => { setCamposInvalidos((atual) => ({ ...atual, contaDestino: false })); setFormulario((atual) => ({ ...atual, contaDestino })); }} error={camposInvalidos.contaDestino} obrigatorio={false} />) : null}
      {exibeCartaoRecebimento ? (somenteLeitura ? renderCampoBloqueadoContaCartao(t('financeiro.receita.campos.cartao'), formulario.cartao, 'cartao', referenciaCartaoSelecionado) : <CampoSelect label={t('financeiro.receita.campos.cartao')} placeholder={t('comum.acoes.selecionar')} options={opcoesCartaoSelect} value={formulario.cartao} onChange={(cartao) => { setCamposInvalidos((atual) => ({ ...atual, cartao: false, contaBancaria: false })); setFormulario((atual) => ({ ...atual, cartao, contaBancaria: cartao ? '' : atual.contaBancaria })); }} error={camposInvalidos.cartao} obrigatorio={tipoRecebimentoExigeCartao} />) : null}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.dataLancamento'), formulario.dataLancamento ? formatarDataHoraPorIdioma(formulario.dataLancamento) : '') : <CampoData label={t('financeiro.receita.campos.dataLancamento')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataLancamento} onChange={(dataLancamento) => { setCamposInvalidos((atual) => ({ ...atual, dataLancamento: false })); setFormulario((atual) => ({ ...atual, dataLancamento })); }} error={camposInvalidos.dataLancamento} comHora estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.competencia'), formulario.competencia) : <CampoTexto label={t('financeiro.receita.campos.competencia')} placeholder={t('financeiro.receita.placeholders.competencia')} value={formulario.competencia} onChangeText={(competencia) => setFormulario((atual) => ({ ...atual, competencia: aplicarMascaraCompetencia(competencia, locale) }))} obrigatorio estilo={{ marginBottom: 12 }} />}
      {ocultarDataVencimentoCartaoCredito ? null : (somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.dataVencimento'), formulario.dataVencimento ? formatarDataPorIdioma(formulario.dataVencimento) : '') : <CampoData label={t('financeiro.receita.campos.dataVencimento')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataVencimento} onChange={(dataVencimento) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimento: false })); setFormulario((atual) => ({ ...atual, dataVencimento })); }} error={camposInvalidos.dataVencimento} estilo={{ marginBottom: 12 }} />)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.valorTotal'), formulario.valorTotal) : <CampoTexto label={t('financeiro.receita.campos.valorTotal')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {exibeInterpretacaoValorParcelado ? (somenteLeitura ? renderCampoBloqueado(t('financeiro.comum.campos.interpretacaoValorParcelado'), t(`financeiro.comum.opcoesInterpretacaoValorParcelado.${formulario.interpretacaoValorParcelado}`)) : (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('financeiro.comum.campos.interpretacaoValorParcelado')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['valorParcela', 'valorTotalTransacao'] as const).map((opcao) => {
              const selecionado = formulario.interpretacaoValorParcelado === opcao;
              return (
                <TouchableOpacity
                  key={opcao}
                  onPress={() => setFormulario((atual) => {
                    const atualizado = { ...atual, interpretacaoValorParcelado: opcao };
                    const valorLiquido = calcularValorLiquidoComInterpretacao(atualizado);
                    return {
                      ...atualizado,
                      valorLiquido: formatarMoedaParaInput(valorLiquido, locale),
                      valorEfetivacao: formatarMoedaParaInput(valorLiquido, locale),
                    };
                  })}
                  style={{
                    flex: 1,
                    backgroundColor: selecionado ? COLORS.accentSubtle : COLORS.bgTertiary,
                    borderWidth: 1,
                    borderColor: selecionado ? COLORS.borderAccent : COLORS.borderColor,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: selecionado ? COLORS.accent : COLORS.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                    {t(`financeiro.comum.opcoesInterpretacaoValorParcelado.${opcao}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )) : null}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.desconto'), formulario.desconto) : <CampoTexto label={t('financeiro.receita.campos.desconto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.acrescimo'), formulario.acrescimo) : <CampoTexto label={t('financeiro.receita.campos.acrescimo')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.imposto'), formulario.imposto) : <CampoTexto label={t('financeiro.receita.campos.imposto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.juros'), formulario.juros) : <CampoTexto label={t('financeiro.receita.campos.juros')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {renderCampoBloqueado(t('financeiro.receita.campos.valorLiquido'), formulario.valorLiquido)}
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
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.anexoDocumento'), formulario.anexoDocumento) : <CampoArquivo label={t('financeiro.receita.campos.anexoDocumento')} placeholder={t('financeiro.receita.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento, documentos: anexoDocumento ? atual.documentos : [] }))} onSelecionarArquivo={(documento) => setFormulario((atual) => ({ ...atual, documentos: documento ? [documento] : [] }))} estilo={{ marginBottom: 12 }} />}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ width: 42 }} />
        <Text style={{ flex: 1, textAlign: 'center', color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.receita.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoTela === 'lista' ? router.back() : resetarTela())} style={{ width: 42, alignItems: 'flex-end' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {modoTela === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.receita.nova')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
            <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => setCompetencia((atual) => avancarCompetencia(atual, -1))}
                  style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>{'<'}</Text>
                </TouchableOpacity>
              <View style={{ backgroundColor: COLORS.bgTertiary, alignItems: 'center'}}>
                  <Text style={{ color: COLORS.accent, fontSize: 14, fontWeight: '800', marginBottom: 2 }}>{competenciaLabel}</Text>
                  <Text style={{ color: COLORS.accent, fontSize: 14, fontWeight: '800' }}>{formatarValorPorIdioma(totalListaPrincipal)}</Text>
                </View>
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
	            <View style={{ position: 'relative', zIndex: 2, overflow: 'visible' }}>
	              {receitasListaPrincipal.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('financeiro.receita.vazio')}</Text> : receitasListaPrincipal.map((receita) => {
	                const grupoFatura = mapaGrupoPorFaturaId.get(receita.id);
	                if (!grupoFatura) return renderCartaoReceita(receita);
	                const expandida = faturasExpandidas.includes(grupoFatura.fatura.id);
		                return <View key={grupoFatura.fatura.id}>{renderCartaoFaturaReceita(grupoFatura, expandida)}</View>;
		              })}
		            </View>
	          </>
	        ) : null}

        {(modoTela === 'novo' || modoTela === 'edicao') ? (
          <>
            {renderFormularioBase(false)}
            {modoTela === 'edicao' && ehReceitaRecorrente(receitaSelecionada) ? (
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
                carregando={salvandoReceita}
              />
            </View>
          </>
        ) : null}

        {modoTela === 'efetivacao' ? (
          <>
            {renderCampoBloqueado(t('financeiro.receita.campos.valorLiquido'), formulario.valorLiquido)}
            {renderCampoBloqueado(t('financeiro.receita.campos.valorEfetivacao'), formulario.valorEfetivacao)}
            <CampoData label={t('financeiro.receita.campos.dataEfetivacao')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataEfetivacao} onChange={(dataEfetivacao) => { setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: false })); setFormulario((atual) => ({ ...atual, dataEfetivacao })); }} error={camposInvalidos.dataEfetivacao} comHora estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={formulario.tipoRecebimento} onChange={(tipoRecebimento) => { setCamposInvalidos((atual) => ({ ...atual, tipoRecebimento: false, contaBancaria: false, contaDestino: false, cartao: false })); setFormulario((atual) => { const exigeContaBancaria = tipoRecebimento === 'pix' || tipoRecebimento === 'transferencia'; const exigeCartao = tipoRecebimento === 'cartaoCredito' || tipoRecebimento === 'cartaoDebito'; const contaOuCartaoOpcional = !exigeContaBancaria && !exigeCartao; return { ...atual, tipoRecebimento, contaBancaria: exigeContaBancaria || contaOuCartaoOpcional ? atual.contaBancaria : '', contaDestino: tipoRecebimento === 'transferencia' || tipoRecebimento === 'pix' ? atual.contaDestino : '', cartao: exigeCartao || contaOuCartaoOpcional ? atual.cartao : '' }; }); }} error={camposInvalidos.tipoRecebimento} />
            {exibeContaBancaria ? <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancariaSelect} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false, cartao: false })); setFormulario((atual) => ({ ...atual, contaBancaria, contaDestino: atual.contaDestino === contaBancaria ? '' : atual.contaDestino, cartao: contaBancaria ? '' : atual.cartao })); }} error={camposInvalidos.contaBancaria} obrigatorio={tipoRecebimentoExigeContaBancaria} /> : null}
            {exibeContaDestinoRecebimento ? <CampoSelect label={t('financeiro.receita.campos.contaDestino')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaDestinoSelect} value={formulario.contaDestino} onChange={(contaDestino) => { setCamposInvalidos((atual) => ({ ...atual, contaDestino: false })); setFormulario((atual) => ({ ...atual, contaDestino })); }} error={camposInvalidos.contaDestino} obrigatorio={false} /> : null}
            {exibeCartaoRecebimento ? <CampoSelect label={t('financeiro.receita.campos.cartao')} placeholder={t('comum.acoes.selecionar')} options={opcoesCartaoSelect} value={formulario.cartao} onChange={(cartao) => { setCamposInvalidos((atual) => ({ ...atual, cartao: false, contaBancaria: false })); setFormulario((atual) => ({ ...atual, cartao, contaBancaria: cartao ? '' : atual.contaBancaria })); }} error={camposInvalidos.cartao} obrigatorio={tipoRecebimentoExigeCartao} /> : null}
            <CampoTexto label={t('financeiro.receita.campos.valorTotal')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.desconto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.acrescimo')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.imposto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.juros')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.observacao')} placeholder={t('financeiro.receita.placeholders.observacao')} value={formulario.observacaoEfetivacao} onChangeText={(observacaoEfetivacao) => setFormulario((atual) => ({ ...atual, observacaoEfetivacao }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />
            <CampoArquivo label={t('financeiro.receita.campos.anexoDocumento')} placeholder={t('financeiro.receita.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento, documentos: anexoDocumento ? atual.documentos : [] }))} onSelecionarArquivo={(documento) => setFormulario((atual) => ({ ...atual, documentos: documento ? [documento] : [] }))} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={t('financeiro.receita.acoes.confirmarEfetivacao')} onPress={efetivarReceita} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'estorno' ? (
          <>
            {renderCampoBloqueado(t('financeiro.receita.campos.valorLiquido'), formulario.valorLiquido)}
            {renderCampoBloqueado(t('financeiro.receita.campos.valorEfetivacao'), formulario.valorEfetivacao)}
            <CampoData label={t('financeiro.receita.campos.dataEstorno')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataEstorno} onChange={(dataEstorno) => { setCamposInvalidos((atual) => ({ ...atual, dataEstorno: false })); setFormulario((atual) => ({ ...atual, dataEstorno })); }} error={camposInvalidos.dataEstorno} obrigatorio comHora estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.observacao')} placeholder={t('financeiro.receita.placeholders.observacao')} value={formulario.observacaoEstorno} onChangeText={(observacaoEstorno) => setFormulario((atual) => ({ ...atual, observacaoEstorno }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />
            <View style={{ marginBottom: 20, backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ color: COLORS.textPrimary, flex: 1, fontSize: 13 }}>{t('financeiro.receita.campos.ocultarEfetivacaoEstornoRegistros')}</Text>
                <Switch
                  value={formulario.ocultarEfetivacaoEstornoRegistros}
                  onValueChange={(ocultarEfetivacaoEstornoRegistros) => setFormulario((atual) => ({ ...atual, ocultarEfetivacaoEstornoRegistros }))}
                  trackColor={{ false: COLORS.borderColor, true: COLORS.accent }}
                  thumbColor={formulario.ocultarEfetivacaoEstornoRegistros ? COLORS.accent : COLORS.textSecondary}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={t('financeiro.receita.acoes.confirmarEstorno')} onPress={estornarReceita} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && receitaSelecionada ? (
          <>
            {renderFormularioBase(true)}
            {renderCampoBloqueadoStatus(t('financeiro.receita.campos.status'), obterRotuloStatusReceita(receitaSelecionada.status, t), obterEstiloBadgeStatusReceita(receitaSelecionada.status))}
            {renderCampoBloqueado(t('financeiro.receita.campos.dataEfetivacao'), receitaSelecionada.dataEfetivacao ? formatarDataHoraPorIdioma(receitaSelecionada.dataEfetivacao) : '')}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('financeiro.receita.logs.titulo')}</Text>
              <View>
                {receitaSelecionada.logs.map((log) => (
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
        visivel={Boolean(receitaPendenteCancelamento)}
        titulo={t('comum.confirmacao')}
        mensagem={t('financeiro.receita.mensagens.confirmarCancelamento')}
        mensagemImpacto={t('comum.confirmacoes.alertaAcaoIrreversivel')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        tipoConfirmar="perigo"
        opcoes={opcoesEscopoCancelamentoRecorrencia}
        valorSelecionado={escopoCancelamentoRecorrente}
        onSelecionarOpcao={(valor) => setEscopoCancelamentoRecorrente(valor as EscopoAcaoRecorrencia)}
        observacao={
          ehReceitaRecorrente(receitaPendenteCancelamento)
            ? receitaPendenteCancelamento?.recorrenciaFixa
              ? `${t('financeiro.comum.mensagens.cancelamentoApenasPendentes')} ${t('financeiro.comum.mensagens.cancelamentoFixaTodasPendentes')}`
              : t('financeiro.comum.mensagens.cancelamentoApenasPendentes')
            : undefined
        }
        carregando={cancelandoReceita}
        onCancelar={() => setReceitaPendenteCancelamento(null)}
        onConfirmar={() => void confirmarCancelamentoReceita()}
      />
      <ModalConfirmacao
        visivel={Boolean(receitaPendenteEdicaoRecorrente)}
        titulo={t('comum.confirmacao')}
        mensagem={t('financeiro.comum.mensagens.confirmarEdicaoRecorrente')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        opcoes={opcoesEscopoEdicaoRecorrencia}
        valorSelecionado={escopoEdicaoRecorrente}
        onSelecionarOpcao={(valor) => setEscopoEdicaoRecorrente(valor as EscopoAcaoRecorrencia)}
        observacao={ehReceitaRecorrente(receitaPendenteEdicaoRecorrente) ? `${t('financeiro.comum.mensagens.edicaoApenasPendentes')} ${t('financeiro.comum.mensagens.edicaoReplicaPendentes')}` : undefined}
        carregando={salvandoReceita}
        onCancelar={() => setReceitaPendenteEdicaoRecorrente(null)}
        onConfirmar={() => void confirmarEdicaoRecorrente()}
      />
    </View>
  );
}

