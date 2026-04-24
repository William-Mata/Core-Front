import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  adicionarParticipanteListaCompraApi,
  criarListaCompraApi,
  duplicarListaCompraApi,
  listarListasCompraApi,
  removerParticipanteListaCompraApi,
  removerListaCompraApi,
} from '../../../src/servicos/compras';
import { listarAmigosRateioApi, type AmigoRateioApi } from '../../../src/servicos/financeiro';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { ListaCompra, PermissaoParticipanteLista } from '../../../src/tipos/compras.tipos';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { extrairMensagemErroApi } from '../../../src/utils/erroApi';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataPorIdioma } from '../../../src/utils/formatacaoLocale';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { COLORS } from '../../../src/styles/variables';

const opcoesCategoriasLista = [
  { value: 'mercado' },
  { value: 'moveis' },
  { value: 'roupas' },
  { value: 'farmacia' },
  { value: 'construcao' },
  { value: 'outros' },
] as const;

type StatusFiltroLista = 'todos' | ListaCompra['status'];
type AcaoListaPlanejamento = 'duplicar' | 'excluir' | 'compartilhar';

const filtroInicial: FiltroPadraoValor = {
  id: '',
  descricao: '',
  dataInicio: '',
  dataFim: '',
};

function obterPermissaoUsuario(lista: ListaCompra, usuarioId?: number): PermissaoParticipanteLista {
  if (lista.papelUsuario) return lista.papelUsuario;
  if (!usuarioId) return 'leitor';
  if (lista.criadoPorUsuarioId === usuarioId) return 'proprietario';
  const participante = lista.participantes.find((item) => item.usuarioId === usuarioId);
  return participante?.permissao ?? 'leitor';
}

