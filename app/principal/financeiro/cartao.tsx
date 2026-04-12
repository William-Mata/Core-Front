import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  obterCartaoApi,
  listarCartoesDetalheApi,
  listarLancamentosCartaoApi,
  criarCartaoApi,
  atualizarCartaoApi,
  inativarCartaoApi,
  ativarCartaoApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { obterIconeBandeiraCartao, obterImagemBandeiraCartao, obterOpcoesBandeirasCartao } from '../../../src/utils/icones';
import { calcularTotalLancamentos } from '../../../src/utils/calcularTotalLancamentos';

type TipoCartao = 'credito' | 'debito';
type StatusCartao = 'ativo' | 'inativo';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao';

interface LogCartao {
  id: number;
  data: string;
  acao: string;
  descricao: string;
}

interface LancamentoCartao {
  id: number;
  transacaoId?: number;
  data: string;
  tipoTransacao: 'despesa' | 'receita' | 'reembolso';
  tipoOperacao: 'efetivacao' | 'estorno';
  descricao: string;
  tipoPagamento?: string;
  valorAntesTransacao?: number;
  valor: number;
  valorDepoisTransacao?: number;
}

interface Cartao {
  id: number;
  descricao: string;
  bandeira: string;
  referenciaBandeira: string;
  tipo: TipoCartao;
  limite: number;
  saldoDisponivel: number;
  diaVencimento: string;
  dataVencimentoCartao: string;
  status: StatusCartao;
  lancamentos: LancamentoCartao[];
  logs: LogCartao[];
}

interface CartaoForm {
  descricao: string;
  bandeira: string;
  tipo: TipoCartao;
  limite: string;
  saldoDisponivel: string;
  diaVencimento: string;
  dataVencimentoCartao: string;
}

const tiposCartao: TipoCartao[] = ['credito', 'debito'];

const transacoesPendentesPorCartao: Record<string, number> = {};

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

function criarFormularioVazio(locale: string): CartaoForm {
  const hoje = new Date().toISOString().split('T')[0];
  return {
    descricao: '',
    bandeira: '',
    tipo: 'credito',
    limite: formatarMoedaParaInput(0, locale),
    saldoDisponivel: formatarMoedaParaInput(0, locale),
    diaVencimento: hoje,
    dataVencimentoCartao: hoje,
  };
}

function tipoExigeVencimento(tipo: TipoCartao) {
  return tipo === 'credito';
}

function normalizarTipoCartao(valor: unknown): TipoCartao {
  const tipo = String(valor ?? '').trim().toLowerCase();
  return tipo.includes('debi') ? 'debito' : 'credito';
}

function normalizarStatusCartao(valor: unknown): StatusCartao {
  const status = String(valor ?? '').trim().toLowerCase();
  return status.includes('inativ') ? 'inativo' : 'ativo';
}

function mapearCartaoApi(item: RegistroFinanceiroApi, atual?: Cartao): Cartao {
  const tipo = normalizarTipoCartao(item.tipo ?? atual?.tipo);
  const status = normalizarStatusCartao(item.status ?? atual?.status);
  const logs = Array.isArray(item.logs)
    ? (item.logs as LogCartao[])
    : (atual?.logs ?? [{ id: 1, data: new Date().toISOString().slice(0, 10), acao: 'IMPORTADO', descricao: 'Registro carregado da API.' }]);
  const lancamentos = Array.isArray(item.lancamentos)
    ? (item.lancamentos as LancamentoCartao[])
    : (atual?.lancamentos ?? []);

  return {
    id: Number(item.id ?? atual?.id ?? 0),
    descricao: String(item.descricao ?? atual?.descricao ?? ''),
    bandeira: String(item.nomeBandeira ?? item.bandeira ?? atual?.bandeira ?? ''),
    referenciaBandeira: String(item.bandeira ?? item.nomeBandeira ?? atual?.referenciaBandeira ?? ''),
    tipo,
    limite: Number(item.limite ?? atual?.limite ?? 0),
    saldoDisponivel: Number(item.saldoDisponivel ?? item.limiteDisponivel ?? atual?.saldoDisponivel ?? 0),
    diaVencimento: String(item.diaVencimento ?? atual?.diaVencimento ?? ''),
    dataVencimentoCartao: String(item.dataVencimentoCartao ?? item.dataVencimento ?? atual?.dataVencimentoCartao ?? ''),
    status,
    lancamentos,
    logs,
  };
}

