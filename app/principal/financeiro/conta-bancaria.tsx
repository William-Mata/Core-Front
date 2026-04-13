import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  obterContaBancariaApi,
  listarContasBancariasDetalheApi,
  listarLancamentosContaBancariaApi,
  criarContaBancariaApi,
  atualizarContaBancariaApi,
  inativarContaBancariaApi,
  ativarContaBancariaApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { obterIconeBanco, obterImagemBanco, obterOpcoesBancos } from '../../../src/utils/icones';
import { calcularTotalLancamentos } from '../../../src/utils/calcularTotalLancamentos';

type StatusConta = 'ativa' | 'inativa';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao';

interface LogConta {
  id: number;
  data: string;
  acao: string;
  descricao: string;
}

interface MovimentoExtrato {
  id: number;
  transacaoId?: number;
  data: string;
  tipoTransacao: 'despesa' | 'receita' | 'reembolso';
  tipoOperacao: 'efetivacao' | 'estorno';
  descricao: string;
  tipoPagamento?: string;
  tipo: 'credito' | 'debito';
  valorAntesTransacao?: number;
  valor: number;
  valorDepoisTransacao?: number;
}

interface ContaBancaria {
  id: number;
  descricao: string;
  banco: string;
  referenciaBanco: string;
  agencia: string;
  numero: string;
  saldoInicial: number;
  saldoAtual: number;
  dataAbertura: string;
  status: StatusConta;
  extrato: MovimentoExtrato[];
  logs: LogConta[];
}

interface ContaForm {
  descricao: string;
  banco: string;
  agencia: string;
  numero: string;
  saldoInicial: string;
  saldoAtual: string;
  dataAbertura: string;
}

const transacoesPendentesPorConta: Record<string, number> = {};

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

function criarFormularioVazio(locale: string): ContaForm {
  return {
    descricao: '',
    banco: '',
    agencia: '',
    numero: '',
    saldoInicial: formatarMoedaParaInput(0, locale),
    saldoAtual: formatarMoedaParaInput(0, locale),
    dataAbertura: new Date().toISOString().split('T')[0],
  };
}

function normalizarStatusConta(valor: unknown): StatusConta {
  const status = String(valor ?? '').trim().toLowerCase();
  return status.includes('inativ') ? 'inativa' : 'ativa';
}

function mapearContaApi(item: RegistroFinanceiroApi, atual?: ContaBancaria): ContaBancaria {
  const logs = Array.isArray(item.logs)
    ? (item.logs as LogConta[])
    : (atual?.logs ?? [{ id: 1, data: new Date().toISOString().slice(0, 10), acao: 'IMPORTADA', descricao: 'Registro carregado da API.' }]);
  const extrato = Array.isArray(item.extrato)
    ? (item.extrato as MovimentoExtrato[])
    : (atual?.extrato ?? []);

  return {
    id: Number(item.id ?? atual?.id ?? 0),
    descricao: String(item.descricao ?? atual?.descricao ?? ''),
    banco: String(item.nomeBanco ?? item.banco ?? atual?.banco ?? ''),
    referenciaBanco: String(item.banco ?? item.nomeBanco ?? atual?.referenciaBanco ?? ''),
    agencia: String(item.agencia ?? atual?.agencia ?? ''),
    numero: String(item.numero ?? atual?.numero ?? ''),
    saldoInicial: Number(item.saldoInicial ?? atual?.saldoInicial ?? 0),
    saldoAtual: Number(item.saldoAtual ?? atual?.saldoAtual ?? item.saldoInicial ?? 0),
    dataAbertura: String(item.dataAbertura ?? item.dataLancamento ?? atual?.dataAbertura ?? ''),
    status: normalizarStatusConta(item.status ?? atual?.status),
    extrato,
    logs,
  };
}

function formatarCompetenciaParaApi(mes: string): string {
  const [ano = '', numeroMes = ''] = mes.split('-');
  if (!ano || !numeroMes) return mes;
  return `${numeroMes}/${ano}`;
}

