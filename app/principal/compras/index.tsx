import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  adicionarParticipanteListaCompraApi,
  arquivarListaCompraApi,
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

const filtroInicial: FiltroPadraoValor = {
  id: '',
  descricao: '',
  dataInicio: '',
  dataFim: '',
};

function obterPermissaoUsuario(lista: ListaCompra, usuarioId?: number): PermissaoParticipanteLista {
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
  const [categoriaLista, setCategoriaLista] = useState<ListaCompra['categoria']>('mercado');
  const [filtro, setFiltro] = useState<FiltroPadraoValor>(filtroInicial);
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>(filtroInicial);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroLista>('todos');
  const [statusFiltroAplicado, setStatusFiltroAplicado] = useState<StatusFiltroLista>('todos');
  const [amigosDisponiveis, setAmigosDisponiveis] = useState<AmigoRateioApi[]>([]);
  const [carregandoAmigos, setCarregandoAmigos] = useState(false);
  const [modalParticipantesListaId, setModalParticipantesListaId] = useState<number | null>(null);
  const [amigoSelecionadoId, setAmigoSelecionadoId] = useState('');
  const [permissaoParticipante, setPermissaoParticipante] = useState<'editor' | 'leitor'>('editor');

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
    setPermissaoParticipante('editor');
  };

  const fecharModalParticipantes = () => {
    setModalParticipantesListaId(null);
    setAmigoSelecionadoId('');
    setPermissaoParticipante('editor');
  };

  const abrirLista = (listaId: number) => {
    router.push(`/principal/compras/lista?listaId=${listaId}` as never);
  };

  const criarLista = async () => {
    if (!podeSalvarLista) return;
    try {
      await criarListaCompraApi({
        nome: nomeLista.trim(),
        categoria: categoriaLista,
      });
      setNomeLista('');
      setCategoriaLista('mercado');
      setModalNovaLista(false);
      notificarSucesso(t('compras.mensagens.listaCriada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarLista'));
    }
  };

  const duplicarLista = async (listaId: number) => {
    try {
      await duplicarListaCompraApi(listaId);
      notificarSucesso(t('compras.mensagens.listaDuplicada'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroDuplicarLista'));
    }
  };

  const arquivarLista = async (listaId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.arquivarLista'), {
      titulo: t('comum.acoes.confirmar'),
      textoConfirmar: t('comum.acoes.confirmar'),
      textoCancelar: t('comum.acoes.cancelar'),
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
      titulo: t('comum.acoes.confirmar'),
      textoConfirmar: t('comum.acoes.confirmar'),
      textoCancelar: t('comum.acoes.cancelar'),
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
    const participanteId = Number(amigoSelecionadoId);
    if (!Number.isInteger(participanteId) || participanteId <= 0) {
      notificarErro(t('compras.mensagens.participanteInvalido'));
      return;
    }

    try {
      await adicionarParticipanteListaCompraApi(listaModalParticipantes.id, {
        participanteId,
        permissao: permissaoParticipante,
      });
      notificarSucesso(t('compras.mensagens.participanteAdicionado'));
      setAmigoSelecionadoId('');
      setPermissaoParticipante('editor');
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroCompartilharLista'));
    }
  };

  const removerParticipante = async (listaId: number, participanteId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.removerParticipante'), {
      titulo: t('comum.acoes.confirmar'),
      textoConfirmar: t('comum.acoes.confirmar'),
      textoCancelar: t('comum.acoes.cancelar'),
    });
    if (!confirmar) return;

    try {
      await removerParticipanteListaCompraApi(listaId, participanteId);
      notificarSucesso(t('compras.mensagens.participanteRemovido'));
      await carregarListas();
    } catch {
      notificarErro(t('compras.mensagens.erroRemoverParticipante'));
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

        <View style={{ gap: 10 }}>
          {listasFiltradas.map((lista) => {
            const permissaoAtual = obterPermissaoUsuario(lista, usuarioId);
            const ehProprietario = permissaoAtual === 'proprietario';
            const podeDuplicar = permissaoAtual !== 'leitor';
            return (
              <View
                key={lista.id}
                style={{
                  backgroundColor: COLORS.bgTertiary,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <TouchableOpacity onPress={() => abrirLista(lista.id)} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15, flex: 1 }}>{lista.nome}</Text>
                    <View
                      style={{
                        backgroundColor:
                          lista.status === 'ativa'
                            ? COLORS.success
                            : lista.status === 'arquivada'
                              ? COLORS.warning
                              : COLORS.accent,
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' }}>{t(`compras.status.${lista.status}`)}</Text>
                    </View>
                  </View>

                  <Text style={{ color: COLORS.textSecondary, marginTop: 6 }}>
                    {t('compras.listas.categoria')}: {t(`compras.categorias.${lista.categoria}`)}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary }}>
                    {t('compras.listas.participantes')}: {lista.participantes.length}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary }}>
                    {t('compras.lista.permissaoAtual')}: {t(`compras.permissoes.${permissaoAtual}`)}
                  </Text>
                  {lista.atualizadoEm || lista.criadoEm ? (
                    <Text style={{ color: COLORS.textSecondary }}>
                      {t('compras.listas.ultimaAtualizacao')}: {formatarDataPorIdioma(lista.atualizadoEm || lista.criadoEm)}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {podeDuplicar ? (
                    <Botao titulo={t('comum.acoes.duplicar')} tipo="secundario" onPress={() => void duplicarLista(lista.id)} />
                  ) : null}
                  {ehProprietario ? (
                    <Botao
                      titulo={t('compras.participantes.gerenciar')}
                      tipo="secundario"
                      onPress={() => abrirModalParticipantes(lista.id)}
                    />
                  ) : null}
                  {ehProprietario && lista.status !== 'arquivada' ? (
                    <Botao titulo={t('compras.acoes.arquivarLista')} tipo="secundario" onPress={() => void arquivarLista(lista.id)} />
                  ) : null}
                  {ehProprietario ? (
                    <Botao titulo={t('comum.acoes.remover')} tipo="perigo" onPress={() => void removerLista(lista.id)} />
                  ) : null}
                </View>
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

      <Modal
        visivel={Boolean(listaModalParticipantes)}
        onFechar={fecharModalParticipantes}
        titulo={t('compras.participantes.tituloModal', { nomeLista: listaModalParticipantes?.nome ?? '' })}
      >
        {carregandoAmigos ? (
          <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>{t('comum.carregando')}</Text>
        ) : null}
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
          onChange={(valor) => setPermissaoParticipante(valor as 'editor' | 'leitor')}
          options={[
            { value: 'editor', label: t('compras.permissoes.editor') },
            { value: 'leitor', label: t('compras.permissoes.leitor') },
          ]}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Botao titulo={t('compras.participantes.convidar')} onPress={() => void convidarParticipante()} tipo="primario" />
        </View>

        <View style={{ backgroundColor: COLORS.bgTertiary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 10, gap: 8 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{t('compras.participantes.listaAtual')}</Text>
          {listaModalParticipantes ? (
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
                  {listaModalParticipantes && participante.usuarioId !== listaModalParticipantes.criadoPorUsuarioId ? (
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
