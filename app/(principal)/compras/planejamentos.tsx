import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { DistintivoStatus } from '../../../src/componentes/comuns/DistintivoStatus';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { MenuAcoesItem } from '../../../src/componentes/comuns/MenuAcoesItem';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  arquivarListaCompraApi,
  obterDetalheListaCompraApi,
  atualizarListaCompraApi,
  criarListaCompraApi,
  duplicarListaCompraApi,
  listarListasCompraApi,
  removerListaCompraApi,
} from '../../../src/servicos/compras';
import { listarAmigosRateioApi, type AmigoRateioApi } from '../../../src/servicos/financeiro';
import { usarAutenticacaoStore } from '../../../src/store/usarAutenticacaoStore';
import { ListaCompra, ListaCompraLog, ParticipanteListaCompra, PermissaoParticipanteLista } from '../../../src/tipos/compras.tipos';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarDataHoraPorIdioma, formatarDataPorIdioma, formatarValorPorIdioma } from '../../../src/utils/formatacaoLocale';
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
type AcaoListaPlanejamento = 'visualizar' | 'editar' | 'duplicar' | 'arquivar' | 'excluir';
type ModoModalLista = 'criar' | 'editar' | 'visualizar';

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

function normalizarParticipantesLista(
  participantes: ParticipanteListaCompra[],
  usuarioId?: number,
  criadoPorUsuarioId?: number,
): ParticipanteListaCompra[] {
  const mapa = new Map<number, ParticipanteListaCompra>();

  participantes.forEach((participante) => {
    if (participante.usuarioId <= 0) return;
    if (mapa.has(participante.usuarioId)) return;
    mapa.set(participante.usuarioId, participante);
  });

  const participantesUnicos = Array.from(mapa.values());
  const proprietarios = participantesUnicos.filter((participante) => participante.permissao === 'proprietario');

  if (proprietarios.length === 0) {
    const proprietarioPadraoId = usuarioId ?? criadoPorUsuarioId;
    if (proprietarioPadraoId && proprietarioPadraoId > 0) {
      participantesUnicos.unshift({
        usuarioId: proprietarioPadraoId,
        nomeUsuario: '',
        permissao: 'proprietario',
      });
    }
  }

  if (proprietarios.length > 1) {
    let proprietarioMantido = false;
    return participantesUnicos.map((participante) => {
      if (participante.permissao !== 'proprietario') return participante;
      if (!proprietarioMantido) {
        proprietarioMantido = true;
        return participante;
      }
      return {
        ...participante,
        permissao: 'coproprietario',
      };
    });
  }

  return participantesUnicos;
}

