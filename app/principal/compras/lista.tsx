import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoDataIntervalo } from '../../../src/componentes/comuns/CampoData';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  aplicarAcaoLoteItensCompraApi,
  atualizarItemListaCompraApi,
  atualizarItemRapidoListaCompraApi,
  buscarSugestoesItensCompraApi,
  criarItemListaCompraApi,
  marcarItemListaCompraApi,
  obterListaCompraApi,
} from '../../../src/servicos/compras';
import { criarClienteTempoRealCompras } from '../../../src/servicos/compras/tempoReal';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { usarComprasStore } from '../../../src/store/usarComprasStore';
import {
  AcaoLoteItensCompra,
  ItemListaCompra,
  ListaCompraDetalhe,
  PermissaoParticipanteLista,
  DirecaoOrdenacao,
  OrdenacaoItensCompra,
} from '../../../src/tipos/compras.tipos';
import {
  aplicarMascaraNumeroPorLocale,
  calcularValorTotalItemCompra,
  converterTextoNumeroPorLocale,
  filtrarItensCompra,
  formatarNumeroEntradaPorLocale,
  ordenarItensCompra,
} from '../../../src/utils/compras.util';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataHoraPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { COLORS } from '../../../src/styles/variables';

const opcoesUnidade = ['unidade', 'kg', 'g', 'mg', 'l', 'ml', 'pacote', 'caixa'] as const;

const opcoesFiltro = [
  { value: 'todos', label: 'todos' },
  { value: 'comprados', label: 'comprados' },
  { value: 'naoComprados', label: 'naoComprados' },
] as const;

const opcoesOrdenacao = [
  { value: 'alfabetica', label: 'alfabetica' },
  { value: 'preco', label: 'preco' },
  { value: 'cor', label: 'cor' },
] as const;

const opcoesMarcadorCor = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
] as const;

const unidadesQuantidadeInteira = new Set<ItemListaCompra['unidadeMedida']>(['unidade', 'pacote', 'caixa']);

function obterCasasDecimaisQuantidade(unidade: ItemListaCompra['unidadeMedida']): number {
  return unidadesQuantidadeInteira.has(unidade) ? 0 : 2;
}

interface FiltroItensValor {
  descricao: string;
  dataInicio: string;
  dataFim: string;
}

const filtroItensInicial: FiltroItensValor = {
  descricao: '',
  dataInicio: '',
  dataFim: '',
};

const opcoesAcaoLote: Array<{
  value: AcaoLoteItensCompra;
  chaveLabel: string;
  requerSelecao: boolean;
}> = [
  { value: 'MarcarSelecionadosComprados', chaveLabel: 'marcarSelecionadosComprados', requerSelecao: true },
  { value: 'DesmarcarSelecionados', chaveLabel: 'desmarcarSelecionados', requerSelecao: true },
  { value: 'ExcluirSelecionados', chaveLabel: 'excluirSelecionados', requerSelecao: true },
  { value: 'ExcluirComprados', chaveLabel: 'excluirComprados', requerSelecao: false },
  { value: 'ExcluirNaoComprados', chaveLabel: 'excluirNaoComprados', requerSelecao: false },
  { value: 'ExcluirSemPreco', chaveLabel: 'excluirSemPreco', requerSelecao: false },
  { value: 'LimparLista', chaveLabel: 'limparLista', requerSelecao: false },
  { value: 'ResetarPrecos', chaveLabel: 'resetarPrecos', requerSelecao: false },
  { value: 'ResetarCores', chaveLabel: 'resetarCores', requerSelecao: false },
  { value: 'CriarNovaListaComComprados', chaveLabel: 'criarNovaListaComComprados', requerSelecao: false },
  { value: 'CriarNovaListaComNaoComprados', chaveLabel: 'criarNovaListaComNaoComprados', requerSelecao: false },
  { value: 'DuplicarLista', chaveLabel: 'duplicarLista', requerSelecao: false },
  { value: 'MesclarDuplicados', chaveLabel: 'mesclarDuplicados', requerSelecao: false },
];

function obterPermissaoAtual(detalhe: ListaCompraDetalhe | null, usuarioId?: number): PermissaoParticipanteLista {
  if (!detalhe || !usuarioId) return 'leitor';
  if (detalhe.papelUsuario) return detalhe.papelUsuario;
  if (detalhe.criadoPorUsuarioId === usuarioId) return 'proprietario';
  const participante = detalhe.participantes.find((item) => item.usuarioId === usuarioId);
  return participante?.permissao ?? 'leitor';
}

