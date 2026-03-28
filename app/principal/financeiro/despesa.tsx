import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoArquivo } from '../../../src/componentes/comuns/CampoArquivo';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import {
  RECORRENCIAS_FINANCEIRAS,
  normalizarQuantidadeRecorrencia,
  normalizarRecorrenciaFinanceira,
  obterRotuloRecorrencia,
  obterValorRecorrencia,
  recorrenciaAceitaQuantidade,
  recorrenciaExigeQuantidade,
  type RecorrenciaFinanceiraChave,
} from '../../../src/utils/recorrenciaFinanceira';
import { SEPARADOR_AREA_SUBAREA, montarChaveAreaSubarea, separarAreaSubarea } from '../../../src/utils/rateioRelacional';
import {
  atualizarDespesaApi,
  criarDespesaApi,
  listarAmigosRateioApi,
  listarAreasSubareasRateioApi,
  listarDespesasApi,
  type AmigoRateioApi,
  type AreaSubareaRateioApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';

type StatusDespesa = 'pendente' | 'efetivada' | 'cancelada';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao';

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
  rateioAmigosValores: Record<string, number>;
  areasRateio: string[];
  rateioAreasValores: Record<string, number>;
  rateiosAmigos?: Array<{ amigo: string; valor: number }>;
  rateiosAreaSubarea?: Array<{ area: string; subarea: string; valor: number }>;
  tiposRateio?: string[];
  anexoDocumento: string;
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
  recorrencia: RecorrenciaFinanceiraChave;
  quantidadeRecorrencia: string;
  valorTotal: string;
  valorLiquido: string;
  desconto: string;
  acrescimo: string;
  imposto: string;
  juros: string;
  valorEfetivacao: string;
  amigosRateio: string[];
  rateioAmigosValores: Record<string, string>;
  areasRateio: string[];
  rateioAreasValores: Record<string, string>;
  anexoDocumento: string;
}

const tiposDespesa = ['alimentacao', 'transporte', 'moradia', 'lazer', 'saude', 'educacao', 'servicos'] as const;
const tiposPagamento = ['pix', 'cartaoCredito', 'cartaoDebito', 'boleto', 'transferencia', 'dinheiro'] as const;

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
    recorrencia: 'unica',
    quantidadeRecorrencia: '',
    valorTotal: formatarMoedaParaInput(0, locale),
    valorLiquido: formatarMoedaParaInput(0, locale),
    desconto: formatarMoedaParaInput(0, locale),
    acrescimo: formatarMoedaParaInput(0, locale),
    imposto: formatarMoedaParaInput(0, locale),
    juros: formatarMoedaParaInput(0, locale),
    valorEfetivacao: formatarMoedaParaInput(0, locale),
    amigosRateio: [],
  rateioAmigosValores: {},
    areasRateio: [],
    rateioAreasValores: {},
    anexoDocumento: '',
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

function normalizarStatusDespesa(status: unknown): StatusDespesa {
  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('cancel')) return 'cancelada';
  return 'pendente';
}

