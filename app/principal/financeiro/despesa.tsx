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
import { atualizarDespesaApi, criarDespesaApi, listarDespesasApi, type RegistroFinanceiroApi } from '../../../src/servicos/financeiro';

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
  recorrencia: string;
  valorTotal: number;
  valorLiquido: number;
  desconto: number;
  acrescimo: number;
  imposto: number;
  juros: number;
  valorEfetivacao?: number;
  status: StatusDespesa;
  amigosRateio: string[];
  tiposRateio: string[];
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
  recorrencia: string;
  valorTotal: string;
  valorLiquido: string;
  desconto: string;
  acrescimo: string;
  imposto: string;
  juros: string;
  valorEfetivacao: string;
  amigosRateio: string[];
  tiposRateio: string[];
  anexoDocumento: string;
}

const tiposDespesa = ['alimentacao', 'transporte', 'moradia', 'lazer', 'saude', 'educacao', 'servicos'] as const;
const tiposPagamento = ['pix', 'cartaoCredito', 'cartaoDebito', 'boleto', 'transferencia', 'dinheiro'] as const;
const recorrencias = ['unica', 'semanal', 'mensal', 'anual'] as const;
const amigosMock = ['Ana', 'Bruno', 'Carlos', 'Diana'];

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
    valorTotal: formatarMoedaParaInput(0, locale),
    valorLiquido: formatarMoedaParaInput(0, locale),
    desconto: formatarMoedaParaInput(0, locale),
    acrescimo: formatarMoedaParaInput(0, locale),
    imposto: formatarMoedaParaInput(0, locale),
    juros: formatarMoedaParaInput(0, locale),
    valorEfetivacao: formatarMoedaParaInput(0, locale),
    amigosRateio: [],
    tiposRateio: [],
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

  return {
    id: Number(item.id),
    descricao: String(item.descricao ?? item.titulo ?? `Despesa ${item.id}`),
    observacao: String(item.observacao ?? item.descricao ?? ''),
    dataLancamento: dataBase,
    dataVencimento: String(item.dataVencimento ?? dataBase).slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
    tipoDespesa: String(item.tipoDespesa ?? item.categoria ?? 'servicos'),
    tipoPagamento: String(item.tipoPagamento ?? 'dinheiro'),
    recorrencia: String(item.recorrencia ?? 'unica'),
    valorTotal: valorBase,
    valorLiquido,
    desconto,
    acrescimo,
    imposto,
    juros,
    valorEfetivacao: item.valorEfetivacao ? Number(item.valorEfetivacao) : undefined,
    status: normalizarStatusDespesa(item.status),
    amigosRateio: Array.isArray(item.amigosRateio) ? (item.amigosRateio as string[]) : [],
    tiposRateio: Array.isArray(item.tiposRateio) ? (item.tiposRateio as string[]) : [],
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
  const [despesas, setDespesas] = useState<DespesaRegistro[]>([
    {
      id: 1,
      descricao: 'Almoco com cliente',
      observacao: 'Reuniao comercial no centro.',
      dataLancamento: '2026-03-10',
      dataVencimento: '2026-03-15',
      dataEfetivacao: '2026-03-15',
      tipoDespesa: 'alimentacao',
      tipoPagamento: 'pix',
      recorrencia: 'unica',
      valorTotal: 150,
      valorLiquido: 145,
      desconto: 5,
      acrescimo: 0,
      imposto: 0,
      juros: 0,
      valorEfetivacao: 145,
      status: 'efetivada',
      amigosRateio: ['Ana', 'Bruno'],
      tiposRateio: ['alimentacao'],
      anexoDocumento: 'recibo-almoco.pdf',
      logs: [
        { id: 1, data: '2026-03-10', acao: 'CRIADA', descricao: 'Despesa criada com status pendente.' },
        { id: 2, data: '2026-03-15', acao: 'EFETIVADA', descricao: 'Despesa efetivada com pagamento via PIX.' },
      ],
    },
    {
      id: 2,
      descricao: 'Cinema com amigos',
      observacao: 'Sessao de sexta.',
      dataLancamento: '2026-03-18',
      dataVencimento: '2026-03-21',
      tipoDespesa: 'lazer',
      tipoPagamento: 'cartaoCredito',
      recorrencia: 'unica',
      valorTotal: 90,
      valorLiquido: 90,
      desconto: 0,
      acrescimo: 0,
      imposto: 0,
      juros: 0,
      status: 'pendente',
      amigosRateio: ['Carlos', 'Diana'],
      tiposRateio: ['lazer'],
      anexoDocumento: 'ingressos.png',
      logs: [{ id: 1, data: '2026-03-18', acao: 'CRIADA', descricao: 'Despesa criada com status pendente.' }],
    },
  ]);
  const [formulario, setFormulario] = useState<DespesaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  const despesaSelecionada = despesas.find((despesa) => despesa.id === despesaSelecionadaId) ?? null;

  const carregarDespesasApi = async () => {
    try {
      const dados = await listarDespesasApi();
      setDespesas(dados.map(mapearDespesaApi));
    } catch {
      // fallback: manter dados locais quando a API estiver indisponivel
    }
  };

  useEffect(() => {
    void carregarDespesasApi();
  }, []);

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
  }, [idParam, locale]);

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
      valorTotal: formatarMoedaParaInput(despesa.valorTotal, locale),
      valorLiquido: formatarMoedaParaInput(despesa.valorLiquido, locale),
      desconto: formatarMoedaParaInput(despesa.desconto, locale),
      acrescimo: formatarMoedaParaInput(despesa.acrescimo, locale),
      imposto: formatarMoedaParaInput(despesa.imposto, locale),
      juros: formatarMoedaParaInput(despesa.juros, locale),
      valorEfetivacao: formatarMoedaParaInput(despesa.valorEfetivacao ?? despesa.valorLiquido, locale),
      amigosRateio: despesa.amigosRateio,
      tiposRateio: despesa.tiposRateio,
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

  const validarFormularioBase = () => {
    const invalidos: Record<string, boolean> = {};
    const dataLancamento = formulario.dataLancamento;
    const dataVencimento = formulario.dataVencimento;

    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!dataLancamento) invalidos.dataLancamento = true;
    if (!dataVencimento) invalidos.dataVencimento = true;
    if (!formulario.tipoDespesa) invalidos.tipoDespesa = true;
    if (!formulario.tipoPagamento) invalidos.tipoPagamento = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.despesa.mensagens.obrigatorio'));
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
    };
  };

  const resetarTela = () => {
    setModoTela('lista');
    setDespesaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
  };

  const salvarCadastroOuEdicao = async () => {
    const base = validarFormularioBase();
    if (!base) return;

    const payloadBase = {
      descricao: formulario.descricao,
      observacao: formulario.observacao,
      dataLancamento: base.dataLancamento,
      dataVencimento: base.dataVencimento,
      tipoDespesa: formulario.tipoDespesa,
      tipoPagamento: formulario.tipoPagamento,
      recorrencia: formulario.recorrencia,
      valorTotal: base.valorTotal,
      valorLiquido: base.valorLiquido,
      desconto: base.desconto,
      acrescimo: base.acrescimo,
      imposto: base.imposto,
      juros: base.juros,
      amigosRateio: formulario.amigosRateio,
      tiposRateio: formulario.tiposRateio,
      anexoDocumento: formulario.anexoDocumento,
    };

    try {
      if (modoTela === 'novo') {
        await criarDespesaApi(payloadBase);
        await carregarDespesasApi();
        notificarSucesso(t('financeiro.despesa.mensagens.criada'));
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
      // fallback local enquanto endpoints finais nao estao completos em todos os ambientes
    }

    if (modoTela === 'novo') {
      const novoId = despesas.length > 0 ? Math.max(...despesas.map((despesa) => despesa.id)) + 1 : 1;
      setDespesas((atual) => [
        ...atual,
        {
          id: novoId,
          descricao: formulario.descricao,
          observacao: formulario.observacao,
          dataLancamento: base.dataLancamento,
          dataVencimento: base.dataVencimento,
          tipoDespesa: formulario.tipoDespesa,
          tipoPagamento: formulario.tipoPagamento,
          recorrencia: formulario.recorrencia,
          valorTotal: base.valorTotal,
          valorLiquido: base.valorLiquido,
          desconto: base.desconto,
          acrescimo: base.acrescimo,
          imposto: base.imposto,
          juros: base.juros,
          status: 'pendente',
          amigosRateio: formulario.amigosRateio,
          tiposRateio: formulario.tiposRateio,
          anexoDocumento: formulario.anexoDocumento,
          logs: [{ id: 1, data: new Date().toISOString().split('T')[0], acao: 'CRIADA', descricao: t('financeiro.despesa.logs.criada') }],
        },
      ]);
      notificarSucesso(t('financeiro.despesa.mensagens.criada'));
    } else if (modoTela === 'edicao' && despesaSelecionada) {
      setDespesas((atual) =>
        atual.map((despesa) =>
          despesa.id === despesaSelecionada.id
            ? {
                ...despesa,
                descricao: formulario.descricao,
                observacao: formulario.observacao,
                dataLancamento: base.dataLancamento,
                dataVencimento: base.dataVencimento,
                tipoDespesa: formulario.tipoDespesa,
                tipoPagamento: formulario.tipoPagamento,
                recorrencia: formulario.recorrencia,
                valorTotal: base.valorTotal,
                valorLiquido: base.valorLiquido,
                desconto: base.desconto,
                acrescimo: base.acrescimo,
                imposto: base.imposto,
                juros: base.juros,
                amigosRateio: formulario.amigosRateio,
                tiposRateio: formulario.tiposRateio,
                anexoDocumento: formulario.anexoDocumento,
                logs: [...despesa.logs, { id: despesa.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'EDITADA', descricao: t('financeiro.despesa.logs.editada') }],
              }
            : despesa,
        ),
      );
      notificarSucesso(t('financeiro.despesa.mensagens.atualizada'));
    }

    resetarTela();
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
      // fallback local
    }

    setDespesas((atual) =>
      atual.map((despesa) =>
        despesa.id === despesaSelecionada.id
          ? {
              ...despesa,
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
              logs: [...despesa.logs, { id: despesa.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'EFETIVADA', descricao: t('financeiro.despesa.logs.efetivada') }],
            }
          : despesa,
      ),
    );

    notificarSucesso(t('financeiro.despesa.mensagens.efetivada'));
    resetarTela();
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
        // fallback local
      }

      setDespesas((atual) =>
        atual.map((item) =>
          item.id === despesa.id
            ? {
                ...item,
                status: 'cancelada',
                logs: [...item.logs, { id: item.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'CANCELADA', descricao: t('financeiro.despesa.logs.cancelada') }],
              }
            : item,
        ),
      );

      notificarSucesso(t('financeiro.despesa.acoes.cancelarDespesa'));
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
      // fallback local
    }

    setDespesas((atual) =>
      atual.map((item) =>
        item.id === despesa.id
          ? {
              ...item,
              status: 'pendente',
              dataEfetivacao: undefined,
              valorEfetivacao: undefined,
              logs: [...item.logs, { id: item.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'ESTORNADA', descricao: t('financeiro.despesa.logs.estornada') }],
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

  const renderFormularioBase = (somenteLeitura: boolean) => (
    <>
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.descricao'), formulario.descricao) : <CampoTexto label={t('financeiro.despesa.campos.descricao')} placeholder={t('financeiro.despesa.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.observacao'), formulario.observacao) : <CampoTexto label={t('financeiro.despesa.campos.observacao')} placeholder={t('financeiro.despesa.placeholders.observacao')} value={formulario.observacao} onChangeText={(observacao) => setFormulario((atual) => ({ ...atual, observacao }))} multiline numberOfLines={4} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.dataLancamento'), formulario.dataLancamento ? formatarDataPorIdioma(formulario.dataLancamento) : '') : <CampoData label={t('financeiro.despesa.campos.dataLancamento')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataLancamento} onChange={(dataLancamento) => { setCamposInvalidos((atual) => ({ ...atual, dataLancamento: false })); setFormulario((atual) => ({ ...atual, dataLancamento })); }} error={camposInvalidos.dataLancamento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.dataVencimento'), formulario.dataVencimento ? formatarDataPorIdioma(formulario.dataVencimento) : '') : <CampoData label={t('financeiro.despesa.campos.dataVencimento')} placeholder={t('financeiro.despesa.placeholders.data')} value={formulario.dataVencimento} onChange={(dataVencimento) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimento: false })); setFormulario((atual) => ({ ...atual, dataVencimento })); }} error={camposInvalidos.dataVencimento} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.tipoDespesa'), formulario.tipoDespesa ? t(`financeiro.despesa.tipoDespesa.${formulario.tipoDespesa}`) : '') : <CampoSelect label={t('financeiro.despesa.campos.tipoDespesa')} placeholder={t('comum.acoes.selecionar')} options={tiposDespesa.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoDespesa.${tipo}`) }))} value={formulario.tipoDespesa} onChange={(tipoDespesa) => { setCamposInvalidos((atual) => ({ ...atual, tipoDespesa: false })); setFormulario((atual) => ({ ...atual, tipoDespesa })); }} error={camposInvalidos.tipoDespesa} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.tipoPagamento'), formulario.tipoPagamento ? t(`financeiro.despesa.tipoPagamento.${formulario.tipoPagamento}`) : '') : <CampoSelect label={t('financeiro.despesa.campos.tipoPagamento')} placeholder={t('comum.acoes.selecionar')} options={tiposPagamento.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoPagamento.${tipo}`) }))} value={formulario.tipoPagamento} onChange={(tipoPagamento) => { setCamposInvalidos((atual) => ({ ...atual, tipoPagamento: false })); setFormulario((atual) => ({ ...atual, tipoPagamento })); }} error={camposInvalidos.tipoPagamento} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.recorrencia'), t(`financeiro.despesa.recorrencia.${formulario.recorrencia}`)) : <CampoSelect label={t('financeiro.despesa.campos.recorrencia')} placeholder={t('comum.acoes.selecionar')} options={recorrencias.map((item) => ({ value: item, label: t(`financeiro.despesa.recorrencia.${item}`) }))} value={formulario.recorrencia} onChange={(recorrencia) => setFormulario((atual) => ({ ...atual, recorrencia }))} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.valorTotal'), formulario.valorTotal) : <CampoTexto label={t('financeiro.despesa.campos.valorTotal')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.valorTotal} onChangeText={(valor) => { setCamposInvalidos((atual) => ({ ...atual, valorTotal: false })); atualizarCampoMoeda('valorTotal', valor); }} error={camposInvalidos.valorTotal} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.desconto'), formulario.desconto) : <CampoTexto label={t('financeiro.despesa.campos.desconto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.desconto} onChangeText={(valor) => atualizarCampoMoeda('desconto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.acrescimo'), formulario.acrescimo) : <CampoTexto label={t('financeiro.despesa.campos.acrescimo')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.acrescimo} onChangeText={(valor) => atualizarCampoMoeda('acrescimo', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.imposto'), formulario.imposto) : <CampoTexto label={t('financeiro.despesa.campos.imposto')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.imposto} onChangeText={(valor) => atualizarCampoMoeda('imposto', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.juros'), formulario.juros) : <CampoTexto label={t('financeiro.despesa.campos.juros')} placeholder={t('financeiro.despesa.placeholders.valor')} value={formulario.juros} onChangeText={(valor) => atualizarCampoMoeda('juros', valor)} keyboardType="numeric" estilo={{ marginBottom: 12 }} />}
      {renderCampoBloqueado(t('financeiro.despesa.campos.valorLiquido'), formulario.valorLiquido)}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.rateioAmigos'), formulario.amigosRateio.join(', ')) : <CampoSelect label={t('financeiro.despesa.campos.rateioAmigos')} placeholder={t('comum.acoes.selecionar')} options={amigosMock.map((nome) => ({ value: nome, label: nome }))} values={formulario.amigosRateio} multiple onChangeMultiple={(amigosRateio) => setFormulario((atual) => ({ ...atual, amigosRateio }))} />}
      {somenteLeitura ? renderCampoBloqueado(t('financeiro.despesa.campos.rateioTipoDespesa'), formulario.tiposRateio.map((item) => t(`financeiro.despesa.tipoDespesa.${item}`)).join(', ')) : <CampoSelect label={t('financeiro.despesa.campos.rateioTipoDespesa')} placeholder={t('comum.acoes.selecionar')} options={tiposDespesa.map((tipo) => ({ value: tipo, label: t(`financeiro.despesa.tipoDespesa.${tipo}`) }))} values={formulario.tiposRateio} multiple onChangeMultiple={(tiposRateio) => setFormulario((atual) => ({ ...atual, tiposRateio }))} />}
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