function mapearMovimentoExtratoApi(item: RegistroFinanceiroApi, indice: number): MovimentoExtrato {
  const tipoTransacao = String(item.tipoTransacao ?? '').toLowerCase();
  const tipoOperacao = String(item.tipoOperacao ?? '').toLowerCase();
  const tipo: MovimentoExtrato['tipo'] = tipoTransacao.includes('despesa') ? 'debito' : 'credito';
  return {
    id: Number(item.id ?? item.transacaoId ?? indice + 1),
    transacaoId: item.transacaoId ? Number(item.transacaoId) : undefined,
    data: String(item.dataTransacao ?? item.data ?? '').slice(0, 10),
    tipoTransacao: tipoTransacao === 'receita' || tipoTransacao === 'reembolso' ? (tipoTransacao as 'receita' | 'reembolso') : 'despesa',
    tipoOperacao: tipoOperacao === 'estorno' ? 'estorno' : 'efetivacao',
    descricao: String(item.descricao ?? ''),
    tipoPagamento: item.tipoPagamento ? String(item.tipoPagamento) : undefined,
    tipo,
    valorAntesTransacao: item.valorAntesTransacao === null || item.valorAntesTransacao === undefined ? undefined : Number(item.valorAntesTransacao),
    valor: Math.abs(Number(item.valorTransacao ?? item.valor ?? 0)),
    valorDepoisTransacao: item.valorDepoisTransacao === null || item.valorDepoisTransacao === undefined ? undefined : Number(item.valorDepoisTransacao),
  };
}

