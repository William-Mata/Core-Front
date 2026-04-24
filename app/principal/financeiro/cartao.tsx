import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { ValorMonetarioAnimado } from '../../../src/componentes/comuns/ValorMonetarioAnimado';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  obterCartaoApi,
  efetivarFaturaCartaoApi,
  estornarFaturaCartaoApi,
  listarContasBancariasApi,
  listarCartoesDetalheApi,
  listarDetalhesFaturasCartaoApi,
  listarLancamentosCartaoApi,
  criarCartaoApi,
  atualizarCartaoApi,
  inativarCartaoApi,
  ativarCartaoApi,
  type ContaBancariaOpcaoApi,
  type FaturaCartaoDetalheApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { COLORS } from '../../../src/styles/variables';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { obterIconeBandeiraCartao, obterImagemBandeiraCartao, obterOpcoesBandeirasCartao } from '../../../src/utils/icones';
import { calcularTotalLancamentos } from '../../../src/utils/calcularTotalLancamentos';
import { todasTransacoesFaturaEfetivadas } from '../../../src/utils/acoesFaturaCartao';

type TipoCartao = 'credito' | 'debito';
type StatusCartao = 'ativo' | 'inativo';
type StatusFaturaCartao = 'aberta' | 'fechada' | 'efetivada' | 'estornada' | 'vencida';
type ModoTela = 'lista' | 'novo' | 'edicao' | 'visualizacao';
type TipoAcaoFaturaCartao = 'efetivar' | 'estornar';

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
  dataLancamento?: string;
  tipoTransacao: 'despesa' | 'receita' | 'reembolso';
  tipoOperacao: 'efetivacao' | 'estorno';
  descricao: string;
  status?: string;
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
  faturaCartaoId?: number;
  statusFatura?: StatusFaturaCartao;
  valorTotalFatura?: number;
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

interface AcaoFaturaCartaoEmEdicao {
  cartaoId: number;
  tipo: TipoAcaoFaturaCartao;
}