function mapearDespesaApi(item: RegistroFinanceiroApi): DespesaRegistro {
  const dataBase = String(item.dataLancamento ?? item.data ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const valorBase = Number(item.valor ?? item.valorTotal ?? item.valorLiquido ?? 0);
  const desconto = Number(item.desconto ?? 0);
  const acrescimo = Number(item.acrescimo ?? 0);
  const imposto = Number(item.imposto ?? 0);
  const juros = Number(item.juros ?? 0);
  const valorLiquido = Number(item.valorLiquido ?? Math.max(0, valorBase - desconto + acrescimo + imposto + juros));

  const amigosRateioLegado = Array.isArray(item.amigosRateio) ? (item.amigosRateio as string[]) : [];
  const rateioAmigosValoresLegado = (item.rateioAmigosValores as Record<string, number>) || {};
  const rateiosAmigosApi = Array.isArray(item.rateiosAmigos)
    ? (item.rateiosAmigos as Array<Record<string, unknown>>)
        .map((rateio) => ({
          amigo: String(rateio.amigo ?? '').trim(),
          valor: Number(rateio.valor ?? 0),
        }))
        .filter((rateio) => Boolean(rateio.amigo))
    : [];
  const amigosRateio = rateiosAmigosApi.length > 0 ? rateiosAmigosApi.map((rateio) => rateio.amigo) : amigosRateioLegado;
  const rateioAmigosValores =
    rateiosAmigosApi.length > 0
      ? Object.fromEntries(rateiosAmigosApi.map((rateio) => [rateio.amigo, rateio.valor]))
      : Object.fromEntries(amigosRateio.map((amigo) => [amigo, Number(rateioAmigosValoresLegado[amigo] ?? 0)]));

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
  const areasRateio =
    rateiosAreaSubareaApi.length > 0
      ? rateiosAreaSubareaApi.map((rateio) => montarChaveAreaSubarea(rateio.area, rateio.subarea))
      : areasRateioLegadoBase.map((area) =>
          area.includes(SEPARADOR_AREA_SUBAREA) ? area : montarChaveAreaSubarea(area, area),
        );
  const rateioAreasValores =
    rateiosAreaSubareaApi.length > 0
      ? Object.fromEntries(
          rateiosAreaSubareaApi.map((rateio) => [montarChaveAreaSubarea(rateio.area, rateio.subarea), rateio.valor]),
        )
      : Object.fromEntries(
          areasRateio.map((chave) => [
            chave,
            Number(rateioAreasValoresLegado[chave] ?? rateioAreasValoresLegado[chave.replace(SEPARADOR_AREA_SUBAREA, ' / ')] ?? 0),
          ]),
        );

  return {
    id: Number(item.id),
    descricao: String(item.descricao ?? item.titulo ?? `Despesa ${item.id}`),
    observacao: String(item.observacao ?? item.descricao ?? ''),
    dataLancamento: dataBase,
    dataVencimento: String(item.dataVencimento ?? dataBase).slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
    tipoDespesa: String(item.tipoDespesa ?? item.categoria ?? 'servicos'),
    tipoPagamento: String(item.tipoPagamento ?? 'dinheiro'),
    recorrencia: normalizarRecorrenciaFinanceira(item.recorrencia),
    quantidadeRecorrencia: normalizarQuantidadeRecorrencia(item.quantidadeRecorrencia),
    valorTotal: valorBase,
    valorLiquido,
    desconto,
    acrescimo,
    imposto,
    juros,
    valorEfetivacao: item.valorEfetivacao ? Number(item.valorEfetivacao) : undefined,
    status: normalizarStatusDespesa(item.status),
    amigosRateio,
    rateioAmigosValores,
    areasRateio,
    rateioAreasValores,
    rateiosAmigos: amigosRateio.map((amigo) => ({ amigo, valor: Number(rateioAmigosValores[amigo] ?? 0) })),
    rateiosAreaSubarea: areasRateio.map((chave) => {
      const { area, subarea } = separarAreaSubarea(chave);
      return { area, subarea, valor: Number(rateioAreasValores[chave] ?? 0) };
    }),
    tiposRateio: areasRateio.map((chave) => separarAreaSubarea(chave).area),
    anexoDocumento: String(item.anexoDocumento ?? ''),
    logs: Array.isArray(item.logs)
      ? (item.logs as LogDespesa[])
      : [{ id: 1, data: dataBase, acao: 'IMPORTADA', descricao: 'Registro carregado da API.' }],
  };
}

export default function TelaDespesa() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();
  const params = useLocalSearchParams();
  const idParamBruto = Array.isArray(params.id) ? params.id[0] : params.id;
  const idParam = idParamBruto ? Number(idParamBruto) : null;

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoTela, setModoTela] = useState<ModoTela>(idParam ? 'visualizacao' : 'lista');
  const [despesaSelecionadaId, setDespesaSelecionadaId] = useState<number | null>(idParam);
  const [despesas, setDespesas] = useState<DespesaRegistro[]>([]);
  const [formulario, setFormulario] = useState<DespesaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [novoAmigoRateio, setNovoAmigoRateio] = useState('');
  const [novoValorAmigoRateio, setNovoValorAmigoRateio] = useState(() => formatarMoedaParaInput(0, locale));
  const [novaAreaRateio, setNovaAreaRateio] = useState('');
  const [novaSubareaRateio, setNovaSubareaRateio] = useState('');
  const [novoValorAreaRateio, setNovoValorAreaRateio] = useState(() => formatarMoedaParaInput(0, locale));
  const [opcoesAmigosRateioApi, setOpcoesAmigosRateioApi] = useState<AmigoRateioApi[]>([]);
  const [opcoesAreasSubareasApi, setOpcoesAreasSubareasApi] = useState<AreaSubareaRateioApi[]>([]);

  const despesaSelecionada = despesas.find((despesa) => despesa.id === despesaSelecionadaId) ?? null;
  const areasCatalogo = useMemo(() => opcoesAreasSubareasApi.filter((item) => item.tipo === 'despesa'), [opcoesAreasSubareasApi]);
  const opcoesAmigosRateio = useMemo(() => Array.from(new Set([...opcoesAmigosRateioApi.map((item) => item.nome), ...despesas.flatMap((despesa) => despesa.amigosRateio).filter(Boolean)])).sort(), [opcoesAmigosRateioApi, despesas]);
  const opcoesAreasRateio = useMemo(() => Array.from(new Set([...areasCatalogo.map((item) => item.nome), ...despesas.flatMap((despesa) => despesa.areasRateio.map((chave) => separarAreaSubarea(chave).area)).filter(Boolean)])).sort(), [areasCatalogo, despesas]);
  const quantidadeRecorrenciaObrigatoria = recorrenciaExigeQuantidade(formulario.recorrencia);
  const exibirQuantidadeRecorrencia = recorrenciaAceitaQuantidade(formulario.recorrencia);

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

  const carregarDespesasApi = async () => {
    try {
      const dados = await listarDespesasApi();
      setDespesas(dados.map(mapearDespesaApi));
    } catch {
      setDespesas([]);
    }
  };

  const carregarOpcoesRateioApi = async () => {
    try {
      const [amigos, areasSubareas] = await Promise.all([listarAmigosRateioApi(), listarAreasSubareasRateioApi()]);
      setOpcoesAmigosRateioApi(amigos);
      setOpcoesAreasSubareasApi(areasSubareas);
    } catch {
      setOpcoesAmigosRateioApi([]);
      setOpcoesAreasSubareasApi([]);
    }
  };

  useEffect(() => {
    void carregarDespesasApi();
    void carregarOpcoesRateioApi();
  }, []);

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

    const despesa = despesas.find((item) => item.id === idParam);
    if (!despesa) {
      setModoTela('lista');
      setDespesaSelecionadaId(null);
      return;
    }

    setDespesaSelecionadaId(despesa.id);
    preencherFormulario(despesa);
    setModoTela('visualizacao');
  }, [idParam, locale, despesas]);

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((despesa) => {
      const bateId = !filtro.id || String(despesa.id).includes(filtro.id);
      const termo = filtro.descricao.trim().toLowerCase();
      const tipoTraduzido = t(`financeiro.despesa.tipoDespesa.${despesa.tipoDespesa}`).toLowerCase();
      const statusTraduzido = t(`financeiro.despesa.status.${despesa.status}`).toLowerCase();
      const bateDescricao =
        !termo ||
        despesa.descricao.toLowerCase().includes(termo) ||
        despesa.observacao.toLowerCase().includes(termo) ||
        tipoTraduzido.includes(termo) ||
        statusTraduzido.includes(termo);
      const bateData = estaDentroIntervalo(despesa.dataLancamento, filtro.dataInicio, filtro.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [despesas, filtro, t]);

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
    setFormulario({
      descricao: despesa.descricao,
      observacao: despesa.observacao,
      dataLancamento: despesa.dataLancamento,
      dataVencimento: despesa.dataVencimento,
      dataEfetivacao: despesa.dataEfetivacao || new Date().toISOString().split('T')[0],
      tipoDespesa: despesa.tipoDespesa,
      tipoPagamento: despesa.tipoPagamento,
      recorrencia: despesa.recorrencia,
      quantidadeRecorrencia: despesa.quantidadeRecorrencia ? String(despesa.quantidadeRecorrencia) : '',
      valorTotal: formatarMoedaParaInput(despesa.valorTotal, locale),
      valorLiquido: formatarMoedaParaInput(despesa.valorLiquido, locale),
      desconto: formatarMoedaParaInput(despesa.desconto, locale),
      acrescimo: formatarMoedaParaInput(despesa.acrescimo, locale),
      imposto: formatarMoedaParaInput(despesa.imposto, locale),
      juros: formatarMoedaParaInput(despesa.juros, locale),
      valorEfetivacao: formatarMoedaParaInput(despesa.valorEfetivacao ?? despesa.valorLiquido, locale),
      amigosRateio: despesa.amigosRateio,
      rateioAmigosValores: Object.fromEntries(Object.entries(despesa.rateioAmigosValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      areasRateio: despesa.areasRateio,
      rateioAreasValores: Object.fromEntries(Object.entries(despesa.rateioAreasValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      anexoDocumento: despesa.anexoDocumento,
    });
  };

  const abrirNovo = () => {
    setDespesaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    setModoTela('novo');
  };

  const abrirVisualizacao = (despesa: DespesaRegistro) => {
    setDespesaSelecionadaId(despesa.id);
    preencherFormulario(despesa);
    setModoTela('visualizacao');
  };

  const abrirEdicao = (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendente') {
      notificarErro( t('financeiro.despesa.mensagens.edicaoSomentePendente'));
      return;
    }
    setDespesaSelecionadaId(despesa.id);
    preencherFormulario(despesa);
    setModoTela('edicao');
  };

  const abrirEfetivacao = (despesa: DespesaRegistro) => {
    if (despesa.status !== 'pendente') {
      notificarErro( t('financeiro.despesa.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setDespesaSelecionadaId(despesa.id);
    preencherFormulario(despesa);
    setModoTela('efetivacao');
  };

  const serializarValores = (valores: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(valores)
        .filter(([, valor]) => Boolean(valor))
        .map(([chave, valor]) => [chave, converterTextoParaNumero(valor, locale)]),
    );

  const adicionarRateioAmigo = () => {
    const amigo = novoAmigoRateio.trim();
    const valor = converterTextoParaNumero(novoValorAmigoRateio, locale);

    if (!amigo || valor <= 0) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
      return;
    }

    setFormulario((atual) => {
      const amigosRateio = atual.amigosRateio.includes(amigo) ? atual.amigosRateio : [...atual.amigosRateio, amigo];
      return {
        ...atual,
        amigosRateio,
        rateioAmigosValores: {
          ...atual.rateioAmigosValores,
          [amigo]: formatarMoedaParaInput(valor, locale),
        },
      };
    });

    setNovoAmigoRateio('');
    setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
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
    if (quantidadeRecorrenciaObrigatoria && !quantidadeRecorrencia) invalidos.quantidadeRecorrencia = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.despesa.mensagens.obrigatorio'));
      return null;
    }

    if (formulario.recorrencia === 'fixa' && formulario.quantidadeRecorrencia.trim()) {
      setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: true }));
      notificarErro(locale.startsWith('en') ? 'Fixed recurrence does not accept quantity.' : locale.startsWith('es') ? 'La recurrencia fija no acepta cantidad.' : 'Recorrencia fixa nao aceita quantidade.');
      return null;
    }

    if (quantidadeRecorrenciaObrigatoria && !quantidadeRecorrencia) {
      setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: true }));
      notificarErro(locale.startsWith('en') ? 'Enter a recurrence quantity greater than zero.' : locale.startsWith('es') ? 'Informe una cantidad de recurrencia mayor que cero.' : 'Informe uma quantidade de recorrencia maior que zero.');
      return null;
    }

    if (dataIsoMaiorQue(dataVencimento, dataLancamento)) {
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

    return {
      dataLancamento,
      dataVencimento,
      valorTotal,
      valorLiquido: calcularValorLiquido(formulario, locale),
      desconto: converterTextoParaNumero(formulario.desconto, locale),
      acrescimo: converterTextoParaNumero(formulario.acrescimo, locale),
      imposto: converterTextoParaNumero(formulario.imposto, locale),
      juros: converterTextoParaNumero(formulario.juros, locale),
      quantidadeRecorrencia,
      rateioAmigosValores: serializarValores(formulario.rateioAmigosValores),
      rateioAreasValores: serializarValores(formulario.rateioAreasValores),
    };
  };

  const resetarTela = () => {
    setModoTela('lista');
    setDespesaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    setNovoAmigoRateio('');
    setNovoValorAmigoRateio(formatarMoedaParaInput(0, locale));
    setNovaAreaRateio('');
    setNovaSubareaRateio('');
    setNovoValorAreaRateio(formatarMoedaParaInput(0, locale));
  };

  const salvarCadastroOuEdicao = async () => {
    const base = validarFormularioBase();
    if (!base) return;

    const amigos = formulario.amigosRateio
      .map((amigo) => ({
        nome: amigo,
        valor: Number(base.rateioAmigosValores[amigo] ?? 0),
      }))
      .filter((item) => item.nome && item.valor > 0);

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
      recorrencia: obterValorRecorrencia(formulario.recorrencia),
      ...(formulario.recorrencia === 'fixa' ? {} : { quantidadeRecorrencia: base.quantidadeRecorrencia }),
      valorTotal: base.valorTotal,
      valorLiquido: base.valorLiquido,
      desconto: base.desconto,
      acrescimo: base.acrescimo,
      imposto: base.imposto,
      juros: base.juros,
      amigos,
      areasRateio: areasRateioPayload,
      anexoDocumento: formulario.anexoDocumento,
    };

    try {
      if (modoTela === 'novo') {
        await criarDespesaApi(payloadBase);
        await carregarDespesasApi();
        const criouSerie = formulario.recorrencia === 'fixa' || ((base.quantidadeRecorrencia ?? 0) > 1 && formulario.recorrencia !== 'unica');
        notificarSucesso(criouSerie ? (locale.startsWith('en') ? 'First occurrence created. Remaining ones are being generated.' : locale.startsWith('es') ? 'Primera ocurrencia creada. Las demas se estan generando.' : 'Primeira ocorrencia criada. Demais estao sendo geradas.') : t('financeiro.despesa.mensagens.criada'));
        resetarTela();
        return;
      }

      if (modoTela === 'edicao' && despesaSelecionada) {
        await atualizarDespesaApi(despesaSelecionada.id, payloadBase);
        await carregarDespesasApi();
        notificarSucesso(t('financeiro.despesa.mensagens.atualizada'));
        resetarTela();
        return;
      }
    } catch {
      return;
    }
  };

  const efetivarDespesa = async () => {
    if (!despesaSelecionada) return;
    const base = validarFormularioBase();
    const dataEfetivacao = formulario.dataEfetivacao;
    if (!base || !dataEfetivacao || !formulario.tipoPagamento) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: !dataEfetivacao, tipoPagamento: !formulario.tipoPagamento }));
      notificarErro( t('financeiro.despesa.mensagens.obrigatorioEfetivacao'));
      return;
    }

    if (dataIsoMaiorQue(base.dataLancamento, dataEfetivacao)) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: true }));
      notificarErro(t('financeiro.despesa.mensagens.dataEfetivacaoMaiorQueLancamento'));
      return;
    }

    try {
      await atualizarDespesaApi(despesaSelecionada.id, {
        dataEfetivacao,
        tipoPagamento: formulario.tipoPagamento,
        valorTotal: base.valorTotal,
        valorLiquido: base.valorLiquido,
        desconto: base.desconto,
        acrescimo: base.acrescimo,
        imposto: base.imposto,
        juros: base.juros,
        valorEfetivacao: base.valorLiquido,
        anexoDocumento: formulario.anexoDocumento,
        status: 'efetivada',
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

    const confirmarCancelamento = async () => {
      try {
        await atualizarDespesaApi(despesa.id, { status: 'cancelada' });
        await carregarDespesasApi();
        notificarSucesso(t('financeiro.despesa.acoes.cancelarDespesa'));
        return;
      } catch {
        return;
      }
    };

    confirmarCancelamento();
  };

  const estornarDespesa = async (despesa: DespesaRegistro) => {
    if (despesa.status !== 'efetivada') {
      notificarErro( t('financeiro.despesa.mensagens.estornoSomenteEfetivada'));
      return;
    }

    try {
      await atualizarDespesaApi(despesa.id, {
        status: 'pendente',
        dataEfetivacao: null,
        valorEfetivacao: null,
      });
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
      return renderCampoBloqueado(t('financeiro.despesa.campos.rateioAmigos'), conteudo);
    }

    return (
      <View style={{ marginBottom: 12 }}>
        <CampoSelect
          label={t('financeiro.despesa.campos.rateioAmigos')}
          placeholder={t('comum.acoes.selecionar')}
          options={opcoesAmigosRateio.map((amigo) => ({ value: amigo, label: amigo }))}
          value={novoAmigoRateio}
          onChange={setNovoAmigoRateio}
        />
        <CampoTexto
          label={t('dashboard.colunas.valor')}
          placeholder={t('financeiro.despesa.placeholders.valor')}
          value={novoValorAmigoRateio}
          onChangeText={(valor) => setNovoValorAmigoRateio(aplicarMascaraMoeda(valor, locale))}
          keyboardType="numeric"
          estilo={{ marginBottom: 8 }}
        />
        <Botao titulo={t('comum.acoes.confirmar')} onPress={adicionarRateioAmigo} tipo="secundario" estilo={{ marginBottom: 8 }} />
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
          label="Subarea"
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
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.tipoPagamento'), formulario.tipoPagamento ? t(`financeiro.despesa.tipoPagamento.${formulario.tipoPagamento}`) : '') : <CampoSelect label={t('financeiro.despesa.campos.tipoPagamento')} placeholder={t('comum.acoes.selecionar')} options={tiposPagamento.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoPagamento.${tipo}`) }))} value={formulario.tipoPagamento} onChange={(tipoPagamento) => { setCamposInvalidos((atual) => ({ ...atual, tipoPagamento: false })); setFormulario((atual) => ({ ...atual, tipoPagamento })); }} error={camposInvalidos.tipoPagamento} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.recorrencia'), obterRotuloRecorrencia(formulario.recorrencia, locale)) : <CampoSelect label={t('financeiro.despesa.campos.recorrencia')} placeholder={t('comum.acoes.selecionar')} options={RECORRENCIAS_FINANCEIRAS.map((item) => ({ value: item.chave, label: obterRotuloRecorrencia(item.chave, locale) }))} value={formulario.recorrencia} onChange={(recorrencia) => setFormulario((atual) => ({ ...atual, recorrencia: recorrencia as RecorrenciaFinanceiraChave, quantidadeRecorrencia: recorrencia === 'fixa' || recorrencia === 'unica' ? '' : atual.quantidadeRecorrencia }))} />}
      {somenteLeitura ? (exibirQuantidadeRecorrencia ? renderCampoBloqueado('Quantidade de recorrencia', formulario.quantidadeRecorrencia || '-') : null) : (exibirQuantidadeRecorrencia ? <CampoTexto label='Quantidade de recorrencia' placeholder='1' value={formulario.quantidadeRecorrencia} onChangeText={(quantidadeRecorrencia) => { setCamposInvalidos((atual) => ({ ...atual, quantidadeRecorrencia: false })); setFormulario((atual) => ({ ...atual, quantidadeRecorrencia: quantidadeRecorrencia.replace(/[^\d]/g, '') })); }} error={camposInvalidos.quantidadeRecorrencia} keyboardType='numeric' estilo={{ marginBottom: 12 }} /> : null)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.valorTotal'), formulario.valorTotal) : <CampoTexto label={t('financeiro.despesa.campos.valorTotal')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.desconto'), formulario.desconto) : <CampoTexto label={t('financeiro.despesa.campos.desconto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.acrescimo'), formulario.acrescimo) : <CampoTexto label={t('financeiro.despesa.campos.acrescimo')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.imposto'), formulario.imposto) : <CampoTexto label={t('financeiro.despesa.campos.imposto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.juros'), formulario.juros) : <CampoTexto label={t('financeiro.despesa.campos.juros')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {renderCampoBloqueado(t('financeiro.despesa.campos.valorLiquido'), formulario.valorLiquido)}
      {renderTabelaRateioAmigos(somenteLeitura)}
      {renderTabelaRateioAreaSubarea(somenteLeitura)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.anexoDocumento'), formulario.anexoDocumento) : <CampoArquivo label={t('financeiro.despesa.campos.anexoDocumento')} placeholder={t('financeiro.despesa.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento }))} estilo={{ marginBottom: 12 }} />}
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
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />
            <View>
              {despesasFiltradas.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('financeiro.despesa.vazio')}</Text> : despesasFiltradas.map((despesa) => (
                <View key={despesa.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{despesa.id} {despesa.descricao}</Text>
                    <Text style={{ color: despesa.status === 'efetivada' ? COLORS.success : despesa.status === 'cancelada' ? COLORS.error : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{t(`financeiro.despesa.status.${despesa.status}`)}</Text>
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>{t(`financeiro.despesa.tipoDespesa.${despesa.tipoDespesa}`)} | {formatarDataPorIdioma(despesa.dataVencimento)} | {formatarValorPorIdioma(despesa.valorLiquido)}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{despesa.observacao || t('financeiro.despesa.mensagens.semObservacao')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                    <TouchableOpacity onPress={() => abrirVisualizacao(despesa)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('financeiro.despesa.acoes.visualizar')}</Text></TouchableOpacity>
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEdicao(despesa)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEfetivacao(despesa)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.despesa.acoes.efetivar')}</Text></TouchableOpacity> : null}
                    {despesa.status === 'pendente' ? <TouchableOpacity onPress={() => cancelarDespesa(despesa)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.error, fontSize: 12 }}>{t('financeiro.despesa.acoes.cancelarDespesa')}</Text></TouchableOpacity> : null}
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
            <View style={{ flexDirection: 'row', marginTop: 8, marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={salvarCadastroOuEdicao} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'efetivacao' ? (
          <>
            {renderCampoBloqueado(t('financeiro.despesa.campos.valorLiquido'), formulario.valorLiquido)}
            {renderCampoBloqueado(t('financeiro.despesa.campos.valorEfetivacao'), formulario.valorEfetivacao)}
            <CampoData label={t('financeiro.despesa.campos.dataEfetivacao')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataEfetivacao} onChange={(dataEfetivacao) => { setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: false })); setFormulario((atual) => ({ ...atual, dataEfetivacao })); }} error={camposInvalidos.dataEfetivacao} estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.despesa.campos.tipoPagamento')} placeholder={t('comum.acoes.selecionar')} options={tiposPagamento.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoPagamento.${tipo}`) }))} value={formulario.tipoPagamento} onChange={(tipoPagamento) => { setCamposInvalidos((atual) => ({ ...atual, tipoPagamento: false })); setFormulario((atual) => ({ ...atual, tipoPagamento })); }} error={camposInvalidos.tipoPagamento} />
            <CampoTexto label={t('financeiro.despesa.campos.valorTotal')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => atualizarCampoMoeda('valorTotal', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.desconto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.acrescimo')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.imposto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.despesa.campos.juros')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoArquivo label={t('financeiro.despesa.campos.anexoDocumento')} placeholder={t('financeiro.despesa.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento }))} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={t('financeiro.despesa.acoes.confirmarEfetivacao')} onPress={efetivarDespesa} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && despesaSelecionada ? (
          <>
            {renderFormularioBase(true)}
            {renderCampoBloqueado(t('financeiro.despesa.campos.status'), t(`financeiro.despesa.status.${despesaSelecionada.status}`))}
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
    </View>
  );
}





































