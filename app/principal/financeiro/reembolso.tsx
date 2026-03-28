import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CampoData } from '../../../src/componentes/comuns/CampoData';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../src/utils/formatacaoLocale';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../../src/utils/erroApi';
import { dataIsoMaiorQue } from '../../../src/utils/validacaoDataFinanceira';
import {
  listarDespesasApi,
  listarReembolsosApi,
  criarReembolsoApi,
  atualizarReembolsoApi,
  deletarReembolsoApi,
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
  dataSolicitacao: string;
  dataEfetivacao?: string;
  despesasVinculadas: number[];
  valorEfetivacao?: number;
  status: StatusReembolso;
}

type ModoFormulario = 'lista' | 'novo' | 'edicao' | 'efetivacao';

function paraNumero(valor: unknown, padrao = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarReembolsoApi(item: RegistroFinanceiroApi): Reembolso {
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
    dataSolicitacao: String(item.dataSolicitacao ?? item.data_solicitacao ?? item.data ?? '').slice(0, 10),
    dataEfetivacao: item.dataEfetivacao ? String(item.dataEfetivacao).slice(0, 10) : undefined,
    despesasVinculadas,
    valorEfetivacao: item.valorEfetivacao ? paraNumero(item.valorEfetivacao) : undefined,
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
    dataSolicitacao: hoje,
    dataEfetivacao: hoje,
    despesasVinculadas: [],
    valorEfetivacao: 0,
    status: 'pendente',
  };
}

export default function TelaReembolso() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>('lista');
  const [carregando, setCarregando] = useState(false);
  const [despesasDisponiveis, setDespesasDisponiveis] = useState<DespesaDisponivel[]>([]);
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [reembolsoAtual, setReembolsoAtual] = useState<Reembolso>(criarReembolsoVazio());

  const carregarDados = async (signal?: AbortSignal) => {
    setCarregando(true);
    try {
      const [resReembolsos, resDespesas] = await Promise.all([
        listarReembolsosApi({ signal }),
        listarDespesasApi({ signal }),
      ]);

      setReembolsos(resReembolsos.map(normalizarReembolsoApi));
      setDespesasDisponiveis(resDespesas.map(normalizarDespesaApi));
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
  }, []);

  const reembolsosFiltrados = useMemo(() => {
    return reembolsos.filter((r) => {
      const bateId = !filtro.id || String(r.id).includes(filtro.id);
      const termo = filtro.descricao.trim().toLowerCase();
      const bateDescricao = !termo || r.descricao.toLowerCase().includes(termo) || r.solicitante.toLowerCase().includes(termo);
      const bateData = estaDentroIntervalo(r.dataSolicitacao, filtro.dataInicio, filtro.dataFim);
      return bateId && bateDescricao && bateData;
    });
  }, [filtro, reembolsos]);

  const obterDespesaPorId = (id: number) => despesasDisponiveis.find((despesa) => despesa.id === id);

  const calcularTotal = (idsDespesas: number[]) =>
    idsDespesas.reduce((total, id) => total + (obterDespesaPorId(id)?.valor || 0), 0);

  const limparFormulario = () => {
    setReembolsoAtual(criarReembolsoVazio());
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
    setReembolsoAtual({
      ...encontrado,
      dataEfetivacao: encontrado.dataEfetivacao || new Date().toISOString().split('T')[0],
      valorEfetivacao: encontrado.valorEfetivacao ?? calcularTotal(encontrado.despesasVinculadas),
    });
    setModoFormulario('edicao');
  };

  const abrirEfetivacao = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
    if (!podeEfetivarReembolso(encontrado.status)) {
      notificarErro(t('financeiro.reembolso.mensagens.efetivacaoSomentePendente'));
      return;
    }
    setReembolsoAtual({
      ...encontrado,
      dataEfetivacao: encontrado.dataEfetivacao || new Date().toISOString().split('T')[0],
      valorEfetivacao: calcularTotal(encontrado.despesasVinculadas),
    });
    setModoFormulario('efetivacao');
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
      dataSolicitacao: reembolsoAtual.dataSolicitacao,
      despesasVinculadas: reembolsoAtual.despesasVinculadas,
      valorTotal,
      status: serializarStatusReembolso('pendente'),
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

    if (dataIsoMaiorQue(reembolsoAtual.dataEfetivacao, reembolsoAtual.dataSolicitacao)) {
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

  const remover = async (id: number) => {
    setCarregando(true);
    try {
      await deletarReembolsoApi(id);
      notificarSucesso(t('financeiro.reembolso.mensagens.removido'));
      await carregarDados();
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
            <FiltroPadrao valor={filtro} aoMudar={setFiltro} />

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
                      {reembolso.solicitante || '-'} | {formatarDataPorIdioma(reembolso.dataSolicitacao)} | {formatarValorPorIdioma(calcularTotal(reembolso.despesasVinculadas))}
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
                      <TouchableOpacity onPress={() => void remover(reembolso.id)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.remover')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {modoFormulario === 'novo' || modoFormulario === 'edicao' ? (
          <>
            <CampoTexto
              label={t('financeiro.reembolso.descricao')}
              placeholder={t('financeiro.reembolso.placeholderDescricao')}
              value={reembolsoAtual.descricao}
              onChangeText={(descricao) => setReembolsoAtual((atual) => ({ ...atual, descricao }))}
              multiline
              numberOfLines={3}
              estilo={{ marginBottom: 12 }}
            />

            <CampoTexto
              label={t('financeiro.reembolso.solicitante')}
              value={reembolsoAtual.solicitante}
              onChangeText={(solicitante) => setReembolsoAtual((atual) => ({ ...atual, solicitante }))}
              estilo={{ marginBottom: 12 }}
            />

            <CampoData
              label={t('financeiro.reembolso.dataSolicitacao')}
              placeholder={t('financeiro.reembolso.placeholderData')}
              value={reembolsoAtual.dataSolicitacao}
              onChange={(dataSolicitacao) => setReembolsoAtual((atual) => ({ ...atual, dataSolicitacao }))}
              estilo={{ marginBottom: 14 }}
            />

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

            <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderAccent, borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>{t('financeiro.reembolso.valorTotal')}</Text>
              <Text style={{ color: COLORS.accent, fontSize: 22, fontWeight: '800' }}>{formatarValorPorIdioma(calcularTotal(reembolsoAtual.despesasVinculadas))}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
              <Botao titulo={modoFormulario === 'novo' ? t('comum.acoes.salvar') : t('comum.acoes.confirmar')} onPress={() => void salvar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
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
              estilo={{ marginBottom: 20 }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Botao titulo={t('comum.acoes.cancelar')} onPress={() => setModoFormulario('lista')} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
              <Botao titulo={t('financeiro.reembolso.acoes.confirmarEfetivacao')} onPress={() => void efetivar()} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