export default function ListaCompraDetalheTela() {
  const router = useRouter();
  const { t } = usarTraducao();
  const params = useLocalSearchParams<{ listaId?: string }>();
  const listaId = Number(params.listaId);
  const usuarioId = usarAutenticacaoStore((state) => state.usuario?.id);

  const {
    itensDaListaAtiva,
    definirListaAtiva,
    definirItensDaListaAtiva,
    filtroStatus,
    ordenacao,
    direcaoOrdenacao,
    definirFiltroStatus,
    definirOrdenacao,
    itensSelecionadosIds,
    alternarSelecaoItem,
    limparSelecaoItens,
  } = usarComprasStore();

  const [detalheLista, setDetalheLista] = useState<ListaCompraDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [conectadoTempoReal, setConectadoTempoReal] = useState(false);
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [modalEditarItem, setModalEditarItem] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<ItemListaCompra | null>(null);
  const [acaoLoteSelecionada, setAcaoLoteSelecionada] = useState<AcaoLoteItensCompra>('MarcarSelecionadosComprados');
  const [descricao, setDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<ItemListaCompra['unidadeMedida']>('unidade');
  const localeAtivo = obterLocaleAtivo();
  const [quantidade, setQuantidade] = useState(() =>
    formatarNumeroEntradaPorLocale(1, localeAtivo, obterCasasDecimaisQuantidade('unidade')),
  );
  const [valorUnitario, setValorUnitario] = useState(() => formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
  const [marcadorCor, setMarcadorCor] = useState<string>(opcoesMarcadorCor[0]);
  const [sugestoesDescricao, setSugestoesDescricao] = useState<
    Array<{ descricao: string; unidadeMedida: ItemListaCompra['unidadeMedida']; valorReferencia: number; marcadorCor: string }>
  >([]);
  const [filtroItens, setFiltroItens] = useState<FiltroItensValor>(filtroItensInicial);
  const [filtroItensAplicado, setFiltroItensAplicado] = useState<FiltroItensValor>(filtroItensInicial);
  const [filtroStatusRascunho, setFiltroStatusRascunho] = useState<typeof filtroStatus>(filtroStatus);
  const [ordenacaoRascunho, setOrdenacaoRascunho] = useState<OrdenacaoItensCompra>(ordenacao);
  const [direcaoOrdenacaoRascunho, setDirecaoOrdenacaoRascunho] = useState<DirecaoOrdenacao>(direcaoOrdenacao);

  const carregarDetalheLista = useCallback(async () => {
    if (!Number.isFinite(listaId)) return;
    try {
      setCarregando(true);
      const resposta = await obterListaCompraApi(listaId);
      setDetalheLista(resposta);
      definirItensDaListaAtiva(resposta.itens ?? []);
    } catch {
      notificarErro(t('compras.mensagens.erroCarregarItens'));
    } finally {
      setCarregando(false);
    }
  }, [definirItensDaListaAtiva, listaId, t]);

  useEffect(() => {
    if (!Number.isFinite(listaId)) return;
    definirListaAtiva(listaId);
    void carregarDetalheLista();
  }, [carregarDetalheLista, definirListaAtiva, listaId]);

  useEffect(() => {
    if (!Number.isFinite(listaId)) return;
    let ativo = true;
    let clienteLimpeza: {
      iniciar: () => Promise<void>;
      parar: () => Promise<void>;
      entrarLista: (id: number) => Promise<void>;
      sairLista: (id: number) => Promise<void>;
    } | null = null;

    const iniciar = async () => {
      try {
        const cliente = await criarClienteTempoRealCompras({
          aoConexaoAlterada: (conectado) => {
            if (ativo) setConectadoTempoReal(conectado);
          },
          aoReceberEvento: (evento) => {
            if (!ativo || evento.listaId !== listaId) return;
            void carregarDetalheLista();
          },
        });
        clienteLimpeza = cliente;
        await cliente.iniciar();
        await cliente.entrarLista(listaId);
      } catch {
        if (ativo) setConectadoTempoReal(false);
      }
    };

    void iniciar();

    return () => {
      ativo = false;
      setConectadoTempoReal(false);
      if (!clienteLimpeza) return;
      void clienteLimpeza.sairLista(listaId).catch(() => undefined);
      void clienteLimpeza.parar().catch(() => undefined);
    };
  }, [carregarDetalheLista, listaId]);

  useEffect(() => {
    const termo = descricao.trim();
    if (termo.length < 3 || !Number.isFinite(listaId)) {
      setSugestoesDescricao([]);
      return;
    }
    const timeout = setTimeout(() => {
      void buscarSugestoesItensCompraApi(listaId, { termo, limite: 8 })
        .then(setSugestoesDescricao)
        .catch(() => setSugestoesDescricao([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [descricao, listaId]);

  const permissaoAtual = useMemo(() => obterPermissaoAtual(detalheLista, usuarioId), [detalheLista, usuarioId]);
  const podeEditarItens = permissaoAtual === 'proprietario' || permissaoAtual === 'coproprietario';
  const casasDecimaisQuantidade = useMemo(
    () => obterCasasDecimaisQuantidade(unidadeMedida),
    [unidadeMedida],
  );
  const quantidadeExigeInteiro = useMemo(() => unidadesQuantidadeInteira.has(unidadeMedida), [unidadeMedida]);
  const quantidadeNumero = useMemo(() => converterTextoNumeroPorLocale(quantidade, localeAtivo), [localeAtivo, quantidade]);
  const quantidadeEhValidaParaUnidade = useMemo(
    () => !quantidadeExigeInteiro || Number.isInteger(quantidadeNumero),
    [quantidadeExigeInteiro, quantidadeNumero],
  );
  const valorUnitarioNumero = useMemo(
    () => converterTextoNumeroPorLocale(valorUnitario, localeAtivo),
    [localeAtivo, valorUnitario],
  );
  const valorTotalCalculado = useMemo(
    () => calcularValorTotalItemCompra(quantidadeNumero, valorUnitarioNumero),
    [quantidadeNumero, valorUnitarioNumero],
  );

  const itensFiltradosOrdenados = useMemo(() => {
    const termoDescricao = filtroItensAplicado.descricao.trim().toLowerCase();
    const filtradosStatus = filtrarItensCompra(itensDaListaAtiva, filtroStatus);
    const filtrados = filtradosStatus.filter((item) => {
      const bateDescricao = !termoDescricao || item.descricao.toLowerCase().includes(termoDescricao);
      const bateData = estaDentroIntervalo(item.atualizadoEm, filtroItensAplicado.dataInicio, filtroItensAplicado.dataFim);
      return bateDescricao && bateData;
    });
    return ordenarItensCompra(filtrados, ordenacao, direcaoOrdenacao);
  }, [direcaoOrdenacao, filtroItensAplicado, filtroStatus, itensDaListaAtiva, ordenacao]);

  useEffect(() => {
    setFiltroStatusRascunho(filtroStatus);
    setOrdenacaoRascunho(ordenacao);
    setDirecaoOrdenacaoRascunho(direcaoOrdenacao);
  }, [direcaoOrdenacao, filtroStatus, ordenacao]);

  const limparFormularioItem = () => {
    setDescricao('');
    setObservacao('');
    setUnidadeMedida('unidade');
    setQuantidade(formatarNumeroEntradaPorLocale(1, localeAtivo, obterCasasDecimaisQuantidade('unidade')));
    setValorUnitario(formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
    setMarcadorCor(opcoesMarcadorCor[0]);
    setSugestoesDescricao([]);
  };

  const atualizarUnidadeMedidaFormulario = (proximaUnidade: ItemListaCompra['unidadeMedida']) => {
    setUnidadeMedida(proximaUnidade);
    setQuantidade((valorAtual) => {
      const numeroAtual = converterTextoNumeroPorLocale(valorAtual, localeAtivo);
      const numeroAjustado = unidadesQuantidadeInteira.has(proximaUnidade) ? Math.trunc(numeroAtual) : numeroAtual;
      return formatarNumeroEntradaPorLocale(numeroAjustado, localeAtivo, obterCasasDecimaisQuantidade(proximaUnidade));
    });
  };

  const consultarFiltrosItens = () => {
    definirFiltroStatus(filtroStatusRascunho);
    definirOrdenacao(ordenacaoRascunho, direcaoOrdenacaoRascunho);
    setFiltroItensAplicado({
      descricao: filtroItens.descricao.trim(),
      dataInicio: filtroItens.dataInicio,
      dataFim: filtroItens.dataFim,
    });
  };

  const salvarNovoItem = async () => {
    if (!podeEditarItens) return;
    if (
      !descricao.trim()
      || !unidadeMedida
      || !marcadorCor
      || quantidadeNumero <= 0
      || !quantidadeEhValidaParaUnidade
      || valorUnitarioNumero <= 0
      || valorTotalCalculado <= 0
    ) {
      notificarErro(t('compras.mensagens.itemInvalido'));
      return;
    }
    try {
      await criarItemListaCompraApi(listaId, {
        descricao: descricao.trim(),
        observacao: observacao.trim(),
        unidadeMedida,
        quantidade: quantidadeNumero,
        marcadorCor,
        valorUnitario: valorUnitarioNumero,
      });
      notificarSucesso(t('compras.mensagens.itemCriado'));
      setModalNovoItem(false);
      limparFormularioItem();
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarItem'));
    }
  };

  const abrirEditarItem = (item: ItemListaCompra) => {
    if (!podeEditarItens) return;
    setItemEdicao(item);
    setDescricao(item.descricao);
    setObservacao(item.observacao);
    setUnidadeMedida(item.unidadeMedida);
    setQuantidade(
      formatarNumeroEntradaPorLocale(item.quantidade, localeAtivo, obterCasasDecimaisQuantidade(item.unidadeMedida)),
    );
    setValorUnitario(formatarNumeroEntradaPorLocale(item.valorUnitario, localeAtivo, 2));
    setMarcadorCor(item.marcadorCor);
    setModalEditarItem(true);
  };

  const salvarEdicaoCompleta = async () => {
    if (!itemEdicao || !podeEditarItens) return;
    if (
      !descricao.trim()
      || !unidadeMedida
      || !marcadorCor
      || quantidadeNumero <= 0
      || !quantidadeEhValidaParaUnidade
      || valorUnitarioNumero <= 0
      || valorTotalCalculado <= 0
    ) {
      notificarErro(t('compras.mensagens.itemInvalido'));
      return;
    }
    try {
      await atualizarItemListaCompraApi(listaId, itemEdicao.id, {
        descricao: descricao.trim(),
        observacao: observacao.trim(),
        unidadeMedida,
        quantidade: quantidadeNumero,
        valorUnitario: valorUnitarioNumero,
        marcadorCor,
        versao: itemEdicao.versao,
      });
      notificarSucesso(t('compras.mensagens.itemAtualizado'));
      setModalEditarItem(false);
      setItemEdicao(null);
      limparFormularioItem();
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarItem'));
    }
  };

  const atualizarRapido = async (item: ItemListaCompra, campo: 'quantidade' | 'valorUnitario', valor: string) => {
    if (!podeEditarItens) return;
    const numero = Number(valor.replace(',', '.'));
    if (!Number.isFinite(numero) || numero < 0) return;
    try {
      await atualizarItemRapidoListaCompraApi(
        listaId,
        item.id,
        campo === 'quantidade' ? numero : item.quantidade,
        campo === 'valorUnitario' ? numero : item.valorUnitario,
        item.versao,
      );
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroAtualizacaoRapida'));
    }
  };

  const alternarComprado = async (item: ItemListaCompra, comprado: boolean) => {
    if (!podeEditarItens) return;
    try {
      await marcarItemListaCompraApi(listaId, item.id, comprado);
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarItem'));
    }
  };

  const executarAcaoLote = async () => {
    if (!podeEditarItens) return;
    const opcaoSelecionada = opcoesAcaoLote.find((item) => item.value === acaoLoteSelecionada);
    if (!opcaoSelecionada) return;
    const rotuloAcaoSelecionada = t(`compras.acoesLote.${opcaoSelecionada.chaveLabel}`);
    const acaoDestrutiva = [
      'ExcluirSelecionados',
      'ExcluirComprados',
      'ExcluirNaoComprados',
      'ExcluirSemPreco',
      'LimparLista',
      'ResetarPrecos',
      'ResetarCores',
    ].includes(opcaoSelecionada.value);

    if (opcaoSelecionada.requerSelecao && itensSelecionadosIds.length === 0) {
      notificarErro(t('compras.mensagens.selecioneItensLote'));
      return;
    }

    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.acaoLote', { acao: rotuloAcaoSelecionada }), {
      titulo: t('comum.confirmacoes.tituloAcaoCritica'),
      textoConfirmar: rotuloAcaoSelecionada,
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: acaoDestrutiva ? t('comum.confirmacoes.alertaAcaoIrreversivel') : undefined,
      tipoConfirmar: acaoDestrutiva ? 'perigo' : 'primario',
    });
    if (!confirmar) return;

    try {
      setSalvandoLote(true);
      await aplicarAcaoLoteItensCompraApi(listaId, {
        acao: acaoLoteSelecionada,
        ...(opcaoSelecionada.requerSelecao ? { itemIds: itensSelecionadosIds } : {}),
      });
      limparSelecaoItens();
      notificarSucesso(t('compras.mensagens.acaoLoteSucesso'));
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.acaoLoteErro'));
    } finally {
      setSalvandoLote(false);
    }
  };

  const selecionarSugestao = (sugestao: (typeof sugestoesDescricao)[number]) => {
    setDescricao(sugestao.descricao);
    atualizarUnidadeMedidaFormulario(sugestao.unidadeMedida);
    setValorUnitario(formatarNumeroEntradaPorLocale(sugestao.valorReferencia, localeAtivo, 2));
    setMarcadorCor(sugestao.marcadorCor);
    setSugestoesDescricao([]);
  };

  if (!Number.isFinite(listaId)) {
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
          <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.lista.titulo')}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={{ color: COLORS.error }}>{t('compras.mensagens.listaInvalida')}</Text>
        </View>
      </View>
    );
  }

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
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{detalheLista?.nome || t('compras.lista.titulo')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700', marginBottom: 12 }}>{t('compras.lista.resumo')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, minWidth: 160 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.totalLista')}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 }}>{formatarValorPorIdioma(detalheLista?.valorTotal ?? 0)}</Text>
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, minWidth: 160 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.totalComprado')}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 }}>{formatarValorPorIdioma(detalheLista?.valorComprado ?? 0)}</Text>
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, minWidth: 160 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.percentualComprado')}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 }}>{(detalheLista?.percentualComprado ?? 0).toFixed(2)}%</Text>
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, minWidth: 160 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.quantidadeItens')}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 }}>{detalheLista?.quantidadeItens ?? 0}</Text>
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, minWidth: 160 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.quantidadeItensComprados')}</Text>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 2 }}>{detalheLista?.quantidadeItensComprados ?? 0}</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: COLORS.textSecondary }}>
              {t('compras.lista.permissaoAtual')}: {t(`compras.permissoes.${permissaoAtual}`)}
            </Text>
            <Text style={{ color: conectadoTempoReal ? COLORS.success : COLORS.warning }}>
              {conectadoTempoReal ? t('compras.tempoReal.conectado') : t('compras.tempoReal.desconectado')}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <Botao titulo={t('compras.acoes.recarregar')} tipo="secundario" onPress={() => void carregarDetalheLista()} />
          {podeEditarItens ? <Botao titulo={t('compras.acoes.novoItem')} onPress={() => setModalNovoItem(true)} /> : null}
        </View>

        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>{t('comum.filtros.titulo')}</Text>
          <CampoTexto
            label={t('comum.filtros.descricao')}
            value={filtroItens.descricao}
            onChangeText={(descricao) => setFiltroItens((atual) => ({ ...atual, descricao }))}
          />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ minWidth: 210, flex: 1 }}>
              <CampoSelect
                label={t('compras.filtros.status')}
                value={filtroStatusRascunho}
                onChange={(valor) => setFiltroStatusRascunho(valor as typeof filtroStatus)}
                options={opcoesFiltro.map((item) => ({ value: item.value, label: t(`compras.filtros.${item.label}`) }))}
              />
            </View>
            <View style={{ minWidth: 210, flex: 1 }}>
              <CampoSelect
                label={t('compras.filtros.ordenacao')}
                value={ordenacaoRascunho}
                onChange={(valor) => setOrdenacaoRascunho(valor as OrdenacaoItensCompra)}
                options={opcoesOrdenacao.map((item) => ({ value: item.value, label: t(`compras.ordenacao.${item.label}`) }))}
              />
            </View>
            <View style={{ minWidth: 210, flex: 1 }}>
              <CampoSelect
                label={t('compras.ordenacao.ordemTitulo')}
                value={direcaoOrdenacaoRascunho}
                onChange={(valor) => setDirecaoOrdenacaoRascunho(valor as DirecaoOrdenacao)}
                options={[
                  { value: 'asc', label: t('compras.ordenacao.ordemAmigavelAsc') },
                  { value: 'desc', label: t('compras.ordenacao.ordemAmigavelDesc') },
                ]}
              />
            </View>
          </View>
          <CampoDataIntervalo
            label={`${t('comum.filtros.dataInicio')} - ${t('comum.filtros.dataFim')}`}
            dataInicio={filtroItens.dataInicio}
            dataFim={filtroItens.dataFim}
            onChange={({ dataInicio, dataFim }) => setFiltroItens((atual) => ({ ...atual, dataInicio, dataFim }))}
          />
          <Botao
            titulo={t('comum.acoes.consultar')}
            tipo="secundario"
            onPress={() => {
              Keyboard.dismiss();
              consultarFiltrosItens();
            }}
          />
        </View>

        {podeEditarItens ? (
          <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <CampoSelect
              label={t('compras.acoesLote.titulo')}
              value={acaoLoteSelecionada}
              onChange={(valor) => setAcaoLoteSelecionada(valor as AcaoLoteItensCompra)}
              options={opcoesAcaoLote.map((item) => ({ value: item.value, label: t(`compras.acoesLote.${item.chaveLabel}`) }))}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={{ color: COLORS.textSecondary }}>
                {t('compras.acoesLote.itensSelecionados')}: {itensSelecionadosIds.length}
              </Text>
              <Botao
                titulo={t('compras.acoesLote.executar')}
                tipo="perigo"
                onPress={() => void executarAcaoLote()}
                carregando={salvandoLote}
              />
            </View>
          </View>
        ) : null}

        {carregando ? <Text style={{ color: COLORS.textSecondary }}>{t('comum.carregando')}</Text> : null}
        {!carregando && itensFiltradosOrdenados.length === 0 ? <Text style={{ color: COLORS.textSecondary }}>{t('compras.lista.vazio')}</Text> : null}

        <View style={{ gap: 10 }}>
          {itensFiltradosOrdenados.map((item) => {
            const selecionado = itensSelecionadosIds.includes(item.id);
            return (
              <View key={item.id} style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    {podeEditarItens ? (
                      <Switch value={selecionado} onValueChange={() => alternarSelecaoItem(item.id)} />
                    ) : null}
                    <Text style={{ color: COLORS.textPrimary, flexShrink: 1 }}>{item.descricao}</Text>
                  </View>
                  {podeEditarItens ? (
                    <TouchableOpacity onPress={() => abrirEditarItem(item)}>
                      <Text style={{ color: COLORS.accent }}>{t('comum.acoes.editar')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: COLORS.textSecondary }}>
                    {t('compras.item.unidade')}: {t(`compras.unidades.${item.unidadeMedida}`)} | {t('compras.item.cor')}: {item.marcadorCor}
                  </Text>
                  <Switch value={item.comprado} onValueChange={(valor) => void alternarComprado(item, valor)} disabled={!podeEditarItens} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      label={t('compras.item.quantidade')}
                      value={String(item.quantidade)}
                      onChangeText={(valor) => void atualizarRapido(item, 'quantidade', valor)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CampoTexto
                      label={t('compras.item.valorUnitario')}
                      value={String(item.valorUnitario)}
                      onChangeText={(valor) => void atualizarRapido(item, 'valorUnitario', valor)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <Text style={{ color: COLORS.textSecondary }}>{t('compras.item.valorTotal')}: {formatarValorPorIdioma(item.valorTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginTop: 12 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700', marginBottom: 8 }}>{t('compras.logs.titulo')}</Text>
          {(detalheLista?.logs ?? []).length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.logs.vazio')}</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {(detalheLista?.logs ?? []).slice(0, 20).map((log) => (
                <Text key={log.id} style={{ color: COLORS.textSecondary }}>
                  {log.evento} - {formatarDataHoraPorIdioma(log.dataHoraUtc)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visivel={modalNovoItem} onFechar={() => setModalNovoItem(false)} titulo={t('compras.modalItem.novoTitulo')}>
        <CampoTexto label={t('compras.item.descricao')} value={descricao} onChangeText={setDescricao} />
        {sugestoesDescricao.length > 0 ? (
          <View style={{ maxHeight: 120, marginBottom: 8 }}>
            <ScrollView>
              {sugestoesDescricao.map((sugestao) => (
                <TouchableOpacity key={`${sugestao.descricao}-${sugestao.unidadeMedida}`} onPress={() => selecionarSugestao(sugestao)} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: COLORS.accent }}>{sugestao.descricao}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <CampoTexto
          label={t('compras.item.observacao')}
          value={observacao}
          onChangeText={setObservacao}
          multiline
          numberOfLines={3}
        />
        <CampoSelect
          label={t('compras.item.unidade')}
          value={unidadeMedida}
          onChange={(valor) => atualizarUnidadeMedidaFormulario(valor as ItemListaCompra['unidadeMedida'])}
          options={opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) }))}
        />
        <CampoTexto
          label={t('compras.item.quantidade')}
          value={quantidade}
          onChangeText={(valor) => setQuantidade(aplicarMascaraNumeroPorLocale(valor, localeAtivo, casasDecimaisQuantidade))}
          keyboardType={quantidadeExigeInteiro ? 'number-pad' : 'decimal-pad'}
        />
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('compras.item.cor')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {opcoesMarcadorCor.map((cor) => {
              const selecionada = marcadorCor === cor;
              return (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setMarcadorCor(cor)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: cor,
                    borderWidth: selecionada ? 3 : 1,
                    borderColor: selecionada ? COLORS.textPrimary : COLORS.borderColor,
                  }}
                />
              );
            })}
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 8 }}>
            {t('compras.item.corSelecionada', { cor: marcadorCor })}
          </Text>
        </View>
        <CampoTexto
          label={t('compras.item.valorUnitario')}
          value={valorUnitario}
          onChangeText={(valor) => setValorUnitario(aplicarMascaraNumeroPorLocale(valor, localeAtivo, 2))}
          keyboardType="decimal-pad"
        />
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('compras.item.valorTotal')}</Text>
          <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.textPrimary }}>{formatarValorPorIdioma(valorTotalCalculado)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalNovoItem(false)} />
          <Botao titulo={t('comum.acoes.salvar')} onPress={() => void salvarNovoItem()} />
        </View>
      </Modal>

      <Modal visivel={modalEditarItem} onFechar={() => setModalEditarItem(false)} titulo={t('compras.modalItem.editarTitulo')}>
        <CampoTexto label={t('compras.item.descricao')} value={descricao} onChangeText={setDescricao} />
        <CampoTexto
          label={t('compras.item.observacao')}
          value={observacao}
          onChangeText={setObservacao}
          multiline
          numberOfLines={3}
        />
        <CampoSelect
          label={t('compras.item.unidade')}
          value={unidadeMedida}
          onChange={(valor) => atualizarUnidadeMedidaFormulario(valor as ItemListaCompra['unidadeMedida'])}
          options={opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) }))}
        />
        <CampoTexto
          label={t('compras.item.quantidade')}
          value={quantidade}
          onChangeText={(valor) => setQuantidade(aplicarMascaraNumeroPorLocale(valor, localeAtivo, casasDecimaisQuantidade))}
          keyboardType={quantidadeExigeInteiro ? 'number-pad' : 'decimal-pad'}
        />
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('compras.item.cor')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {opcoesMarcadorCor.map((cor) => {
              const selecionada = marcadorCor === cor;
              return (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setMarcadorCor(cor)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: cor,
                    borderWidth: selecionada ? 3 : 1,
                    borderColor: selecionada ? COLORS.textPrimary : COLORS.borderColor,
                  }}
                />
              );
            })}
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 8 }}>
            {t('compras.item.corSelecionada', { cor: marcadorCor })}
          </Text>
        </View>
        <CampoTexto
          label={t('compras.item.valorUnitario')}
          value={valorUnitario}
          onChangeText={(valor) => setValorUnitario(aplicarMascaraNumeroPorLocale(valor, localeAtivo, 2))}
          keyboardType="decimal-pad"
        />
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('compras.item.valorTotal')}</Text>
          <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.textPrimary }}>{formatarValorPorIdioma(valorTotalCalculado)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalEditarItem(false)} />
          <Botao titulo={t('comum.acoes.salvar')} onPress={() => void salvarEdicaoCompleta()} />
        </View>
      </Modal>

    </View>
  );
}