export default function ComprasIndex() {
  const router = useRouter();
  const { t } = usarTraducao();
  const usuarioId = usarAutenticacaoStore((state) => state.usuario?.id);
  const [listas, setListas] = useState<ListaCompra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalNovaLista, setModalNovaLista] = useState(false);
  const [nomeLista, setNomeLista] = useState('');
  const [observacaoLista, setObservacaoLista] = useState('');
  const [categoriaLista, setCategoriaLista] = useState<ListaCompra['categoria']>('mercado');
  const [filtro, setFiltro] = useState<FiltroPadraoValor>(filtroInicial);
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>(filtroInicial);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroLista>('todos');
  const [statusFiltroAplicado, setStatusFiltroAplicado] = useState<StatusFiltroLista>('todos');
  const [amigosDisponiveis, setAmigosDisponiveis] = useState<AmigoRateioApi[]>([]);
  const [carregandoAmigos, setCarregandoAmigos] = useState(false);
  const [modalParticipantesListaId, setModalParticipantesListaId] = useState<number | null>(null);
  const [amigoSelecionadoId, setAmigoSelecionadoId] = useState('');
  const [permissaoParticipante, setPermissaoParticipante] = useState<'coproprietario' | 'leitor'>('coproprietario');
  const [menuAcoesAbertoListaId, setMenuAcoesAbertoListaId] = useState<number | null>(null);
  const [modalDuplicarLista, setModalDuplicarLista] = useState(false);
  const [listaDuplicacaoId, setListaDuplicacaoId] = useState<number | null>(null);
  const [nomeDuplicacao, setNomeDuplicacao] = useState('');
  const [observacaoDuplicacao, setObservacaoDuplicacao] = useState('');
  const [categoriaDuplicacao, setCategoriaDuplicacao] = useState<ListaCompra['categoria']>('mercado');

  const carregarListas = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta = await listarListasCompraApi();
      setListas(resposta);
    } catch {
      notificarErro(t('compras.mensagens.erroCarregarListas'));
    } finally {
      setCarregando(false);
    }
  }, [t]);

  const carregarAmigos = useCallback(async () => {
    try {
      setCarregandoAmigos(true);
      const amigos = await listarAmigosRateioApi();
      setAmigosDisponiveis(amigos);
    } catch {
      notificarErro(t('compras.mensagens.erroCarregarAmigos'));
      setAmigosDisponiveis([]);
    } finally {
      setCarregandoAmigos(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarListas();
  }, [carregarListas]);

  useEffect(() => {
    void carregarAmigos();
  }, [carregarAmigos]);

  const podeSalvarLista = useMemo(() => nomeLista.trim().length >= 3, [nomeLista]);
  const listaModalParticipantes = useMemo(
    () => listas.find((lista) => lista.id === modalParticipantesListaId) ?? null,
    [listas, modalParticipantesListaId],
  );

  const amigosDisponiveisParaConvite = useMemo(() => {
    if (!listaModalParticipantes) return [];
    const participantesIds = new Set(listaModalParticipantes.participantes.map((item) => item.usuarioId));
    participantesIds.add(listaModalParticipantes.criadoPorUsuarioId);
    return amigosDisponiveis.filter((amigo) => !participantesIds.has(amigo.id));
  }, [amigosDisponiveis, listaModalParticipantes]);
  const permissaoModalParticipantes = useMemo(() => {
    if (!listaModalParticipantes) return 'leitor' as const;
    return obterPermissaoUsuario(listaModalParticipantes, usuarioId);
  }, [listaModalParticipantes, usuarioId]);
  const podeGerenciarParticipantes = permissaoModalParticipantes !== 'leitor';

  const listasFiltradas = useMemo(() => {
    const termoId = filtroAplicado.id.trim();
    const termoDescricao = filtroAplicado.descricao.trim().toLowerCase();

    return listas.filter((lista) => {
      const bateId = !termoId || String(lista.id).includes(termoId);
      const bateDescricao = !termoDescricao || lista.nome.toLowerCase().includes(termoDescricao);
      const bateStatus = statusFiltroAplicado === 'todos' || lista.status === statusFiltroAplicado;
      const dataReferencia = lista.atualizadoEm || lista.criadoEm;
      const bateData = estaDentroIntervalo(dataReferencia, filtroAplicado.dataInicio, filtroAplicado.dataFim);
      return bateId && bateDescricao && bateStatus && bateData;
    });
  }, [filtroAplicado, listas, statusFiltroAplicado]);

  const totais = useMemo(() => {
    const total = listasFiltradas.length;
    const ativas = listasFiltradas.filter((lista) => lista.status === 'ativa').length;
    const arquivadas = listasFiltradas.filter((lista) => lista.status === 'arquivada').length;
    const concluidas = listasFiltradas.filter((lista) => lista.status === 'concluida').length;
    return { total, ativas, arquivadas, concluidas };
  }, [listasFiltradas]);

  const consultarFiltros = () => {
    setFiltroAplicado({
      id: filtro.id.trim(),
      descricao: filtro.descricao.trim(),
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
    });
    setStatusFiltroAplicado(statusFiltro);
  };

  const abrirModalParticipantes = (listaId: number) => {
    setModalParticipantesListaId(listaId);
    setAmigoSelecionadoId('');
    setPermissaoParticipante('coproprietario');
  };

  const fecharModalParticipantes = () => {
    setModalParticipantesListaId(null);
    setAmigoSelecionadoId('');
    setPermissaoParticipante('coproprietario');
  };

  const abrirLista = (listaId: number) => {
    setMenuAcoesAbertoListaId(null);
    router.push(`/principal/compras/lista?listaId=${listaId}` as never);
  };

  const criarLista = async () => {
    if (!podeSalvarLista) return;
    try {
      await criarListaCompraApi({
        nome: nomeLista.trim(),
        observacao: observacaoLista.trim(),
        categoria: categoriaLista,
      });
      setNomeLista('');
      setObservacaoLista('');
      setCategoriaLista('mercado');
      setModalNovaLista(false);
      notificarSucesso(t('compras.mensagens.listaCriada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarLista'));
    }
  };

  const abrirModalDuplicarLista = (lista: ListaCompra) => {
    setListaDuplicacaoId(lista.id);
    setNomeDuplicacao(lista.nome);
    setObservacaoDuplicacao(lista.observacao ?? '');
    setCategoriaDuplicacao(lista.categoria);
    setModalDuplicarLista(true);
  };

  const fecharModalDuplicarLista = () => {
    setModalDuplicarLista(false);
    setListaDuplicacaoId(null);
    setNomeDuplicacao('');
    setObservacaoDuplicacao('');
    setCategoriaDuplicacao('mercado');
  };

  const duplicarLista = async () => {
    if (!listaDuplicacaoId || nomeDuplicacao.trim().length < 3) return;
    try {
      await duplicarListaCompraApi(listaDuplicacaoId, {
        nome: nomeDuplicacao.trim(),
        observacao: observacaoDuplicacao.trim(),
        categoria: categoriaDuplicacao,
      });
      fecharModalDuplicarLista();
      notificarSucesso(t('compras.mensagens.listaDuplicada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroDuplicarLista'));
    }
  };

  const removerLista = async (listaId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.removerLista'), {
      titulo: t('comum.confirmacoes.tituloExclusao'),
      textoConfirmar: t('comum.acoes.excluir'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
      tipoConfirmar: 'perigo',
    });
    if (!confirmar) return;

    try {
      await removerListaCompraApi(listaId);
      notificarSucesso(t('compras.mensagens.listaRemovida'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroRemoverLista'));
    }
  };

  const convidarParticipante = async () => {
    if (!listaModalParticipantes) return;
    const amigoId = Number(amigoSelecionadoId);
    if (!Number.isInteger(amigoId) || amigoId <= 0) {
      notificarErro(t('compras.mensagens.participanteInvalido'));
      return;
    }

    try {
      const listaAtualizada = await adicionarParticipanteListaCompraApi(listaModalParticipantes.id, {
        amigoId,
        permissao: permissaoParticipante,
      });
      setListas((atual) => atual.map((lista) => (lista.id === listaAtualizada.id ? listaAtualizada : lista)));
      notificarSucesso(t('compras.mensagens.participanteAdicionado'));
      setAmigoSelecionadoId('');
      setPermissaoParticipante('coproprietario');
      void carregarListas();
    } catch (erro) {
      notificarErro(extrairMensagemErroApi(erro, t('compras.mensagens.erroCompartilharLista')));
    }
  };

  const removerParticipante = async (listaId: number, participanteId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.removerParticipante'), {
      titulo: t('comum.confirmacoes.tituloExclusao'),
      textoConfirmar: t('comum.acoes.remover'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
      tipoConfirmar: 'perigo',
    });
    if (!confirmar) return;

    try {
      await removerParticipanteListaCompraApi(listaId, participanteId);
      setListas((atual) => atual.map((lista) => {
        if (lista.id !== listaId) return lista;
        const participantesFiltrados = lista.participantes.filter((participante) => participante.usuarioId !== participanteId);
        const quantidadeAtual = lista.quantidadeParticipantes ?? lista.participantes.length;
        const participanteRemovido = participantesFiltrados.length !== lista.participantes.length;
        return {
          ...lista,
          participantes: participantesFiltrados,
          quantidadeParticipantes: participanteRemovido
            ? Math.max(0, quantidadeAtual - 1)
            : quantidadeAtual,
        };
      }));
      notificarSucesso(t('compras.mensagens.participanteRemovido'));
      void carregarListas();
    } catch (erro) {
      notificarErro(extrairMensagemErroApi(erro, t('compras.mensagens.erroRemoverParticipante')));
    }
  };

  const executarAcaoLista = async (lista: ListaCompra, acao: AcaoListaPlanejamento) => {
    if (acao === 'duplicar') {
      abrirModalDuplicarLista(lista);
      return;
    }

    if (acao === 'excluir') {
      await removerLista(lista.id);
      return;
    }

    abrirModalParticipantes(lista.id);
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
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.menu.listas')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, padding: 16 }}>
        <Botao titulo={`+ ${t('compras.acoes.novaLista')}`} onPress={() => setModalNovaLista(true)} tipo="primario" estilo={{ marginBottom: 12 }} />

        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('compras.listas.totalListas')}</Text>
          <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: '700' }}>{totais.total}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.listas.totalAtivas')}: {totais.ativas}</Text>
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.listas.totalArquivadas')}: {totais.arquivadas}</Text>
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.listas.totalConcluidas')}: {totais.concluidas}</Text>
          </View>
        </View>

        <FiltroPadrao valor={filtro} aoMudar={setFiltro}>
          <CampoSelect
            label={t('compras.listas.filtroStatus')}
            value={statusFiltro}
            onChange={(valor) => setStatusFiltro(valor as StatusFiltroLista)}
            options={[
              { value: 'todos', label: t('compras.filtros.todos') },
              { value: 'ativa', label: t('compras.status.ativa') },
              { value: 'arquivada', label: t('compras.status.arquivada') },
              { value: 'concluida', label: t('compras.status.concluida') },
            ]}
          />
        </FiltroPadrao>
        <Botao
          titulo={t('comum.acoes.consultar')}
          tipo="secundario"
          onPress={() => {
            Keyboard.dismiss();
            consultarFiltros();
          }}
          estilo={{ marginBottom: 12 }}
        />

        {carregando ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('comum.carregando')}</Text> : null}
        {!carregando && listasFiltradas.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('compras.listas.vazio')}</Text> : null}

        <View style={{ gap: 10, overflow: 'visible' }}>
          {listasFiltradas.map((lista) => {
            const permissaoAtual = obterPermissaoUsuario(lista, usuarioId);
            const podeGerenciarLista = permissaoAtual !== 'leitor';
            const podeDuplicar = permissaoAtual !== 'leitor';
            const estiloStatus =
              lista.status === 'ativa'
                ? { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' }
                : lista.status === 'arquivada'
                  ? { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' }
                  : { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };
            const opcoesAcoesLista = [
              ...(podeDuplicar
                ? [{ value: 'duplicar', label: t('comum.acoes.duplicar') }]
                : []),
              ...(podeGerenciarLista
                ? [{ value: 'compartilhar', label: t('compras.participantes.compartilharComAmigos') }]
                : []),
              ...(podeGerenciarLista
                ? [{ value: 'excluir', label: t('comum.acoes.excluir') }]
                : []),
            ] as Array<{ value: AcaoListaPlanejamento; label: string }>;
            return (
              <View
                key={lista.id}
                style={{
                  position: 'relative',
                  zIndex: menuAcoesAbertoListaId === lista.id ? 50 : 1,
                  elevation: menuAcoesAbertoListaId === lista.id ? 12 : 0,
                  overflow: 'visible',
                  backgroundColor: COLORS.bgTertiary,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={() => abrirLista(lista.id)} activeOpacity={0.85} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15, flex: 1 }}>{lista.nome}</Text>
                      <DistintivoStatus
                        rotulo={t(`compras.status.${lista.status}`)}
                        corTexto={estiloStatus.corTexto}
                        corBorda={estiloStatus.corBorda}
                        corFundo={estiloStatus.corFundo}
                      />
                    </View>
                  </TouchableOpacity>
                  {opcoesAcoesLista.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setMenuAcoesAbertoListaId((atual) => (atual === lista.id ? null : lista.id))}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: menuAcoesAbertoListaId === lista.id ? COLORS.borderAccent : COLORS.textPrimary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: menuAcoesAbertoListaId === lista.id ? COLORS.accentSubtle : COLORS.bgSecondary,
                      }}
                    >
                      <Text
                        style={{
                          color: menuAcoesAbertoListaId === lista.id ? COLORS.accent : COLORS.textPrimary,
                          fontSize: 18,
                          fontWeight: '700',
                          lineHeight: 18,
                        }}
                      >
                        {'\u22EE'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity onPress={() => abrirLista(lista.id)} activeOpacity={0.85}>
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ color: COLORS.textSecondary }}>
                      {t('compras.listas.categoria')}: {t(`compras.categorias.${lista.categoria}`)}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary }}>
                      {t('compras.listas.participantes')}: {lista.quantidadeParticipantes ?? lista.participantes.length}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary }}>
                      {t('compras.lista.permissaoAtual')}: {t(`compras.permissoes.${permissaoAtual}`)}
                    </Text>
                    {lista.atualizadoEm || lista.criadoEm ? (
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.listas.ultimaAtualizacao')}: {formatarDataPorIdioma(lista.atualizadoEm || lista.criadoEm)}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {opcoesAcoesLista.length > 0 && menuAcoesAbertoListaId === lista.id ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 50,
                      right: 14,
                      zIndex: 60,
                      elevation: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 240,
                        borderWidth: 1,
                        borderColor: COLORS.borderAccent,
                        borderRadius: 12,
                        backgroundColor: COLORS.bgSecondary,
                        overflow: 'hidden',
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
                        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>
                          {t('compras.acoes.menuAcoes')}
                        </Text>
                      </View>
                      {opcoesAcoesLista.map((opcao, indice) => {
                        const acaoPerigosa = opcao.value === 'excluir';
                        const icone = opcao.value === 'duplicar' ? '\u29C9' : opcao.value === 'compartilhar' ? '\u2197' : '\u2716';
                        return (
                          <TouchableOpacity
                            key={`${lista.id}-${opcao.value}`}
                            onPress={() => {
                              setMenuAcoesAbertoListaId(null);
                              void executarAcaoLista(lista, opcao.value);
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 11,
                              borderTopWidth: indice === 0 ? 0 : 1,
                              borderTopColor: COLORS.borderColor,
                              backgroundColor: acaoPerigosa ? COLORS.errorSoft : COLORS.bgSecondary,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: acaoPerigosa ? COLORS.errorSoft : COLORS.accentSubtle,
                              }}
                            >
                              <Text style={{ color: acaoPerigosa ? COLORS.error : COLORS.accent, fontSize: 12 }}>
                                {icone}
                              </Text>
                            </View>
                            <Text style={{ color: acaoPerigosa ? COLORS.error : COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>
                              {opcao.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visivel={modalNovaLista} onFechar={() => setModalNovaLista(false)} titulo={t('compras.modalNovaLista.titulo')}>
        <CampoTexto
          label={t('compras.modalNovaLista.nome')}
          value={nomeLista}
          onChangeText={setNomeLista}
          placeholder={t('compras.modalNovaLista.placeholderNome')}
        />
        <CampoTexto
          label={t('compras.modalNovaLista.observacao')}
          value={observacaoLista}
          onChangeText={setObservacaoLista}
          placeholder={t('compras.modalNovaLista.placeholderObservacao')}
          multiline
          numberOfLines={3}
        />
        <CampoSelect
          label={t('compras.modalNovaLista.categoria')}
          value={categoriaLista}
          onChange={(valor) => setCategoriaLista(valor as ListaCompra['categoria'])}
          options={opcoesCategoriasLista.map((opcao) => ({ value: opcao.value, label: t(`compras.categorias.${opcao.value}`) }))}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalNovaLista(false)} />
          <Botao titulo={t('comum.acoes.salvar')} onPress={() => void criarLista()} desabilitado={!podeSalvarLista} />
        </View>
      </Modal>

      <Modal visivel={modalDuplicarLista} onFechar={fecharModalDuplicarLista} titulo={t('comum.acoes.duplicar')}>
        <CampoTexto
          label={t('compras.modalNovaLista.nome')}
          value={nomeDuplicacao}
          onChangeText={setNomeDuplicacao}
          placeholder={t('compras.modalNovaLista.placeholderNome')}
        />
        <CampoTexto
          label={t('compras.modalNovaLista.observacao')}
          value={observacaoDuplicacao}
          onChangeText={setObservacaoDuplicacao}
          placeholder={t('compras.modalNovaLista.placeholderObservacao')}
          multiline
          numberOfLines={3}
        />
        <CampoSelect
          label={t('compras.modalNovaLista.categoria')}
          value={categoriaDuplicacao}
          onChange={(valor) => setCategoriaDuplicacao(valor as ListaCompra['categoria'])}
          options={opcoesCategoriasLista.map((opcao) => ({ value: opcao.value, label: t(`compras.categorias.${opcao.value}`) }))}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={fecharModalDuplicarLista} />
          <Botao titulo={t('comum.acoes.duplicar')} onPress={() => void duplicarLista()} desabilitado={nomeDuplicacao.trim().length < 3} />
        </View>
      </Modal>

      <Modal
        visivel={Boolean(listaModalParticipantes)}
        onFechar={fecharModalParticipantes}
        titulo={t('compras.participantes.tituloModal', { nomeLista: listaModalParticipantes?.nome ?? '' })}
      >
        {carregandoAmigos ? (
          <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>{t('comum.carregando')}</Text>
        ) : null}
        {podeGerenciarParticipantes ? (
          <>
            <CampoSelect
              label={t('compras.participantes.amigo')}
              value={amigoSelecionadoId}
              onChange={setAmigoSelecionadoId}
              options={amigosDisponiveisParaConvite.map((amigo) => ({
                value: String(amigo.id),
                label: amigo.email ? `${amigo.nome} - ${amigo.email}` : amigo.nome,
              }))}
            />
            <CampoSelect
              label={t('compras.participantes.permissao')}
              value={permissaoParticipante}
              onChange={(valor) => setPermissaoParticipante(valor as 'coproprietario' | 'leitor')}
              options={[
                { value: 'coproprietario', label: t('compras.permissoes.coproprietario') },
                { value: 'leitor', label: t('compras.permissoes.leitor') },
              ]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Botao titulo={t('compras.participantes.convidar')} onPress={() => void convidarParticipante()} tipo="primario" />
            </View>
          </>
        ) : null}

        <View style={{ backgroundColor: COLORS.bgTertiary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, gap: 8 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{t('compras.participantes.listaAtual')}</Text>
          {listaModalParticipantes && listaModalParticipantes.criadoPorUsuarioId > 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>
              {t('compras.permissoes.proprietario')}: {listaModalParticipantes.criadoPorUsuarioId}
            </Text>
          ) : null}
          {(listaModalParticipantes?.participantes ?? []).length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.participantes.vazio')}</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {(listaModalParticipantes?.participantes ?? []).map((participante) => (
                <View
                  key={`${participante.usuarioId}-${participante.permissao}`}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                  <Text style={{ color: COLORS.textSecondary, flex: 1 }}>
                    {participante.nomeUsuario || `${t('compras.participantes.usuario')} ${participante.usuarioId}`} - {t(`compras.permissoes.${participante.permissao}`)}
                  </Text>
                  {podeGerenciarParticipantes && listaModalParticipantes && participante.usuarioId !== listaModalParticipantes.criadoPorUsuarioId ? (
                    <Botao
                      titulo={t('comum.acoes.remover')}
                      tipo="perigo"
                      onPress={() => void removerParticipante(listaModalParticipantes.id, participante.usuarioId)}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
