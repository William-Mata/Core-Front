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
import {
  listarDespesasApi,
  listarReembolsosApi,
  criarReembolsoApi,
  atualizarReembolsoApi,
  deletarReembolsoApi,
  type RegistroFinanceiroApi,
} from '../../../src/servicos/financeiro';
import { encontrarDespesaJaVinculada } from '../../../src/utils/reembolso';

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
  despesasVinculadas: number[];
  status: 'aguardando' | 'aprovado';
}

function paraNumero(valor: unknown, padrao = 0): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function parseStatus(valor: unknown): 'aguardando' | 'aprovado' {
  const texto = String(valor ?? '')
    .trim()
    .toLowerCase();
  if (['aprovado', 'approved', 'pago', 'pago_parcial'].includes(texto)) return 'aprovado';
  return 'aguardando';
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
    dataSolicitacao: String(item.dataSolicitacao ?? item.data_solicitacao ?? item.data ?? ''),
    despesasVinculadas,
    status: parseStatus(item.status),
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

export default function TelaReembolso() {
  const router = useRouter();
  const { t } = usarTraducao();

  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [modoFormulario, setModoFormulario] = useState<'lista' | 'novo' | 'edicao'>('lista');
  const [carregando, setCarregando] = useState(false);
  const [despesasDisponiveis, setDespesasDisponiveis] = useState<DespesaDisponivel[]>([]);
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);

  const [reembolsoAtual, setReembolsoAtual] = useState<Reembolso>({
    id: 0,
    descricao: '',
    solicitante: '',
    dataSolicitacao: new Date().toISOString().split('T')[0],
    despesasVinculadas: [],
    status: 'aguardando',
  });

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
    setReembolsoAtual({
      id: 0,
      descricao: '',
      solicitante: '',
      dataSolicitacao: new Date().toISOString().split('T')[0],
      despesasVinculadas: [],
      status: 'aguardando',
    });
  };

  const abrirNovo = () => {
    limparFormulario();
    setModoFormulario('novo');
  };

  const abrirEdicao = (id: number) => {
    const encontrado = reembolsos.find((reembolso) => reembolso.id === id);
    if (!encontrado) return;
    setReembolsoAtual(encontrado);
    setModoFormulario('edicao');
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

    const payload: Record<string, unknown> = {
      descricao: reembolsoAtual.descricao.trim(),
      solicitante: reembolsoAtual.solicitante.trim(),
      dataSolicitacao: reembolsoAtual.dataSolicitacao,
      despesasVinculadas: reembolsoAtual.despesasVinculadas,
      valorTotal: calcularTotal(reembolsoAtual.despesasVinculadas),
      status: reembolsoAtual.status.toUpperCase(),
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
        <TouchableOpacity onPress={() => router.back()}>
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
                      <Text style={{ color: reembolso.status === 'aprovado' ? COLORS.success : COLORS.warning, fontSize: 12, fontWeight: '700' }}>
                        {t(`financeiro.reembolso.statusLista.${reembolso.status}`)}
                      </Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>
                      {reembolso.solicitante || '-'} | {formatarDataPorIdioma(reembolso.dataSolicitacao)} | {formatarValorPorIdioma(calcularTotal(reembolso.despesasVinculadas))}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                      {t('financeiro.reembolso.despesasSelecionadas', { count: String(reembolso.despesasVinculadas.length) })}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => abrirEdicao(reembolso.id)} style={{ backgroundColor: COLORS.bgSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.textPrimary, fontSize: 12 }}>{t('comum.acoes.editar')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => void remover(reembolso.id)} style={{ backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.remover')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
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
        )}
      </ScrollView>
    </View>
  );
}

