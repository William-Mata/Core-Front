import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoArquivo } from '../../../src/componentes/comuns/CampoArquivo';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { ModalConfirmacao } from '../../../src/componentes/comuns/ModalConfirmacao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { avancarCompetencia, formatarCompetencia, obterCompetenciaAtual, obterIntervaloCompetencia, type CompetenciaFinanceira } from '../../../src/utils/competenciaFinanceira';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../../src/utils/erroApi';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import { montarDocumentosPayload, normalizarDocumentosApi, type DocumentoFinanceiro } from '../../../src/utils/documentoUpload';
import {
  listarDespesasApi,
  listarCartoesApi,
  listarContasBancariasApi,
  listarReembolsosApi,
  obterReembolsoApi,
  criarReembolsoApi,
  atualizarReembolsoApi,
  type CartaoOpcaoApi,
  type ContaBancariaOpcaoApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { encontrarDespesaJaVinculada } from '../../../src/utils/reembolso';
import {
  parseStatusReembolso,
  podeEditarReembolso,
  podeEfetivarReembolso,
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
  descricao: string;
  solicitante: string;
  dataLancamento: string;
  dataEfetivacao?: string;
  tipoRecebimento: string;
  contaBancariaId?: number;
  cartaoId?: number;
  despesasVinculadas: number[];
  valorEfetivacao?: number;
  documentos: DocumentoFinanceiro[];
  status: StatusReembolso;
}

type ModoFormulario = 'lista' | 'novo' | 'edicao' | 'visualizacao' | 'efetivacao';
const tiposRecebimento = ['pix', 'transferencia', 'contaCorrente', 'cartaoCredito', 'cartaoDebito', 'dinheiro', 'boleto'] as const;

function paraNumero(valor: unknown, padrao = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarReembolsoApi(item: RegistroFinanceiroApi): Reembolso {
  const vinculo = (item.vinculo && typeof item.vinculo === 'object')
    ? (item.vinculo as Record<string, unknown>)
    : undefined;
  const valorEfetivacaoBruto = item.valorEfetivacao ?? item.valorTotal;
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

  return {
    id: paraNumero(item.id),
    descricao: String(item.descricao ?? item.titulo ?? ''),
    solicitante: String(item.solicitante ?? item.solicitanteName ?? ''),
    dataLancamento: String(item.dataLancamento ?? item.data ?? '').slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
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
    valorEfetivacao: valorEfetivacaoBruto === null || valorEfetivacaoBruto === undefined ? undefined : paraNumero(valorEfetivacaoBruto),
    documentos: normalizarDocumentosApi(item.documentos),
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

function criarReembolsoVazio(): Reembolso {
  const hoje = new Date().toISOString().split('T')[0];
  return {
    id: 0,
    descricao: '',
    solicitante: '',
    dataLancamento: hoje,
    dataEfetivacao: hoje,
    tipoRecebimento: '',
    contaBancariaId: undefined,
    cartaoId: undefined,
    despesasVinculadas: [],
    valorEfetivacao: 0,
    documentos: [],
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
  const [opcoesContasBancariasApi, setOpcoesContasBancariasApi] = useState<ContaBancariaOpcaoApi[]>([]);
  const [opcoesCartoesApi, setOpcoesCartoesApi] = useState<CartaoOpcaoApi[]>([]);
  const [reembolsoAtual, setReembolsoAtual] = useState<Reembolso>(criarReembolsoVazio());
  const [secaoRateioExpandida, setSecaoRateioExpandida] = useState(true);
  const [reembolsoPendenteCancelamento, setReembolsoPendenteCancelamento] = useState<Reembolso | null>(null);
  const competenciaLabel = useMemo(() => formatarCompetencia(competencia, locale), [competencia, locale]);
  const competenciaConsulta = useMemo(() => `${String(competencia.ano)}-${String(competencia.mes).padStart(2, '0')}`, [competencia.ano, competencia.mes]);
  const exibeContaBancaria = reembolsoAtual.tipoRecebimento === 'pix' || reembolsoAtual.tipoRecebimento === 'transferencia' || reembolsoAtual.tipoRecebimento === 'contaCorrente';
  const exibeCartao = reembolsoAtual.tipoRecebimento === 'cartaoCredito' || reembolsoAtual.tipoRecebimento === 'cartaoDebito';
  const opcoesContaBancaria = useMemo(() => opcoesContasBancariasApi.map((item) => ({ value: String(item.id), label: item.nome })), [opcoesContasBancariasApi]);
  const opcoesCartao = useMemo(() => opcoesCartoesApi.map((item) => ({ value: String(item.id), label: item.nome })), [opcoesCartoesApi]);
  const reembolsoSelecionado = reembolsos.find((item) => item.id === reembolsoSelecionadoId) ?? null;

  const carregarDados = async (signal?: AbortSignal) => {
    setCarregando(true);
    try {
      const periodoCompetencia = obterIntervaloCompetencia(competencia);
      const dataInicio = filtroAplicado.dataInicio || periodoCompetencia.dataInicio;
      const dataFim = filtroAplicado.dataFim || periodoCompetencia.dataFim;
      const opcoesConsulta = {
        signal,
        id: filtroAplicado.id.trim() || undefined,
        descricao: filtroAplicado.descricao.trim() || undefined,
        dataInicio,
        dataFim,
        competencia: competenciaConsulta,
      };
      const [resReembolsos, resDespesas, resContas, resCartoes] = await Promise.all([
        listarReembolsosApi(opcoesConsulta),
        listarDespesasApi(opcoesConsulta),
        listarContasBancariasApi({ signal, competencia: competenciaConsulta }),
        listarCartoesApi({ signal, competencia: competenciaConsulta }),
      ]);

      setReembolsos(resReembolsos.map(normalizarReembolsoApi));
      setDespesasDisponiveis(resDespesas.map(normalizarDespesaApi));
      setOpcoesContasBancariasApi(resContas);
      setOpcoesCartoesApi(resCartoes);
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

  const consultarFiltros = () => {
    setFiltroAplicado({ ...filtro });
    setVersaoConsulta((atual) => atual + 1);
  };

  const obterDespesaPorId = (id: number) => despesasDisponiveis.find((despesa) => despesa.id === id);

  const calcularTotal = (idsDespesas: number[]) =>
    idsDespesas.reduce((total, id) => total + (obterDespesaPorId(id)?.valor || 0), 0);

  const limparFormulario = () => {
    setReembolsoAtual(criarReembolsoVazio());
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
        dataEfetivacao: completo.dataEfetivacao || new Date().toISOString().split('T')[0],
        valorEfetivacao: completo.valorEfetivacao ?? calcularTotal(completo.despesasVinculadas),
      });
      return completo;
    } catch {
      notificarErro(t('comum.erro'));
      return null;
    }
  };

  const abrirNovo = () => {
    limparFormulario();
    setModoFormulario('novo');
  };

  const abrirEdicao = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
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
    if (!podeEfetivarReembolso(encontrado.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setModoFormulario('efetivacao');
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

    if (exibeContaBancaria && !reembolsoAtual.contaBancariaId) {
      notificarErro(t('financeiro.receita.mensagens.contaObrigatoria'));
      return;
    }

    if (exibeCartao && !reembolsoAtual.cartaoId) {
      notificarErro(t('financeiro.despesa.mensagens.obrigatorio'));
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
      descricao: reembolsoAtual.descricao.trim(),
      solicitante: reembolsoAtual.solicitante.trim(),
      dataLancamento: reembolsoAtual.dataLancamento,
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
      await atualizarReembolsoApi(reembolsoAtual.id, {
        status: serializarStatusReembolso('efetivada'),
        dataEfetivacao: reembolsoAtual.dataEfetivacao,
        valorEfetivacao,
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

  const estornar = async (reembolso: Reembolso) => {
    if (!podeEstornarReembolso(reembolso.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.estornoSomenteEfetivado'));
      return;
    }

    setCarregando(true);
    try {
      await atualizarReembolsoApi(reembolso.id, {
        status: serializarStatusReembolso('pendente'),
        dataEfetivacao: null,
        valorEfetivacao: null,
      });
      notificarSucesso(t('financeiro.reembolso.mensagens.estornado'));
      await carregarDados();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('financeiro.reembolso.mensagens.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const cancelar = (reembolso: Reembolso) => {
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

  const renderCampoBloqueado = (label: string, valor: string) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{valor || '-'}</Text>
      </View>
    </View>
  );

  const corStatus = (status: StatusReembolso) => {
    if (status === 'efetivada') return COLORS.success;
    if (status === 'cancelada') return COLORS.error;
    return COLORS.warning;
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
                        label: `${despesa.titulo} - ${formatarValorPorIdioma(despesa.valor)} - ${formatarDataPorIdioma(despesa.data)}`,
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
              multiline
              numberOfLines={3}
              estilo={{ marginBottom: 12 }}
            />
          )}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.solicitante'), reembolsoAtual.solicitante)
        : <CampoTexto label={t('financeiro.reembolso.solicitante')} value={reembolsoAtual.solicitante} onChangeText={(solicitante) => setReembolsoAtual((atual) => ({ ...atual, solicitante }))} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.reembolso.dataLancamento'), reembolsoAtual.dataLancamento ? formatarDataPorIdioma(reembolsoAtual.dataLancamento) : '')
        : <CampoData label={t('financeiro.reembolso.dataLancamento')} placeholder={t('financeiro.reembolso.placeholderData')} value={reembolsoAtual.dataLancamento} onChange={(dataLancamento) => setReembolsoAtual((atual) => ({ ...atual, dataLancamento }))} estilo={{ marginBottom: 12 }} />}
      {somenteLeitura
        ? renderCampoBloqueado(t('financeiro.receita.campos.tipoRecebimento'), reembolsoAtual.tipoRecebimento ? t(`financeiro.receita.tipoRecebimento.${reembolsoAtual.tipoRecebimento}`) : '')
        : <CampoSelect label={t('financeiro.receita.campos.tipoRecebimento')} placeholder={t('comum.acoes.selecionar')} options={tiposRecebimento.map((tipo) => ({ value: tipo, label: t(`financeiro.receita.tipoRecebimento.${tipo}`) }))} value={reembolsoAtual.tipoRecebimento} onChange={(tipoRecebimento) => setReembolsoAtual((atual) => ({ ...atual, tipoRecebimento, contaBancariaId: tipoRecebimento === 'pix' || tipoRecebimento === 'transferencia' || tipoRecebimento === 'contaCorrente' ? atual.contaBancariaId : undefined, cartaoId: tipoRecebimento === 'cartaoCredito' || tipoRecebimento === 'cartaoDebito' ? atual.cartaoId : undefined }))} />}
      {exibeContaBancaria
        ? (somenteLeitura
            ? renderCampoBloqueado(t('financeiro.receita.campos.contaBancaria'), opcoesContasBancariasApi.find((item) => item.id === reembolsoAtual.contaBancariaId)?.nome ?? '')
            : <CampoSelect label={t('financeiro.receita.campos.contaBancaria')} placeholder={t('comum.acoes.selecionar')} options={opcoesContaBancaria} value={reembolsoAtual.contaBancariaId ? String(reembolsoAtual.contaBancariaId) : ''} onChange={(contaBancariaId) => setReembolsoAtual((atual) => ({ ...atual, contaBancariaId: Number(contaBancariaId) || undefined }))} obrigatorio={exibeContaBancaria} />)
        : null}
      {exibeCartao
        ? (somenteLeitura
            ? renderCampoBloqueado(t('financeiro.receita.campos.cartao'), opcoesCartoesApi.find((item) => item.id === reembolsoAtual.cartaoId)?.nome ?? '')
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
        <Text style={{ color: COLORS.accent, fontSize: 22, fontWeight: '800' }}>{formatarValorPorIdioma(calcularTotal(reembolsoAtual.despesasVinculadas))}</Text>
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
            <Botao titulo={t('comum.acoes.consultar')} onPress={consultarFiltros} tipo='secundario' estilo={{ marginBottom: 12 }} disabled={carregando} />

            <View style={{ gap: 10 }}>
              {reembolsosFiltrados.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                  {carregando ? t('comum.carregando') : t('financeiro.reembolso.vazio')}
                </Text>
              ) : (
                reembolsosFiltrados.map((reembolso) => (
                  <View
                    key={reembolso.id}
                    style={{
                      backgroundColor: COLORS.bgTertiary,
                      borderWidth: 1,
                      borderColor: COLORS.borderColor,
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>
                        #{reembolso.id} {reembolso.descricao}
                      </Text>
                      <Text style={{ color: corStatus(reembolso.status), fontSize: 12, fontWeight: '700' }}>
                        {t(`financeiro.reembolso.statusLista.${reembolso.status}`)}
                      </Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>
                      {reembolso.solicitante || '-'} | {formatarDataPorIdioma(reembolso.dataLancamento)} | {formatarValorPorIdioma(calcularTotal(reembolso.despesasVinculadas))}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                      {t('financeiro.reembolso.despesasSelecionadas', { count: String(reembolso.despesasVinculadas.length) })}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {podeEditarReembolso(reembolso.status) ? (
                        <TouchableOpacity onPress={() => abrirEdicao(reembolso.id)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                          <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text>
                        </TouchableOpacity>
                      ) : null}
                      {podeEfetivarReembolso(reembolso.status) ? (
                        <TouchableOpacity onPress={() => abrirEfetivacao(reembolso.id)} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                          <Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.reembolso.acoes.efetivar')}</Text>
                        </TouchableOpacity>
                      ) : null}
                      {podeEstornarReembolso(reembolso.status) ? (
                        <TouchableOpacity onPress={() => void estornar(reembolso)} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                          <Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.reembolso.acoes.estornar')}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={() => abrirVisualizacao(reembolso.id)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.visualizar')}</Text>
                      </TouchableOpacity>
                      {podeEditarReembolso(reembolso.status) ? <TouchableOpacity onPress={() => cancelar(reembolso)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.cancelar')}</Text>
                      </TouchableOpacity> : null}
                    </View>
                  </View>
                ))
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
            {renderCampoBloqueado(t('financeiro.reembolso.statusLista.pendente'), t(`financeiro.reembolso.statusLista.${reembolsoSelecionado.status}`))}
            {renderCampoBloqueado(t('financeiro.reembolso.campos.dataEfetivacao'), reembolsoSelecionado.dataEfetivacao ? formatarDataPorIdioma(reembolsoSelecionado.dataEfetivacao) : '')}
            <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" disabled={carregando} />
          </>
        ) : null}

        {modoFormulario === 'efetivacao' ? (
          <>
            {renderCampoBloqueado(t('financeiro.reembolso.descricao'), reembolsoAtual.descricao)}
            {renderCampoBloqueado(t('financeiro.reembolso.solicitante'), reembolsoAtual.solicitante)}
            {renderCampoBloqueado(t('financeiro.reembolso.valorTotal'), formatarValorPorIdioma(calcularTotal(reembolsoAtual.despesasVinculadas)))}
            {renderCampoBloqueado(t('financeiro.reembolso.campos.valorEfetivacao'), formatarValorPorIdioma(calcularTotal(reembolsoAtual.despesasVinculadas)))}

            <CampoData
              label={t('financeiro.reembolso.campos.dataEfetivacao')}
              placeholder={t('financeiro.reembolso.placeholderData')}
              value={reembolsoAtual.dataEfetivacao || ''}
              onChange={(dataEfetivacao) => setReembolsoAtual((atual) => ({ ...atual, dataEfetivacao }))}
              obrigatorio
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
      </ScrollView>
      <ModalConfirmacao
        visivel={Boolean(reembolsoPendenteCancelamento)}
        titulo={t('comum.confirmacao')}
        mensagem={t('comum.acoes.cancelar')}
        textoCancelar={t('comum.acoes.cancelar')}
        textoConfirmar={t('comum.acoes.confirmar')}
        carregando={carregando}
        onCancelar={() => setReembolsoPendenteCancelamento(null)}
        onConfirmar={() => void confirmarCancelamento()}
      />
    </View>
  );
}