export default function TelaContaBancaria() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [versaoConsulta, setVersaoConsulta] = useState(0);
  const [modoTela, setModoTela] = useState<ModoTela>('lista');
  const [contaSelecionadaId, setContaSelecionadaId] = useState<number | null>(null);
  const [contaExtratoAberta, setContaExtratoAberta] = useState<number | null>(null);
  const [mesPorConta, setMesPorConta] = useState<Record<number, string>>({});
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [formulario, setFormulario] = useState<ContaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(false);
  const opcoesBanco = useMemo(() => obterOpcoesBancos(), []);

  const contaSelecionada = contas.find((conta) => conta.id === contaSelecionadaId) ?? null;

  const contasFiltradas = useMemo(
    () =>
      contas.filter((conta) => {
        const bateId = !filtroAplicado.id || String(conta.id).includes(filtroAplicado.id);
        const termo = filtroAplicado.descricao.trim().toLowerCase();
        const bancoTraduzido = conta.banco.toLowerCase();
        const statusTraduzido = t(`financeiro.contaBancaria.status.${conta.status}`).toLowerCase();
        const bateDescricao =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          bancoTraduzido.includes(termo) ||
          conta.numero.toLowerCase().includes(termo) ||
          statusTraduzido.includes(termo);
        const bateData = estaDentroIntervalo(conta.dataAbertura, filtroAplicado.dataInicio, filtroAplicado.dataFim);
        return bateId && bateDescricao && bateData;
      }),
    [contas, filtroAplicado, t, versaoConsulta],
  );

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };

  const carregarContasApi = async (signal?: AbortSignal) => {
    setCarregando(true);
    try {
      const dados = await listarContasBancariasDetalheApi({
        signal,
        id: filtroAplicado.id.trim() || undefined,
        descricao: filtroAplicado.descricao.trim() || undefined,
      });
      setContas(dados.map((item) => mapearContaApi(item)));
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void carregarContasApi(controller.signal);
    return () => controller.abort();
  }, [filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, versaoConsulta]);

  const atualizarSaldoInicial = (valor: string) => {
    setCamposInvalidos((atual) => ({ ...atual, saldoInicial: false }));
    setFormulario((atual) => {
      const saldoInicial = aplicarMascaraMoeda(valor, locale);
      return { ...atual, saldoInicial, saldoAtual: saldoInicial };
    });
  };

  const preencherFormulario = (conta: ContaBancaria) => {
    setFormulario({
      descricao: conta.descricao,
      banco: conta.banco,
      agencia: conta.agencia,
      numero: conta.numero,
      saldoInicial: formatarMoedaParaInput(conta.saldoInicial, locale),
      saldoAtual: formatarMoedaParaInput(conta.saldoAtual, locale),
      dataAbertura: conta.dataAbertura,
    });
  };

  const carregarContaPorId = async (id: number) => {
    const contaAtual = contas.find((item) => item.id === id);
    try {
      const detalhe = await obterContaBancariaApi(id);
      const contaCompleta = mapearContaApi(detalhe, contaAtual);
      setContas((atual) => {
        const indice = atual.findIndex((item) => item.id === contaCompleta.id);
        if (indice < 0) return [...atual, contaCompleta];
        const proximo = [...atual];
        proximo[indice] = contaCompleta;
        return proximo;
      });
      setContaSelecionadaId(contaCompleta.id);
      preencherFormulario(contaCompleta);
      return contaCompleta;
    } catch {
      if (contaAtual) {
        setContaSelecionadaId(contaAtual.id);
        preencherFormulario(contaAtual);
        return contaAtual;
      }
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const carregarLancamentosConta = async (id: number, mes: string) => {
    try {
      const competencia = formatarCompetenciaParaApi(mes);
      const lancamentos = await listarLancamentosContaBancariaApi(id, { competencia });
      setContas((atual) =>
        atual.map((conta) =>
          conta.id === id
            ? {
                ...conta,
                extrato: lancamentos.map((item, indice) => mapearMovimentoExtratoApi(item, indice)),
              }
            : conta,
        ),
      );
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const resetarTela = () => {
    setModoTela('lista');
    setContaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
  };

  const abrirNovo = () => {
    setContaSelecionadaId(null);
    setFormulario(criarFormularioVazio(locale));
    setModoTela('novo');
  };

  const abrirEdicao = (conta: ContaBancaria) => {
    setModoTela('edicao');
    void carregarContaPorId(conta.id);
  };

  const abrirVisualizacao = (conta: ContaBancaria) => {
    setModoTela('visualizacao');
    void carregarContaPorId(conta.id);
  };

  const validarFormulario = () => {
    const invalidos: Record<string, boolean> = {};
    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!formulario.banco) invalidos.banco = true;
    if (!formulario.agencia.trim()) invalidos.agencia = true;
    if (!formulario.numero.trim()) invalidos.numero = true;
    if (!formulario.dataAbertura) invalidos.dataAbertura = true;
    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro( t('financeiro.contaBancaria.mensagens.obrigatorio'));
      return null;
    }

    const saldoInicial = converterTextoParaNumero(formulario.saldoInicial, locale);
    if (!saldoInicial && saldoInicial !== 0) {
      setCamposInvalidos((atual) => ({ ...atual, saldoInicial: true }));
      notificarErro( t('financeiro.contaBancaria.mensagens.saldoObrigatorio'));
      return null;
    }

    return {
      saldoInicial,
      saldoAtual: contaSelecionada ? contaSelecionada.saldoAtual : saldoInicial,
    };
  };

  const salvar = async () => {
    const base = validarFormulario();
    if (!base) return;

    const payloadBase = {
      descricao: formulario.descricao.trim(),
      banco: formulario.banco,
      agencia: formulario.agencia.trim(),
      numero: formulario.numero.trim(),
      saldoInicial: base.saldoInicial,
      saldoAtual: base.saldoAtual,
      dataAbertura: formulario.dataAbertura,
    };

    setCarregando(true);
    try {
      if (modoTela === 'novo') {
        await criarContaBancariaApi({ ...payloadBase, status: 'ativa' });
        notificarSucesso(t('financeiro.contaBancaria.mensagens.criada'));
      } else if (modoTela === 'edicao' && contaSelecionada) {
        await atualizarContaBancariaApi(contaSelecionada.id, payloadBase);
        notificarSucesso(t('financeiro.contaBancaria.mensagens.atualizada'));
      }
      await carregarContasApi();
      resetarTela();
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  const alternarStatusConta = async (conta: ContaBancaria, proximoStatus: StatusConta) => {
    if (proximoStatus === 'inativa') {
      const pendencias = transacoesPendentesPorConta[conta.descricao] || 0;
      if (pendencias > 0) {
        notificarErro( t('financeiro.contaBancaria.mensagens.transacoesPendentes'));
        return;
      }
    }

    setCarregando(true);
    try {
      if (proximoStatus === 'inativa') {
        await inativarContaBancariaApi(conta.id, {});
      } else {
        await ativarContaBancariaApi(conta.id);
      }
      await carregarContasApi();
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  const alternarExtratoConta = async (conta: ContaBancaria) => {
    if (contaExtratoAberta === conta.id) {
      setContaExtratoAberta(null);
      return;
    }
    const mes = obterMesSelecionado(conta.id);
    await carregarContaPorId(conta.id);
    await carregarLancamentosConta(conta.id, mes);
    setContaExtratoAberta(conta.id);
  };

  const obterMesSelecionado = (contaId: number) => mesPorConta[contaId] ?? new Date().toISOString().slice(0, 7);

  const formatarMesNavegacao = (mes: string) => {
    const [ano, numeroMes] = mes.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(ano, numeroMes - 1, 1));
  };

  const alterarMes = async (contaId: number, direcao: 'anterior' | 'proximo') => {
    const atual = obterMesSelecionado(contaId);
    const [ano, mes] = atual.split('-').map(Number);
    const dataBase = new Date(ano, mes - 1, 1);
    dataBase.setMonth(dataBase.getMonth() + (direcao === 'anterior' ? -1 : 1));
    const novoMes = `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, '0')}`;
    setMesPorConta((estadoAtual) => ({ ...estadoAtual, [contaId]: novoMes }));
    await carregarLancamentosConta(contaId, novoMes);
  };

  const obterMovimentosDoMes = (conta: ContaBancaria) => {
    const mesSelecionado = obterMesSelecionado(conta.id);
    return conta.extrato.filter((movimento) => movimento.data.startsWith(mesSelecionado));
  };

  const totalPeriodo = (conta: ContaBancaria) => calcularTotalLancamentos(obterMovimentosDoMes(conta));

  const renderIconeBanco = (banco: string) => {
    const imagemBanco = obterImagemBanco(banco);
    if (imagemBanco) {
      return <Image source={imagemBanco} style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6 }} resizeMode="contain" />;
    }
    return (
      <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 14 }}>
        {obterIconeBanco(banco) || '\uD83C\uDFE6'}
      </Text>
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

  const renderCampoBloqueadoBanco = (label: string, banco: string, referenciaBanco?: string) => {
    const referencia = (referenciaBanco || banco || '').trim();
    const imagemBanco = obterImagemBanco(referencia);
    const valor = (banco || '').trim();
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          {valor ? (
            imagemBanco
              ? <Image source={imagemBanco} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" />
              : <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 13 }}>{obterIconeBanco(referencia) || '\uD83C\uDFE6'}</Text>
          ) : null}
          <Text style={{ color: COLORS.textPrimary, fontSize: 14, flex: 1 }}>{valor || '-'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.contaBancaria.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoTela === 'lista' ? router.back() : resetarTela())}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {modoTela === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.contaBancaria.nova')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />
            <Botao titulo={t('comum.acoes.consultar')} onPress={consultarFiltros} tipo="secundario" estilo={{ marginBottom: 12 }} />

            <View>
              {contasFiltradas.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>{t('financeiro.contaBancaria.vazio')}</Text>
              ) : (
                contasFiltradas.map((conta) => (
                  <View key={conta.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {renderIconeBanco(conta.referenciaBanco || conta.banco)}
                        <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{conta.id} {conta.descricao}</Text>
                      </View>
                      <DistintivoStatus
                        rotulo={t(`financeiro.contaBancaria.status.${conta.status}`)}
                        corTexto={conta.status === 'ativa' ? COLORS.success : COLORS.warning}
                        corBorda={conta.status === 'ativa' ? '#86efac' : '#fde68a'}
                        corFundo={conta.status === 'ativa' ? '#14532d' : '#78350f'}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>{conta.banco} | {t('financeiro.contaBancaria.campos.agencia')}: {conta.agencia} | {t('financeiro.contaBancaria.campos.numero')}: {conta.numero}</Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{t('financeiro.contaBancaria.campos.saldoAtual')}: {formatarValorPorIdioma(conta.saldoAtual)}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                      <TouchableOpacity onPress={() => abrirVisualizacao(conta)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.visualizar')}</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => abrirEdicao(conta)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity>
                      {conta.status === 'ativa' ? <TouchableOpacity onPress={() => void alternarStatusConta(conta, 'inativa')} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.inativar')}</Text></TouchableOpacity> : null}
                      {conta.status === 'inativa' ? <TouchableOpacity onPress={() => void alternarStatusConta(conta, 'ativa')} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.ativar')}</Text></TouchableOpacity> : null}
                      <TouchableOpacity onPress={() => void alternarExtratoConta(conta)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.accent, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.extrato')}</Text></TouchableOpacity>
                    </View>

                    {contaExtratoAberta === conta.id ? (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, paddingTop: 10 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{t('financeiro.contaBancaria.extratoTitulo')}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => void alterarMes(conta.id, 'anterior')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2190'}</Text>
                          </TouchableOpacity>
                          <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{formatarMesNavegacao(obterMesSelecionado(conta.id))}</Text>
                          <TouchableOpacity onPress={() => void alterarMes(conta.id, 'proximo')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2192'}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('financeiro.contaBancaria.extratoTitulo')}</Text>
                          <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: '800' }}>{formatarValorPorIdioma(totalPeriodo(conta))}</Text>
                        </View>
                        {obterMovimentosDoMes(conta).length === 0 ? (
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('financeiro.contaBancaria.extratoVazio')}</Text>
                        ) : (
                          obterMovimentosDoMes(conta).map((movimento) => (
                            <View key={movimento.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: COLORS.textPrimary, fontWeight: '600', flex: 1 }}>{movimento.descricao}</Text>
                                <Text style={{ color: movimento.tipo === 'credito' ? COLORS.success : COLORS.error, fontWeight: '700' }}>
                                  {movimento.tipo === 'credito' ? '+' : '-'} {formatarValorPorIdioma(movimento.valor)}
                                </Text>
                              </View>
                              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{formatarDataPorIdioma(movimento.data)} | {t(`financeiro.contaBancaria.tipos.${movimento.tipo}`)}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {(modoTela === 'novo' || modoTela === 'edicao') ? (
          <>
            <CampoTexto label={t('financeiro.contaBancaria.campos.descricao')} placeholder={t('financeiro.contaBancaria.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.contaBancaria.campos.banco')} placeholder={t('comum.acoes.selecionar')} options={opcoesBanco.map((banco) => ({ value: banco, label: banco, icone: obterIconeBanco(banco), imagem: obterImagemBanco(banco) }))} value={formulario.banco} onChange={(banco) => { setCamposInvalidos((atual) => ({ ...atual, banco: false })); setFormulario((atual) => ({ ...atual, banco })); }} error={camposInvalidos.banco} />
            <CampoTexto label={t('financeiro.contaBancaria.campos.agencia')} placeholder={t('financeiro.contaBancaria.placeholders.agencia')} value={formulario.agencia} onChangeText={(agencia) => { setCamposInvalidos((atual) => ({ ...atual, agencia: false })); setFormulario((atual) => ({ ...atual, agencia })); }} error={camposInvalidos.agencia} estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.contaBancaria.campos.numero')} placeholder={t('financeiro.contaBancaria.placeholders.numero')} value={formulario.numero} onChangeText={(numero) => { setCamposInvalidos((atual) => ({ ...atual, numero: false })); setFormulario((atual) => ({ ...atual, numero })); }} error={camposInvalidos.numero} estilo={{ marginBottom: 12 }} />
            {modoTela === 'novo' ? <CampoTexto label={t('financeiro.contaBancaria.campos.saldoInicial')} placeholder={t('financeiro.contaBancaria.placeholders.saldoInicial')} value={formulario.saldoInicial} onChangeText={atualizarSaldoInicial} error={camposInvalidos.saldoInicial} keyboardType="numeric" estilo={{ marginBottom: 12 }} /> : renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoInicial'), formulario.saldoInicial)}
            {modoTela === 'edicao' ? renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoAtual'), formulario.saldoAtual) : null}
            <CampoData label={t('financeiro.contaBancaria.campos.dataAbertura')} placeholder={t('financeiro.contaBancaria.placeholders.dataAbertura')} value={formulario.dataAbertura} onChange={(dataAbertura) => { setCamposInvalidos((atual) => ({ ...atual, dataAbertura: false })); setFormulario((atual) => ({ ...atual, dataAbertura })); }} error={camposInvalidos.dataAbertura} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1 }} />
	              <Botao titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={() => void salvar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && contaSelecionada ? (
          <>
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.descricao'), contaSelecionada.descricao)}
            {renderCampoBloqueadoBanco(t('financeiro.contaBancaria.campos.banco'), contaSelecionada.banco, contaSelecionada.referenciaBanco)}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.agencia'), contaSelecionada.agencia)}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.numero'), contaSelecionada.numero)}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoInicial'), formatarValorPorIdioma(contaSelecionada.saldoInicial))}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoAtual'), formatarValorPorIdioma(contaSelecionada.saldoAtual))}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.dataAbertura'), formatarDataPorIdioma(contaSelecionada.dataAbertura))}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.status'), t(`financeiro.contaBancaria.status.${contaSelecionada.status}`))}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('financeiro.contaBancaria.logs.titulo')}</Text>
              {contaSelecionada.logs.map((log) => (
                <View key={log.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{log.acao}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{log.descricao}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{formatarDataPorIdioma(log.data)}</Text>
                </View>
              ))}
            </View>
            <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}