export default function ComprasIndex() {
  const router = useRouter();
  const { t } = usarTraducao();
  const usuarioId = usarAutenticacaoStore((state) => state.usuario?.id);
  const [listas, setListas] = useState<ListaCompra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPadraoValor>(filtroInicial);
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>(filtroInicial);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroLista>('todos');
  const [statusFiltroAplicado, setStatusFiltroAplicado] = useState<StatusFiltroLista>('todos');
  const [menuAcoesAbertoListaId, setMenuAcoesAbertoListaId] = useState<number | null>(null);

  const [modoModalLista, setModoModalLista] = useState<ModoModalLista>('criar');
  const [modalListaVisivel, setModalListaVisivel] = useState(false);
  const [listaEdicaoId, setListaEdicaoId] = useState<number | null>(null);
  const [nomeLista, setNomeLista] = useState('');
  const [observacaoLista, setObservacaoLista] = useState('');
  const [categoriaLista, setCategoriaLista] = useState<ListaCompra['categoria']>('mercado');
  const [participantesFormulario, setParticipantesFormulario] = useState<ParticipanteListaCompra[]>([]);
  const [logsListaModal, setLogsListaModal] = useState<ListaCompraLog[]>([]);
  const [carregandoLogsLista, setCarregandoLogsLista] = useState(false);

  const [amigosDisponiveis, setAmigosDisponiveis] = useState<AmigoRateioApi[]>([]);
  const [carregandoAmigos, setCarregandoAmigos] = useState(false);
  const [usuarioParticipanteSelecionadoId, setUsuarioParticipanteSelecionadoId] = useState('');
  const [permissaoParticipante, setPermissaoParticipante] = useState<'coproprietario' | 'leitor'>('coproprietario');

  const [modalDuplicarLista, setModalDuplicarLista] = useState(false);
  const [listaDuplicacao, setListaDuplicacao] = useState<ListaCompra | null>(null);
  const [nomeDuplicacao, setNomeDuplicacao] = useState('');
  const [observacaoDuplicacao, setObservacaoDuplicacao] = useState('');
  const [categoriaDuplicacao, setCategoriaDuplicacao] = useState<ListaCompra['categoria']>('mercado');

  const carregarListas = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta = await listarListasCompraApi({ incluirArquivadas: true });
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
      setAmigosDisponiveis([]);
      notificarErro(t('compras.mensagens.erroCarregarAmigos'));
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

  const proprietariosNoFormulario = useMemo(
    () => participantesFormulario.filter((participante) => participante.permissao === 'proprietario').length,
    [participantesFormulario],
  );
  const participantesVisiveisNoFormulario = useMemo(
    () => participantesFormulario.filter((participante) => participante.permissao !== 'proprietario'),
    [participantesFormulario],
  );

  const podeSalvarLista = useMemo(
    () => nomeLista.trim().length >= 3 && proprietariosNoFormulario === 1,
    [nomeLista, proprietariosNoFormulario],
  );

  const amigosDisponiveisParaParticipante = useMemo(() => {
    const idsSelecionados = new Set(participantesFormulario.map((participante) => participante.usuarioId));
    return amigosDisponiveis.filter((amigo) => !idsSelecionados.has(amigo.id));
  }, [amigosDisponiveis, participantesFormulario]);

  const consultarFiltros = () => {
    setFiltroAplicado({
      id: filtro.id.trim(),
      descricao: filtro.descricao.trim(),
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
    });
    setStatusFiltroAplicado(statusFiltro);
  };

  const fecharModalLista = () => {
    setModalListaVisivel(false);
    setListaEdicaoId(null);
    setNomeLista('');
    setObservacaoLista('');
    setCategoriaLista('mercado');
    setParticipantesFormulario([]);
    setLogsListaModal([]);
    setCarregandoLogsLista(false);
    setUsuarioParticipanteSelecionadoId('');
    setPermissaoParticipante('coproprietario');
  };

  const abrirModalNovaLista = () => {
    setModoModalLista('criar');
    setListaEdicaoId(null);
    setNomeLista('');
    setObservacaoLista('');
    setCategoriaLista('mercado');
    setParticipantesFormulario(
      usuarioId
        ? [{ usuarioId, nomeUsuario: '', permissao: 'proprietario' }]
        : [],
    );
    setUsuarioParticipanteSelecionadoId('');
    setPermissaoParticipante('coproprietario');
    setModalListaVisivel(true);
  };

  const carregarDetalheListaModal = async (listaId: number) => {
    try {
      setCarregandoLogsLista(true);
      const detalheLista = await obterDetalheListaCompraApi(listaId);
      setNomeLista(detalheLista.nome);
      setObservacaoLista(detalheLista.observacao ?? '');
      setCategoriaLista(detalheLista.categoria);
      setParticipantesFormulario(normalizarParticipantesLista(detalheLista.participantes, usuarioId, detalheLista.criadoPorUsuarioId));
      setLogsListaModal(detalheLista.logs ?? []);
    } catch {
      setLogsListaModal([]);
      notificarErro(t('compras.mensagens.erroCarregarItens'));
    } finally {
      setCarregandoLogsLista(false);
    }
  };

  const abrirModalEditarLista = (lista: ListaCompra) => {
    setModoModalLista('editar');
    setListaEdicaoId(lista.id);
    setNomeLista(lista.nome);
    setObservacaoLista(lista.observacao ?? '');
    setCategoriaLista(lista.categoria);
    setParticipantesFormulario(normalizarParticipantesLista(lista.participantes, usuarioId, lista.criadoPorUsuarioId));
    setUsuarioParticipanteSelecionadoId('');
    setPermissaoParticipante('coproprietario');
    setModalListaVisivel(true);
    void carregarDetalheListaModal(lista.id);
  };

  const abrirModalVisualizarLista = (lista: ListaCompra) => {
    setModoModalLista('visualizar');
    setListaEdicaoId(lista.id);
    setNomeLista(lista.nome);
    setObservacaoLista(lista.observacao ?? '');
    setCategoriaLista(lista.categoria);
    setParticipantesFormulario(normalizarParticipantesLista(lista.participantes, usuarioId, lista.criadoPorUsuarioId));
    setUsuarioParticipanteSelecionadoId('');
    setPermissaoParticipante('coproprietario');
    setModalListaVisivel(true);
    void carregarDetalheListaModal(lista.id);
  };

  const abrirTelaItensLista = (lista: ListaCompra) => {
    setMenuAcoesAbertoListaId(null);
    router.push(`/compras/planejamento?listaId=${lista.id}` as never);
  };

  const adicionarParticipanteFormulario = () => {
    const amigoId = Number(usuarioParticipanteSelecionadoId);
    if (!Number.isInteger(amigoId) || amigoId <= 0) {
      notificarErro(t('compras.mensagens.participanteInvalido'));
      return;
    }

    if (participantesFormulario.some((participante) => participante.usuarioId === amigoId)) {
      notificarErro(t('compras.mensagens.participanteDuplicado'));
      return;
    }

    const amigoSelecionado = amigosDisponiveis.find((amigo) => amigo.id === amigoId);

    setParticipantesFormulario((atual) => [
      ...atual,
      {
        usuarioId: amigoId,
        nomeUsuario: amigoSelecionado?.nome ?? '',
        permissao: permissaoParticipante,
      },
    ]);
    setUsuarioParticipanteSelecionadoId('');
    setPermissaoParticipante('coproprietario');
  };

  const removerParticipanteFormulario = (participanteId: number) => {
    const participante = participantesFormulario.find((item) => item.usuarioId === participanteId);
    if (participante?.permissao === 'proprietario') {
      notificarErro(t('compras.mensagens.proprietarioObrigatorio'));
      return;
    }
    setParticipantesFormulario((atual) => atual.filter((item) => item.usuarioId !== participanteId));
  };

  const atualizarPermissaoParticipanteFormulario = (participanteId: number, permissao: PermissaoParticipanteLista) => {
    setParticipantesFormulario((atual) => atual.map((participante) => {
      if (participante.usuarioId !== participanteId) return participante;
      if (participante.permissao === 'proprietario') return participante;
      return { ...participante, permissao };
    }));
  };

  const salvarLista = async () => {
    if (!podeSalvarLista) {
      if (proprietariosNoFormulario !== 1) {
        notificarErro(t('compras.mensagens.proprietarioObrigatorio'));
      }
      return;
    }

    const payload = {
      nome: nomeLista.trim(),
      observacao: observacaoLista.trim(),
      categoria: categoriaLista,
      participantes: participantesFormulario.map((participante) => ({
        usuarioId: participante.usuarioId,
        permissao: participante.permissao,
      })),
    };

    try {
      if (modoModalLista === 'criar') {
        await criarListaCompraApi(payload);
        notificarSucesso(t('compras.mensagens.listaCriada'));
      } else if (listaEdicaoId) {
        await atualizarListaCompraApi(listaEdicaoId, payload);
        notificarSucesso(t('compras.mensagens.listaAtualizada'));
      }
      fecharModalLista();
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarLista'));
    }
  };

  const abrirModalDuplicarLista = (lista: ListaCompra) => {
    setListaDuplicacao(lista);
    setNomeDuplicacao(lista.nome);
    setObservacaoDuplicacao(lista.observacao ?? '');
    setCategoriaDuplicacao(lista.categoria);
    setModalDuplicarLista(true);
  };

  const fecharModalDuplicarLista = () => {
    setModalDuplicarLista(false);
    setListaDuplicacao(null);
    setNomeDuplicacao('');
    setObservacaoDuplicacao('');
    setCategoriaDuplicacao('mercado');
  };

  const duplicarLista = async () => {
    if (!listaDuplicacao || nomeDuplicacao.trim().length < 3) return;

    try {
      await duplicarListaCompraApi(listaDuplicacao.id, {
        nome: nomeDuplicacao.trim(),
        observacao: observacaoDuplicacao.trim(),
        categoria: categoriaDuplicacao,
        participantes: normalizarParticipantesLista(
          listaDuplicacao.participantes,
          usuarioId,
          listaDuplicacao.criadoPorUsuarioId,
        ).map((participante) => ({
          usuarioId: participante.usuarioId,
          permissao: participante.permissao,
        })),
      });
      fecharModalDuplicarLista();
      notificarSucesso(t('compras.mensagens.listaDuplicada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroDuplicarLista'));
    }
  };

  const arquivarLista = async (listaId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.arquivarLista'), {
      titulo: t('comum.confirmacoes.tituloAcaoCritica'),
      textoConfirmar: t('comum.acoes.arquivar'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('compras.confirmacoes.arquivarListaImpacto'),
      tipoConfirmar: 'perigo',
    });

    if (!confirmar) return;

    try {
      await arquivarListaCompraApi(listaId);
      notificarSucesso(t('compras.mensagens.listaArquivada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroArquivarLista'));
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

  const executarAcaoLista = async (lista: ListaCompra, acao: AcaoListaPlanejamento) => {
    if (acao === 'visualizar') {
      abrirModalVisualizarLista(lista);
      return;
    }

    if (acao === 'editar') {
      abrirModalEditarLista(lista);
      return;
    }

    if (acao === 'duplicar') {
      abrirModalDuplicarLista(lista);
      return;
    }

    if (acao === 'arquivar') {
      await arquivarLista(lista.id);
      return;
    }

    await removerLista(lista.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.bgSecondary,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ width: 42 }} />
        <Text style={{ flex: 1, textAlign: 'center', color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.menu.listas')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, alignItems: 'flex-end' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, padding: 16 }}>
        <Botao titulo={`+ ${t('compras.acoes.novaLista')}`} onPress={abrirModalNovaLista} tipo="primario" estilo={{ marginBottom: 12 }} />

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
            const opcoesAcoesLista: Array<{ value: AcaoListaPlanejamento; label: string; perigosa?: boolean }> = [
              { value: 'visualizar', label: t('comum.acoes.visualizar') },
              ...(permissaoAtual !== 'leitor'
                ? [
                    { value: 'editar' as const, label: t('comum.acoes.editar') },
                    { value: 'duplicar' as const, label: t('comum.acoes.duplicar') },
                  ]
                : []),
              ...(permissaoAtual === 'proprietario'
                ? [
                    { value: 'arquivar' as const, label: t('comum.acoes.arquivar'), perigosa: true },
                    { value: 'excluir' as const, label: t('comum.acoes.excluir'), perigosa: true },
                  ]
                : []),
            ];

            const estiloStatus =
              lista.status === 'ativa'
                ? { corTexto: COLORS.success, corBorda: '#86efac', corFundo: '#14532d' }
                : lista.status === 'arquivada'
                  ? { corTexto: COLORS.warning, corBorda: '#fde68a', corFundo: '#78350f' }
                  : { corTexto: COLORS.info, corBorda: '#93c5fd', corFundo: '#1e3a8a' };

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
                  <TouchableOpacity onPress={() => abrirTelaItensLista(lista)} activeOpacity={0.85} style={{ flex: 1 }}>
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

                  <View style={{ height: 30, justifyContent: 'center' }}>
                    <MenuAcoesItem
                      aberto={menuAcoesAbertoListaId === lista.id}
                      aoAlternar={() => setMenuAcoesAbertoListaId((atual) => (atual === lista.id ? null : lista.id))}
                      aoFechar={() => setMenuAcoesAbertoListaId(null)}
                      tituloMenu={t('compras.acoes.menuAcoes')}
                      opcoes={opcoesAcoesLista.map((opcao) => ({
                        id: `${lista.id}-${opcao.value}`,
                        rotulo: opcao.label,
                        perigosa: opcao.perigosa,
                        aoPressionar: () => {
                          void executarAcaoLista(lista, opcao.value);
                        },
                      }))}
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={() => abrirTelaItensLista(lista)} activeOpacity={0.85}>
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.listas.categoria')}: {t(`compras.categorias.${lista.categoria}`)}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary }}>
                        {t('compras.lista.permissaoAtual')}: {t(`compras.permissoes.${permissaoAtual}`)}
                      </Text>
                    </View>
                    <Text style={{ color: COLORS.textSecondary }}>
                      {t('compras.listas.valorTotal')}: {formatarValorPorIdioma(lista.valorTotal ?? 0)} | {t('compras.listas.valorComprado')}: {formatarValorPorIdioma(lista.valorComprado ?? 0)} ({(lista.percentualComprado ?? 0).toFixed(2)}%)
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: COLORS.textSecondary, flex: 1 }}>
                        {t('compras.listas.quantidadeItensResumo', {
                          comprados: lista.quantidadeItensComprados ?? 0,
                          total: lista.quantidadeItens ?? 0,
                        })}
                      </Text>
                      {lista.atualizadoEm || lista.criadoEm ? (
                        <Text style={{ color: COLORS.textSecondary }}>
                          {formatarDataPorIdioma(lista.atualizadoEm || lista.criadoEm)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>

                
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visivel={modalListaVisivel}
        onFechar={fecharModalLista}
        titulo={
          modoModalLista === 'criar'
            ? t('compras.modalNovaLista.titulo')
            : modoModalLista === 'editar'
              ? t('compras.modalNovaLista.tituloEdicao')
              : t('comum.acoes.visualizar')
        }
      >
        <CampoTexto
          label={t('compras.modalNovaLista.nome')}
          value={nomeLista}
          onChangeText={setNomeLista}
          placeholder={t('compras.modalNovaLista.placeholderNome')}
          editavel={modoModalLista !== 'visualizar'}
        />
        <CampoTexto
          label={t('compras.modalNovaLista.observacao')}
          value={observacaoLista}
          onChangeText={setObservacaoLista}
          placeholder={t('compras.modalNovaLista.placeholderObservacao')}
          multiline
          numberOfLines={3}
          editavel={modoModalLista !== 'visualizar'}
        />
        {modoModalLista === 'visualizar' ? (
          <CampoTexto
            label={t('compras.modalNovaLista.categoria')}
            value={t(`compras.categorias.${categoriaLista}`)}
            onChangeText={() => undefined}
            editavel={false}
          />
        ) : (
          <CampoSelect
            label={t('compras.modalNovaLista.categoria')}
            value={categoriaLista}
            onChange={(valor) => setCategoriaLista(valor as ListaCompra['categoria'])}
            options={opcoesCategoriasLista.map((opcao) => ({ value: opcao.value, label: t(`compras.categorias.${opcao.value}`) }))}
          />
        )}

        <View style={{ marginTop: 8, padding: 10, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, backgroundColor: COLORS.bgTertiary }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700', marginBottom: 8 }}>{t('compras.participantes.tituloFormulario')}</Text>

          {modoModalLista !== 'visualizar' ? (
            <>
              {carregandoAmigos ? <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>{t('comum.carregando')}</Text> : null}

              <CampoSelect
                label={t('compras.participantes.amigo')}
                value={usuarioParticipanteSelecionadoId}
                onChange={setUsuarioParticipanteSelecionadoId}
                options={amigosDisponiveisParaParticipante.map((amigo) => ({
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

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                <Botao titulo={t('compras.participantes.adicionar')} tipo="secundario" onPress={adicionarParticipanteFormulario} />
              </View>
            </>
          ) : null}

          {participantesVisiveisNoFormulario.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.participantes.vazio')}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              <View style={{ gap: 6 }}>
                {participantesVisiveisNoFormulario.map((participante) => (
                  <View
                    key={`${participante.usuarioId}-${participante.permissao}`}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.borderColor,
                      borderRadius: 8,
                      padding: 8,
                      backgroundColor: COLORS.bgSecondary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: COLORS.textSecondary, flex: 1 }}>
                        {participante.nomeUsuario || `${t('compras.participantes.usuario')} ${participante.usuarioId}`}
                      </Text>
                      {modoModalLista === 'visualizar' ? (
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: COLORS.borderColor,
                            backgroundColor: COLORS.bgTertiary,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                          }}
                        >
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{t(`compras.permissoes.${participante.permissao}`)}</Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => atualizarPermissaoParticipanteFormulario(participante.usuarioId, 'coproprietario')}
                            style={{
                              borderWidth: 1,
                              borderColor: participante.permissao === 'coproprietario' ? COLORS.borderAccent : COLORS.borderColor,
                              backgroundColor: participante.permissao === 'coproprietario' ? COLORS.accentSubtle : COLORS.bgTertiary,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: participante.permissao === 'coproprietario' ? COLORS.accent : COLORS.textSecondary, fontSize: 12 }}>
                              {t('compras.permissoes.coproprietario')}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => atualizarPermissaoParticipanteFormulario(participante.usuarioId, 'leitor')}
                            style={{
                              borderWidth: 1,
                              borderColor: participante.permissao === 'leitor' ? COLORS.borderAccent : COLORS.borderColor,
                              backgroundColor: participante.permissao === 'leitor' ? COLORS.accentSubtle : COLORS.bgTertiary,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: participante.permissao === 'leitor' ? COLORS.accent : COLORS.textSecondary, fontSize: 12 }}>
                              {t('compras.permissoes.leitor')}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removerParticipanteFormulario(participante.usuarioId)}
                            style={{
                              borderWidth: 1,
                              borderColor: COLORS.error,
                              backgroundColor: COLORS.errorSoft,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={{ color: COLORS.error, fontSize: 12 }}>{t('comum.acoes.remover')}</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {modoModalLista !== 'visualizar' && proprietariosNoFormulario !== 1 ? (
            <Text style={{ color: COLORS.error, marginTop: 8 }}>{t('compras.participantes.proprietarioObrigatorio')}</Text>
          ) : null}
        </View>

        {modoModalLista !== 'criar' ? (
          <View style={{ marginTop: 8, padding: 10, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, backgroundColor: COLORS.bgTertiary }}>
            <Text style={{ color: COLORS.accent, fontWeight: '700', marginBottom: 8 }}>{t('compras.logs.titulo')}</Text>
            {carregandoLogsLista ? <Text style={{ color: COLORS.textSecondary }}>{t('comum.carregando')}</Text> : null}
            {!carregandoLogsLista && logsListaModal.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.logs.vazio')}</Text>
            ) : null}
            {!carregandoLogsLista && logsListaModal.length > 0 ? (
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                <View style={{ gap: 8 }}>
                  {logsListaModal.slice(0, 20).map((log) => (
                    <View
                      key={log.id}
                      style={{
                        borderWidth: 1,
                        borderColor: COLORS.borderColor,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        backgroundColor: COLORS.bgSecondary,
                        gap: 4,
                      }}
                    >
                      <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>{log.evento}</Text>
                      {log.descricao ? <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{log.descricao}</Text> : null}
                      <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{formatarDataHoraPorIdioma(log.dataHoraUtc)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <Botao titulo={modoModalLista === 'visualizar' ? t('comum.acoes.fechar') : t('comum.acoes.cancelar')} tipo="secundario" onPress={fecharModalLista} />
          {modoModalLista !== 'visualizar' ? (
            <Botao titulo={t('comum.acoes.salvar')} onPress={() => void salvarLista()} desabilitado={!podeSalvarLista} />
          ) : null}
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
    </View>
  );
}
