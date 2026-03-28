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
import { atualizarReceitaApi, criarReceitaApi, listarReceitasApi, type RegistroFinanceiroApi } from '../../../src/servicos/financeiro';

type StatusReceita = 'pendente' | 'efetivada' | 'cancelada';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao';

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
  dataVencimento: string;
  dataEfetivacao?: string;
  tipoReceita: string;
  tipoRecebimento: string;
  recorrencia: string;
  valorTotal: number;
  valorLiquido: number;
  desconto: number;
  acrescimo: number;
  imposto: number;
  juros: number;
  valorEfetivacao?: number;
  status: StatusReceita;
  amigosRateio: string[];
  rateioAmigosValores: Record<string, number>;
  areasRateio: string[];
  rateioAreasValores: Record<string, number>;
  contaBancaria?: string;
  anexoDocumento: string;
  logs: LogReceita[];
}

interface ReceitaForm {
  descricao: string;
  observacao: string;
  dataLancamento: string;
  dataVencimento: string;
  dataEfetivacao: string;
  tipoReceita: string;
  tipoRecebimento: string;
  recorrencia: string;
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
  contaBancaria: string;
  anexoDocumento: string;
}

const tiposReceita = ['salario', 'freelance', 'reembolso', 'investimento', 'bonus', 'outros'] as const;
const tiposRecebimento = ['pix', 'transferencia', 'contaCorrente', 'dinheiro', 'boleto'] as const;
const recorrencias = ['unica', 'semanal', 'mensal', 'anual'] as const;
const amigosMock = ['Ana', 'Bruno', 'Carlos', 'Diana'];
const areasMock = ['Comercial > Projeto A', 'Comercial > Projeto B', 'Marketing > Midia', 'Operacoes > Suporte'];
const contasMock = ['Conta Principal', 'Conta PJ', 'Conta Reserva'];

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

function criarFormularioVazio(locale: string): ReceitaForm {
  const hoje = new Date().toISOString().split('T')[0];
  return {
    descricao: '',
    observacao: '',
    dataLancamento: hoje,
    dataVencimento: '',
    dataEfetivacao: hoje,
    tipoReceita: '',
    tipoRecebimento: '',
    recorrencia: 'unica',
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
    contaBancaria: '',
    anexoDocumento: '',
  };
}

function calcularValorLiquido(formulario: ReceitaForm, locale: string) {
  const calculado =
    converterTextoParaNumero(formulario.valorTotal, locale) -
    converterTextoParaNumero(formulario.desconto, locale) +
    converterTextoParaNumero(formulario.acrescimo, locale) +
    converterTextoParaNumero(formulario.imposto, locale) +
    converterTextoParaNumero(formulario.juros, locale);
  return Math.max(0, Number(calculado.toFixed(2)));
}

function normalizarStatusReceita(status: unknown): StatusReceita {
  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('cancel')) return 'cancelada';
  return 'pendente';
}