function formatarCompetenciaParaApi(mes: string): string {
  const [ano = '', numeroMes = ''] = mes.split('-');
  if (!ano || !numeroMes) return mes;
  return `${numeroMes}/${ano}`;
}

function mapearLancamentoCartaoApi(item: RegistroFinanceiroApi, indice: number): LancamentoCartao {
  const valorBruto = Number(item.valorTransacao ?? item.valor ?? 0);
  const tipoTransacaoBruto = String(item.tipoTransacao ?? '').toLowerCase();
  const tipoOperacaoBruto = String(item.tipoOperacao ?? '').toLowerCase();
  return {
    id: Number(item.id ?? item.transacaoId ?? indice + 1),
    transacaoId: item.transacaoId ? Number(item.transacaoId) : undefined,
    data: String(item.dataTransacao ?? item.data ?? '').slice(0, 10),
    tipoTransacao: tipoTransacaoBruto === 'receita' || tipoTransacaoBruto === 'reembolso' ? (tipoTransacaoBruto as 'receita' | 'reembolso') : 'despesa',
    tipoOperacao: tipoOperacaoBruto === 'estorno' ? 'estorno' : 'efetivacao',
    descricao: String(item.descricao ?? ''),
    tipoPagamento: item.tipoPagamento ? String(item.tipoPagamento) : undefined,
    valorAntesTransacao: item.valorAntesTransacao === null || item.valorAntesTransacao === undefined ? undefined : Number(item.valorAntesTransacao),
    valor: Math.abs(valorBruto),
    valorDepoisTransacao: item.valorDepoisTransacao === null || item.valorDepoisTransacao === undefined ? undefined : Number(item.valorDepoisTransacao),
  };
}

