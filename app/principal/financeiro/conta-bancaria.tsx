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
import { BANCOS_POPULARES, obterIconeBanco } from '../../../src/utils/icones';

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
  data: string;
  descricao: string;
  tipo: 'credito' | 'debito';
  valor: number;
}

interface ContaBancaria {
  id: number;
  descricao: string;
  banco: string;
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

const transacoesPendentesPorConta: Record<string, number> = {
  'Conta Principal': 2,
  'Conta Reserva': 0,
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

export default function TelaContaBancaria() {
  const router = useRouter();
  const { t } = usarTraducao();
  const locale = obterLocaleAtivo();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoTela, setModoTela] = useState<ModoTela>('lista');
  const [contaSelecionadaId, setContaSelecionadaId] = useState<number | null>(null);
  const [contaExtratoAberta, setContaExtratoAberta] = useState<number | null>(null);
  const [contas, setContas] = useState<ContaBancaria[]>([
    {
      id: 1,
      descricao: 'Conta Principal',
      banco: 'Itaú',
      agencia: '1245',
      numero: '55667-8',
      saldoInicial: 3200,
      saldoAtual: 4850.1,
      dataAbertura: '2026-01-15',
      status: 'ativa',
      extrato: [
        { id: 1, data: '2026-03-02', descricao: 'Recebimento projeto', tipo: 'credito', valor: 1800 },
        { id: 2, data: '2026-03-04', descricao: 'Pagamento internet', tipo: 'debito', valor: 149.9 },
      ],
      logs: [
        { id: 1, data: '2026-01-15', acao: 'CRIADA', descricao: 'Conta bancaria criada com status ativa.' },
        { id: 2, data: '2026-03-04', acao: 'ATUALIZADA', descricao: 'Dados da conta atualizados.' },
      ],
    },
    {
      id: 2,
      descricao: 'Conta Reserva',
      banco: 'Inter',
      agencia: '0001',
      numero: '98321-0',
      saldoInicial: 900,
      saldoAtual: 1300,
      dataAbertura: '2026-02-01',
      status: 'inativa',
      extrato: [{ id: 3, data: '2026-03-10', descricao: 'Transferencia recebida', tipo: 'credito', valor: 400 }],
      logs: [
        { id: 1, data: '2026-02-01', acao: 'CRIADA', descricao: 'Conta bancaria criada com status ativa.' },
        { id: 2, data: '2026-03-20', acao: 'INATIVADA', descricao: 'Conta bancaria inativada sem transacoes pendentes.' },
      ],
    },
  ]);
  const [formulario, setFormulario] = useState<ContaForm>(() => criarFormularioVazio(locale));
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  const contaSelecionada = contas.find((conta) => conta.id === contaSelecionadaId) ?? null;

  const contasFiltradas = useMemo(
    () =>
      contas.filter((conta) => {
        const bateId = !filtro.id || String(conta.id).includes(filtro.id);
        const termo = filtro.descricao.trim().toLowerCase();
        const bancoTraduzido = conta.banco.toLowerCase();
        const statusTraduzido = t(`financeiro.contaBancaria.status.${conta.status}`).toLowerCase();
        const bateDescricao =
          !termo ||
          conta.descricao.toLowerCase().includes(termo) ||
          bancoTraduzido.includes(termo) ||
          conta.numero.toLowerCase().includes(termo) ||
          statusTraduzido.includes(termo);
        const bateData = estaDentroIntervalo(conta.dataAbertura, filtro.dataInicio, filtro.dataFim);
        return bateId && bateDescricao && bateData;
      }),
    [contas, filtro, t],
  );

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
    setContaSelecionadaId(conta.id);
    preencherFormulario(conta);
    setModoTela('edicao');
  };

