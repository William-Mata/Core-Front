import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoArquivo } from '../../../src/componentes/comuns/CampoArquivo';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { ModalConfirmacao } from '../../../src/componentes/comuns/ModalConfirmacao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataHoraPorIdioma, formatarDataPorIdioma, formatarValorPorIdioma, normalizarIsoDataHora, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { aplicarMascaraCompetencia, avancarCompetencia, desserializarCompetencia, formatarCompetencia, formatarCompetenciaParaEntrada, obterCompetenciaAtual, obterCompetenciaPorData, serializarCompetencia, type CompetenciaFinanceira } from '../../../src/utils/competenciaFinanceira';
import { obterIconeBanco, obterIconeBandeiraCartao, obterImagemBanco, obterImagemBandeiraCartao } from '../../../src/utils/icones';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../../src/utils/erroApi';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import { podeAlterarTransacaoVinculadaAFatura, resolverStatusOperacionalTransacaoFatura } from '../../../src/utils/acoesFaturaCartao';
import { montarDocumentosPayload, normalizarDocumentosApi, type DocumentoFinanceiro } from '../../../src/utils/documentoUpload';
import { compararPorLancamentoEfetivacaoDecrescente } from '../../../src/utils/ordenacaoLancamentoFinanceiro';
import {
  listarDespesasApi,
  listarCartoesApi,
  listarContasBancariasApi,
  listarDetalhesFaturasCartaoApi,
  listarReembolsosApi,
  obterReembolsoApi,
  criarReembolsoApi,
  atualizarReembolsoApi,
  efetivarReembolsoApi,
  estornarReembolsoApi,
  type CartaoOpcaoApi,
  type ContaBancariaOpcaoApi,
  type FaturaCartaoDetalheApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { encontrarDespesaJaVinculada } from '../../../src/utils/reembolso';
import {
  parseStatusReembolso,
  podeEditarReembolso,
  podeEstornarReembolso,
  serializarStatusReembolso,
  type StatusReembolso,
} from '../../../src/utils/reembolsoStatus';

interface DespesaDisponivel {
  id: number;
  titulo: string;
  valor: number;
  data: string;
}

interface Reembolso {
  id: number;
  faturaCartaoId?: number;
  ehFaturaCartao?: boolean;
  descricao: string;
  solicitante: string;
  dataLancamento: string;
  competencia: string;
  dataEfetivacao?: string;
  dataEstorno?: string;
  observacao: string;
  observacaoEfetivacao: string;
  observacaoEstorno: string;
  tipoRecebimento: string;
  contaBancariaId?: number;
  cartaoId?: number;
  despesasVinculadas: number[];
  valorTotal: number;
  valorEfetivacao?: number;
  documentos: DocumentoFinanceiro[];
  ocultarEfetivacaoEstornoRegistros: boolean;
  status: StatusReembolso;
  statusFaturaCartao?: StatusFaturaCartao;
}

interface GrupoFaturaReembolso {
  fatura: Reembolso;
  reembolsosVinculados: Reembolso[];
  valorTotalGrupo: number;
  valorTotalFatura: number;
  valorTotalTransacoes: number;
  cartaoId?: number;
  competencia?: string;
  statusFaturaCartao: StatusFaturaCartao;
}

type ModoFormulario = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao' | 'estorno';
type StatusFaturaCartao = 'aberta' | 'fechada' | 'efetivada' | 'estornada';
const tiposRecebimento = ['pix', 'transferencia', 'contaCorrente', 'cartaoCredito', 'cartaoDebito', 'dinheiro', 'boleto'] as const;

function paraNumero(valor: unknown, padrao = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarDescricaoMaiuscula(descricao: string, locale: string) {
  return descricao.toLocaleUpperCase(locale);
}

function normalizarStatusFaturaCartao(status: unknown): StatusFaturaCartao {
  const valor = String(status ?? '').toLowerCase();
  if (valor.includes('estorn')) return 'estornada';
  if (valor.includes('efetiv')) return 'efetivada';
  if (valor.includes('fech')) return 'fechada';
  return 'aberta';
}

function normalizarTipoCartaoOpcao(valor: unknown): 'credito' | 'debito' {
  const tipo = String(valor ?? '').trim().toLowerCase();
  return tipo.includes('debi') ? 'debito' : 'credito';
}

function normalizarReembolsoApi(item: RegistroFinanceiroApi): Reembolso {
  const vinculo = (item.vinculo && typeof item.vinculo === 'object')
    ? (item.vinculo as Record<string, unknown>)
    : undefined;
  const faturaCartaoRegistro = item.faturaCartao && typeof item.faturaCartao === 'object'
    ? (item.faturaCartao as Record<string, unknown>)
    : undefined;
  const faturaCartaoIdBruto = paraNumero(item.faturaCartaoId ?? faturaCartaoRegistro?.id ?? faturaCartaoRegistro?.faturaCartaoId, 0);
  const valorEfetivacaoBruto = item.valorEfetivacao ?? item.valorTotal;
  const valorTotal = paraNumero(item.valorTotal ?? valorEfetivacaoBruto, 0);
  const despesasVinculadasBrutas = Array.isArray(item.despesasVinculadas)
    ? (item.despesasVinculadas as unknown[])
    : [];

  const despesasVinculadas = despesasVinculadasBrutas
    .map((despesa) => {
      if (typeof despesa === 'number') return despesa;
      if (typeof despesa === 'object' && despesa !== null) {
        const id = paraNumero((despesa as Record<string, unknown>).id, NaN);
        return Number.isFinite(id) ? id : NaN;
      }
      return NaN;
    })
    .filter((id): id is number => Number.isFinite(id));
  const ehFaturaCartao = Boolean(item.ehFatura) || faturaCartaoIdBruto > 0 || String(item.tipo ?? item.tipoLancamento ?? '').toLowerCase().includes('fatura');
  const statusFaturaCartao = (ehFaturaCartao || faturaCartaoIdBruto > 0)
    ? normalizarStatusFaturaCartao(item.statusFaturaCartao ?? item.statusFatura ?? item.status)
    : undefined;

  return {
    id: paraNumero(item.id),
    faturaCartaoId: faturaCartaoIdBruto > 0 ? faturaCartaoIdBruto : undefined,
    ehFaturaCartao,
    statusFaturaCartao,
    descricao: String(item.descricao ?? item.titulo ?? ''),
    solicitante: String(item.solicitante ?? item.solicitanteName ?? ''),
    dataLancamento: normalizarIsoDataHora(String(item.dataLancamento ?? item.data ?? ''), '00:00'),
    competencia: formatarCompetenciaParaEntrada(desserializarCompetencia(String(item.competencia ?? '')) ?? obterCompetenciaPorData(String(item.dataLancamento ?? item.data ?? '')), obterLocaleAtivo()),
    dataEfetivacao: item.dataEfetivacao
      ? normalizarIsoDataHora(String(item.dataEfetivacao), '00:00')
      : (faturaCartaoIdBruto > 0 ? normalizarIsoDataHora(String(item.dataLancamento ?? item.data ?? ''), '00:00') : undefined),
    dataEstorno: item.dataEstorno ? normalizarIsoDataHora(String(item.dataEstorno), '00:00') : undefined,
    observacao: String(item.observacao ?? ''),
    observacaoEfetivacao: '',
    observacaoEstorno: '',
    tipoRecebimento: String(item.tipoRecebimento ?? item.tipoPagamento ?? ''),
    contaBancariaId: item.contaBancariaId
      ? paraNumero(item.contaBancariaId)
      : vinculo?.contaBancariaId
        ? paraNumero(vinculo.contaBancariaId)
        : undefined,
    cartaoId: item.cartaoId
      ? paraNumero(item.cartaoId)
      : vinculo?.cartaoId
        ? paraNumero(vinculo.cartaoId)
        : undefined,
    despesasVinculadas,
    valorTotal,
    valorEfetivacao: valorEfetivacaoBruto === null || valorEfetivacaoBruto === undefined ? undefined : paraNumero(valorEfetivacaoBruto),
    documentos: normalizarDocumentosApi(item.documentos),
    ocultarEfetivacaoEstornoRegistros: true,
    status: parseStatusReembolso(item.status),
  };
}

function normalizarDespesaApi(item: RegistroFinanceiroApi): DespesaDisponivel {
  return {
    id: paraNumero(item.id),
    titulo: String(item.titulo ?? item.descricao ?? `#${item.id}`),
    valor: paraNumero(item.valor ?? item.valorTotal),
    data: String(item.data ?? item.dataLancamento ?? item.dataEfetivacao ?? new Date().toISOString().split('T')[0]),
  };
}

function criarReembolsoVazio(locale: string): Reembolso {
  const hoje = new Date().toISOString().split('T')[0];
  const hojeComHoraZerada = `${hoje}T00:00`;
  return {
    id: 0,
    descricao: '',
    solicitante: '',
    dataLancamento: hojeComHoraZerada,
    competencia: formatarCompetenciaParaEntrada(obterCompetenciaAtual(), locale),
    dataEfetivacao: hojeComHoraZerada,
    dataEstorno: hojeComHoraZerada,
    observacao: '',
    observacaoEfetivacao: '',
    observacaoEstorno: '',
    tipoRecebimento: '',
    contaBancariaId: undefined,
    cartaoId: undefined,
    despesasVinculadas: [],
    valorTotal: 0,
    valorEfetivacao: 0,
    documentos: [],
    ocultarEfetivacaoEstornoRegistros: true,
    status: 'pendente',
  };
}

export default function TelaReembolso() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idParamBruto = Array.isArray(params.id) ? params.id[0] : params.id;
  const idParam = idParamBruto ? Number(idParamBruto) : null;
  const { t } = usarTraducao();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [versaoConsulta, setVersaoConsulta] = useState(0);
  const locale = obterLocaleAtivo();
  const [competencia, setCompetencia] = useState<CompetenciaFinanceira>(() => obterCompetenciaAtual());
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>(idParam ? 'visualizacao' : 'lista');
  const [carregando, setCarregando] = useState(false);
  const [reembolsoSelecionadoId, setReembolsoSelecionadoId] = useState<number | null>(idParam);
  const [despesasDisponiveis, setDespesasDisponiveis] = useState<DespesaDisponivel[]>([]);
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [detalhesFaturasCartao, setDetalhesFaturasCartao] = useState<FaturaCartaoDetalheApi[]>([]);
  const [opcoesContasBancariasApi, setOpcoesContasBancariasApi] = useState<ContaBancariaOpcaoApi[]>([]);
  const [opcoesCartoesApi, setOpcoesCartoesApi] = useState<CartaoOpcaoApi[]>([]);
  const [reembolsoAtual, setReembolsoAtual] = useState<Reembolso>(() => criarReembolsoVazio(locale));
  const [secaoRateioExpandida, setSecaoRateioExpandida] = useState(true);
  const [faturasExpandidas, setFaturasExpandidas] = useState<number[]>([]);
  const [reembolsoPendenteCancelamento, setReembolsoPendenteCancelamento] = useState<Reembolso | null>(null);
  const competenciaLabel = useMemo(() => formatarCompetencia(competencia, locale), [competencia, locale]);
  const competenciaConsulta = useMemo(() => serializarCompetencia(competencia), [competencia]);
  const exibeContaBancaria = reembolsoAtual.tipoRecebimento === 'pix' || reembolsoAtual.tipoRecebimento === 'transferencia' || reembolsoAtual.tipoRecebimento === 'contaCorrente';
  const exibeCartao = reembolsoAtual.tipoRecebimento === 'cartaoCredito' || reembolsoAtual.tipoRecebimento === 'cartaoDebito';
  const tipoCartaoFiltrado = useMemo<'credito' | 'debito' | null>(() => {
    if (reembolsoAtual.tipoRecebimento === 'cartaoDebito') return 'debito';
    if (reembolsoAtual.tipoRecebimento === 'cartaoCredito') return 'credito';
    return null;
  }, [reembolsoAtual.tipoRecebimento]);
  const ocultarDataVencimentoCartaoCredito = reembolsoAtual.tipoRecebimento === 'cartaoCredito';
  const opcoesContaBancaria = useMemo(
    () =>
      opcoesContasBancariasApi.map((item) => {
        const referencia = item.banco ?? item.nome;
        return { value: String(item.id), label: item.nome, icone: obterIconeBanco(referencia), imagem: obterImagemBanco(referencia) };
      }),
    [opcoesContasBancariasApi],
  );
  const opcoesCartao = useMemo(
    () =>
      opcoesCartoesApi
        .filter((item) => !tipoCartaoFiltrado || normalizarTipoCartaoOpcao(item.tipo) === tipoCartaoFiltrado)
        .map((item) => {
        const referencia = item.bandeira ?? item.nome;
        return { value: String(item.id), label: item.nome, icone: obterIconeBandeiraCartao(referencia), imagem: obterImagemBandeiraCartao(referencia) };
      }),
    [opcoesCartoesApi, tipoCartaoFiltrado],
  );
  useEffect(() => {
    if (!reembolsoAtual.cartaoId) return;
    const cartaoCompativel = opcoesCartao.some((opcao) => Number(opcao.value) === reembolsoAtual.cartaoId);
    if (cartaoCompativel) return;
    setReembolsoAtual((atual) => (atual.cartaoId ? { ...atual, cartaoId: undefined } : atual));
  }, [reembolsoAtual.cartaoId, opcoesCartao]);
  const mapaCartoesPorId = useMemo(
    () => new Map(opcoesCartoesApi.map((item) => [item.id, item])),
    [opcoesCartoesApi],
  );
  const reembolsoSelecionado = reembolsos.find((item) => item.id === reembolsoSelecionadoId) ?? null;

  const carregarDados = async (signal?: AbortSignal) => {
    setCarregando(true);
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
      };
      const [resReembolsos, resDespesas, resContas, resCartoes, resDetalhesFatura] = await Promise.all([
        listarReembolsosApi(opcoesConsulta),
        listarDespesasApi(opcoesConsulta),
        listarContasBancariasApi({ signal, competencia: competenciaConsulta }),
        listarCartoesApi({ signal, competencia: competenciaConsulta }),
        listarDetalhesFaturasCartaoApi({
          signal,
          competencia: competenciaConsulta,
          tipoTransacao: 'reembolso',
        }).catch(() => [] as FaturaCartaoDetalheApi[]),
      ]);

      setReembolsos(resReembolsos.map(normalizarReembolsoApi));
      setDespesasDisponiveis(resDespesas.map(normalizarDespesaApi));
      setOpcoesContasBancariasApi(resContas);
      setOpcoesCartoesApi(resCartoes);
      setDetalhesFaturasCartao(resDetalhesFatura);
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaCarregar')));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void carregarDados(controller.signal);
    return () => controller.abort();
  }, [competencia.ano, competencia.mes, filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, competenciaConsulta, versaoConsulta]);

  const reembolsosFiltrados = useMemo(() => {
    return reembolsos.filter((r) => {
      const bateId = !filtroAplicado.id || String(r.id).includes(filtroAplicado.id);
      const termo = filtroAplicado.descricao.trim().toLowerCase();
      const bateDescricao = !termo || r.descricao.toLowerCase().includes(termo) || r.solicitante.toLowerCase().includes(termo);
      const bateData = estaDentroIntervalo(r.dataLancamento, filtroAplicado.dataInicio, filtroAplicado.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [filtroAplicado, reembolsos]);

  const reembolsoBateFiltroLista = (reembolso: Reembolso) => {
    const bateId = !filtroAplicado.id || String(reembolso.id).includes(filtroAplicado.id);
    const termo = filtroAplicado.descricao.trim().toLowerCase();
    const bateDescricao = !termo || reembolso.descricao.toLowerCase().includes(termo) || reembolso.solicitante.toLowerCase().includes(termo);
    const bateData = estaDentroIntervalo(reembolso.dataLancamento, filtroAplicado.dataInicio, filtroAplicado.dataFim);
    return bateId && bateDescricao && bateData;
  };

  const gruposFaturaReembolso = useMemo<GrupoFaturaReembolso[]>(() => {
    const mapaStatusPorReembolsoId = new Map(reembolsos.map((reembolso) => [reembolso.id, reembolso.status]));
    return detalhesFaturasCartao
      .map((detalhe) => {
        const statusFaturaCartao = normalizarStatusFaturaCartao(detalhe.status);
        const reembolsosVinculados = detalhe.transacoes
          .map((transacao) => {
            const transacaoId = Number((transacao as Record<string, unknown>).id ?? (transacao as Record<string, unknown>).transacaoId ?? 0);
            const statusTransacaoLista = mapaStatusPorReembolsoId.get(transacaoId);
            return normalizarReembolsoApi({
            ...transacao,
            faturaCartaoId: detalhe.faturaCartaoId,
            statusFaturaCartao,
              status: statusTransacaoLista ?? resolverStatusOperacionalTransacaoFatura(transacao as Record<string, unknown>, statusFaturaCartao),
            });
          })
          .filter(reembolsoBateFiltroLista)
          .sort(compararPorLancamentoEfetivacaoDecrescente);
        const dataBase = detalhe.competencia
          ? normalizarIsoDataHora(`${detalhe.competencia}-01`, '00:00')
          : normalizarIsoDataHora(new Date().toISOString().slice(0, 10), '00:00');
        const valorTotalTransacoes = Number.isFinite(detalhe.valorTotalTransacoes) ? detalhe.valorTotalTransacoes : reembolsosVinculados.reduce((total, item) => total + item.valorTotal, 0);
        const valorTotalFatura = Number.isFinite(detalhe.valorTotal) ? detalhe.valorTotal : valorTotalTransacoes;
        const fatura = normalizarReembolsoApi({
          id: detalhe.faturaCartaoId * -1,
          faturaCartaoId: detalhe.faturaCartaoId,
          ehFatura: true,
          statusFaturaCartao,
          descricao: `${t('financeiro.cartao.faturaTitulo')} ${detalhe.competencia || ''}`.trim(),
          dataLancamento: dataBase,
          competencia: detalhe.competencia,
          dataEfetivacao: dataBase,
          valorTotal: valorTotalTransacoes,
          valorEfetivacao: valorTotalTransacoes,
          status: statusFaturaCartao === 'efetivada' ? 'efetivada' : 'pendente',
          despesasVinculadas: [],
        });
        return {
          fatura,
          reembolsosVinculados,
          valorTotalGrupo: valorTotalTransacoes,
          valorTotalFatura,
          valorTotalTransacoes,
          cartaoId: detalhe.cartaoId,
          competencia: detalhe.competencia,
          statusFaturaCartao,
        };
      })
      .sort((a, b) => compararPorLancamentoEfetivacaoDecrescente(a.fatura, b.fatura));
  }, [detalhesFaturasCartao, filtroAplicado.id, filtroAplicado.descricao, filtroAplicado.dataInicio, filtroAplicado.dataFim, reembolsos, t]);

  const mapaGrupoPorFaturaId = useMemo(
    () => new Map(gruposFaturaReembolso.map((grupo) => [grupo.fatura.id, grupo])),
    [gruposFaturaReembolso],
  );
  const idsReembolsosFilhosFatura = useMemo(() => {
    const ids = new Set<number>();
    gruposFaturaReembolso.forEach((grupo) => {
      grupo.reembolsosVinculados.forEach((reembolso) => ids.add(reembolso.id));
    });
    reembolsosFiltrados
      .filter((reembolso) => Boolean(reembolso.faturaCartaoId))
      .forEach((reembolso) => ids.add(reembolso.id));
    return ids;
  }, [gruposFaturaReembolso, reembolsosFiltrados]);
  const reembolsosListaPrincipal = useMemo(() => {
    const idsPais = new Set(gruposFaturaReembolso.map((grupo) => grupo.fatura.id));
    const reembolsosComuns = reembolsosFiltrados.filter(
      (reembolso) => !idsReembolsosFilhosFatura.has(reembolso.id) && !reembolso.faturaCartaoId,
    );
    const faturasOrdenadas = [...gruposFaturaReembolso.map((grupo) => grupo.fatura)].sort(compararPorLancamentoEfetivacaoDecrescente);
    const reembolsosOrdenados = reembolsosComuns
      .filter((reembolso) => !idsPais.has(reembolso.id))
      .sort(compararPorLancamentoEfetivacaoDecrescente);
    return [
      ...faturasOrdenadas,
      ...reembolsosOrdenados,
    ];
  }, [gruposFaturaReembolso, idsReembolsosFilhosFatura, reembolsosFiltrados]);
  const totalListaPrincipal = useMemo(() => {
    const idsPais = new Set(gruposFaturaReembolso.map((grupo) => grupo.fatura.id));
    const totalFaturas = gruposFaturaReembolso.reduce((total, grupo) => total + grupo.valorTotalGrupo, 0);
    const totalComuns = reembolsosListaPrincipal
      .filter((reembolso) => !idsPais.has(reembolso.id))
      .reduce((total, reembolso) => total + reembolso.valorTotal, 0);
    return totalFaturas + totalComuns;
  }, [gruposFaturaReembolso, reembolsosListaPrincipal]);

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };

  const obterDespesaPorId = (id: number) => despesasDisponiveis.find((despesa) => despesa.id === id);

  const calcularTotal = (idsDespesas: number[]) =>
    idsDespesas.reduce((total, id) => total + (obterDespesaPorId(id)?.valor || 0), 0);

  const limparFormulario = () => {
    setReembolsoAtual((atual) => ({
      ...criarReembolsoVazio(locale),
      competencia: formatarCompetenciaParaEntrada(competencia, locale),
    }));
    setReembolsoSelecionadoId(null);
  };

  useEffect(() => {
    if (!idParam) return;
    setModoFormulario('visualizacao');
    void carregarReembolsoPorId(idParam);
  }, [idParam]);

  const carregarReembolsoPorId = async (id: number) => {
    try {
      const detalhe = await obterReembolsoApi(id);
      const completo = normalizarReembolsoApi(detalhe);
      setReembolsos((atual) => {
        const indice = atual.findIndex((item) => item.id === completo.id);
        if (indice < 0) return [...atual, completo];
        const proximo = [...atual];
        proximo[indice] = completo;
        return proximo;
      });
      setReembolsoSelecionadoId(completo.id);
      setReembolsoAtual({
        ...completo,
        descricao: normalizarDescricaoMaiuscula(completo.descricao, locale),
        dataEfetivacao: completo.dataEfetivacao || `${new Date().toISOString().split('T')[0]}T00:00`,
        dataEstorno: completo.dataEstorno || `${new Date().toISOString().split('T')[0]}T00:00`,
        valorEfetivacao: completo.valorEfetivacao ?? completo.valorTotal ?? calcularTotal(completo.despesasVinculadas),
        observacaoEfetivacao: '',
        observacaoEstorno: '',
        ocultarEfetivacaoEstornoRegistros: completo.ocultarEfetivacaoEstornoRegistros ?? true,
      });
      return completo;
    } catch {
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const abrirNovo = () => {
    setReembolsoAtual((atual) => ({
      ...criarReembolsoVazio(locale),
      competencia: formatarCompetenciaParaEntrada(competencia, locale),
    }));
    setReembolsoSelecionadoId(null);
    setModoFormulario('novo');
  };

  const abrirEdicao = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
    if (!podeAlterarTransacaoVinculadaAFatura(encontrado.faturaCartaoId, encontrado.id, encontrado.statusFaturaCartao)) {
      return;
    }
    if (!podeEditarReembolso(encontrado.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.edicaoSomentePendente'));
      return;
    }
    setModoFormulario('edicao');
    void carregarReembolsoPorId(id);
  };

  const abrirVisualizacao = (id: number) => {
    setModoFormulario('visualizacao');
    void carregarReembolsoPorId(id);
  };

  const abrirEfetivacao = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
    if (!podeAlterarTransacaoVinculadaAFatura(encontrado.faturaCartaoId, encontrado.id, encontrado.statusFaturaCartao)) {
      return;
    }
    if (podeEstornarReembolso(encontrado.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setModoFormulario('efetivacao');
    void carregarReembolsoPorId(id);
  };

  const abrirEstorno = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
    if (!podeAlterarTransacaoVinculadaAFatura(encontrado.faturaCartaoId, encontrado.id, encontrado.statusFaturaCartao)) {
      return;
    }
    if (!podeEstornarReembolso(encontrado.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.estornoSomenteEfetivado'));
      return;
    }
    setModoFormulario('estorno');
    void carregarReembolsoPorId(id);
  };


  const salvar = async () => {
    if (!reembolsoAtual.descricao.trim()) {
      notificarErro(t('financeiro.reembolso.mensagens.descricaoObrigatoria'));
      return;
    }

    if (reembolsoAtual.despesasVinculadas.length === 0) {
      notificarErro(t('financeiro.reembolso.mensagens.adicionarDespesa'));
      return;
    }

    if (!reembolsoAtual.competencia.trim()) {
      notificarErro(t('financeiro.comum.mensagens.competenciaObrigatoria'));
      return;
    }

    if (exibeContaBancaria && !reembolsoAtual.contaBancariaId) {
      notificarErro(t('financeiro.reembolso.mensagens.contaObrigatoria'));
      return;
    }

    if (exibeCartao && !reembolsoAtual.cartaoId) {
      notificarErro(t('financeiro.reembolso.mensagens.cartaoObrigatorio'));
      return;
    }

    const despesaConflitanteId = encontrarDespesaJaVinculada(
      reembolsos,
      reembolsoAtual.despesasVinculadas,
      modoFormulario === 'edicao' ? reembolsoAtual.id : undefined,
    );
    if (despesaConflitanteId !== null) {
      const despesaConflitante = obterDespesaPorId(despesaConflitanteId)?.titulo ?? `#${despesaConflitanteId}`;
      notificarErro(t('financeiro.reembolso.mensagens.despesaJaVinculada', { despesa: despesaConflitante }));
      return;
    }

    const valorTotal = calcularTotal(reembolsoAtual.despesasVinculadas);
    const payload: Record<string, unknown> = {
      descricao: normalizarDescricaoMaiuscula(reembolsoAtual.descricao.trim(), locale),
      solicitante: reembolsoAtual.solicitante.trim(),
      dataLancamento: reembolsoAtual.dataLancamento,
      competencia: serializarCompetencia(desserializarCompetencia(reembolsoAtual.competencia) ?? obterCompetenciaPorData(reembolsoAtual.dataLancamento)),
      despesasVinculadas: reembolsoAtual.despesasVinculadas,
      valorTotal,
      documentos: montarDocumentosPayload(reembolsoAtual.documentos),
      status: serializarStatusReembolso('pendente'),
      contaBancariaId: reembolsoAtual.contaBancariaId ?? null,
      cartaoId: reembolsoAtual.cartaoId ?? null,
    };

    setCarregando(true);
    try {
      if (modoFormulario === 'novo') {
        await criarReembolsoApi(payload);
        notificarSucesso(t('financeiro.reembolso.mensagens.criado'));
      } else {
        await atualizarReembolsoApi(reembolsoAtual.id, payload);
        notificarSucesso(t('financeiro.reembolso.mensagens.atualizado'));
      }

      setModoFormulario('lista');
      limparFormulario();
      await carregarDados();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const efetivar = async () => {
    if (!reembolsoAtual.id) return;
    if (!podeAlterarTransacaoVinculadaAFatura(reembolsoAtual.faturaCartaoId, reembolsoAtual.id, reembolsoAtual.statusFaturaCartao)) {
      return;
    }
    if (podeEstornarReembolso(reembolsoAtual.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.efetivacaoSomentePendente'));
      return;
    }
    if (!reembolsoAtual.dataEfetivacao) {
      notificarErro(t('financeiro.reembolso.mensagens.obrigatorioEfetivacao'));
      return;
    }

    if (dataIsoMaiorQue(reembolsoAtual.dataLancamento, reembolsoAtual.dataEfetivacao)) {
      notificarErro(t('financeiro.reembolso.mensagens.dataEfetivacaoMaiorQueSolicitacao'));
      return;
    }

    setCarregando(true);
    try {
      const valorEfetivacao = calcularTotal(reembolsoAtual.despesasVinculadas);
      await efetivarReembolsoApi(reembolsoAtual.id, {
        dataEfetivacao: reembolsoAtual.dataEfetivacao,
        valorEfetivacao,
        observacaoHistorico: reembolsoAtual.observacaoEfetivacao.trim(),
        documentos: montarDocumentosPayload(reembolsoAtual.documentos),
      });

      notificarSucesso(t('financeiro.reembolso.mensagens.efetivado'));
      setModoFormulario('lista');
      limparFormulario();
      await carregarDados();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const estornar = async () => {
    if (!reembolsoAtual.id) return;
    if (!podeAlterarTransacaoVinculadaAFatura(reembolsoAtual.faturaCartaoId, reembolsoAtual.id, reembolsoAtual.statusFaturaCartao)) {
      return;
    }
    if (!podeEstornarReembolso(reembolsoAtual.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.estornoSomenteEfetivado'));
      return;
    }
    if (!reembolsoAtual.dataEstorno) {
      notificarErro(t('financeiro.reembolso.mensagens.obrigatorioEstorno'));
      return;
    }
    if (dataIsoMaiorQue(reembolsoAtual.dataLancamento, reembolsoAtual.dataEstorno)) {
      notificarErro(t('financeiro.reembolso.mensagens.dataEfetivacaoMaiorQueSolicitacao'));
      return;
    }
    if (reembolsoAtual.dataEfetivacao && dataIsoMaiorQue(reembolsoAtual.dataEfetivacao, reembolsoAtual.dataEstorno)) {
      notificarErro(t('financeiro.reembolso.mensagens.dataEfetivacaoMaiorQueSolicitacao'));
      return;
    }

    setCarregando(true);
    try {
      await estornarReembolsoApi(reembolsoAtual.id, {
        dataEstorno: reembolsoAtual.dataEstorno,
        observacaoHistorico: reembolsoAtual.observacaoEstorno.trim(),
        ocultarDoHistorico: reembolsoAtual.ocultarEfetivacaoEstornoRegistros,
      });
      notificarSucesso(t('financeiro.reembolso.mensagens.estornado'));
      setModoFormulario('lista');
      limparFormulario();
      await carregarDados();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const cancelar = (reembolso: Reembolso) => {
    if (!podeAlterarTransacaoVinculadaAFatura(reembolso.faturaCartaoId, reembolso.id, reembolso.statusFaturaCartao)) {
      return;
    }
    if (!podeEditarReembolso(reembolso.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.edicaoSomentePendente'));
      return;
    }
    setReembolsoPendenteCancelamento(reembolso);
  };

  const confirmarCancelamento = async () => {
    if (!reembolsoPendenteCancelamento) return;

    setCarregando(true);
    try {
      const detalheApi = await obterReembolsoApi(reembolsoPendenteCancelamento.id);
      const completo = normalizarReembolsoApi(detalheApi);
      await atualizarReembolsoApi(reembolsoPendenteCancelamento.id, {
        descricao: completo.descricao,
        solicitante: completo.solicitante,
        dataLancamento: completo.dataLancamento,
        competencia: completo.competencia,
        dataEfetivacao: null,
        despesasVinculadas: completo.despesasVinculadas,
        valorTotal: calcularTotal(completo.despesasVinculadas),
        documentos: montarDocumentosPayload(completo.documentos),
        status: serializarStatusReembolso('cancelada'),
        contaBancariaId: completo.contaBancariaId ?? null,
        cartaoId: completo.cartaoId ?? null,
      });
      await carregarDados();
      setReembolsoPendenteCancelamento(null);
      notificarSucesso(t('comum.sucesso'));
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const alternarExpansaoFatura = (faturaId: number) => {
    setFaturasExpandidas((atual) =>
      atual.includes(faturaId)
        ? atual.filter((id) => id !== faturaId)
        : [...atual, faturaId],
    );
  };

  const obterValorExibicaoReembolso = (reembolso: Reembolso) => {
    if (reembolso.valorTotal > 0) return reembolso.valorTotal;
    return calcularTotal(reembolso.despesasVinculadas);
  };

  const renderCartaoReembolso = (reembolso: Reembolso, opcoes?: { ocultarAcoes?: boolean; margemInferior?: number; ocultarEfetivacaoEstorno?: boolean }) => {
    const estiloBadge = reembolso.ehFaturaCartao
      ? obterEstiloBadgeStatusFaturaCartao(reembolso.statusFaturaCartao)
      : obterEstiloBadgeStatusReembolso(reembolso.status);
    const podeAlterar = podeAlterarTransacaoVinculadaAFatura(reembolso.faturaCartaoId, reembolso.id, reembolso.statusFaturaCartao);

    return (
    <View
      key={reembolso.id}
      style={{
        backgroundColor: COLORS.bgTertiary,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: 10,
        padding: 12,
        marginBottom: opcoes?.margemInferior ?? 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>
          #{reembolso.id} {reembolso.descricao}
        </Text>
        <DistintivoStatus
          rotulo={reembolso.ehFaturaCartao ? obterRotuloStatusFaturaCartao(reembolso.statusFaturaCartao) : t(`financeiro.reembolso.statusLista.${reembolso.status}`)}
          corTexto={estiloBadge.corTexto}
          corBorda={estiloBadge.corBorda}
          corFundo={estiloBadge.corFundo}
        />
      </View>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>
        {reembolso.solicitante || '-'} | {formatarDataHoraPorIdioma(reembolso.dataLancamento)} | {formatarValorPorIdioma(obterValorExibicaoReembolso(reembolso))}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
        {t('financeiro.reembolso.despesasSelecionadas', { count: String(reembolso.despesasVinculadas.length) })}
      </Text>
      {opcoes?.ocultarAcoes ? null : (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {reembolso.ehFaturaCartao && !reembolso.faturaCartaoId ? null : (
            <>
              {podeEditarReembolso(reembolso.status) && podeAlterar ? (
                <TouchableOpacity onPress={() => abrirEdicao(reembolso.id)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text>
                </TouchableOpacity>
              ) : null}
              {!podeEstornarReembolso(reembolso.status) && !opcoes?.ocultarEfetivacaoEstorno && podeAlterar ? (
                <TouchableOpacity onPress={() => abrirEfetivacao(reembolso.id)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                  <Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.reembolso.acoes.efetivar')}</Text>
                </TouchableOpacity>
              ) : null}
              {podeEstornarReembolso(reembolso.status) && !opcoes?.ocultarEfetivacaoEstorno && podeAlterar ? (
                <TouchableOpacity onPress={() => abrirEstorno(reembolso.id)} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                  <Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.reembolso.acoes.estornar')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => abrirVisualizacao(reembolso.id)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.visualizar')}</Text>
              </TouchableOpacity>
              {podeEditarReembolso(reembolso.status) && podeAlterar ? <TouchableOpacity onPress={() => cancelar(reembolso)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.cancelar')}</Text>
              </TouchableOpacity> : null}
            </>
          )}
        </View>
      )}
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

  const corStatus = (status: StatusReembolso) => {
    if (status === 'efetivada') return COLORS.success;
    if (status === 'cancelada') return COLORS.error;
    return COLORS.warning;
  };

  const corStatusFaturaCartao = (status: StatusFaturaCartao | undefined) => {
    if (status === 'efetivada') return COLORS.success;
    if (status === 'estornada') return COLORS.warning;
    return COLORS.warning;
  };

  const obterEstiloBadgeStatusReembolso = (status: StatusReembolso) => {
    if (status === 'efetivada') return { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' };
    if (status === 'cancelada') return { corTexto: COLORS.error, corBorda: '#fca5a5', corFundo: '#7f1d1d' };
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
  const renderCartaoFaturaReembolso = (grupo: GrupoFaturaReembolso, expandida: boolean) => {
    const cartao = grupo.cartaoId ? mapaCartoesPorId.get(grupo.cartaoId) : undefined;
    const cartaoDescricao = cartao?.nome ?? '-';
    const referenciaBandeira = cartao?.bandeira ?? cartao?.nome ?? '';
    const imagemBandeira = referenciaBandeira ? obterImagemBandeiraCartao(referenciaBandeira) : null;
    const iconeBandeira = referenciaBandeira ? obterIconeBandeiraCartao(referenciaBandeira) : '';
    const competenciaFatura = grupo.competencia
      ? formatarCompetencia(desserializarCompetencia(grupo.competencia) ?? competencia, locale)
      : competenciaLabel;

    return (
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 12, padding: 12, marginBottom: expandida ? 8 : 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>
            {`${t('financeiro.cartao.faturaTitulo')} #${grupo.fatura.faturaCartaoId ?? Math.abs(grupo.fatura.id)}`}
          </Text>
          {renderBadgeStatusFaturaCartao(grupo.statusFaturaCartao)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          {cartaoDescricao !== '-' ? (
            imagemBandeira
              ? <Image source={imagemBandeira} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" />
              : <Text style={{ color: COLORS.textSecondary, marginRight: 6, fontSize: 13 }}>{iconeBandeira}</Text>
          ) : null}
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, flex: 1 }}>{`${t('financeiro.despesa.campos.cartao')}: ${referenciaBandeira || '-'} | ${cartaoDescricao}`}</Text>
        </View>   
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6}}>{`${t('dashboard.colunas.valor')} ${t('dashboard.ultimasTransacoes')} :  ${formatarValorPorIdioma(grupo.valorTotalTransacoes)}`}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6}}>{`${t('dashboard.colunas.valor')} ${t('financeiro.cartao.totalFatura')} :  ${formatarValorPorIdioma(grupo.valorTotalFatura)}`}</Text>
	        <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: COLORS.borderColor }}>
	          <TouchableOpacity onPress={() => alternarExpansaoFatura(grupo.fatura.id)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginBottom: 10 }}>
	            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{`${t('financeiro.cartao.acoes.fatura')} (${grupo.reembolsosVinculados.length}) ${expandida ? '^' : 'v'}`}</Text>
	          </TouchableOpacity>
	        </View>
		        {expandida ? (
		          <View style={{ borderLeftWidth: 2, borderLeftColor: COLORS.borderAccent, marginLeft: 8, paddingLeft: 10, marginBottom: 10, maxHeight: 320 }}>
		            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
			            {[...grupo.reembolsosVinculados]
			              .sort(compararPorLancamentoEfetivacaoDecrescente)
			              .map((reembolsoVinculado) => renderCartaoReembolso(reembolsoVinculado, { margemInferior: 8 }))}
		            </ScrollView>
		          </View>
		        ) : null}
		      </View>
	    );
	  };

  const renderSecaoRateio = (somenteLeitura: boolean) => {
    const despesasSelecionadas = reembolsoAtual.despesasVinculadas
      .map((id) => {
        const despesa = obterDespesaPorId(id);
        return despesa ? `${despesa.titulo} - ${formatarValorPorIdioma(despesa.valor)}` : `#${id}`;
      })
      .join(' | ');

    return (
      <>
        <View style={{ marginTop: 6, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor }}>
          <TouchableOpacity
            onPress={() => setSecaoRateioExpandida((atual) => !atual)}
            style={{ backgroundColor: COLORS.accentSubtle, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
          >
            <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '800' }}>{secaoRateioExpandida ? '-' : '+'} {t('financeiro.comum.campos.rateio')}</Text>
          </TouchableOpacity>
          {secaoRateioExpandida ? (
            <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 10 }}>
              {somenteLeitura
                ? renderCampoBloqueado(t('financeiro.reembolso.despesasVinculadas'), despesasSelecionadas || '-')
                : (
	                    <CampoSelect
	                      label={t('financeiro.reembolso.despesasVinculadas')}
	                      placeholder={t('comum.acoes.selecionar')}
	                      multiple
	                      options={despesasDisponiveis.map((despesa) => ({
	                        value: String(despesa.id),
	                        label: ocultarDataVencimentoCartaoCredito
	                          ? `${despesa.titulo} - ${formatarValorPorIdioma(despesa.valor)}`
	                          : `${despesa.titulo} - ${formatarValorPorIdioma(despesa.valor)} - ${formatarDataPorIdioma(despesa.data)}`,
	                      }))}
                      values={reembolsoAtual.despesasVinculadas.map(String)}
                      onChangeMultiple={(values) =>
                        setReembolsoAtual((atual) => ({
                          ...atual,
                          despesasVinculadas: values.map((value) => Number(value)),
                        }))
                      }
                    />
                  )}
            </View>
          ) : null}
        </View>
      </>
    );
  };

  const renderFormularioBase = (somenteLeitura: boolean) => (
    <>
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.descricao'), reembolsoAtual.descricao)
        : (
            <CampoTexto
              label={t('financeiro.reembolso.descricao')}
              placeholder={t('financeiro.reembolso.placeholderDescricao')}
              value={reembolsoAtual.descricao}
              onChangeText={(descricao) => setReembolsoAtual((atual) => ({ ...atual, descricao }))}
              obrigatorio
              forcarMaiusculo
              multiline
              numberOfLines={3}
              estilo={{ marginBottom: 12 }}
            />
          )}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.solicitante'), reembolsoAtual.solicitante)
        : <CampoTexto label={t('financeiro.reembolso.solicitante')} value={reembolsoAtual.solicitante} onChangeText={(solicitante) => setReembolsoAtual((atual) => ({ ...atual, solicitante }))} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.dataLancamento'), reembolsoAtual.dataLancamento ? formatarDataHoraPorIdioma(reembolsoAtual.dataLancamento) : '')
        : <CampoData label={t('financeiro.reembolso.dataLancamento')} placeholder={t('financeiro.reembolso.placeholderData')} value={reembolsoAtual.dataLancamento} onChange={(dataLancamento) => setReembolsoAtual((atual) => ({ ...atual, dataLancamento }))} comHora estilo={{ marginBottom: 12 }} />}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.competencia'), reembolsoAtual.competencia)
        : <CampoTexto label={t('financeiro.reembolso.competencia')} placeholder={t('financeiro.reembolso.placeholderCompetencia')} value={reembolsoAtual.competencia} onChangeText={(competencia) => setReembolsoAtual((atual) => ({ ...atual, competencia: aplicarMascaraCompetencia(competencia, locale) }))} obrigatorio estilo={{ marginBottom: 12 }} />}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.receita.campos.tipoRecebimento'), reembolsoAtual.tipoRecebimento ? t(`financeiro.receita.tipoRecebimento.${reembolsoAtual.tipoRecebimento}`) : '')
        : <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={reembolsoAtual.tipoRecebimento} onChange={(tipoRecebimento) => setReembolsoAtual((atual) => ({ ...atual, tipoRecebimento, contaBancariaId: tipoRecebimento === 'pix' || tipoRecebimento === 'transferencia' || tipoRecebimento === 'contaCorrente' ? atual.contaBancariaId : undefined, cartaoId: tipoRecebimento === 'cartaoCredito' || tipoRecebimento === 'cartaoDebito' ? atual.cartaoId : undefined }))} />}
      {exibeContaBancaria
        ? (somenteLeitura
            ? renderCampoBloqueadoContaCartao(
                t('financeiro.receita.campos.contaBancaria'),
                opcoesContasBancariasApi.find((item) => item.id === reembolsoAtual.contaBancariaId)?.nome ?? '',
                'conta',
                opcoesContasBancariasApi.find((item) => item.id === reembolsoAtual.contaBancariaId)?.banco ?? '',
              )
            : <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancaria} value={reembolsoAtual.contaBancariaId ? String(reembolsoAtual.contaBancariaId) : ''} onChange={(contaBancariaId) => setReembolsoAtual((atual) => ({ ...atual, contaBancariaId: Number(contaBancariaId) || undefined }))} obrigatorio={exibeContaBancaria} />)
        : null}
      {exibeCartao
        ? (somenteLeitura
            ? renderCampoBloqueadoContaCartao(
                t('financeiro.receita.campos.cartao'),
                opcoesCartoesApi.find((item) => item.id === reembolsoAtual.cartaoId)?.nome ?? '',
                'cartao',
                opcoesCartoesApi.find((item) => item.id === reembolsoAtual.cartaoId)?.bandeira ?? '',
              )
            : <CampoSelect label={t('financeiro.receita.campos.cartao')} placeholder={t('comum.acoes.selecionar')} options={opcoesCartao} value={reembolsoAtual.cartaoId ? String(reembolsoAtual.cartaoId) : ''} onChange={(cartaoId) => setReembolsoAtual((atual) => ({ ...atual, cartaoId: Number(cartaoId) || undefined }))} obrigatorio={exibeCartao} />)
        : null}
      {renderSecaoRateio(somenteLeitura)}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.despesa.campos.anexoDocumento'), reembolsoAtual.documentos[0]?.nomeArquivo || '')
        : (
            <CampoArquivo
              label={t('financeiro.despesa.campos.anexoDocumento')}
              placeholder={t('financeiro.despesa.placeholders.anexo')}
              value={reembolsoAtual.documentos[0]?.nomeArquivo || ''}
              onChange={(nomeArquivo) =>
                setReembolsoAtual((atual) => ({
                  ...atual,
                  documentos: nomeArquivo ? atual.documentos : [],
                }))
              }
              onSelecionarArquivo={(documento) =>
                setReembolsoAtual((atual) => ({
                  ...atual,
                  documentos: documento ? [documento] : [],
                }))
              }
              estilo={{ marginBottom: 12 }}
            />
          )}
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, padding: 12, marginBottom: 20 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>{t('financeiro.reembolso.valorTotal')}</Text>
        <Text style={{ color: COLORS.accent, fontSize: 22, fontWeight: '800' }}>{formatarValorPorIdioma(obterValorExibicaoReembolso(reembolsoAtual))}</Text>
      </View>
    </>
  );

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
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('financeiro.reembolso.titulo')}</Text>
        <TouchableOpacity onPress={() => (modoFormulario === 'lista' ? router.back() : setModoFormulario('lista'))}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {modoFormulario === 'lista' ? (
          <>
            <Botao titulo={`+ ${t('financeiro.reembolso.novo')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} disabled={carregando} />
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
	            <Botao titulo={t('comum.acoes.consultar')} onPress={consultarFiltros} tipo='secundario' estilo={{ marginBottom: 12 }} disabled={carregando} />
	            <View style={{ gap: 10 }}>
	              {reembolsosListaPrincipal.length === 0 ? (
	                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
	                  {carregando ? t('comum.carregando') : t('financeiro.reembolso.vazio')}
	                </Text>
	              ) : (
	                reembolsosListaPrincipal.map((reembolso) => {
	                  const grupoFatura = mapaGrupoPorFaturaId.get(reembolso.id);
	                  if (!grupoFatura) return renderCartaoReembolso(reembolso);
	                  const expandida = faturasExpandidas.includes(grupoFatura.fatura.id);
			                  return <View key={grupoFatura.fatura.id}>{renderCartaoFaturaReembolso(grupoFatura, expandida)}</View>;
		                })
		              )}
		            </View>
          </>
        ) : null}

        {modoFormulario === 'novo' || modoFormulario === 'edicao' ? (
          <>
            {renderFormularioBase(false)}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
              <Botao titulo={modoFormulario === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={() => void salvar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}

        {modoFormulario === 'visualizacao' && reembolsoSelecionado ? (
          <>
            {renderFormularioBase(true)}
            {renderCampoBloqueadoStatus(t('financeiro.reembolso.statusLista.pendente'), t(`financeiro.reembolso.statusLista.${reembolsoSelecionado.status}`), obterEstiloBadgeStatusReembolso(reembolsoSelecionado.status))}
            {renderCampoBloqueado(t('financeiro.reembolso.campos.dataEfetivacao'), reembolsoSelecionado.dataEfetivacao ? formatarDataHoraPorIdioma(reembolsoSelecionado.dataEfetivacao) : '')}
            <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" disabled={carregando} />
          </>
        ) : null}

        {modoFormulario === 'efetivacao' ? (
          <>
            {renderCampoBloqueado(t('financeiro.reembolso.descricao'), reembolsoAtual.descricao)}
            {renderCampoBloqueado(t('financeiro.reembolso.solicitante'), reembolsoAtual.solicitante)}
            {renderCampoBloqueado(t('financeiro.reembolso.valorTotal'), formatarValorPorIdioma(obterValorExibicaoReembolso(reembolsoAtual)))}
            {renderCampoBloqueado(t('financeiro.reembolso.campos.valorEfetivacao'), formatarValorPorIdioma(obterValorExibicaoReembolso(reembolsoAtual)))}

            <CampoData
              label={t('financeiro.reembolso.campos.dataEfetivacao')}
              placeholder={t('financeiro.reembolso.placeholderData')}
              value={reembolsoAtual.dataEfetivacao || ''}
              onChange={(dataEfetivacao) => setReembolsoAtual((atual) => ({ ...atual, dataEfetivacao }))}
              comHora
              obrigatorio
              estilo={{ marginBottom: 12 }}
            />
            <CampoTexto
              label={t('financeiro.reembolso.campos.observacao')}
              placeholder={t('financeiro.reembolso.placeholders.observacao')}
              value={reembolsoAtual.observacaoEfetivacao}
              onChangeText={(observacaoEfetivacao) => setReembolsoAtual((atual) => ({ ...atual, observacaoEfetivacao }))}
              multiline
              numberOfLines={4}
              estilo={{ marginBottom: 12 }}
            />

            <CampoArquivo
              label={t('financeiro.despesa.campos.anexoDocumento')}
              placeholder={t('financeiro.despesa.placeholders.anexo')}
              value={reembolsoAtual.documentos[0]?.nomeArquivo || ''}
              onChange={(nomeArquivo) =>
                setReembolsoAtual((atual) => ({
                  ...atual,
                  documentos: nomeArquivo ? atual.documentos : [],
                }))
              }
              onSelecionarArquivo={(documento) =>
                setReembolsoAtual((atual) => ({
                  ...atual,
                  documentos: documento ? [documento] : [],
                }))
              }
              estilo={{ marginBottom: 20 }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
              <Botao titulo={t('financeiro.reembolso.acoes.confirmarEfetivacao')} onPress={() => void efetivar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}

        {modoFormulario === 'estorno' ? (
          <>
            {renderCampoBloqueado(t('financeiro.reembolso.descricao'), reembolsoAtual.descricao)}
            {renderCampoBloqueado(t('financeiro.reembolso.solicitante'), reembolsoAtual.solicitante)}
            {renderCampoBloqueado(t('financeiro.reembolso.valorTotal'), formatarValorPorIdioma(obterValorExibicaoReembolso(reembolsoAtual)))}
            {renderCampoBloqueado(t('financeiro.reembolso.campos.valorEfetivacao'), formatarValorPorIdioma(obterValorExibicaoReembolso(reembolsoAtual)))}
            <CampoData
              label={t('financeiro.reembolso.campos.dataEstorno')}
              placeholder={t('financeiro.reembolso.placeholderData')}
              value={reembolsoAtual.dataEstorno || ''}
              onChange={(dataEstorno) => setReembolsoAtual((atual) => ({ ...atual, dataEstorno }))}
              comHora
              obrigatorio
              estilo={{ marginBottom: 12 }}
            />
            <CampoTexto
              label={t('financeiro.reembolso.campos.observacao')}
              placeholder={t('financeiro.reembolso.placeholders.observacao')}
              value={reembolsoAtual.observacaoEstorno}
              onChangeText={(observacaoEstorno) => setReembolsoAtual((atual) => ({ ...atual, observacaoEstorno }))}
              multiline
              numberOfLines={4}
              estilo={{ marginBottom: 12 }}
            />
            <View style={{ marginBottom: 20, backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ color: COLORS.textPrimary, flex: 1, fontSize: 13 }}>{t('financeiro.reembolso.campos.ocultarEfetivacaoEstornoRegistros')}</Text>
                <Switch
                  value={reembolsoAtual.ocultarEfetivacaoEstornoRegistros}
                  onValueChange={(ocultarEfetivacaoEstornoRegistros) => setReembolsoAtual((atual) => ({ ...atual, ocultarEfetivacaoEstornoRegistros }))}
                  trackColor={{ false: COLORS.borderColor, true: COLORS.accent }}
                  thumbColor={reembolsoAtual.ocultarEfetivacaoEstornoRegistros ? COLORS.accent : COLORS.textSecondary}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
              <Botao titulo={t('financeiro.reembolso.acoes.confirmarEstorno')} onPress={() => void estornar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}
      </ScrollView>
      <ModalConfirmacao
        visivel={Boolean(reembolsoPendenteCancelamento)}
        titulo={t('comum.confirmacao')}
        mensagem={t('financeiro.reembolso.mensagens.confirmarCancelamento')}
        mensagemImpacto={t('comum.confirmacoes.alertaAcaoIrreversivel')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        tipoConfirmar="perigo"
        carregando={carregando}
        onCancelar={() => setReembolsoPendenteCancelamento(null)}
        onConfirmar={() => void confirmarCancelamento()}
      />
    </View>
  );
}