function mapearReceitaApi(item: RegistroFinanceiroApi): ReceitaRegistro {
  const dataBase = String(item.dataLancamento ?? item.data ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const valorBase = Number(item.valor ?? item.valorTotal ?? item.valorLiquido ?? 0);
  const desconto = Number(item.desconto ?? 0);
  const acrescimo = Number(item.acrescimo ?? 0);
  const imposto = Number(item.imposto ?? 0);
  const juros = Number(item.juros ?? 0);
  const valorLiquido = Number(item.valorLiquido ?? Math.max(0, valorBase - desconto + acrescimo + imposto + juros));

  return {
    id: Number(item.id),
    descricao: String(item.descricao ?? item.titulo ?? `Receita ${item.id}`),
    observacao: String(item.observacao ?? item.descricao ?? ''),
    dataLancamento: dataBase,
    dataVencimento: String(item.dataVencimento ?? dataBase).slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
    tipoReceita: String(item.tipoReceita ?? item.categoria ?? 'outros'),
    tipoRecebimento: String(item.tipoRecebimento ?? item.tipoPagamento ?? 'dinheiro'),
    recorrencia: String(item.recorrencia ?? 'unica'),
    valorTotal: valorBase,
    valorLiquido,
    desconto,
    acrescimo,
    imposto,
    juros,
    valorEfetivacao: item.valorEfetivacao ? Number(item.valorEfetivacao) : undefined,
    status: normalizarStatusReceita(item.status),
    amigosRateio: Array.isArray(item.amigosRateio) ? (item.amigosRateio as string[]) : [],
    rateioAmigosValores: (item.rateioAmigosValores as Record<string, number>) || {},
    areasRateio: Array.isArray(item.areasRateio) ? (item.areasRateio as string[]) : [],
    rateioAreasValores: (item.rateioAreasValores as Record<string, number>) || {},
    contaBancaria: item.contaBancaria ? String(item.contaBancaria) : undefined,
    anexoDocumento: String(item.anexoDocumento ?? ''),
    logs: Array.isArray(item.logs)
      ? (item.logs as LogReceita[])
      : [{ id: 1, data: dataBase, acao: 'IMPORTADA', descricao: 'Registro carregado da API.' }],
  };
}

export default function TelaReceita() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();
  const params = useLocalSearchParams();
  const idParamBruto = Array.isArray(params.id) ? params.id[0] : params.id;
  const idParam = idParamBruto ? Number(idParamBruto) : null;

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoTela, setModoTela] = useState<ModoTela>(idParam ? 'visualizacao' : 'lista');
  const [receitaSelecionadaId, setReceitaSelecionadaId] = useState<number | null>(idParam);
  const [receitas, setReceitas] = useState<ReceitaRegistro[]>([
    {
      id: 1,
      descricao: 'Salario mensal',
      observacao: 'Recebimento principal do mes.',
      dataLancamento: '2026-03-01',
      dataVencimento: '2026-03-05',
      dataEfetivacao: '2026-03-05',
      tipoReceita: 'salario',
      tipoRecebimento: 'transferencia',
      recorrencia: 'mensal',
      valorTotal: 5800,
      valorLiquido: 5650,
      desconto: 150,
      acrescimo: 0,
      imposto: 0,
      juros: 0,
      valorEfetivacao: 5650,
      status: 'efetivada',
      amigosRateio: [],
      rateioAmigosValores: {},
      areasRateio: ['Comercial > Projeto A'],
      rateioAreasValores: { 'Comercial > Projeto A': 5650 },
      contaBancaria: 'Conta Principal',
      anexoDocumento: 'holerite-marco.pdf',
      logs: [
        { id: 1, data: '2026-03-01', acao: 'CRIADA', descricao: t('financeiro.receita.logs.criada') },
        { id: 2, data: '2026-03-05', acao: 'EFETIVADA', descricao: t('financeiro.receita.logs.efetivada') },
      ],
    },
    {
      id: 2,
      descricao: 'Freelance design',
      observacao: 'Projeto pontual.',
      dataLancamento: '2026-03-12',
      dataVencimento: '2026-03-20',
      tipoReceita: 'freelance',
      tipoRecebimento: 'pix',
      recorrencia: 'unica',
      valorTotal: 1200,
      valorLiquido: 1200,
      desconto: 0,
      acrescimo: 0,
      imposto: 0,
      juros: 0,
      status: 'pendente',
      amigosRateio: ['Ana'],
      rateioAmigosValores: { Ana: 400 },
      areasRateio: ['Marketing > Midia'],
      rateioAreasValores: { 'Marketing > Midia': 800 },
      anexoDocumento: 'proposta.pdf',
      logs: [{ id: 1, data: '2026-03-12', acao: 'CRIADA', descricao: t('financeiro.receita.logs.criada') }],
    },
  ]);
  const [formulario, setFormulario] = useState<ReceitaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  const receitaSelecionada = receitas.find((receita) => receita.id === receitaSelecionadaId) ?? null;
  const exibeContaBancaria = formulario.tipoRecebimento === 'pix' || formulario.tipoRecebimento === 'transferencia';

  const carregarReceitasApi = async () => {
    try {
      const dados = await listarReceitasApi();
      setReceitas(dados.map(mapearReceitaApi));
    } catch {
      // fallback: manter mock local quando API indisponivel
    }
  };

  useEffect(() => {
    void carregarReceitasApi();
  }, []);

  useEffect(() => {
    if (!idParam) return;
    const receita = receitas.find((item) => item.id === idParam);
    if (!receita) {
      setModoTela('lista');
      setReceitaSelecionadaId(null);
      return;
    }
    setReceitaSelecionadaId(receita.id);
    preencherFormulario(receita);
    setModoTela('visualizacao');
  }, [idParam, locale]);

  const receitasFiltradas = useMemo(() => {
    return receitas.filter((receita) => {
      const bateId = !filtro.id || String(receita.id).includes(filtro.id);
      const termo = filtro.descricao.trim().toLowerCase();
      const tipoTraduzido = t(`financeiro.receita.tipoReceita.${receita.tipoReceita}`).toLowerCase();
      const statusTraduzido = t(`financeiro.receita.status.${receita.status}`).toLowerCase();
      const bateDescricao =
        !termo ||
        receita.descricao.toLowerCase().includes(termo) ||
        receita.observacao.toLowerCase().includes(termo) ||
        tipoTraduzido.includes(termo) ||
        statusTraduzido.includes(termo);
      const bateData = estaDentroIntervalo(receita.dataLancamento, filtro.dataInicio, filtro.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [receitas, filtro, t]);

  const atualizarCampoMoeda = (campo: keyof ReceitaForm, valor: string) => {
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

  const preencherFormulario = (receita: ReceitaRegistro) => {
    setFormulario({
      descricao: receita.descricao,
      observacao: receita.observacao,
      dataLancamento: receita.dataLancamento,
      dataVencimento: receita.dataVencimento,
      dataEfetivacao: receita.dataEfetivacao || new Date().toISOString().split('T')[0],
      tipoReceita: receita.tipoReceita,
      tipoRecebimento: receita.tipoRecebimento,
      recorrencia: receita.recorrencia,
      valorTotal: formatarMoedaParaInput(receita.valorTotal, locale),
      valorLiquido: formatarMoedaParaInput(receita.valorLiquido, locale),
      desconto: formatarMoedaParaInput(receita.desconto, locale),
      acrescimo: formatarMoedaParaInput(receita.acrescimo, locale),
      imposto: formatarMoedaParaInput(receita.imposto, locale),
      juros: formatarMoedaParaInput(receita.juros, locale),
      valorEfetivacao: formatarMoedaParaInput(receita.valorEfetivacao ?? receita.valorLiquido, locale),
      amigosRateio: receita.amigosRateio,
      rateioAmigosValores: Object.fromEntries(Object.entries(receita.rateioAmigosValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      areasRateio: receita.areasRateio,
      rateioAreasValores: Object.fromEntries(Object.entries(receita.rateioAreasValores).map(([chave, valor]) => [chave, formatarMoedaParaInput(valor, locale)])),
      contaBancaria: receita.contaBancaria || '',
      anexoDocumento: receita.anexoDocumento,
    });
  };

  const resetarTela = () => {
    setModoTela('lista');
    setReceitaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
  };

  const abrirNovo = () => {
    setReceitaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    setModoTela('novo');
  };

  const abrirVisualizacao = (receita: ReceitaRegistro) => {
    setReceitaSelecionadaId(receita.id);
    preencherFormulario(receita);
    setModoTela('visualizacao');
  };

  const abrirEdicao = (receita: ReceitaRegistro) => {
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.edicaoSomentePendente'));
      return;
    }
    setReceitaSelecionadaId(receita.id);
    preencherFormulario(receita);
    setModoTela('edicao');
  };

  const abrirEfetivacao = (receita: ReceitaRegistro) => {
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setReceitaSelecionadaId(receita.id);
    preencherFormulario(receita);
    setModoTela('efetivacao');
  };

  const serializarValores = (valores: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(valores)
        .filter(([, valor]) => valor)
        .map(([chave, valor]) => [chave, converterTextoParaNumero(valor, locale)]),
    );

  const validarFormularioBase = () => {
    const invalidos: Record<string, boolean> = {};
    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!formulario.dataLancamento) invalidos.dataLancamento = true;
    if (!formulario.dataVencimento) invalidos.dataVencimento = true;
    if (!formulario.tipoReceita) invalidos.tipoReceita = true;
    if (!formulario.tipoRecebimento) invalidos.tipoRecebimento = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.receita.mensagens.obrigatorio'));
      return null;
    }

    if (exibeContaBancaria && !formulario.contaBancaria) {
      setCamposInvalidos((atual) => ({ ...atual, contaBancaria: true }));
      notificarErro( t('financeiro.receita.mensagens.contaObrigatoria'));
      return null;
    }

    const valorTotal = converterTextoParaNumero(formulario.valorTotal, locale);
    if (!valorTotal) {
      setCamposInvalidos((atual) => ({ ...atual, valorTotal: true }));
      notificarErro( t('financeiro.receita.mensagens.valorObrigatorio'));
      return null;
    }

    return {
      valorTotal,
      valorLiquido: calcularValorLiquido(formulario, locale),
      desconto: converterTextoParaNumero(formulario.desconto, locale),
      acrescimo: converterTextoParaNumero(formulario.acrescimo, locale),
      imposto: converterTextoParaNumero(formulario.imposto, locale),
      juros: converterTextoParaNumero(formulario.juros, locale),
      rateioAmigosValores: serializarValores(formulario.rateioAmigosValores),
      rateioAreasValores: serializarValores(formulario.rateioAreasValores),
    };
  };

  const salvarCadastroOuEdicao = async () => {
    const base = validarFormularioBase();
    if (!base) return;

    const payloadBase = {
      descricao: formulario.descricao,
      observacao: formulario.observacao,
      dataLancamento: formulario.dataLancamento,
      dataVencimento: formulario.dataVencimento,
      tipoReceita: formulario.tipoReceita,
      tipoRecebimento: formulario.tipoRecebimento,
      recorrencia: formulario.recorrencia,
      valorTotal: base.valorTotal,
      valorLiquido: base.valorLiquido,
      desconto: base.desconto,
      acrescimo: base.acrescimo,
      imposto: base.imposto,
      juros: base.juros,
      amigosRateio: formulario.amigosRateio,
      rateioAmigosValores: base.rateioAmigosValores,
      areasRateio: formulario.areasRateio,
      rateioAreasValores: base.rateioAreasValores,
      contaBancaria: formulario.contaBancaria,
      anexoDocumento: formulario.anexoDocumento,
    };

    try {
      if (modoTela === 'novo') {
        await criarReceitaApi(payloadBase);
        await carregarReceitasApi();
        notificarSucesso(t('financeiro.receita.mensagens.criada'));
        resetarTela();
        return;
      }

      if (modoTela === 'edicao' && receitaSelecionada) {
        await atualizarReceitaApi(receitaSelecionada.id, payloadBase);
        await carregarReceitasApi();
        notificarSucesso(t('financeiro.receita.mensagens.atualizada'));
        resetarTela();
        return;
      }
    } catch {
      // fallback local
    }

    if (modoTela === 'novo') {
      const novoId = receitas.length > 0 ? Math.max(...receitas.map((receita) => receita.id)) + 1 : 1;
      setReceitas((atual) => [
        ...atual,
        {
          id: novoId,
          descricao: formulario.descricao,
          observacao: formulario.observacao,
          dataLancamento: formulario.dataLancamento,
          dataVencimento: formulario.dataVencimento,
          tipoReceita: formulario.tipoReceita,
          tipoRecebimento: formulario.tipoRecebimento,
          recorrencia: formulario.recorrencia,
          valorTotal: base.valorTotal,
          valorLiquido: base.valorLiquido,
          desconto: base.desconto,
          acrescimo: base.acrescimo,
          imposto: base.imposto,
          juros: base.juros,
          status: 'pendente',
          amigosRateio: formulario.amigosRateio,
          rateioAmigosValores: base.rateioAmigosValores,
          areasRateio: formulario.areasRateio,
          rateioAreasValores: base.rateioAreasValores,
          contaBancaria: formulario.contaBancaria,
          anexoDocumento: formulario.anexoDocumento,
          logs: [{ id: 1, data: new Date().toISOString().split('T')[0], acao: 'CRIADA', descricao: t('financeiro.receita.logs.criada') }],
        },
      ]);
      notificarSucesso(t('financeiro.receita.mensagens.criada'));
    } else if (modoTela === 'edicao' && receitaSelecionada) {
      setReceitas((atual) =>
        atual.map((receita) =>
          receita.id === receitaSelecionada.id
            ? {
                ...receita,
                descricao: formulario.descricao,
                observacao: formulario.observacao,
                dataLancamento: formulario.dataLancamento,
                dataVencimento: formulario.dataVencimento,
                tipoReceita: formulario.tipoReceita,
                tipoRecebimento: formulario.tipoRecebimento,
                recorrencia: formulario.recorrencia,
                valorTotal: base.valorTotal,
                valorLiquido: base.valorLiquido,
                desconto: base.desconto,
                acrescimo: base.acrescimo,
                imposto: base.imposto,
                juros: base.juros,
                amigosRateio: formulario.amigosRateio,
                rateioAmigosValores: base.rateioAmigosValores,
                areasRateio: formulario.areasRateio,
                rateioAreasValores: base.rateioAreasValores,
                contaBancaria: formulario.contaBancaria,
                anexoDocumento: formulario.anexoDocumento,
                logs: [...receita.logs, { id: receita.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'EDITADA', descricao: t('financeiro.receita.logs.editada') }],
              }
            : receita,
        ),
      );
      notificarSucesso(t('financeiro.receita.mensagens.atualizada'));
    }

    resetarTela();
  };

  const efetivarReceita = async () => {
    if (!receitaSelecionada) return;
    const base = validarFormularioBase();
    if (!base || !formulario.dataEfetivacao || !formulario.tipoRecebimento) {
      setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: !formulario.dataEfetivacao, tipoRecebimento: !formulario.tipoRecebimento }));
      notificarErro( t('financeiro.receita.mensagens.obrigatorioEfetivacao'));
      return;
    }

    if ((formulario.tipoRecebimento === 'pix' || formulario.tipoRecebimento === 'transferencia') && !formulario.contaBancaria) {
      setCamposInvalidos((atual) => ({ ...atual, contaBancaria: true }));
      notificarErro( t('financeiro.receita.mensagens.contaObrigatoria'));
      return;
    }

    try {
      await atualizarReceitaApi(receitaSelecionada.id, {
        dataEfetivacao: formulario.dataEfetivacao,
        tipoRecebimento: formulario.tipoRecebimento,
        valorTotal: base.valorTotal,
        valorLiquido: base.valorLiquido,
        desconto: base.desconto,
        acrescimo: base.acrescimo,
        imposto: base.imposto,
        juros: base.juros,
        valorEfetivacao: base.valorLiquido,
        contaBancaria: formulario.contaBancaria,
        anexoDocumento: formulario.anexoDocumento,
        status: 'efetivada',
      });
      await carregarReceitasApi();
      notificarSucesso(t('financeiro.receita.mensagens.efetivada'));
      resetarTela();
      return;
    } catch {
      // fallback local
    }

    setReceitas((atual) =>
      atual.map((receita) =>
        receita.id === receitaSelecionada.id
          ? {
              ...receita,
              dataEfetivacao: formulario.dataEfetivacao,
              tipoRecebimento: formulario.tipoRecebimento,
              valorTotal: base.valorTotal,
              valorLiquido: base.valorLiquido,
              desconto: base.desconto,
              acrescimo: base.acrescimo,
              imposto: base.imposto,
              juros: base.juros,
              valorEfetivacao: base.valorLiquido,
              contaBancaria: formulario.contaBancaria,
              anexoDocumento: formulario.anexoDocumento,
              status: 'efetivada',
              logs: [...receita.logs, { id: receita.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'EFETIVADA', descricao: t('financeiro.receita.logs.efetivada') }],
            }
          : receita,
      ),
    );

    notificarSucesso(t('financeiro.receita.mensagens.efetivada'));
    resetarTela();
  };

  const cancelarReceita = (receita: ReceitaRegistro) => {
    if (receita.status !== 'pendente') {
      notificarErro( t('financeiro.receita.mensagens.cancelamentoSomentePendente'));
      return;
    }

    const confirmarCancelamento = async () => {
      try {
        await atualizarReceitaApi(receita.id, { status: 'cancelada' });
        await carregarReceitasApi();
        notificarSucesso(t('financeiro.receita.acoes.cancelarReceita'));
        return;
      } catch {
        // fallback local
      }

      setReceitas((atual) =>
        atual.map((item) =>
          item.id === receita.id
            ? {
                ...item,
                status: 'cancelada',
                logs: [...item.logs, { id: item.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'CANCELADA', descricao: t('financeiro.receita.logs.cancelada') }],
              }
            : item,
        ),
      );
      notificarSucesso(t('financeiro.receita.acoes.cancelarReceita'));
    };

    void confirmarCancelamento();
  };

  const estornarReceita = async (receita: ReceitaRegistro) => {
    if (receita.status !== 'efetivada') {
      notificarErro( t('financeiro.receita.mensagens.estornoSomenteEfetivada'));
      return;
    }

    try {
      await atualizarReceitaApi(receita.id, {
        status: 'pendente',
        dataEfetivacao: null,
        valorEfetivacao: null,
      });
      await carregarReceitasApi();
      return;
    } catch {
      // fallback local
    }

    setReceitas((atual) =>
      atual.map((item) =>
        item.id === receita.id
          ? {
              ...item,
              status: 'pendente',
              dataEfetivacao: undefined,
              valorEfetivacao: undefined,
              logs: [...item.logs, { id: item.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'ESTORNADA', descricao: t('financeiro.receita.logs.estornada') }],
            }
          : item,
      ),
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

  const renderCamposValoresRateio = (itens: string[], valores: Record<string, string>, onChange: (chave: string, valor: string) => void) => (
    <>
      {itens.map((item) => (
        <CampoTexto
          key={item}
          label={item}
          placeholder={t('financeiro.receita.placeholders.valor')}
          value={valores[item] || ''}
          onChangeText={(valor) => onChange(item, aplicarMascaraMoeda(valor, locale))}
          keyboardType="numeric"
          estilo={{ marginBottom: 12 }}
        />
      ))}
    </>
  );

  const renderFormularioBase = (somenteLeitura: boolean) => (
    <>
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.descricao'), formulario.descricao) : <CampoTexto label={t('financeiro.receita.campos.descricao')} placeholder={t('financeiro.receita.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.observacao'), formulario.observacao) : <CampoTexto label={t('financeiro.receita.campos.observacao')} placeholder={t('financeiro.receita.placeholders.observacao')} value={formulario.observacao} onChangeText={(observacao) => setFormulario((atual) => ({ ...atual, observacao }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.dataLancamento'), formulario.dataLancamento ? formatarDataPorIdioma(formulario.dataLancamento) : '') : <CampoData label={t('financeiro.receita.campos.dataLancamento')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataLancamento} onChange={(dataLancamento) => { setCamposInvalidos((atual) => ({ ...atual, dataLancamento: false })); setFormulario((atual) => ({ ...atual, dataLancamento })); }} error={camposInvalidos.dataLancamento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.dataVencimento'), formulario.dataVencimento ? formatarDataPorIdioma(formulario.dataVencimento) : '') : <CampoData label={t('financeiro.receita.campos.dataVencimento')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataVencimento} onChange={(dataVencimento) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimento: false })); setFormulario((atual) => ({ ...atual, dataVencimento })); }} error={camposInvalidos.dataVencimento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.tipoReceita'), formulario.tipoReceita ? t(`financeiro.receita.tipoReceita.${formulario.tipoReceita}`) : '') : <CampoSelect label={t('financeiro.receita.campos.tipoReceita')} placeholder={t('comum.acoes.selecionar')} options={tiposReceita.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoReceita.${tipo}`) }))} value={formulario.tipoReceita} onChange={(tipoReceita) => { setCamposInvalidos((atual) => ({ ...atual, tipoReceita: false })); setFormulario((atual) => ({ ...atual, tipoReceita })); }} error={camposInvalidos.tipoReceita} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.tipoRecebimento'), formulario.tipoRecebimento ? t(`financeiro.receita.tipoRecebimento.${formulario.tipoRecebimento}`) : '') : <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={formulario.tipoRecebimento} onChange={(tipoRecebimento) => { setCamposInvalidos((atual) => ({ ...atual, tipoRecebimento: false, contaBancaria: false })); setFormulario((atual) => ({ ...atual, tipoRecebimento, contaBancaria: tipoRecebimento === 'pix' || tipoRecebimento === 'transferencia' ? atual.contaBancaria : '' })); }} error={camposInvalidos.tipoRecebimento} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.recorrencia'), t(`financeiro.receita.recorrencia.${formulario.recorrencia}`)) : <CampoSelect label={t('financeiro.receita.campos.recorrencia')} placeholder={t('comum.acoes.selecionar')} options={recorrencias.map((item) => ({ value: item, label: t(`financeiro.receita.recorrencia.${item}`) }))} value={formulario.recorrencia} onChange={(recorrencia) => setFormulario((atual) => ({ ...atual, recorrencia }))} />}
      {exibeContaBancaria ? somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.contaBancaria'), formulario.contaBancaria) : <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={contasMock.map((conta) => ({ value: conta, label: conta }))} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false })); setFormulario((atual) => ({ ...atual, contaBancaria })); }} error={camposInvalidos.contaBancaria} /> : null}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.valorTotal'), formulario.valorTotal) : <CampoTexto label={t('financeiro.receita.campos.valorTotal')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.desconto'), formulario.desconto) : <CampoTexto label={t('financeiro.receita.campos.desconto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.acrescimo'), formulario.acrescimo) : <CampoTexto label={t('financeiro.receita.campos.acrescimo')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.imposto'), formulario.imposto) : <CampoTexto label={t('financeiro.receita.campos.imposto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.juros'), formulario.juros) : <CampoTexto label={t('financeiro.receita.campos.juros')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {renderCampoBloqueado(t('financeiro.receita.campos.valorLiquido'), formulario.valorLiquido)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.rateioAmigos'), formulario.amigosRateio.join(', ')) : <CampoSelect label={t('financeiro.receita.campos.rateioAmigos')} placeholder={t('comum.acoes.selecionar')} options={amigosMock.map((nome) => ({ value: nome, label: nome }))} values={formulario.amigosRateio} multiple onChangeMultiple={(amigosRateio) => setFormulario((atual) => ({ ...atual, amigosRateio }))} />}
      {!somenteLeitura ? renderCamposValoresRateio(formulario.amigosRateio, formulario.rateioAmigosValores, (chave, valor) => setFormulario((atual) => ({ ...atual, rateioAmigosValores: { ...atual.rateioAmigosValores, [chave]: valor } }))) : renderCampoBloqueado(t('financeiro.receita.campos.rateioAmigosValores'), Object.entries(formulario.rateioAmigosValores).map(([nome, valor]) => `${nome}: ${valor}`).join(' | '))}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.rateioAreaSubarea'), formulario.areasRateio.join(', ')) : <CampoSelect label={t('financeiro.receita.campos.rateioAreaSubarea')} placeholder={t('comum.acoes.selecionar')} options={areasMock.map((area) => ({ value: area, label: area }))} values={formulario.areasRateio} multiple onChangeMultiple={(areasRateio) => setFormulario((atual) => ({ ...atual, areasRateio }))} />}
      {!somenteLeitura ? renderCamposValoresRateio(formulario.areasRateio, formulario.rateioAreasValores, (chave, valor) => setFormulario((atual) => ({ ...atual, rateioAreasValores: { ...atual.rateioAreasValores, [chave]: valor } }))) : renderCampoBloqueado(t('financeiro.receita.campos.rateioAreaSubareaValores'), Object.entries(formulario.rateioAreasValores).map(([nome, valor]) => `${nome}: ${valor}`).join(' | '))}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.receita.campos.anexoDocumento'), formulario.anexoDocumento) : <CampoArquivo label={t('financeiro.receita.campos.anexoDocumento')} placeholder={t('financeiro.receita.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento }))} estilo={{ marginBottom: 12 }} />}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.receita.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoTela === 'lista' ? router.back() : resetarTela())}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {modoTela === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.receita.nova')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />
            <View>
              {receitasFiltradas.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('financeiro.receita.vazio')}</Text> : receitasFiltradas.map((receita) => (
                <View key={receita.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{receita.id} {receita.descricao}</Text>
                    <Text style={{ color: receita.status === 'efetivada' ? COLORS.success : receita.status === 'cancelada' ? COLORS.error : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{t(`financeiro.receita.status.${receita.status}`)}</Text>
                  </View>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>{t(`financeiro.receita.tipoReceita.${receita.tipoReceita}`)} | {formatarDataPorIdioma(receita.dataVencimento)} | {formatarValorPorIdioma(receita.valorLiquido)}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{receita.observacao || t('financeiro.receita.mensagens.semObservacao')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                    <TouchableOpacity onPress={() => abrirVisualizacao(receita)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('financeiro.receita.acoes.visualizar')}</Text></TouchableOpacity>
                    {receita.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEdicao(receita)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity> : null}
                    {receita.status === 'pendente' ? <TouchableOpacity onPress={() => abrirEfetivacao(receita)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.receita.acoes.efetivar')}</Text></TouchableOpacity> : null}
                    {receita.status === 'pendente' ? <TouchableOpacity onPress={() => cancelarReceita(receita)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.error, fontSize: 12 }}>{t('financeiro.receita.acoes.cancelarReceita')}</Text></TouchableOpacity> : null}
                    {receita.status === 'efetivada' ? <TouchableOpacity onPress={() => estornarReceita(receita)} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.receita.acoes.estornar')}</Text></TouchableOpacity> : null}
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
            {renderCampoBloqueado(t('financeiro.receita.campos.valorLiquido'), formulario.valorLiquido)}
            {renderCampoBloqueado(t('financeiro.receita.campos.valorEfetivacao'), formulario.valorEfetivacao)}
            <CampoData label={t('financeiro.receita.campos.dataEfetivacao')} placeholder={t('financeiro.receita.placeholders.data')} value={formulario.dataEfetivacao} onChange={(dataEfetivacao) => { setCamposInvalidos((atual) => ({ ...atual, dataEfetivacao: false })); setFormulario((atual) => ({ ...atual, dataEfetivacao })); }} error={camposInvalidos.dataEfetivacao} estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={formulario.tipoRecebimento} onChange={(tipoRecebimento) => { setCamposInvalidos((atual) => ({ ...atual, tipoRecebimento: false })); setFormulario((atual) => ({ ...atual, tipoRecebimento })); }} error={camposInvalidos.tipoRecebimento} />
            {(formulario.tipoRecebimento === 'pix' || formulario.tipoRecebimento === 'transferencia') ? <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={contasMock.map((conta) => ({ value: conta, label: conta }))} value={formulario.contaBancaria} onChange={(contaBancaria) => { setCamposInvalidos((atual) => ({ ...atual, contaBancaria: false })); setFormulario((atual) => ({ ...atual, contaBancaria })); }} error={camposInvalidos.contaBancaria} /> : null}
            <CampoTexto label={t('financeiro.receita.campos.valorTotal')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.desconto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.acrescimo')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.imposto')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.receita.campos.juros')} placeholder={t('financeiro.receita.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
            <CampoArquivo label={t('financeiro.receita.campos.anexoDocumento')} placeholder={t('financeiro.receita.placeholders.anexo')} value={formulario.anexoDocumento} onChange={(anexoDocumento) => setFormulario((atual) => ({ ...atual, anexoDocumento }))} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1, marginHorizontal: 5 }} />
              <Botao titulo={t('financeiro.receita.acoes.confirmarEfetivacao')} onPress={efetivarReceita} tipo="primario" estilo={{ flex: 1, marginHorizontal: 5 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && receitaSelecionada ? (
          <>
            {renderFormularioBase(true)}
            {renderCampoBloqueado(t('financeiro.receita.campos.status'), t(`financeiro.receita.status.${receitaSelecionada.status}`))}
            {renderCampoBloqueado(t('financeiro.receita.campos.dataEfetivacao'), receitaSelecionada.dataEfetivacao ? formatarDataPorIdioma(receitaSelecionada.dataEfetivacao) : '')}
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
    </View>
  );
}




