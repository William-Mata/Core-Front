import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoAutoCompletar } from '../../../src/componentes/comuns/CampoAutoCompletar';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoDataIntervalo } from '../../../src/componentes/comuns/CampoData';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  aplicarAcaoLoteItensCompraApi,
  atualizarItemListaCompraApi,
  buscarSugestoesItensCompraApi,
  criarItemListaCompraApi,
  marcarItemListaCompraApi,
  obterListaCompraApi,
  removerItemListaCompraApi,
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
  SugestaoItemCompra,
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
import { formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
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

const nomesMarcadorCorPorHex: Record<string, string> = {
  '#ef4444': 'compras.item.cores.vermelho',
  '#f97316': 'compras.item.cores.laranja',
  '#f59e0b': 'compras.item.cores.amarelo',
  '#84cc16': 'compras.item.cores.lima',
  '#22c55e': 'compras.item.cores.verde',
  '#14b8a6': 'compras.item.cores.turquesa',
  '#0ea5e9': 'compras.item.cores.azulClaro',
  '#6366f1': 'compras.item.cores.indigo',
  '#a855f7': 'compras.item.cores.violeta',
  '#ec4899': 'compras.item.cores.rosa',
};

const unidadesQuantidadeInteira = new Set<ItemListaCompra['unidadeMedida']>([
  'unidade',
  'kg',
  'g',
  'mg',
  'l',
  'ml',
  'pacote',
  'caixa',
]);

function obterCasasDecimaisQuantidade(unidade: ItemListaCompra['unidadeMedida']): number {
  return unidadesQuantidadeInteira.has(unidade) ? 0 : 2;
}

interface FiltroItensValor {
  descricao: string;
  dataInicio: string;
  dataFim: string;
}

interface SugestaoDescricaoAutoCompletar {
  id: string;
  rotulo: string;
  valor: string;
  unidadeMedida: ItemListaCompra['unidadeMedida'];
  valorReferencia: number;
  marcadorCor: string;
}

const filtroItensInicial: FiltroItensValor = {
  descricao: '',
  dataInicio: '',
  dataFim: '',
};

const opcoesAcaoLote: Array<{
  value: AcaoLoteItensCompra;
  chaveLabel: string;
  perigosa?: boolean;
}> = [
  { value: 'CriarNovaListaComComprados', chaveLabel: 'criarNovaListaComComprados' },
  { value: 'CriarNovaListaComNaoComprados', chaveLabel: 'criarNovaListaComNaoComprados' },
  { value: 'DuplicarLista', chaveLabel: 'duplicarLista' },
  { value: 'MesclarDuplicados', chaveLabel: 'mesclarDuplicados' },
  { value: 'ExcluirComprados', chaveLabel: 'excluirComprados', perigosa: true },
  { value: 'ExcluirNaoComprados', chaveLabel: 'excluirNaoComprados', perigosa: true },
  { value: 'ExcluirSemPreco', chaveLabel: 'excluirSemPreco', perigosa: true },
  { value: 'LimparLista', chaveLabel: 'limparLista', perigosa: true },
  { value: 'ResetarPrecos', chaveLabel: 'resetarPrecos', perigosa: true },
  { value: 'ResetarCores', chaveLabel: 'resetarCores', perigosa: true },
];

function converterHexEmRgba(corHex: string, opacidade: number): string {
  const semHash = corHex.trim().replace('#', '');
  const hexNormalizado = semHash.length === 3
    ? semHash.split('').map((digito) => `${digito}${digito}`).join('')
    : semHash;

  if (!/^[\da-fA-F]{6}$/.test(hexNormalizado)) {
    return COLORS.bgSecondary;
  }

  const r = Number.parseInt(hexNormalizado.slice(0, 2), 16);
  const g = Number.parseInt(hexNormalizado.slice(2, 4), 16);
  const b = Number.parseInt(hexNormalizado.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacidade})`;
}

function obterPermissaoAtual(detalhe: ListaCompraDetalhe | null, usuarioId?: number): PermissaoParticipanteLista {
  if (!detalhe) return 'leitor';

  const usuarioIdNormalizado = Number(usuarioId);
  if (Number.isFinite(usuarioIdNormalizado) && usuarioIdNormalizado > 0) {
    const participante = detalhe.participantes.find((item) => Number(item.usuarioId) === usuarioIdNormalizado);
    if (participante?.permissao) return participante.permissao;

    if (Number(detalhe.criadoPorUsuarioId) === usuarioIdNormalizado) return 'proprietario';
  }

  if (detalhe.papelUsuario) return detalhe.papelUsuario;
  return 'leitor';
}

function arredondarValorAnimado(valor: number): number {
  const valorArredondado = Number(valor.toFixed(2));
  return Object.is(valorArredondado, -0) ? 0 : valorArredondado;
}

interface NumeroResumoAnimadoProps {
  valorFinal: number;
  deveAnimar: boolean;
  duracaoMs?: number;
  formatar: (valor: number) => string;
  estilo?: { color?: string; fontWeight?: '700' | '600' | '500' | '400'; marginTop?: number };
}

function NumeroResumoAnimado({
  valorFinal,
  deveAnimar,
  duracaoMs = 1000,
  formatar,
  estilo,
}: NumeroResumoAnimadoProps) {
  const animacaoValor = useRef(new Animated.Value(0)).current;
  const [valorExibido, setValorExibido] = useState(() => arredondarValorAnimado(Number(valorFinal) || 0));
  const animacaoJaExecutada = useRef(false);

  useEffect(() => {
    const valorNormalizado = Number.isFinite(valorFinal) ? valorFinal : 0;
    const ambienteTeste = process.env.NODE_ENV === 'test';

    if (ambienteTeste) {
      animacaoJaExecutada.current = true;
      setValorExibido(arredondarValorAnimado(valorNormalizado));
      return;
    }

    if (!deveAnimar || animacaoJaExecutada.current) {
      setValorExibido(arredondarValorAnimado(valorNormalizado));
      return;
    }

    let componenteAtivo = true;
    animacaoValor.setValue(0);

    const idListener = animacaoValor.addListener(({ value }) => {
      if (!componenteAtivo) return;
      const valorInterpolado = value * valorNormalizado;
      setValorExibido(arredondarValorAnimado(valorInterpolado));
    });

    Animated.timing(animacaoValor, {
      toValue: 1,
      duration: duracaoMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      if (!componenteAtivo) return;
      animacaoJaExecutada.current = true;
      setValorExibido(arredondarValorAnimado(valorNormalizado));
    });

    return () => {
      componenteAtivo = false;
      animacaoValor.removeListener(idListener);
      animacaoValor.stopAnimation();
    };
  }, [animacaoValor, deveAnimar, duracaoMs, valorFinal]);

  return <Text style={estilo}>{formatar(valorExibido)}</Text>;
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
  } = usarComprasStore();

  const [detalheLista, setDetalheLista] = useState<ListaCompraDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [conectadoTempoReal, setConectadoTempoReal] = useState(false);
  const [menuAcoesLoteAberto, setMenuAcoesLoteAberto] = useState(false);
  const [menuAcoesItemAbertoId, setMenuAcoesItemAbertoId] = useState<number | null>(null);
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [modalEditarItem, setModalEditarItem] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<ItemListaCompra | null>(null);
  const [descricao, setDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<ItemListaCompra['unidadeMedida']>('unidade');
  const localeAtivo = obterLocaleAtivo();
  const [quantidade, setQuantidade] = useState(() =>
    formatarNumeroEntradaPorLocale(1, localeAtivo, obterCasasDecimaisQuantidade('unidade')),
  );
  const [valorUnitario, setValorUnitario] = useState(() => formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
  const [valorTotal, setValorTotal] = useState(() => formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
  const [origemCalculoValor, setOrigemCalculoValor] = useState<'unitario' | 'total'>('unitario');
  const [marcadorCor, setMarcadorCor] = useState<string>(opcoesMarcadorCor[0]);
  const [filtroItens, setFiltroItens] = useState<FiltroItensValor>(filtroItensInicial);
  const [filtroItensAplicado, setFiltroItensAplicado] = useState<FiltroItensValor>(filtroItensInicial);
  const [filtroStatusRascunho, setFiltroStatusRascunho] = useState<typeof filtroStatus>(filtroStatus);
  const [ordenacaoRascunho, setOrdenacaoRascunho] = useState<OrdenacaoItensCompra>(ordenacao);
  const [direcaoOrdenacaoRascunho, setDirecaoOrdenacaoRascunho] = useState<DirecaoOrdenacao>(direcaoOrdenacao);

  const obterNomeMarcadorCor = useCallback((corHex: string) => {
    const chaveTraducaoCor = nomesMarcadorCorPorHex[corHex.toLowerCase()];
    if (!chaveTraducaoCor) return t('compras.item.cores.personalizada');
    return t(chaveTraducaoCor);
  }, [t]);
  const carregarDetalheListaRef = useRef<() => Promise<void>>(async () => undefined);

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
    carregarDetalheListaRef.current = carregarDetalheLista;
  }, [carregarDetalheLista]);

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
            void carregarDetalheListaRef.current();
          },
        });
        clienteLimpeza = cliente;
        await cliente.iniciar();
        if (!ativo) {
          await cliente.parar().catch(() => undefined);
          return;
        }
        await cliente.entrarLista(listaId);
      } catch {
        if (ativo) setConectadoTempoReal(false);
      }
    };

    void iniciar();

    return () => {
      ativo = false;
      const clienteAtual = clienteLimpeza;
      if (!clienteAtual) return;
      void clienteAtual.sairLista(listaId).catch(() => undefined);
      void clienteAtual.parar().catch(() => undefined);
    };
  }, [listaId]);

  const permissaoAtual = useMemo(() => obterPermissaoAtual(detalheLista, usuarioId), [detalheLista, usuarioId]);
  const usuarioPodeEditarLista = useMemo(() => {
    const possuiPapelEdicao = permissaoAtual === 'proprietario' || permissaoAtual === 'coproprietario';
    const listaEditavel = detalheLista?.status === 'ativa';
    return possuiPapelEdicao && listaEditavel;
  }, [detalheLista?.status, permissaoAtual]);
  const podeEditarItens = Boolean(detalheLista) && usuarioPodeEditarLista;
  const deveAnimarResumo = useMemo(() => Boolean(detalheLista), [detalheLista]);
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
  const valorTotalNumero = useMemo(
    () => converterTextoNumeroPorLocale(valorTotal, localeAtivo),
    [localeAtivo, valorTotal],
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
    setValorTotal(formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
    setOrigemCalculoValor('unitario');
    setMarcadorCor(opcoesMarcadorCor[0]);
  };

  const calcularValorTotalFormatado = useCallback((quantidadeTexto: string, valorUnitarioTexto: string) => {
    const quantidadeConvertida = converterTextoNumeroPorLocale(quantidadeTexto, localeAtivo);
    const valorUnitarioConvertido = converterTextoNumeroPorLocale(valorUnitarioTexto, localeAtivo);
    const totalConvertido = calcularValorTotalItemCompra(quantidadeConvertida, valorUnitarioConvertido);
    return formatarNumeroEntradaPorLocale(totalConvertido, localeAtivo, 2);
  }, [localeAtivo]);

  const calcularValorUnitarioFormatado = useCallback((quantidadeTexto: string, valorTotalTexto: string) => {
    const quantidadeConvertida = converterTextoNumeroPorLocale(quantidadeTexto, localeAtivo);
    const valorTotalConvertido = converterTextoNumeroPorLocale(valorTotalTexto, localeAtivo);
    const valorUnitarioCalculado = quantidadeConvertida > 0 ? valorTotalConvertido / quantidadeConvertida : 0;
    return formatarNumeroEntradaPorLocale(valorUnitarioCalculado, localeAtivo, 2);
  }, [localeAtivo]);

  const atualizarQuantidadeFormulario = useCallback((valorDigitado: string, casasDecimais: number) => {
    const quantidadeFormatada = aplicarMascaraNumeroPorLocale(valorDigitado, localeAtivo, casasDecimais);
    setQuantidade(quantidadeFormatada);

    if (origemCalculoValor === 'total') {
      setValorUnitario(calcularValorUnitarioFormatado(quantidadeFormatada, valorTotal));
      return;
    }

    setValorTotal(calcularValorTotalFormatado(quantidadeFormatada, valorUnitario));
  }, [calcularValorTotalFormatado, calcularValorUnitarioFormatado, localeAtivo, origemCalculoValor, valorTotal, valorUnitario]);

  const atualizarValorUnitarioFormulario = useCallback((valorDigitado: string) => {
    const valorUnitarioFormatado = aplicarMascaraNumeroPorLocale(valorDigitado, localeAtivo, 2);
    setOrigemCalculoValor('unitario');
    setValorUnitario(valorUnitarioFormatado);
    setValorTotal(calcularValorTotalFormatado(quantidade, valorUnitarioFormatado));
  }, [calcularValorTotalFormatado, localeAtivo, quantidade]);

  const atualizarValorTotalFormulario = useCallback((valorDigitado: string) => {
    const valorTotalFormatado = aplicarMascaraNumeroPorLocale(valorDigitado, localeAtivo, 2);
    setOrigemCalculoValor('total');
    setValorTotal(valorTotalFormatado);
    setValorUnitario(calcularValorUnitarioFormatado(quantidade, valorTotalFormatado));
  }, [calcularValorUnitarioFormatado, localeAtivo, quantidade]);

  const atualizarUnidadeMedidaFormulario = (proximaUnidade: ItemListaCompra['unidadeMedida']) => {
    setUnidadeMedida(proximaUnidade);
    setQuantidade((valorAtual) => {
      const numeroAtual = converterTextoNumeroPorLocale(valorAtual, localeAtivo);
      const numeroAjustado = unidadesQuantidadeInteira.has(proximaUnidade) ? Math.trunc(numeroAtual) : numeroAtual;
      const quantidadeFormatada = formatarNumeroEntradaPorLocale(
        numeroAjustado,
        localeAtivo,
        obterCasasDecimaisQuantidade(proximaUnidade),
      );

      if (origemCalculoValor === 'total') {
        setValorUnitario(calcularValorUnitarioFormatado(quantidadeFormatada, valorTotal));
        return quantidadeFormatada;
      }

      setValorTotal(calcularValorTotalFormatado(quantidadeFormatada, valorUnitario));
      return quantidadeFormatada;
    });
  };

  const buscarSugestoesDescricao = useCallback(async (termo: string): Promise<SugestaoDescricaoAutoCompletar[]> => {
    if (!Number.isFinite(listaId)) return [];
    const sugestoesApi = await buscarSugestoesItensCompraApi(listaId, { termo, limite: 8 });
    return sugestoesApi.map((sugestao: SugestaoItemCompra, indice) => ({
      id: `${sugestao.descricao}-${sugestao.unidadeMedida}-${indice}`,
      rotulo: sugestao.descricao,
      valor: sugestao.descricao,
      unidadeMedida: sugestao.unidadeMedida,
      valorReferencia: sugestao.valorReferencia,
      marcadorCor: sugestao.marcadorCor,
    }));
  }, [listaId]);

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
      || valorTotalNumero <= 0
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
    setValorTotal(formatarNumeroEntradaPorLocale(item.valorTotal, localeAtivo, 2));
    setOrigemCalculoValor('unitario');
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
      || valorTotalNumero <= 0
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

  const alternarComprado = async (item: ItemListaCompra, comprado: boolean) => {
    if (!podeEditarItens) return;
    try {
      await marcarItemListaCompraApi(listaId, item.id, comprado);
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarItem'));
    }
  };

  const executarAcaoLote = async (acaoSelecionada: AcaoLoteItensCompra) => {
    if (!podeEditarItens) return;
    const opcaoSelecionada = opcoesAcaoLote.find((item) => item.value === acaoSelecionada);
    if (!opcaoSelecionada) return;

    setMenuAcoesLoteAberto(false);
    const rotuloAcaoSelecionada = t(`compras.acoesLote.${opcaoSelecionada.chaveLabel}`);
    const acaoDestrutiva = Boolean(opcaoSelecionada.perigosa);

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
        acao: acaoSelecionada,
      });
      notificarSucesso(t('compras.mensagens.acaoLoteSucesso'));
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.acaoLoteErro'));
    } finally {
      setSalvandoLote(false);
    }
  };

  const removerItem = async (item: ItemListaCompra) => {
    if (!podeEditarItens) return;
    setMenuAcoesItemAbertoId(null);

    const confirmar = await solicitarConfirmacao(
      t('compras.confirmacoes.removerItem'),
      {
        titulo: t('comum.confirmacoes.tituloAcaoCritica'),
        textoConfirmar: t('comum.acoes.excluir'),
        textoCancelar: t('comum.acoes.cancelar'),
        mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
        tipoConfirmar: 'perigo',
      },
    );
    if (!confirmar) return;

    try {
      await removerItemListaCompraApi(listaId, item.id);
      notificarSucesso(t('compras.mensagens.itemRemovido'));
      await carregarDetalheLista();
    } catch {
      notificarErro(t('compras.mensagens.erroRemoverItem'));
    }
  };

  const executarAcaoItem = (item: ItemListaCompra, acao: 'editar' | 'excluir') => {
    if (acao === 'editar') {
      setMenuAcoesItemAbertoId(null);
      abrirEditarItem(item);
      return;
    }

    void removerItem(item);
  };

  const selecionarSugestao = (sugestao: SugestaoDescricaoAutoCompletar) => {
    setDescricao(sugestao.valor);
    atualizarUnidadeMedidaFormulario(sugestao.unidadeMedida);
    const valorUnitarioSugestao = formatarNumeroEntradaPorLocale(sugestao.valorReferencia, localeAtivo, 2);
    setValorUnitario(valorUnitarioSugestao);
    setOrigemCalculoValor('unitario');
    setValorTotal(calcularValorTotalFormatado(quantidade, valorUnitarioSugestao));
    setMarcadorCor(sugestao.marcadorCor);
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
        <View style={{ marginBottom: 10 }}>
          {podeEditarItens ? (
            <Botao
              titulo={`+ ${t('compras.acoes.novoItem')}`}
              onPress={() => {
                setMenuAcoesItemAbertoId(null);
                limparFormularioItem();
                setModalNovoItem(true);
              }}
              estilo={{ width: '100%' }}
            />
          ) : null}
        </View>

        <View
          style={{
            position: 'relative',
            zIndex: 4,
            elevation: 0,
            overflow: 'visible',
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
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

        <View
          style={{
            position: 'relative',
            zIndex: menuAcoesLoteAberto ? 160 : 6,
            elevation: menuAcoesLoteAberto ? 20 : 0,
            overflow: 'visible',
            backgroundColor: COLORS.bgTertiary,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              position: 'relative',
              zIndex: 210,
              elevation: 22,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{t('compras.lista.resumo')}</Text>
              <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                {t('compras.lista.permissaoAtual')}: {t(`compras.permissoes.${permissaoAtual}`)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => void carregarDetalheLista()}
                accessibilityRole="button"
                accessibilityLabel={t('compras.acoes.recarregar')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor,
                  backgroundColor: COLORS.bgSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: COLORS.accent, fontSize: 18, lineHeight: 18 }}>{carregando ? '...' : '\u21BB'}</Text>
              </TouchableOpacity>

              {podeEditarItens ? (
                <View style={{ position: 'relative', zIndex: 170 }}>
                  <TouchableOpacity
                    onPress={() => setMenuAcoesLoteAberto((atual) => !atual)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: menuAcoesLoteAberto ? COLORS.borderAccent : COLORS.borderColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: menuAcoesLoteAberto ? COLORS.accentSubtle : COLORS.bgSecondary,
                    }}
                  >
                    <Text
                      style={{
                        color: menuAcoesLoteAberto ? COLORS.accent : COLORS.textPrimary,
                        fontSize: 18,
                        fontWeight: '700',
                        lineHeight: 18,
                      }}
                    >
                      {'\u22EE'}
                    </Text>
                  </TouchableOpacity>

                  {menuAcoesLoteAberto ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 36,
                        right: 0,
                        zIndex: 180,
                        width: 280,
                        borderWidth: 1,
                        borderColor: COLORS.borderAccent,
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: COLORS.bgSecondary,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.35,
                        shadowRadius: 12,
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.borderColor,
                          backgroundColor: COLORS.accentSubtle,
                        }}
                      >
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{t('compras.acoesLote.titulo')}</Text>
                      </View>

                      {opcoesAcaoLote.map((opcao, indice) => (
                        <TouchableOpacity
                          key={opcao.value}
                          onPress={() => void executarAcaoLote(opcao.value)}
                          disabled={salvandoLote}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 11,
                            borderTopWidth: indice === 0 ? 0 : 1,
                            borderTopColor: COLORS.borderColor,
                            backgroundColor: COLORS.bgSecondary,
                            opacity: salvandoLote ? 0.6 : 1,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {opcao.perigosa ? (
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 999,
                                  backgroundColor: COLORS.borderAccent,
                                }}
                              />
                            ) : null}
                            <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>
                              {t(`compras.acoesLote.${opcao.chaveLabel}`)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ position: 'relative', zIndex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            <View style={{ backgroundColor: COLORS.accentSubtle, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderAccent, padding: 12, minWidth: 160, flex: 1 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.totalLista')}</Text>
              <NumeroResumoAnimado
                valorFinal={detalheLista?.valorTotal ?? 0}
                deveAnimar={deveAnimarResumo}
                formatar={(valor) => formatarValorPorIdioma(valor)}
                estilo={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 }}
              />
            </View>
            <View style={{ backgroundColor: COLORS.successSoft, borderRadius: 12, borderWidth: 1, borderColor: COLORS.success, padding: 12, minWidth: 160, flex: 1 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.totalComprado')}</Text>
              <NumeroResumoAnimado
                valorFinal={detalheLista?.valorComprado ?? 0}
                deveAnimar={deveAnimarResumo}
                formatar={(valor) => formatarValorPorIdioma(valor)}
                estilo={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 }}
              />
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, padding: 12, minWidth: 160, flex: 1 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.percentualComprado')}</Text>
              <NumeroResumoAnimado
                valorFinal={detalheLista?.percentualComprado ?? 0}
                deveAnimar={deveAnimarResumo}
                formatar={(valor) => `${valor.toFixed(2)}%`}
                estilo={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 }}
              />
            </View>
            <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, padding: 12, minWidth: 160, flex: 1 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('compras.lista.quantidadeItens')}</Text>
              <NumeroResumoAnimado
                valorFinal={detalheLista?.quantidadeItens ?? 0}
                deveAnimar={deveAnimarResumo}
                formatar={(valor) => `${Math.round(valor)}`}
                estilo={{ color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 }}
              />
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <DistintivoStatus
              rotulo={conectadoTempoReal ? t('compras.tempoReal.sincronizando') : t('compras.tempoReal.desconectado')}
              corTexto={conectadoTempoReal ? COLORS.success : COLORS.error}
              corBorda={conectadoTempoReal ? COLORS.success : COLORS.error}
              corFundo={conectadoTempoReal ? COLORS.successSoft : COLORS.errorSoft}
            />
          </View>
        </View>

        {carregando ? <Text style={{ color: COLORS.textSecondary }}>{t('comum.carregando')}</Text> : null}
        {!carregando && itensFiltradosOrdenados.length === 0 ? <Text style={{ color: COLORS.textSecondary }}>{t('compras.lista.vazio')}</Text> : null}

        <View style={{ gap: 10, position: 'relative', zIndex: 2 }}>
          {itensFiltradosOrdenados.map((item) => {
            const menuAcoesAberto = menuAcoesItemAbertoId === item.id;
            const quantidadeFormatada = formatarNumeroEntradaPorLocale(
              item.quantidade,
              localeAtivo,
              Number.isInteger(item.quantidade) ? 0 : 2,
            );

            return (
              <View
                key={item.id}
                style={{
                  position: 'relative',
                  zIndex: menuAcoesAberto ? 70 : 1,
                  elevation: menuAcoesAberto ? 16 : 0,
                  overflow: 'visible',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor,
                  borderLeftWidth: 4,
                  borderLeftColor: item.marcadorCor,
                  padding: 12,
                  backgroundColor: converterHexEmRgba(item.marcadorCor, 0.08),
                }}
              >
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <TouchableOpacity
                    onPress={() => void alternarComprado(item, !item.comprado)}
                    disabled={!podeEditarItens}
                    style={{ marginTop: 2 }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: item.comprado ? COLORS.success : COLORS.borderColor,
                        backgroundColor: item.comprado ? COLORS.successSoft : COLORS.bgSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: podeEditarItens ? 1 : 0.7,
                      }}
                    >
                      {item.comprado ? <Text style={{ color: COLORS.success, fontSize: 13, fontWeight: '700' }}>{'\u2713'}</Text> : null}
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', textDecorationLine: item.comprado ? 'line-through' : 'none' }}>
                      {item.descricao}
                    </Text>
                    {item.observacao ? <Text style={{ color: COLORS.textSecondary, marginTop: 2 }}>{item.observacao}</Text> : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.item.quantidade')}: {quantidadeFormatada} {t(`compras.unidades.${item.unidadeMedida}`)}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.item.valorUnitario')}: {formatarValorPorIdioma(item.valorUnitario)}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.item.valorTotal')}: {formatarValorPorIdioma(item.valorTotal)}
                      </Text>
                    </View>

                    <View
                      style={{
                        marginTop: 8,
                        alignSelf: 'flex-start',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: item.marcadorCor,
                        backgroundColor: converterHexEmRgba(item.marcadorCor, 0.15),
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: item.marcadorCor }} />
                      <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{obterNomeMarcadorCor(item.marcadorCor)}</Text>
                    </View>
                  </View>

                  {podeEditarItens ? (
                    <View style={{ position: 'relative', zIndex: 75 }}>
                      <TouchableOpacity
                        onPress={() => setMenuAcoesItemAbertoId((atual) => (atual === item.id ? null : item.id))}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: menuAcoesAberto ? COLORS.borderAccent : COLORS.borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: menuAcoesAberto ? COLORS.accentSubtle : COLORS.bgSecondary,
                        }}
                      >
                        <Text style={{ color: menuAcoesAberto ? COLORS.accent : COLORS.textPrimary, fontSize: 18, fontWeight: '700', lineHeight: 18 }}>
                          {'\u22EE'}
                        </Text>
                      </TouchableOpacity>

                      {menuAcoesAberto ? (
                        <View
                          style={{
                            position: 'absolute',
                            top: 34,
                            right: 0,
                            zIndex: 140,
                            width: 170,
                            borderWidth: 1,
                            borderColor: COLORS.borderAccent,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: COLORS.bgSecondary,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                          }}
                        >
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: COLORS.borderColor,
                              backgroundColor: COLORS.accentSubtle,
                            }}
                          >
                            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{t('compras.acoes.menuAcoes')}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => executarAcaoItem(item, 'editar')}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 11,
                              backgroundColor: COLORS.bgSecondary,
                            }}
                          >
                            <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>{t('comum.acoes.editar')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => executarAcaoItem(item, 'excluir')}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 11,
                              borderTopWidth: 1,
                              borderTopColor: COLORS.borderColor,
                              backgroundColor: COLORS.bgSecondary,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 999,
                                  backgroundColor: COLORS.borderAccent,
                                }}
                              />
                              <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>{t('comum.acoes.excluir')}</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      <Modal visivel={modalNovoItem} onFechar={() => setModalNovoItem(false)} titulo={t('compras.modalItem.novoTitulo')}>
        <CampoAutoCompletar<SugestaoDescricaoAutoCompletar>
          label={t('compras.item.descricao')}
          value={descricao}
          onChange={setDescricao}
          buscarSugestoes={buscarSugestoesDescricao}
          onSelecionarSugestao={selecionarSugestao}
          minimoCaracteresBusca={3}
          aguardarBuscaMs={300}
          mensagemSemSugestoes={t('comum.autocomplete.semSugestoes')}
        />
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
          onChangeText={(valor) => atualizarQuantidadeFormulario(valor, casasDecimaisQuantidade)}
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
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <CampoTexto
              label={t('compras.item.valorUnitario')}
              value={valorUnitario}
              onChangeText={atualizarValorUnitarioFormulario}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              label={t('compras.item.valorTotal')}
              value={valorTotal}
              onChangeText={atualizarValorTotalFormulario}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalNovoItem(false)} />
          <Botao titulo={t('comum.acoes.salvar')} onPress={() => void salvarNovoItem()} />
        </View>
      </Modal>

      <Modal visivel={modalEditarItem} onFechar={() => setModalEditarItem(false)} titulo={t('compras.modalItem.editarTitulo')}>
        <CampoAutoCompletar<SugestaoDescricaoAutoCompletar>
          label={t('compras.item.descricao')}
          value={descricao}
          onChange={setDescricao}
          buscarSugestoes={buscarSugestoesDescricao}
          onSelecionarSugestao={selecionarSugestao}
          minimoCaracteresBusca={3}
          aguardarBuscaMs={300}
          mensagemSemSugestoes={t('comum.autocomplete.semSugestoes')}
        />
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
          onChangeText={(valor) => atualizarQuantidadeFormulario(valor, casasDecimaisQuantidade)}
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
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <CampoTexto
              label={t('compras.item.valorUnitario')}
              value={valorUnitario}
              onChangeText={atualizarValorUnitarioFormulario}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              label={t('compras.item.valorTotal')}
              value={valorTotal}
              onChangeText={atualizarValorTotalFormulario}
              keyboardType="decimal-pad"
            />
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