export default function TelaCartao() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [versaoConsulta, setVersaoConsulta] = useState(0);
  const [modoTela, setModoTela] = useState<ModoTela>('lista');
  const [cartaoSelecionadoId, setCartaoSelecionadoId] = useState<number | null>(null);
  const [cartaoDetalheAberto, setCartaoDetalheAberto] = useState<number | null>(null);
  const [mesPorCartao, setMesPorCartao] = useState<Record<number, string>>({});
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [formulario, setFormulario] = useState<CartaoForm>(() => criarFormularioVazio(locale));
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const opcoesBandeiras = useMemo(() => obterOpcoesBandeirasCartao(), []);

  const cartaoSelecionado = cartoes.find((item) => item.id === cartaoSelecionadoId) ?? null;

  const cartoesFiltrados = useMemo(
    () =>
      cartoes.filter((cartao) => {
        const bateId = !filtroAplicado.id || String(cartao.id).includes(filtroAplicado.id);
        const termo = filtroAplicado.descricao.trim().toLowerCase();
        const tipoTraduzido = t(`financeiro.cartao.tipos.${cartao.tipo}`).toLowerCase();
        const statusTraduzido = t(`financeiro.cartao.status.${cartao.status}`).toLowerCase();
        const bateDescricao =
          !termo ||
          cartao.descricao.toLowerCase().includes(termo) ||
          cartao.bandeira.toLowerCase().includes(termo) ||
          tipoTraduzido.includes(termo) ||
          statusTraduzido.includes(termo);
        const baseDataFiltro = cartao.dataVencimentoCartao || cartao.logs[0]?.data || '';
        const bateData = estaDentroIntervalo(baseDataFiltro, filtroAplicado.dataInicio, filtroAplicado.dataFim);
        return bateId && bateDescricao && bateData;
      }),
    [cartoes, filtroAplicado, t, versaoConsulta],
  );

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };

  const carregarCartoesApi = async (signal?: AbortSignal) => {
    setCarregando(true);
    try {
      const dados = await listarCartoesDetalheApi({
        signal,
        id: filtroAplicado.id.trim() || undefined,
        descricao: filtroAplicado.descricao.trim() || undefined,
      });
      setCartoes(dados.map((item) => mapearCartaoApi(item)));
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void carregarCartoesApi(controller.signal);
    return () => controller.abort();
  }, [filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, versaoConsulta]);

  const renderCampoBloqueado = (label: string, valor: string) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{valor || '-'}</Text>
      </View>
    </View>
  );

  const resetarTela = () => {
    setModoTela('lista');
    setCartaoSelecionadoId(null);
    setFormulario(criarFormularioVazio(locale));
    setCamposInvalidos({});
  };

  const preencherFormulario = (cartao: Cartao) => {
    setFormulario({
      descricao: cartao.descricao,
      bandeira: cartao.bandeira,
      tipo: cartao.tipo,
      limite: formatarMoedaParaInput(cartao.limite, locale),
      saldoDisponivel: formatarMoedaParaInput(cartao.saldoDisponivel, locale),
      diaVencimento: cartao.diaVencimento,
      dataVencimentoCartao: cartao.dataVencimentoCartao,
    });
    setCamposInvalidos({});
  };

  const carregarCartaoPorId = async (id: number) => {
    const cartaoAtual = cartoes.find((item) => item.id === id);
    try {
      const detalhe = await obterCartaoApi(id);
      const cartaoCompleto = mapearCartaoApi(detalhe, cartaoAtual);
      setCartoes((atual) => {
        const indice = atual.findIndex((item) => item.id === cartaoCompleto.id);
        if (indice < 0) return [...atual, cartaoCompleto];
        const proximo = [...atual];
        proximo[indice] = cartaoCompleto;
        return proximo;
      });
      setCartaoSelecionadoId(cartaoCompleto.id);
      preencherFormulario(cartaoCompleto);
      return cartaoCompleto;
    } catch {
      if (cartaoAtual) {
        setCartaoSelecionadoId(cartaoAtual.id);
        preencherFormulario(cartaoAtual);
        return cartaoAtual;
      }
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const carregarLancamentosCartao = async (id: number, mes: string) => {
    try {
      const competencia = formatarCompetenciaParaApi(mes);
      const lancamentos = await listarLancamentosCartaoApi(id, { competencia });
      setCartoes((atual) =>
        atual.map((cartao) =>
          cartao.id === id
            ? {
                ...cartao,
                lancamentos: lancamentos.map((item, indice) => mapearLancamentoCartaoApi(item, indice)),
              }
            : cartao,
        ),
      );
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const atualizarTipoFormulario = (tipo: TipoCartao) => {
    setCamposInvalidos((atual) => ({
      ...atual,
      tipo: false,
      limite: false,
      diaVencimento: false,
      dataVencimentoCartao: false,
    }));
    setFormulario((atual) => ({
      ...atual,
      tipo,
      limite: tipoExigeVencimento(tipo) ? atual.limite : formatarMoedaParaInput(0, locale),
      diaVencimento: tipoExigeVencimento(tipo) ? (atual.diaVencimento || new Date().toISOString().split('T')[0]) : '',
      dataVencimentoCartao: tipoExigeVencimento(tipo) ? (atual.dataVencimentoCartao || new Date().toISOString().split('T')[0]) : '',
    }));
  };

  const abrirNovo = () => {
    setCartaoSelecionadoId(null);
    setFormulario(criarFormularioVazio(locale));
    setCamposInvalidos({});
    setModoTela('novo');
  };

  const abrirEdicao = (cartao: Cartao) => {
    setModoTela('edicao');
    void carregarCartaoPorId(cartao.id);
  };

  const abrirVisualizacao = (cartao: Cartao) => {
    setModoTela('visualizacao');
    void carregarCartaoPorId(cartao.id);
  };

  const validarFormulario = () => {
    const invalidos: Record<string, boolean> = {};
    if (!formulario.descricao.trim()) invalidos.descricao = true;
    if (!formulario.bandeira) invalidos.bandeira = true;
    if (!formulario.tipo) invalidos.tipo = true;

    const limite = converterTextoParaNumero(formulario.limite, locale);
    const saldoDisponivel = converterTextoParaNumero(formulario.saldoDisponivel, locale);
    if (modoTela === 'novo' && !saldoDisponivel && saldoDisponivel !== 0) invalidos.saldoDisponivel = true;

    if (tipoExigeVencimento(formulario.tipo)) {
      if (!limite && limite !== 0) invalidos.limite = true;
      if (!formulario.diaVencimento) invalidos.diaVencimento = true;
      if (!formulario.dataVencimentoCartao) invalidos.dataVencimentoCartao = true;
    }

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos((atual) => ({ ...atual, ...invalidos }));
      notificarErro(
        tipoExigeVencimento(formulario.tipo)
          ? t('financeiro.cartao.mensagens.obrigatorioCredito')
          : t('financeiro.cartao.mensagens.obrigatorioDebito'),
      );
      return null;
    }

    return {
      limite: tipoExigeVencimento(formulario.tipo) ? limite : 0,
      saldoDisponivel: modoTela === 'edicao' && cartaoSelecionado ? cartaoSelecionado.saldoDisponivel : saldoDisponivel,
    };
  };

  const salvar = async () => {
    const base = validarFormulario();
    if (!base) return;

    const diaVencimento = tipoExigeVencimento(formulario.tipo) ? formulario.diaVencimento : '';
    const dataVencimentoCartao = tipoExigeVencimento(formulario.tipo) ? formulario.dataVencimentoCartao : '';
    const payloadBase = {
      descricao: formulario.descricao.trim(),
      bandeira: formulario.bandeira,
      tipo: formulario.tipo,
      limite: base.limite,
      saldoDisponivel: base.saldoDisponivel,
      diaVencimento,
      dataVencimentoCartao,
    };

    setCarregando(true);
    try {
      if (modoTela === 'novo') {
        await criarCartaoApi({ ...payloadBase, status: 'ativo' });
        notificarSucesso(t('financeiro.cartao.mensagens.criado'));
      } else if (modoTela === 'edicao' && cartaoSelecionado) {
        await atualizarCartaoApi(cartaoSelecionado.id, payloadBase);
        notificarSucesso(t('financeiro.cartao.mensagens.atualizado'));
      }
      await carregarCartoesApi();
      resetarTela();
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  const alternarStatusCartao = async (cartao: Cartao, proximoStatus: StatusCartao) => {
    if (proximoStatus === 'inativo') {
      const pendencias = transacoesPendentesPorCartao[cartao.descricao] || 0;
      if (pendencias > 0) {
        notificarErro( t('financeiro.cartao.mensagens.transacoesPendentes'));
        return;
      }
    }

    setCarregando(true);
    try {
      if (proximoStatus === 'inativo') {
        await inativarCartaoApi(cartao.id, {});
      } else {
        await ativarCartaoApi(cartao.id);
      }
      await carregarCartoesApi();
    } catch {
      notificarErro(t('comum.erro'));
    } finally {
      setCarregando(false);
    }
  };

  const alternarDetalheCartao = async (cartao: Cartao) => {
    if (cartaoDetalheAberto === cartao.id) {
      setCartaoDetalheAberto(null);
      return;
    }
    const mes = obterMesSelecionado(cartao.id);
    await carregarCartaoPorId(cartao.id);
    await carregarLancamentosCartao(cartao.id, mes);
    setCartaoDetalheAberto(cartao.id);
  };

  const obterMesSelecionado = (cartaoId: number) => mesPorCartao[cartaoId] ?? new Date().toISOString().slice(0, 7);

  const formatarMesNavegacao = (mes: string) => {
    const [ano, numeroMes] = mes.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(ano, numeroMes - 1, 1));
  };

  const alterarMes = async (cartaoId: number, direcao: 'anterior' | 'proximo') => {
    const atual = obterMesSelecionado(cartaoId);
    const [ano, mes] = atual.split('-').map(Number);
    const dataBase = new Date(ano, mes - 1, 1);
    dataBase.setMonth(dataBase.getMonth() + (direcao === 'anterior' ? -1 : 1));
    const novoMes = `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, '0')}`;
    setMesPorCartao((estadoAtual) => ({ ...estadoAtual, [cartaoId]: novoMes }));
    await carregarLancamentosCartao(cartaoId, novoMes);
  };

  const obterLancamentosDoMes = (cartao: Cartao) => {
    const mesSelecionado = obterMesSelecionado(cartao.id);
    return cartao.lancamentos.filter((lancamento) => lancamento.data.startsWith(mesSelecionado));
  };

  const totalPeriodo = (cartao: Cartao) => calcularTotalLancamentos(obterLancamentosDoMes(cartao));

  const renderIconeBandeira = (bandeira: string) => {
    const imagemBandeira = obterImagemBandeiraCartao(bandeira);
    if (imagemBandeira) {
      return <Image source={imagemBandeira} style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6 }} resizeMode="contain" />;
    }
    return (
      <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 14 }}>
        {obterIconeBandeiraCartao(bandeira) || '\uD83D\uDCB3'}
      </Text>
    );
  };

  const renderCampoBloqueadoBandeira = (label: string, bandeira: string, referenciaBandeira?: string) => {
    const referencia = (referenciaBandeira || bandeira || '').trim();
    const imagemBandeira = obterImagemBandeiraCartao(referencia);
    const valor = (bandeira || '').trim();
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          {valor ? (
            imagemBandeira
              ? <Image source={imagemBandeira} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" />
              : <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 13 }}>{obterIconeBandeiraCartao(referencia) || '\uD83D\uDCB3'}</Text>
          ) : null}
          <Text style={{ color: COLORS.textPrimary, fontSize: 14, flex: 1 }}>{valor || '-'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.cartao.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoTela === 'lista' ? router.back() : resetarTela())}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {modoTela === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.cartao.novo')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />
            <Botao titulo={t('comum.acoes.consultar')} onPress={consultarFiltros} tipo="secundario" estilo={{ marginBottom: 12 }} />

            <View>
              {cartoesFiltrados.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>{t('financeiro.cartao.vazio')}</Text>
              ) : (
                cartoesFiltrados.map((cartao) => (
                  <View key={cartao.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {renderIconeBandeira(cartao.referenciaBandeira || cartao.bandeira)}
                        <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{cartao.id} {cartao.descricao}</Text>
                      </View>
                      <Text style={{ color: cartao.status === 'ativo' ? COLORS.success : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{t(`financeiro.cartao.status.${cartao.status}`)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>
                        {cartao.bandeira} | {t(`financeiro.cartao.tipos.${cartao.tipo}`)}
                      </Text>
                    </View>
                    {cartao.tipo === 'credito' ? (
                      <>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                          {t('financeiro.cartao.campos.limite')}: {formatarValorPorIdioma(cartao.limite)} | {t('financeiro.cartao.campos.saldoDisponivel')}: {formatarValorPorIdioma(cartao.saldoDisponivel)}
                        </Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                          {t('financeiro.cartao.campos.diaVencimento')}: {formatarDataPorIdioma(cartao.diaVencimento)} | {t('financeiro.cartao.campos.dataVencimentoCartao')}: {formatarDataPorIdioma(cartao.dataVencimentoCartao)}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                        {t('financeiro.cartao.campos.saldoDisponivel')}: {formatarValorPorIdioma(cartao.saldoDisponivel)}
                      </Text>
                    )}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                      <TouchableOpacity onPress={() => abrirVisualizacao(cartao)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.visualizar')}</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => abrirEdicao(cartao)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity>
                      {cartao.status === 'ativo' ? <TouchableOpacity onPress={() => void alternarStatusCartao(cartao, 'inativo')} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.cartao.acoes.inativar')}</Text></TouchableOpacity> : null}
                      {cartao.status === 'inativo' ? <TouchableOpacity onPress={() => void alternarStatusCartao(cartao, 'ativo')} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.cartao.acoes.ativar')}</Text></TouchableOpacity> : null}
                      <TouchableOpacity onPress={() => void alternarDetalheCartao(cartao)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.accent, fontSize: 12 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.acoes.fatura') : t('financeiro.cartao.acoes.extrato')}</Text></TouchableOpacity>
                    </View>

                    {cartaoDetalheAberto === cartao.id ? (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, paddingTop: 10 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.faturaTitulo') : t('financeiro.cartao.extratoTitulo')}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => void alterarMes(cartao.id, 'anterior')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2190'}</Text>
                          </TouchableOpacity>
                          <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{formatarMesNavegacao(obterMesSelecionado(cartao.id))}</Text>
                          <TouchableOpacity onPress={() => void alterarMes(cartao.id, 'proximo')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2192'}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.totalFatura') : t('financeiro.cartao.totalExtrato')}</Text>
                          <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: '800' }}>{formatarValorPorIdioma(totalPeriodo(cartao))}</Text>
                        </View>
                        {obterLancamentosDoMes(cartao).length === 0 ? (
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.faturaVazia') : t('financeiro.cartao.extratoVazio')}</Text>
                        ) : (
                          obterLancamentosDoMes(cartao).map((lancamento) => (
                            <View key={lancamento.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: COLORS.textPrimary, fontWeight: '600', flex: 1 }}>{lancamento.descricao}</Text>
                                <Text style={{ color: lancamento.tipoOperacao === 'estorno' || lancamento.tipoTransacao !== 'despesa' ? COLORS.success : COLORS.error, fontWeight: '700' }}>
                                  {(lancamento.tipoOperacao === 'estorno' || lancamento.tipoTransacao !== 'despesa') ? '+' : '-'} {formatarValorPorIdioma(lancamento.valor)}
                                </Text>
                              </View>
                              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                                {formatarDataPorIdioma(lancamento.data)} | {lancamento.tipoTransacao} | {lancamento.tipoOperacao}
                              </Text>
                              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                                {lancamento.tipoPagamento || '-'} | {formatarValorPorIdioma(lancamento.valorAntesTransacao ?? 0)} {'->'} {formatarValorPorIdioma(lancamento.valorDepoisTransacao ?? 0)}
                              </Text>
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
            <CampoTexto label={t('financeiro.cartao.campos.descricao')} placeholder={t('financeiro.cartao.placeholders.descricao')} value={formulario.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setFormulario((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} estilo={{ marginBottom: 12 }} />
            <CampoSelect label={t('financeiro.cartao.campos.bandeira')} placeholder={t('comum.acoes.selecionar')} options={opcoesBandeiras.map((bandeira) => ({ value: bandeira, label: bandeira, icone: obterIconeBandeiraCartao(bandeira), imagem: obterImagemBandeiraCartao(bandeira) }))} value={formulario.bandeira} onChange={(bandeira) => { setCamposInvalidos((atual) => ({ ...atual, bandeira: false })); setFormulario((atual) => ({ ...atual, bandeira })); }} error={camposInvalidos.bandeira} />
            <CampoSelect label={t('financeiro.cartao.campos.tipo')} placeholder={t('comum.acoes.selecionar')} options={tiposCartao.map((tipo) => ({ value: tipo, label: t(`financeiro.cartao.tipos.${tipo}`) }))} value={formulario.tipo} onChange={(tipo) => atualizarTipoFormulario(tipo as TipoCartao)} error={camposInvalidos.tipo} />
            {tipoExigeVencimento(formulario.tipo) ? <CampoTexto label={t('financeiro.cartao.campos.limite')} placeholder={t('financeiro.cartao.placeholders.valor')} value={formulario.limite} onChangeText={(limite) => { setCamposInvalidos((atual) => ({ ...atual, limite: false })); setFormulario((atual) => ({ ...atual, limite: aplicarMascaraMoeda(limite, locale) })); }} error={camposInvalidos.limite} keyboardType="numeric" estilo={{ marginBottom: 12 }} /> : null}
            {modoTela === 'novo'
              ? <CampoTexto label={t('financeiro.cartao.campos.saldoDisponivel')} placeholder={t('financeiro.cartao.placeholders.valor')} value={formulario.saldoDisponivel} onChangeText={(saldoDisponivel) => { setCamposInvalidos((atual) => ({ ...atual, saldoDisponivel: false })); setFormulario((atual) => ({ ...atual, saldoDisponivel: aplicarMascaraMoeda(saldoDisponivel, locale) })); }} error={camposInvalidos.saldoDisponivel} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
              : renderCampoBloqueado(t('financeiro.cartao.campos.saldoDisponivel'), formulario.saldoDisponivel)}
            {tipoExigeVencimento(formulario.tipo) ? <CampoData label={t('financeiro.cartao.campos.diaVencimento')} placeholder={t('financeiro.cartao.placeholders.data')} value={formulario.diaVencimento} onChange={(diaVencimento) => { setCamposInvalidos((atual) => ({ ...atual, diaVencimento: false })); setFormulario((atual) => ({ ...atual, diaVencimento })); }} error={camposInvalidos.diaVencimento} estilo={{ marginBottom: 12 }} /> : null}
            {tipoExigeVencimento(formulario.tipo) ? <CampoData label={t('financeiro.cartao.campos.dataVencimentoCartao')} placeholder={t('financeiro.cartao.placeholders.data')} value={formulario.dataVencimentoCartao} onChange={(dataVencimentoCartao) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimentoCartao: false })); setFormulario((atual) => ({ ...atual, dataVencimentoCartao })); }} error={camposInvalidos.dataVencimentoCartao} estilo={{ marginBottom: 20 }} /> : <View style={{ marginBottom: 20 }} />}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1 }} />
              <Botao titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={() => void salvar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && cartaoSelecionado ? (
          <>
            {renderCampoBloqueado(t('financeiro.cartao.campos.descricao'), cartaoSelecionado.descricao)}
            {renderCampoBloqueadoBandeira(t('financeiro.cartao.campos.bandeira'), cartaoSelecionado.bandeira, cartaoSelecionado.referenciaBandeira)}
            {renderCampoBloqueado(t('financeiro.cartao.campos.tipo'), t(`financeiro.cartao.tipos.${cartaoSelecionado.tipo}`))}
            {cartaoSelecionado.tipo === 'credito' ? renderCampoBloqueado(t('financeiro.cartao.campos.limite'), formatarValorPorIdioma(cartaoSelecionado.limite)) : null}
            {renderCampoBloqueado(t('financeiro.cartao.campos.saldoDisponivel'), formatarValorPorIdioma(cartaoSelecionado.saldoDisponivel))}
            {cartaoSelecionado.tipo === 'credito' ? renderCampoBloqueado(t('financeiro.cartao.campos.diaVencimento'), formatarDataPorIdioma(cartaoSelecionado.diaVencimento)) : null}
            {cartaoSelecionado.tipo === 'credito' ? renderCampoBloqueado(t('financeiro.cartao.campos.dataVencimentoCartao'), formatarDataPorIdioma(cartaoSelecionado.dataVencimentoCartao)) : null}
            {renderCampoBloqueado(t('financeiro.cartao.campos.status'), t(`financeiro.cartao.status.${cartaoSelecionado.status}`))}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('financeiro.cartao.logs.titulo')}</Text>
              {cartaoSelecionado.logs.map((log) => (
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