interface FormularioAcaoFaturaCartao {
  dataEfetivacao: string;
  contaBancariaId: string;
  valorTotal: string;
  valorEfetivacao: string;
  observacaoEfetivacao: string;
  dataEstorno: string;
  observacaoEstorno: string;
  ocultarDoHistorico: boolean;
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

function obterDataAtualIso() {
  const hoje = new Date();
  const ano = String(hoje.getFullYear());
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function obterDataHoraAtualIso() {
  const agora = new Date();
  const ano = String(agora.getFullYear());
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const segundo = String(agora.getSeconds()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
}

function criarFormularioAcaoFaturaCartao(valorTotal: number, locale: string): FormularioAcaoFaturaCartao {
  return {
    dataEfetivacao: obterDataHoraAtualIso(),
    contaBancariaId: '',
    valorTotal: formatarMoedaParaInput(valorTotal, locale),
    valorEfetivacao: formatarMoedaParaInput(valorTotal, locale),
    observacaoEfetivacao: '',
    dataEstorno: obterDataAtualIso(),
    observacaoEstorno: '',
    ocultarDoHistorico: true,
  };
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
    faturaCartaoId: atual?.faturaCartaoId,
    statusFatura: atual?.statusFatura,
    valorTotalFatura: atual?.valorTotalFatura,
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
  const dataLancamento = String(item.dataLancamento ?? item.dataTransacao ?? item.data ?? '');
  return {
    id: Number(item.id ?? item.transacaoId ?? indice + 1),
    transacaoId: item.transacaoId ? Number(item.transacaoId) : undefined,
    data: dataLancamento.slice(0, 10),
    dataLancamento: dataLancamento || undefined,
    tipoTransacao: tipoTransacaoBruto === 'receita' || tipoTransacaoBruto === 'reembolso' ? (tipoTransacaoBruto as 'receita' | 'reembolso') : 'despesa',
    tipoOperacao: tipoOperacaoBruto === 'estorno' ? 'estorno' : 'efetivacao',
    descricao: String(item.descricao ?? ''),
    status: item.status ? String(item.status) : undefined,
    tipoPagamento: item.tipoPagamento ? String(item.tipoPagamento) : undefined,
    valorAntesTransacao: item.valorAntesTransacao === null || item.valorAntesTransacao === undefined ? undefined : Number(item.valorAntesTransacao),
    valor: Math.abs(valorBruto),
    valorDepoisTransacao: item.valorDepoisTransacao === null || item.valorDepoisTransacao === undefined ? undefined : Number(item.valorDepoisTransacao),
  };
}

function normalizarStatusFaturaCartao(status: unknown): StatusFaturaCartao {
  const numeroStatus = Number(status);
  if (Number.isFinite(numeroStatus)) {
    if (numeroStatus === 5) return 'vencida';
    if (numeroStatus === 4) return 'estornada';
    if (numeroStatus === 3) return 'efetivada';
    if (numeroStatus === 2) return 'fechada';
    if (numeroStatus === 1) return 'aberta';
  }

  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('vencid')) return 'vencida';
  if (valor.includes('estorn')) return 'estornada';
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('fech')) return 'fechada';
  return 'aberta';
}

function statusFaturaComRegraVencimento(
  status: StatusFaturaCartao,
  dataVencimentoCartao: string,
): StatusFaturaCartao {
  if (status === 'efetivada') return status;
  const dataVencimento = String(dataVencimentoCartao ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) return status;
  if (dataVencimento < obterDataAtualIso()) return 'vencida';
  return status;
}

function selecionarDetalheFaturaCartao(
  detalhes: FaturaCartaoDetalheApi[],
  cartaoId: number,
): FaturaCartaoDetalheApi | null {
  const detalhesCartao = detalhes.filter((detalhe) => detalhe.cartaoId === cartaoId);
  if (detalhesCartao.length === 0) return null;
  return [...detalhesCartao].sort((a, b) => b.faturaCartaoId - a.faturaCartaoId)[0] ?? null;
}

function extrairCodigoErroApi(erro: unknown): string {
  if (!erro || typeof erro !== 'object') return '';
  const erroTipado = erro as { response?: { data?: unknown } };
  const dados = erroTipado.response?.data;
  if (!dados || typeof dados !== 'object') return '';
  const codigo = (dados as { code?: unknown }).code;
  return String(codigo ?? '').trim().toLowerCase();
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
  const [formularioAcaoFatura, setFormularioAcaoFatura] = useState<FormularioAcaoFaturaCartao>(() => criarFormularioAcaoFaturaCartao(0, locale));
  const [camposInvalidosAcaoFatura, setCamposInvalidosAcaoFatura] = useState<Record<string, boolean>>({});
  const [acaoFaturaEmEdicao, setAcaoFaturaEmEdicao] = useState<AcaoFaturaCartaoEmEdicao | null>(null);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancariaOpcaoApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [deveAnimarValoresIniciais, setDeveAnimarValoresIniciais] = useState(true);
  const primeiraConsultaConcluida = useRef(false);
  const timeoutAnimacaoInicial = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opcoesBandeiras = useMemo(() => obterOpcoesBandeirasCartao(), []);
  const opcoesContasBancarias = useMemo(
    () =>
      contasBancarias.map((conta) => ({
        value: String(conta.id),
        label: conta.banco ? `${conta.nome} - ${conta.banco}` : conta.nome,
      })),
    [contasBancarias],
  );

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
      if (!primeiraConsultaConcluida.current) {
        primeiraConsultaConcluida.current = true;
        timeoutAnimacaoInicial.current = setTimeout(() => {
          setDeveAnimarValoresIniciais(false);
          timeoutAnimacaoInicial.current = null;
        }, 700);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void carregarCartoesApi(controller.signal);
    return () => controller.abort();
  }, [filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, versaoConsulta]);

