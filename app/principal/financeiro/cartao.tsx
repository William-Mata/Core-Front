import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma, formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { BANDEIRAS_CARTAO_POPULARES, obterIconeBandeiraCartao } from '../../../src/utils/icones';

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
  data: string;
  descricao: string;
  valor: number;
}

interface Cartao {
  id: number;
  descricao: string;
  bandeira: string;
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

const transacoesPendentesPorCartao: Record<string, number> = {
  'Nubank Gold': 1,
  'Itau Empresas': 0,
};

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

export default function TelaCartao() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoTela, setModoTela] = useState<ModoTela>('lista');
  const [cartaoSelecionadoId, setCartaoSelecionadoId] = useState<number | null>(null);
  const [cartaoDetalheAberto, setCartaoDetalheAberto] = useState<number | null>(null);
  const [mesPorCartao, setMesPorCartao] = useState<Record<number, string>>({ 1: '2026-03', 2: '2026-03' });
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [formulario, setFormulario] = useState<CartaoForm>(() => criarFormularioVazio(locale));
  const [cartoes, setCartoes] = useState<Cartao[]>([
    {
      id: 1,
      descricao: 'Nubank Gold',
      bandeira: 'Mastercard',
      tipo: 'credito',
      limite: 5000,
      saldoDisponivel: 3280.45,
      diaVencimento: '2026-03-12',
      dataVencimentoCartao: '2026-03-12',
      status: 'ativo',
      lancamentos: [
        { id: 1, data: '2026-03-05', descricao: 'Supermercado', valor: 320.6 },
        { id: 2, data: '2026-03-07', descricao: 'Combustivel', valor: 190.4 },
      ],
      logs: [
        { id: 1, data: '2026-01-10', acao: 'CRIADO', descricao: 'Cartao criado com status ativo.' },
        { id: 2, data: '2026-03-07', acao: 'ATUALIZADO', descricao: 'Dados do cartao foram atualizados.' },
      ],
    },
    {
      id: 2,
      descricao: 'Itau Empresas',
      bandeira: 'Visa',
      tipo: 'debito',
      limite: 0,
      saldoDisponivel: 1185.2,
      diaVencimento: '',
      dataVencimentoCartao: '',
      status: 'inativo',
      lancamentos: [
        { id: 1, data: '2026-03-02', descricao: 'Combustivel', valor: 240.5 },
        { id: 2, data: '2026-03-11', descricao: 'Pedagio', valor: 32.9 },
        { id: 3, data: '2026-02-18', descricao: 'Estacionamento', valor: 45 },
      ],
      logs: [
        { id: 1, data: '2026-02-05', acao: 'CRIADO', descricao: 'Cartao criado com status ativo.' },
        { id: 2, data: '2026-03-20', acao: 'INATIVADO', descricao: 'Cartao inativado sem transacoes pendentes.' },
      ],
    },
  ]);

  const cartaoSelecionado = cartoes.find((item) => item.id === cartaoSelecionadoId) ?? null;

  const cartoesFiltrados = useMemo(
    () =>
      cartoes.filter((cartao) => {
        const bateId = !filtro.id || String(cartao.id).includes(filtro.id);
        const termo = filtro.descricao.trim().toLowerCase();
        const tipoTraduzido = t(`financeiro.cartao.tipos.${cartao.tipo}`).toLowerCase();
        const statusTraduzido = t(`financeiro.cartao.status.${cartao.status}`).toLowerCase();
        const bateDescricao =
          !termo ||
          cartao.descricao.toLowerCase().includes(termo) ||
          cartao.bandeira.toLowerCase().includes(termo) ||
          tipoTraduzido.includes(termo) ||
          statusTraduzido.includes(termo);
        const baseDataFiltro = cartao.dataVencimentoCartao || cartao.logs[0]?.data || '';
        const bateData = estaDentroIntervalo(baseDataFiltro, filtro.dataInicio, filtro.dataFim);
        return bateId && bateDescricao && bateData;
      }),
    [cartoes, filtro, t],
  );

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
    setCartaoSelecionadoId(cartao.id);
    preencherFormulario(cartao);
    setModoTela('edicao');
  };

  const abrirVisualizacao = (cartao: Cartao) => {
    setCartaoSelecionadoId(cartao.id);
    preencherFormulario(cartao);
    setModoTela('visualizacao');
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

  const salvar = () => {
    const base = validarFormulario();
    if (!base) return;

    const diaVencimento = tipoExigeVencimento(formulario.tipo) ? formulario.diaVencimento : '';
    const dataVencimentoCartao = tipoExigeVencimento(formulario.tipo) ? formulario.dataVencimentoCartao : '';

    if (modoTela === 'novo') {
      const novoId = cartoes.length > 0 ? Math.max(...cartoes.map((item) => item.id)) + 1 : 1;
      setCartoes((atual) => [
        ...atual,
        {
          id: novoId,
          descricao: formulario.descricao,
          bandeira: formulario.bandeira,
          tipo: formulario.tipo,
          limite: base.limite,
          saldoDisponivel: base.saldoDisponivel,
          diaVencimento,
          dataVencimentoCartao,
          status: 'ativo',
          lancamentos: [],
          logs: [{ id: 1, data: new Date().toISOString().split('T')[0], acao: 'CRIADO', descricao: t('financeiro.cartao.logs.criado') }],
        },
      ]);
      notificarSucesso(t('financeiro.cartao.mensagens.criado'));
    } else if (modoTela === 'edicao' && cartaoSelecionado) {
      setCartoes((atual) =>
        atual.map((cartao) =>
          cartao.id === cartaoSelecionado.id
            ? {
                ...cartao,
                descricao: formulario.descricao,
                bandeira: formulario.bandeira,
                tipo: formulario.tipo,
                limite: base.limite,
                diaVencimento,
                dataVencimentoCartao,
                logs: [
                  ...cartao.logs,
                  { id: cartao.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'ATUALIZADO', descricao: t('financeiro.cartao.logs.atualizado') },
                ],
              }
            : cartao,
        ),
      );
      notificarSucesso(t('financeiro.cartao.mensagens.atualizado'));
    }

    resetarTela();
  };

  const alternarStatusCartao = (cartao: Cartao, proximoStatus: StatusCartao) => {
    if (proximoStatus === 'inativo') {
      const pendencias = transacoesPendentesPorCartao[cartao.descricao] || 0;
      if (pendencias > 0) {
        notificarErro( t('financeiro.cartao.mensagens.transacoesPendentes'));
        return;
      }
    }

    const confirmar = () => {
      setCartoes((atual) =>
        atual.map((item) =>
          item.id === cartao.id
            ? {
                ...item,
                status: proximoStatus,
                logs: [
                  ...item.logs,
                  {
                    id: item.logs.length + 1,
                    data: new Date().toISOString().split('T')[0],
                    acao: proximoStatus === 'ativo' ? 'ATIVADO' : 'INATIVADO',
                    descricao: proximoStatus === 'ativo' ? t('financeiro.cartao.logs.ativado') : t('financeiro.cartao.logs.inativado'),
                  },
                ],
              }
            : item,
        ),
      );
    };

    confirmar();
  };

  const obterMesSelecionado = (cartaoId: number) => mesPorCartao[cartaoId] ?? new Date().toISOString().slice(0, 7);

  const formatarMesNavegacao = (mes: string) => {
    const [ano, numeroMes] = mes.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(ano, numeroMes - 1, 1));
  };

  const alterarMes = (cartaoId: number, direcao: 'anterior' | 'proximo') => {
    const atual = obterMesSelecionado(cartaoId);
    const [ano, mes] = atual.split('-').map(Number);
    const dataBase = new Date(ano, mes - 1, 1);
    dataBase.setMonth(dataBase.getMonth() + (direcao === 'anterior' ? -1 : 1));
    const novoMes = `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, '0')}`;
    setMesPorCartao((estadoAtual) => ({ ...estadoAtual, [cartaoId]: novoMes }));
  };

  const obterLancamentosDoMes = (cartao: Cartao) => {
    const mesSelecionado = obterMesSelecionado(cartao.id);
    return cartao.lancamentos.filter((lancamento) => lancamento.data.startsWith(mesSelecionado));
  };

  const totalPeriodo = (cartao: Cartao) => obterLancamentosDoMes(cartao).reduce((total, lancamento) => total + lancamento.valor, 0);

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

            <View>
              {cartoesFiltrados.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>{t('financeiro.cartao.vazio')}</Text>
              ) : (
                cartoesFiltrados.map((cartao) => (
                  <View key={cartao.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{cartao.id} {obterIconeBandeiraCartao(cartao.bandeira)} {cartao.descricao}</Text>
                      <Text style={{ color: cartao.status === 'ativo' ? COLORS.success : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{t(`financeiro.cartao.status.${cartao.status}`)}</Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                      {obterIconeBandeiraCartao(cartao.bandeira)} {cartao.bandeira} | {t(`financeiro.cartao.tipos.${cartao.tipo}`)}
                    </Text>
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
                      {cartao.status === 'ativo' ? <TouchableOpacity onPress={() => alternarStatusCartao(cartao, 'inativo')} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.cartao.acoes.inativar')}</Text></TouchableOpacity> : null}
                      {cartao.status === 'inativo' ? <TouchableOpacity onPress={() => alternarStatusCartao(cartao, 'ativo')} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.cartao.acoes.ativar')}</Text></TouchableOpacity> : null}
                      <TouchableOpacity onPress={() => setCartaoDetalheAberto(cartaoDetalheAberto === cartao.id ? null : cartao.id)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.accent, fontSize: 12 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.acoes.fatura') : t('financeiro.cartao.acoes.extrato')}</Text></TouchableOpacity>
                    </View>

                    {cartaoDetalheAberto === cartao.id ? (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, paddingTop: 10 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{cartao.tipo === 'credito' ? t('financeiro.cartao.faturaTitulo') : t('financeiro.cartao.extratoTitulo')}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <TouchableOpacity onPress={() => alterarMes(cartao.id, 'anterior')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{'\u2190'}</Text>
                          </TouchableOpacity>
                          <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>{formatarMesNavegacao(obterMesSelecionado(cartao.id))}</Text>
                          <TouchableOpacity onPress={() => alterarMes(cartao.id, 'proximo')} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
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
                                <Text style={{ color: COLORS.error, fontWeight: '700' }}>{formatarValorPorIdioma(lancamento.valor)}</Text>
                              </View>
                              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{formatarDataPorIdioma(lancamento.data)}</Text>
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
            <CampoSelect label={t('financeiro.cartao.campos.bandeira')} placeholder={t('comum.acoes.selecionar')} options={BANDEIRAS_CARTAO_POPULARES.map((bandeira) => ({ value: bandeira, label: `${obterIconeBandeiraCartao(bandeira)} ${bandeira}` }))} value={formulario.bandeira} onChange={(bandeira) => { setCamposInvalidos((atual) => ({ ...atual, bandeira: false })); setFormulario((atual) => ({ ...atual, bandeira })); }} error={camposInvalidos.bandeira} />
            <CampoSelect label={t('financeiro.cartao.campos.tipo')} placeholder={t('comum.acoes.selecionar')} options={tiposCartao.map((tipo) => ({ value: tipo, label: t(`financeiro.cartao.tipos.${tipo}`) }))} value={formulario.tipo} onChange={(tipo) => atualizarTipoFormulario(tipo as TipoCartao)} error={camposInvalidos.tipo} />
            {tipoExigeVencimento(formulario.tipo) ? <CampoTexto label={t('financeiro.cartao.campos.limite')} placeholder={t('financeiro.cartao.placeholders.valor')} value={formulario.limite} onChangeText={(limite) => { setCamposInvalidos((atual) => ({ ...atual, limite: false })); setFormulario((atual) => ({ ...atual, limite: aplicarMascaraMoeda(limite, locale) })); }} error={camposInvalidos.limite} keyboardType="numeric" estilo={{ marginBottom: 12 }} /> : null}
            {modoTela === 'novo'
              ? <CampoTexto label={t('financeiro.cartao.campos.saldoDisponivel')} placeholder={t('financeiro.cartao.placeholders.valor')} value={formulario.saldoDisponivel} onChangeText={(saldoDisponivel) => { setCamposInvalidos((atual) => ({ ...atual, saldoDisponivel: false })); setFormulario((atual) => ({ ...atual, saldoDisponivel: aplicarMascaraMoeda(saldoDisponivel, locale) })); }} error={camposInvalidos.saldoDisponivel} keyboardType="numeric" estilo={{ marginBottom: 12 }} />
              : renderCampoBloqueado(t('financeiro.cartao.campos.saldoDisponivel'), formulario.saldoDisponivel)}
            {tipoExigeVencimento(formulario.tipo) ? <CampoData label={t('financeiro.cartao.campos.diaVencimento')} placeholder={t('financeiro.cartao.placeholders.data')} value={formulario.diaVencimento} onChange={(diaVencimento) => { setCamposInvalidos((atual) => ({ ...atual, diaVencimento: false })); setFormulario((atual) => ({ ...atual, diaVencimento })); }} error={camposInvalidos.diaVencimento} estilo={{ marginBottom: 12 }} /> : null}
            {tipoExigeVencimento(formulario.tipo) ? <CampoData label={t('financeiro.cartao.campos.dataVencimentoCartao')} placeholder={t('financeiro.cartao.placeholders.data')} value={formulario.dataVencimentoCartao} onChange={(dataVencimentoCartao) => { setCamposInvalidos((atual) => ({ ...atual, dataVencimentoCartao: false })); setFormulario((atual) => ({ ...atual, dataVencimentoCartao })); }} error={camposInvalidos.dataVencimentoCartao} estilo={{ marginBottom: 20 }} /> : <View style={{ marginBottom: 20 }} />}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1 }} />
              <Botao titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={salvar} tipo="primario" estilo={{ flex: 1 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && cartaoSelecionado ? (
          <>
            {renderCampoBloqueado(t('financeiro.cartao.campos.descricao'), cartaoSelecionado.descricao)}
            {renderCampoBloqueado(t('financeiro.cartao.campos.bandeira'), `${obterIconeBandeiraCartao(cartaoSelecionado.bandeira)} ${cartaoSelecionado.bandeira}`)}
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