  const abrirVisualizacao = (conta: ContaBancaria) => {
    setContaSelecionadaId(conta.id);
    preencherFormulario(conta);
    setModoTela('visualizacao');
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

  const salvar = () => {
    const base = validarFormulario();
    if (!base) return;

    if (modoTela === 'novo') {
      const novoId = contas.length > 0 ? Math.max(...contas.map((conta) => conta.id)) + 1 : 1;
      setContas((atual) => [
        ...atual,
        {
          id: novoId,
          descricao: formulario.descricao,
          banco: formulario.banco,
          agencia: formulario.agencia,
          numero: formulario.numero,
          saldoInicial: base.saldoInicial,
          saldoAtual: base.saldoAtual,
          dataAbertura: formulario.dataAbertura,
          status: 'ativa',
          extrato: [],
          logs: [{ id: 1, data: new Date().toISOString().split('T')[0], acao: 'CRIADA', descricao: t('financeiro.contaBancaria.logs.criada') }],
        },
      ]);
      notificarSucesso(t('financeiro.contaBancaria.mensagens.criada'));
    } else if (modoTela === 'edicao' && contaSelecionada) {
      setContas((atual) =>
        atual.map((conta) =>
          conta.id === contaSelecionada.id
            ? {
                ...conta,
                descricao: formulario.descricao,
                banco: formulario.banco,
                agencia: formulario.agencia,
                numero: formulario.numero,
                dataAbertura: formulario.dataAbertura,
                logs: [...conta.logs, { id: conta.logs.length + 1, data: new Date().toISOString().split('T')[0], acao: 'ATUALIZADA', descricao: t('financeiro.contaBancaria.logs.atualizada') }],
              }
            : conta,
        ),
      );
      notificarSucesso(t('financeiro.contaBancaria.mensagens.atualizada'));
    }

    resetarTela();
  };

  const alternarStatusConta = (conta: ContaBancaria, proximoStatus: StatusConta) => {
    if (proximoStatus === 'inativa') {
      const pendencias = transacoesPendentesPorConta[conta.descricao] || 0;
      if (pendencias > 0) {
        notificarErro( t('financeiro.contaBancaria.mensagens.transacoesPendentes'));
        return;
      }
    }

    const confirmar = () => {
      setContas((atual) =>
        atual.map((item) =>
          item.id === conta.id
            ? {
                ...item,
                status: proximoStatus,
                logs: [
                  ...item.logs,
                  {
                    id: item.logs.length + 1,
                    data: new Date().toISOString().split('T')[0],
                    acao: proximoStatus === 'ativa' ? 'ATIVADA' : 'INATIVADA',
                    descricao: proximoStatus === 'ativa' ? t('financeiro.contaBancaria.logs.ativada') : t('financeiro.contaBancaria.logs.inativada'),
                  },
                ],
              }
            : item,
        ),
      );
    };

    confirmar();
  };

  const renderCampoBloqueado = (label: string, valor: string) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>{valor || '-'}</Text>
      </View>
    </View>
  );

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