  useEffect(() => () => {
    if (!timeoutAnimacaoInicial.current) return;
    clearTimeout(timeoutAnimacaoInicial.current);
    timeoutAnimacaoInicial.current = null;
  }, []);

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
    setAcaoFaturaEmEdicao(null);
    setCamposInvalidosAcaoFatura({});
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
      const cartaoAtual = cartoes.find((item) => item.id === id);
      if (cartaoAtual?.tipo === 'credito') {
        const detalhesFatura = await listarDetalhesFaturasCartaoApi({
          cartaoId: id,
          competencia: mes,
        });
        const detalheSelecionado = selecionarDetalheFaturaCartao(detalhesFatura, id);
        const lancamentos = detalheSelecionado
          ? detalheSelecionado.transacoes.map((item, indice) => mapearLancamentoCartaoApi(item, indice))
          : [];
        const valorTotalFatura = detalheSelecionado?.valorTotal ?? calcularTotalLancamentos(lancamentos);
        const statusFaturaNormalizado = normalizarStatusFaturaCartao(detalheSelecionado?.status);
        const statusFatura = statusFaturaComRegraVencimento(statusFaturaNormalizado, cartaoAtual?.dataVencimentoCartao ?? '');
        setCartoes((atual) =>
          atual.map((cartao) =>
            cartao.id === id
              ? {
                  ...cartao,
                  lancamentos,
                  faturaCartaoId: detalheSelecionado?.faturaCartaoId,
                  statusFatura,
                  valorTotalFatura,
                }
              : cartao,
          ),
        );
        return;
      }

      const competencia = formatarCompetenciaParaApi(mes);
      const lancamentos = await listarLancamentosCartaoApi(id, { competencia });
      setCartoes((atual) =>
        atual.map((cartao) =>
          cartao.id === id
            ? {
                ...cartao,
                lancamentos: lancamentos.map((item, indice) => mapearLancamentoCartaoApi(item, indice)),
                faturaCartaoId: undefined,
                statusFatura: undefined,
                valorTotalFatura: undefined,
              }
            : cartao,
        ),
      );
    } catch (erro) {
      if (extrairCodigoErroApi(erro) === 'fatura_transacoes_pendentes') {
        notificarErro(t('financeiro.cartao.mensagens.transacoesPendentes'));
        return;
      }
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

      const confirmarInativacao = await solicitarConfirmacao(
        t('financeiro.cartao.mensagens.confirmarInativacao'),
        {
          titulo: t('comum.confirmacoes.tituloAcaoCritica'),
          textoConfirmar: t('financeiro.cartao.acoes.inativar'),
          textoCancelar: t('comum.acoes.cancelar'),
          mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
          tipoConfirmar: 'perigo',
        },
      );
      if (!confirmarInativacao) return;
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
      setAcaoFaturaEmEdicao(null);
      setCamposInvalidosAcaoFatura({});
      return;
    }
    const mes = obterMesSelecionado(cartao.id);
    await carregarCartaoPorId(cartao.id);
    await carregarLancamentosCartao(cartao.id, mes);
    setAcaoFaturaEmEdicao(null);
    setCamposInvalidosAcaoFatura({});
    setCartaoDetalheAberto(cartao.id);
  };

  const carregarContasBancarias = async () => {
    try {
      const contas = await listarContasBancariasApi();
      setContasBancarias(contas);
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const abrirEfetivacaoFaturaCartao = (cartao: Cartao) => {
    const valorTotal = totalPeriodo(cartao);
    setFormularioAcaoFatura(criarFormularioAcaoFaturaCartao(valorTotal, locale));
    setCamposInvalidosAcaoFatura({});
    setAcaoFaturaEmEdicao({ cartaoId: cartao.id, tipo: 'efetivar' });
    void carregarContasBancarias();
  };

  const abrirEstornoFaturaCartao = (cartao: Cartao) => {
    const valorTotal = totalPeriodo(cartao);
    setFormularioAcaoFatura((atual) => ({
      ...atual,
      valorTotal: formatarMoedaParaInput(valorTotal, locale),
      dataEstorno: obterDataAtualIso(),
      observacaoEstorno: '',
      ocultarDoHistorico: true,
    }));
    setCamposInvalidosAcaoFatura({});
    setAcaoFaturaEmEdicao({ cartaoId: cartao.id, tipo: 'estornar' });
  };

  const efetivarFaturaCartao = async (cartao: Cartao) => {
    if (!cartao.faturaCartaoId) return;
    const lancamentosFatura = obterLancamentosDoMes(cartao);
    if (!todasTransacoesFaturaEfetivadas(lancamentosFatura)) {
      notificarErro(t('financeiro.cartao.mensagens.transacoesPendentes'));
      return;
    }
    const valorTotalAtual = totalPeriodo(cartao);
    if (valorTotalAtual < 0) {
      notificarErro(t('comum.erro'));
      return;
    }

    if (valorTotalAtual !== 0) {
      const invalidos: Record<string, boolean> = {};
      const valorTotalFormulario = converterTextoParaNumero(formularioAcaoFatura.valorTotal, locale);
      const valorEfetivacao = converterTextoParaNumero(formularioAcaoFatura.valorEfetivacao, locale);

      if (!formularioAcaoFatura.dataEfetivacao) invalidos.dataEfetivacao = true;
      if (!formularioAcaoFatura.contaBancariaId) invalidos.contaBancariaId = true;
      if (formularioAcaoFatura.valorTotal.trim() === '') invalidos.valorTotal = true;
      if (formularioAcaoFatura.valorEfetivacao.trim() === '') invalidos.valorEfetivacao = true;
      if (Math.abs(valorTotalFormulario - valorTotalAtual) > 0.009) invalidos.valorTotal = true;
      if (valorEfetivacao > valorTotalAtual) invalidos.valorEfetivacao = true;

      if (Object.keys(invalidos).length > 0) {
        setCamposInvalidosAcaoFatura((atual) => ({ ...atual, ...invalidos }));
        notificarErro(t('financeiro.despesa.mensagens.obrigatorioEfetivacao'));
        return;
      }
    }

    try {
      if (valorTotalAtual === 0) {
        await efetivarFaturaCartaoApi(cartao.faturaCartaoId);
      } else {
        await efetivarFaturaCartaoApi(cartao.faturaCartaoId, {
          dataEfetivacao: formularioAcaoFatura.dataEfetivacao,
          contaBancariaId: Number(formularioAcaoFatura.contaBancariaId),
          valorTotal: valorTotalAtual,
          valorEfetivacao: converterTextoParaNumero(formularioAcaoFatura.valorEfetivacao, locale),
          observacaoHistorico: formularioAcaoFatura.observacaoEfetivacao.trim() || undefined,
        });
      }
      const mes = obterMesSelecionado(cartao.id);
      await carregarLancamentosCartao(cartao.id, mes);
      setAcaoFaturaEmEdicao(null);
      setCamposInvalidosAcaoFatura({});
      notificarSucesso(t('financeiro.despesa.mensagens.efetivada'));
    } catch {
      notificarErro(t('comum.erro'));
    }
  };

  const estornarFaturaCartao = async (cartao: Cartao) => {
    if (!cartao.faturaCartaoId) return;
    if (!formularioAcaoFatura.dataEstorno) {
      setCamposInvalidosAcaoFatura((atual) => ({ ...atual, dataEstorno: true }));
      notificarErro(t('financeiro.despesa.mensagens.obrigatorioEstorno'));
      return;
    }
    try {
      await estornarFaturaCartaoApi(cartao.faturaCartaoId, {
        dataEstorno: formularioAcaoFatura.dataEstorno,
        observacaoHistorico: formularioAcaoFatura.observacaoEstorno.trim() || undefined,
        ocultarDoHistorico: formularioAcaoFatura.ocultarDoHistorico,
      });
      const mes = obterMesSelecionado(cartao.id);
      await carregarLancamentosCartao(cartao.id, mes);
      setAcaoFaturaEmEdicao(null);
      setCamposInvalidosAcaoFatura({});
      notificarSucesso(t('financeiro.despesa.mensagens.estornada'));
    } catch {
      notificarErro(t('comum.erro'));
    }
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
    if (cartao.tipo === 'credito') {
      return cartao.lancamentos;
    }
    const mesSelecionado = obterMesSelecionado(cartao.id);
    return cartao.lancamentos.filter((lancamento) => lancamento.data.startsWith(mesSelecionado));
  };

  const totalPeriodo = (cartao: Cartao) =>
    cartao.tipo === 'credito' && cartao.valorTotalFatura !== undefined
      ? cartao.valorTotalFatura
      : calcularTotalLancamentos(obterLancamentosDoMes(cartao));

  const obterRotuloStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => String(status ?? 'aberta').toUpperCase();
  const obterEstiloBadgeStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    if (status === 'efetivada') return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
    if (status === 'estornada') return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    if (status === 'vencida') return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    if (status === 'fechada') return { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };
    return { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' };
  };
  const renderBadgeStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    const estilo = obterEstiloBadgeStatusFaturaCartao(status);
    return (
      <DistintivoStatus
        rotulo={obterRotuloStatusFaturaCartao(status)}
        corTexto={estilo.corTexto}
        corBorda={estilo.corBorda}
        corFundo={estilo.corFundo}
      />
    );
  };

  const obterEstiloBadgeStatusLancamento = (status: string | undefined) => {
    const statusNormalizado = String(status ?? '').toLowerCase();
    if (statusNormalizado.includes('efetiv')) return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
    if (statusNormalizado.includes('estorn')) return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    if (statusNormalizado.includes('vencid')) return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
    if (statusNormalizado.includes('fech')) return { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };
    return { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' };
  };

  const renderBadgeStatusLancamento = (status: string | undefined) => {
    if (!status) return null;
    const estilo = obterEstiloBadgeStatusLancamento(status);
    return (
      <DistintivoStatus
        rotulo={String(status).toUpperCase()}
        corTexto={estilo.corTexto}
        corBorda={estilo.corBorda}
        corFundo={estilo.corFundo}
      />
    );
  };
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
                      <DistintivoStatus
                        rotulo={t(`financeiro.cartao.status.${cartao.status}`)}
                        corTexto={cartao.status === 'ativo' ? COLORS.success : COLORS.warning}
                        corBorda={cartao.status === 'ativo' ? '#86efac' : '#fde68a'}
                        corFundo={cartao.status === 'ativo' ? '#14532d' : '#78350f'}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>
                        {cartao.bandeira} | {t(`financeiro.cartao.tipos.${cartao.tipo}`)}
                      </Text>
                    </View>
                    {cartao.tipo === 'credito' ? (
                      <>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                          {t('financeiro.cartao.campos.limite')}:{' '}
                          <ValorMonetarioAnimado
                            valorFinal={cartao.limite}
                            deveAnimar={deveAnimarValoresIniciais}
                            estilo={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}
                          />{' '}
                          | {t('financeiro.cartao.campos.saldoDisponivel')}:{' '}
                          <ValorMonetarioAnimado
                            valorFinal={cartao.saldoDisponivel}
                            deveAnimar={deveAnimarValoresIniciais}
                            estilo={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}
                          />
                        </Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                          {t('financeiro.cartao.campos.diaVencimento')}: {formatarDataPorIdioma(cartao.diaVencimento)} | {t('financeiro.cartao.campos.dataVencimentoCartao')}: {formatarDataPorIdioma(cartao.dataVencimentoCartao)}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                        {t('financeiro.cartao.campos.saldoDisponivel')}:{' '}
                        <ValorMonetarioAnimado
                          valorFinal={cartao.saldoDisponivel}
                          deveAnimar={deveAnimarValoresIniciais}
                          estilo={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}
                        />
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
		                        <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flex: 1, paddingRight: 8 }}>
		                            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.totalFatura') : t('financeiro.cartao.totalExtrato')}</Text>
		                            <Text style={{ color: COLORS.accent, fontSize: 20, fontWeight: '800' }}>{formatarValorPorIdioma(totalPeriodo(cartao))}</Text>
                              </View>
                              {cartao.tipo === 'credito' && cartao.statusFatura ? (
                                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                  {renderBadgeStatusFaturaCartao(cartao.statusFatura)}
                                </View>
                              ) : null}
			                        </View>
		                        {cartao.tipo === 'credito' && cartao.statusFatura ? (
		                          <View style={{ marginBottom: 8 }}>
		                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                              {(cartao.statusFatura === 'aberta' || cartao.statusFatura === 'fechada' || cartao.statusFatura === 'vencida' || cartao.statusFatura === 'estornada') && cartao.faturaCartaoId ? (
                                <TouchableOpacity onPress={() => abrirEfetivacaoFaturaCartao(cartao)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}>
                                  <Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.despesa.acoes.efetivar')}</Text>
                                </TouchableOpacity>
                              ) : null}
                              {cartao.statusFatura === 'efetivada' && cartao.faturaCartaoId ? (
                                <TouchableOpacity onPress={() => abrirEstornoFaturaCartao(cartao)} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}>
                                  <Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.despesa.acoes.estornar')}</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                        {cartao.tipo === 'credito' && acaoFaturaEmEdicao?.cartaoId === cartao.id ? (
                          <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                            {acaoFaturaEmEdicao.tipo === 'efetivar' ? (
                              <>
                                <CampoData
                                  label={t('financeiro.reembolso.campos.dataEfetivacao')}
                                  placeholder={t('financeiro.cartao.placeholders.data')}
                                  value={formularioAcaoFatura.dataEfetivacao}
                                  onChange={(dataEfetivacao) => {
                                    setCamposInvalidosAcaoFatura((atual) => ({ ...atual, dataEfetivacao: false }));
                                    setFormularioAcaoFatura((atual) => ({ ...atual, dataEfetivacao }));
                                  }}
                                  error={camposInvalidosAcaoFatura.dataEfetivacao}
                                  comHora
                                />
                                <CampoSelect
                                  label={t('financeiro.despesa.campos.contaBancaria')}
                                  placeholder={t('comum.acoes.selecionar')}
                                  options={opcoesContasBancarias}
                                  value={formularioAcaoFatura.contaBancariaId}
                                  onChange={(contaBancariaId) => {
                                    setCamposInvalidosAcaoFatura((atual) => ({ ...atual, contaBancariaId: false }));
                                    setFormularioAcaoFatura((atual) => ({ ...atual, contaBancariaId }));
                                  }}
                                  error={camposInvalidosAcaoFatura.contaBancariaId}
                                />
                                {renderCampoBloqueado(t('financeiro.despesa.campos.valorTotal'), formularioAcaoFatura.valorTotal)}
                                <CampoTexto
                                  label={t('financeiro.reembolso.campos.valorEfetivacao')}
                                  placeholder={t('financeiro.cartao.placeholders.valor')}
                                  value={formularioAcaoFatura.valorEfetivacao}
                                  onChangeText={(valorEfetivacao) => {
                                    setCamposInvalidosAcaoFatura((atual) => ({ ...atual, valorEfetivacao: false }));
                                    setFormularioAcaoFatura((atual) => ({ ...atual, valorEfetivacao: aplicarMascaraMoeda(valorEfetivacao, locale) }));
                                  }}
                                  error={camposInvalidosAcaoFatura.valorEfetivacao}
                                  keyboardType="numeric"
                                />
                                <CampoTexto
                                  label={t('financeiro.reembolso.campos.observacao')}
                                  placeholder={t('financeiro.reembolso.placeholders.observacao')}
                                  value={formularioAcaoFatura.observacaoEfetivacao}
                                  onChangeText={(observacaoEfetivacao) => {
                                    setFormularioAcaoFatura((atual) => ({ ...atual, observacaoEfetivacao }));
                                  }}
                                  multiline
                                  numberOfLines={3}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                  <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setAcaoFaturaEmEdicao(null)} tipo="secundario" estilo={{ flex: 1 }} />
                                  <Botao titulo={t('financeiro.reembolso.acoes.confirmarEfetivacao')} onPress={() => void efetivarFaturaCartao(cartao)} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
                                </View>
                              </>
                            ) : (
                              <>
                                <CampoData
                                  label={t('financeiro.reembolso.campos.dataEstorno')}
                                  placeholder={t('financeiro.cartao.placeholders.data')}
                                  value={formularioAcaoFatura.dataEstorno}
                                  onChange={(dataEstorno) => {
                                    setCamposInvalidosAcaoFatura((atual) => ({ ...atual, dataEstorno: false }));
                                    setFormularioAcaoFatura((atual) => ({ ...atual, dataEstorno }));
                                  }}
                                  error={camposInvalidosAcaoFatura.dataEstorno}
                                />
                                <CampoTexto
                                  label={t('financeiro.reembolso.campos.observacao')}
                                  placeholder={t('financeiro.reembolso.placeholders.observacao')}
                                  value={formularioAcaoFatura.observacaoEstorno}
                                  onChangeText={(observacaoEstorno) => {
                                    setFormularioAcaoFatura((atual) => ({ ...atual, observacaoEstorno }));
                                  }}
                                  multiline
                                  numberOfLines={3}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                  <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setAcaoFaturaEmEdicao(null)} tipo="secundario" estilo={{ flex: 1 }} />
                                  <Botao titulo={t('financeiro.reembolso.acoes.confirmarEstorno')} onPress={() => void estornarFaturaCartao(cartao)} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
                                </View>
                              </>
                            )}
                          </View>
                        ) : null}
                        {obterLancamentosDoMes(cartao).length === 0 ? (
		                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.faturaVazia') : t('financeiro.cartao.extratoVazio')}</Text>
		                        ) : (
                          <View style={{ borderLeftWidth: 2, borderLeftColor: COLORS.borderAccent, marginLeft: 8, paddingLeft: 10, marginBottom: 10, maxHeight: 320 }}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                              {obterLancamentosDoMes(cartao).map((lancamento) => (
                                <View key={lancamento.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <View style={{ alignItems: 'flex-start', gap: 4, paddingRight: 4 }}>

                                      <Text style={{ color: COLORS.textPrimary, fontWeight: '600', flex: 1 }}>{lancamento.descricao}</Text>
                                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>
                                        {t('financeiro.despesa.campos.dataLancamento')}: {formatarDataPorIdioma((lancamento.dataLancamento || lancamento.data).slice(0, 10))}
                                      </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4, paddingLeft: 8 }}>
                                      {renderBadgeStatusLancamento(lancamento.status)}
                                      <Text style={{ color: lancamento.tipoOperacao === 'estorno' || lancamento.tipoTransacao !== 'despesa' ? COLORS.success : COLORS.error, fontWeight: '700' }}>
                                        {(lancamento.tipoOperacao === 'estorno' || lancamento.tipoTransacao !== 'despesa') ? '+' : '-'} {formatarValorPorIdioma(lancamento.valor)}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </ScrollView>
                          </View>
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
            {modoTela === 'novo'
              ? <CampoSelect label={t('financeiro.cartao.campos.tipo')} placeholder={t('comum.acoes.selecionar')} options={tiposCartao.map((tipo) => ({ value: tipo, label: t(`financeiro.cartao.tipos.${tipo}`) }))} value={formulario.tipo} onChange={(tipo) => atualizarTipoFormulario(tipo as TipoCartao)} error={camposInvalidos.tipo} />
              : renderCampoBloqueado(t('financeiro.cartao.campos.tipo'), t(`financeiro.cartao.tipos.${formulario.tipo}`))}
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