            <View>
              {contasFiltradas.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 }}>{t('financeiro.contaBancaria.vazio')}</Text>
              ) : (
                contasFiltradas.map((conta) => (
                  <View key={conta.id} style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>#{conta.id} {obterIconeBanco(conta.banco)} {conta.descricao}</Text>
                      <Text style={{ color: conta.status === 'ativa' ? COLORS.success : COLORS.warning, fontSize: 12, fontWeight: '700' }}>{t(`financeiro.contaBancaria.status.${conta.status}`)}</Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{obterIconeBanco(conta.banco)} {conta.banco} | {t('financeiro.contaBancaria.campos.agencia')}: {conta.agencia} | {t('financeiro.contaBancaria.campos.numero')}: {conta.numero}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>{t('financeiro.contaBancaria.campos.saldoAtual')}: {formatarValorPorIdioma(conta.saldoAtual)}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 }}>
                      <TouchableOpacity onPress={() => abrirVisualizacao(conta)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.visualizar')}</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => abrirEdicao(conta)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text></TouchableOpacity>
                      {conta.status === 'ativa' ? <TouchableOpacity onPress={() => alternarStatusConta(conta, 'inativa')} style={{ backgroundColor: COLORS.warningSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.warning, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.inativar')}</Text></TouchableOpacity> : null}
                      {conta.status === 'inativa' ? <TouchableOpacity onPress={() => alternarStatusConta(conta, 'ativa')} style={{ backgroundColor: COLORS.successSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.success, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.ativar')}</Text></TouchableOpacity> : null}
                      <TouchableOpacity onPress={() => setContaExtratoAberta(contaExtratoAberta === conta.id ? null : conta.id)} style={{ backgroundColor: COLORS.accentSubtle, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginHorizontal: 4, marginVertical: 4 }}><Text style={{ color: COLORS.accent, fontSize: 12 }}>{t('financeiro.contaBancaria.acoes.extrato')}</Text></TouchableOpacity>
                    </View>

                    {contaExtratoAberta === conta.id ? (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, paddingTop: 10 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{t('financeiro.contaBancaria.extratoTitulo')}</Text>
                        {conta.extrato.length === 0 ? (
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t('financeiro.contaBancaria.extratoVazio')}</Text>
                        ) : (
                          conta.extrato.map((movimento) => (
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
            <CampoSelect label={t('financeiro.contaBancaria.campos.banco')} placeholder={t('comum.acoes.selecionar')} options={BANCOS_POPULARES.map((banco) => ({ value: banco, label: `${obterIconeBanco(banco)} ${banco}` }))} value={formulario.banco} onChange={(banco) => { setCamposInvalidos((atual) => ({ ...atual, banco: false })); setFormulario((atual) => ({ ...atual, banco })); }} error={camposInvalidos.banco} />
            <CampoTexto label={t('financeiro.contaBancaria.campos.agencia')} placeholder={t('financeiro.contaBancaria.placeholders.agencia')} value={formulario.agencia} onChangeText={(agencia) => { setCamposInvalidos((atual) => ({ ...atual, agencia: false })); setFormulario((atual) => ({ ...atual, agencia })); }} error={camposInvalidos.agencia} estilo={{ marginBottom: 12 }} />
            <CampoTexto label={t('financeiro.contaBancaria.campos.numero')} placeholder={t('financeiro.contaBancaria.placeholders.numero')} value={formulario.numero} onChangeText={(numero) => { setCamposInvalidos((atual) => ({ ...atual, numero: false })); setFormulario((atual) => ({ ...atual, numero })); }} error={camposInvalidos.numero} estilo={{ marginBottom: 12 }} />
            {modoTela === 'novo' ? <CampoTexto label={t('financeiro.contaBancaria.campos.saldoInicial')} placeholder={t('financeiro.contaBancaria.placeholders.saldoInicial')} value={formulario.saldoInicial} onChangeText={atualizarSaldoInicial} error={camposInvalidos.saldoInicial} keyboardType="numeric" estilo={{ marginBottom: 12 }} /> : renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoInicial'), formulario.saldoInicial)}
            {modoTela === 'edicao' ? renderCampoBloqueado(t('financeiro.contaBancaria.campos.saldoAtual'), formulario.saldoAtual) : null}
            <CampoData label={t('financeiro.contaBancaria.campos.dataAbertura')} placeholder={t('financeiro.contaBancaria.placeholders.dataAbertura')} value={formulario.dataAbertura} onChange={(dataAbertura) => { setCamposInvalidos((atual) => ({ ...atual, dataAbertura: false })); setFormulario((atual) => ({ ...atual, dataAbertura })); }} error={camposInvalidos.dataAbertura} estilo={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={resetarTela} tipo="secundario" estilo={{ flex: 1 }} />
              <Botao titulo={modoTela === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={salvar} tipo="primario" estilo={{ flex: 1 }} />
            </View>
          </>
        ) : null}

        {modoTela === 'visualizacao' && contaSelecionada ? (
          <>
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.descricao'), contaSelecionada.descricao)}
            {renderCampoBloqueado(t('financeiro.contaBancaria.campos.banco'), `${obterIconeBanco(contaSelecionada.banco)} ${contaSelecionada.banco}`)}
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








