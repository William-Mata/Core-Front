import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { COLORS } from '../../../src/styles/variables';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { formatarDataPorIdioma } from '../../../src/utils/formatacaoLocale';
import { erroApiJaNotificado, extrairMensagemErroApi } from '../../../src/utils/erroApi';
import {
  atualizarUsuarioAdminApi,
  criarUsuarioAdminApi,
  deletarUsuarioAdminApi,
  listarUsuariosAdminApi,
  obterUsuarioAdminApi,
  type UsuarioAdminApi,
} from '../../../src/servicos/administracao';
import { InterfaceModuloUsuario, InterfaceTelaModulo } from '../../../src/tipos/usuario.tipos';

type UsuarioRegistro = UsuarioAdminApi;

interface CatalogoTela {
  id: string;
  nome: string;
  funcionalidades: Array<{ id: string; nome: string }>;
}

interface CatalogoModulo {
  id: string;
  nome: string;
  telas: CatalogoTela[];
}

const FUNCIONALIDADES = {
  visualizar: { id: '1' },
  criar: { id: '2' },
  editar: { id: '3' },
  excluir: { id: '4' },
} as const;

function criarCatalogoModulos(t: (chave: string) => string): CatalogoModulo[] {
  const acoesCrud = [
    { id: FUNCIONALIDADES.visualizar.id, nome: t('comum.acoes.visualizar') },
    { id: FUNCIONALIDADES.criar.id, nome: t('comum.acoes.criar') },
    { id: FUNCIONALIDADES.editar.id, nome: t('comum.acoes.editar') },
    { id: FUNCIONALIDADES.excluir.id, nome: t('comum.acoes.excluir') },
  ];
  const somenteVisualizar = [{ id: FUNCIONALIDADES.visualizar.id, nome: t('comum.acoes.visualizar') }];

  return [
    {
      id: '1',
      nome: t('menu.geral'),
      telas: [
        { id: '1', nome: t('menu.dashboard'), funcionalidades: somenteVisualizar },
        { id: '2', nome: t('menu.painelUsuario'), funcionalidades: somenteVisualizar },
        { id: '3', nome: t('menu.listaAmigos'), funcionalidades: acoesCrud },
        { id: '4', nome: t('menu.convites'), funcionalidades: acoesCrud },
        { id: '5', nome: t('documentacao.acao'), funcionalidades: somenteVisualizar },
      ],
    },
    {
      id: '2',
      nome: t('menu.administracao'),
      telas: [
        { id: '30', nome: t('menu.administracao'), funcionalidades: somenteVisualizar },
        { id: '31', nome: t('menu.usuarios'), funcionalidades: acoesCrud },
        { id: '32', nome: t('menu.permissoes'), funcionalidades: acoesCrud },
        { id: '33', nome: t('menu.documentos'), funcionalidades: acoesCrud },
        { id: '34', nome: t('menu.avisos'), funcionalidades: acoesCrud },
        { id: '35', nome: t('documentacao.acao'), funcionalidades: somenteVisualizar },
      ],
    },
    {
      id: '3',
      nome: t('menu.financeiro'),
      telas: [
        { id: '100', nome: t('menu.despesas'), funcionalidades: acoesCrud },
        { id: '101', nome: t('menu.receitas'), funcionalidades: acoesCrud },
        { id: '102', nome: t('menu.reembolsos'), funcionalidades: acoesCrud },
        { id: '103', nome: t('menu.contasBancarias'), funcionalidades: acoesCrud },
        { id: '104', nome: t('menu.cartoesCredito'), funcionalidades: acoesCrud },
        { id: '105', nome: t('documentacao.acao'), funcionalidades: somenteVisualizar },
      ],
    },
  ];
}

function criarModulosIniciais(catalogo: CatalogoModulo[], perfil: 'USER' | 'ADMIN'): InterfaceModuloUsuario[] {
  return catalogo.map((modulo) => {
    const ativoModulo = modulo.id === '2' ? perfil === 'ADMIN' : true;
    return {
      id: modulo.id,
      nome: modulo.nome,
      status: ativoModulo,
      telas: modulo.telas.map((tela) => ({
        id: tela.id,
        nome: tela.nome,
        status: ativoModulo,
        funcionalidades: tela.funcionalidades.map((func) => ({
          id: func.id,
          nome: func.nome,
          status: ativoModulo,
        })),
      })),
    };
  });
}

function normalizarModulosUsuario(catalogo: CatalogoModulo[], origem: InterfaceModuloUsuario[] | undefined, perfil: 'USER' | 'ADMIN'): InterfaceModuloUsuario[] {
  const modulosOrigem = Array.isArray(origem) ? origem : [];
  const mapaModulos = new Map(modulosOrigem.map((m) => [m.id, m]));

  return catalogo.map((moduloCatalogo) => {
    const moduloOrigem = mapaModulos.get(moduloCatalogo.id);
    const statusPadrao = false;
    const statusModulo = moduloOrigem?.status ?? statusPadrao;

    const telasOrigemBrutas = Array.isArray(moduloOrigem?.telas)
      ? moduloOrigem!.telas
      : Array.isArray(moduloOrigem?.funcionalidades)
        ? (moduloOrigem!.funcionalidades as unknown as InterfaceTelaModulo[])
        : [];
    const mapaTelas = new Map(telasOrigemBrutas.map((t) => [t.id, t]));

    const telas = moduloCatalogo.telas.map((telaCatalogo) => {
      const telaOrigem = mapaTelas.get(telaCatalogo.id);
      const statusTela = statusModulo ? (telaOrigem?.status ?? false) : false;
      const mapaFunc = new Map((telaOrigem?.funcionalidades ?? []).map((f) => [f.id, f]));
      return {
        id: telaCatalogo.id,
        nome: telaCatalogo.nome,
        status: statusTela,
        funcionalidades: telaCatalogo.funcionalidades.map((func) => ({
          id: func.id,
          nome: mapaFunc.get(func.id)?.nome || func.nome,
          status: statusTela ? (mapaFunc.get(func.id)?.status ?? false) : false,
        })),
      };
    });

    return {
      id: moduloCatalogo.id,
      nome: moduloCatalogo.nome,
      status: statusModulo,
      telas,
    };
  });
}

export default function FormUsuario() {
  const router = useRouter();
  const { id, novo } = useLocalSearchParams();
  const { t } = usarTraducao();
  const catalogoModulos = useMemo(() => criarCatalogoModulos(t), [t]);

  const usuarioId = Array.isArray(id) ? Number(id[0]) : id ? Number(id) : null;
  const criandoNovo = novo === '1';
  const emEdicao = Boolean(usuarioId && !criandoNovo);

  const [usuarios, setUsuarios] = useState<UsuarioRegistro[]>([]);
  const [filtro, setFiltro] = useState<FiltroPadraoValor>({ id: '', descricao: '', dataInicio: '', dataFim: '' });
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<'USER' | 'ADMIN'>('USER');
  const [statusUsuario, setStatusUsuario] = useState(true);
  const [modulosAtivos, setModulosAtivos] = useState<InterfaceModuloUsuario[]>(criarModulosIniciais(catalogoModulos, 'USER'));
  const [carregando, setCarregando] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<string, boolean>>({});
  const [telasExpandidas, setTelasExpandidas] = useState<Record<string, boolean>>({});
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioRegistro | null>(null);

  const modoFormulario = Boolean(usuarioId || criandoNovo);

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((usr) => {
        const bateId = !filtro.id || String(usr.id).includes(filtro.id);
        const termo = filtro.descricao.trim().toLowerCase();
        const bateDescricao = !termo || usr.nome.toLowerCase().includes(termo) || usr.email.toLowerCase().includes(termo);
        const bateData = estaDentroIntervalo(usr.dataCriacao, filtro.dataInicio, filtro.dataFim);
        return bateId && bateDescricao && bateData;
      }),
    [usuarios, filtro],
  );

  const resetarFormulario = () => {
    setNome('');
    setEmail('');
    setPerfil('USER');
    setStatusUsuario(true);
    setModulosAtivos(criarModulosIniciais(catalogoModulos, 'USER'));
    setModulosExpandidos({});
    setTelasExpandidas({});
    setCamposInvalidos({});
    setUsuarioSelecionado(null);
  };

  const carregarUsuarios = async (signal?: AbortSignal) => {
    setCarregandoLista(true);
    try {
      const dados = await listarUsuariosAdminApi(signal);
      setUsuarios(dados);
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('admin.usuario.erros.falhaSalvar')));
    } finally {
      setCarregandoLista(false);
    }
  };

  const carregarUsuarioPorId = async (idUsuario: number, signal?: AbortSignal) => {
    setCarregandoDetalhe(true);
    try {
      const usuario = await obterUsuarioAdminApi(idUsuario, signal);
      setUsuarioSelecionado(usuario);
      setNome(usuario.nome);
      setEmail(usuario.email);
      setPerfil(usuario.perfil);
      setStatusUsuario(usuario.status !== false);
      setModulosAtivos(normalizarModulosUsuario(catalogoModulos, usuario.modulosAtivos, usuario.perfil));
      setModulosExpandidos({});
      setTelasExpandidas({});
      setCamposInvalidos({});
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('admin.usuario.erros.falhaSalvar')));
      router.replace('/principal/admin/usuario');
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (modoFormulario) {
      if (emEdicao && usuarioId) {
        void carregarUsuarioPorId(usuarioId, controller.signal);
      } else if (criandoNovo) {
        resetarFormulario();
      }
    } else {
      void carregarUsuarios(controller.signal);
      setUsuarioSelecionado(null);
    }
    return () => controller.abort();
  }, [modoFormulario, emEdicao, usuarioId, criandoNovo]);

  const abrirNovo = () => {
    resetarFormulario();
    router.push('/principal/admin/usuario?novo=1');
  };

  const abrirEdicao = (usuario: UsuarioRegistro) => {
    router.push(`/principal/admin/usuario?id=${usuario.id}`);
  };

  const voltarParaLista = () => {
    resetarFormulario();
    router.replace('/principal/admin/usuario');
  };

  const atualizarStatusModulo = (moduloId: string, status: boolean) => {
    setModulosAtivos((atuais) =>
      atuais.map((modulo) =>
        modulo.id === moduloId
          ? {
              ...modulo,
              status,
              telas: modulo.telas.map((tela) => ({
                ...tela,
                status,
                funcionalidades: tela.funcionalidades.map((f) => ({ ...f, status })),
              })),
            }
          : modulo,
      ),
    );
  };

  const atualizarStatusTela = (moduloId: string, telaId: string, status: boolean) => {
    setModulosAtivos((atuais) =>
      atuais.map((modulo) =>
        modulo.id === moduloId
          ? {
              ...modulo,
              status: status ? true : modulo.status,
              telas: modulo.telas.map((tela) =>
                tela.id === telaId
                  ? {
                      ...tela,
                      status,
                      funcionalidades: tela.funcionalidades.map((f) => ({ ...f, status })),
                    }
                  : tela,
              ),
            }
          : modulo,
      ),
    );
  };

  const atualizarStatusFuncionalidade = (moduloId: string, telaId: string, funcionalidadeId: string, status: boolean) => {
    setModulosAtivos((atuais) =>
      atuais.map((modulo) =>
        modulo.id === moduloId
          ? {
              ...modulo,
              status: status ? true : modulo.status,
              telas: modulo.telas.map((tela) =>
                tela.id === telaId
                  ? {
                      ...tela,
                      status: status ? true : tela.status,
                      funcionalidades: tela.funcionalidades.map((f) => (f.id === funcionalidadeId ? { ...f, status } : f)),
                    }
                  : tela,
              ),
            }
          : modulo,
      ),
    );
  };

  const alternarExpansaoModulo = (moduloId: string) => {
    setModulosExpandidos((atual) => ({ ...atual, [moduloId]: !atual[moduloId] }));
  };

  const alternarExpansaoTela = (moduloId: string, telaId: string) => {
    const chave = `${moduloId}:${telaId}`;
    setTelasExpandidas((atual) => ({ ...atual, [chave]: !atual[chave] }));
  };

  const handleSalvar = async () => {
    if (!nome.trim() || !email.trim()) {
      setCamposInvalidos((atual) => ({ ...atual, nome: !nome.trim(), email: !email.trim() }));
      notificarErro(t('admin.usuario.erros.nomeEmailObrigatorio'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setCamposInvalidos((atual) => ({ ...atual, email: true }));
      notificarErro(t('admin.usuario.erros.emailInvalido'));
      return;
    }

    setCarregando(true);
    try {
      const payload = { nome: nome.trim(), email: email.trim(), perfil, status: statusUsuario, modulosAtivos };
      if (emEdicao && usuarioId) await atualizarUsuarioAdminApi(usuarioId, payload);
      else await criarUsuarioAdminApi(payload);

      notificarSucesso(t('admin.usuario.sucessoSalvo', { acao: usuarioSelecionado ? t('admin.usuario.atualizado') : t('admin.usuario.criado') }));
      voltarParaLista();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('admin.usuario.erros.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletar = async () => {
    if (!usuarioId) return;
    setCarregando(true);
    try {
      await deletarUsuarioAdminApi(usuarioId);
      notificarSucesso(t('admin.usuario.sucessoDeletado'));
      voltarParaLista();
    } catch (erro) {
      if (erroApiJaNotificado(erro)) return;
      notificarErro(extrairMensagemErroApi(erro, t('admin.usuario.erros.falhaSalvar')));
    } finally {
      setCarregando(false);
    }
  };

  if (!modoFormulario) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
        <View style={{ backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.accent, fontSize: 24 }}>{'\u2190'}</Text></TouchableOpacity>
            <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('admin.usuarios.lista')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 24 }}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, padding: 16 }}>
          <Botao titulo={`+ ${t('admin.usuarios.criar')}`} onPress={abrirNovo} tipo="primario" estilo={{ marginBottom: 12 }} />
          <FiltroPadrao valor={filtro} aoMudar={setFiltro} />

          <FlatList
            data={usuariosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => abrirEdicao(item)} style={{ backgroundColor: COLORS.bgTertiary, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{item.nome}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{item.email}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{formatarDataPorIdioma(item.dataCriacao)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={{ backgroundColor: item.perfil === 'ADMIN' ? COLORS.accent : COLORS.bgSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: item.perfil === 'ADMIN' ? 0 : 1, borderColor: COLORS.borderColor }}>
                    <Text style={{ color: item.perfil === 'ADMIN' ? 'white' : COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{item.perfil}</Text>
                  </View>
                  <View style={{ backgroundColor: item.status ? COLORS.success : COLORS.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                      {item.status ? t('admin.usuario.statusAtivo') : t('admin.usuario.statusInativo')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 32 }}>{carregandoLista ? t('comum.carregando') : t('admin.usuarios.vazio')}</Text>}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgSecondary, borderBottomWidth: 1, borderBottomColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{emEdicao ? t('admin.usuario.editar') : t('admin.usuario.novo')}</Text>
        <TouchableOpacity onPress={voltarParaLista} style={{ paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: COLORS.textSecondary, fontSize: 24 }}>{'\u2715'}</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {carregandoDetalhe ? <Text style={{ color: COLORS.textSecondary, marginBottom: 12 }}>{t('comum.carregando')}</Text> : null}
        <CampoTexto label={t('admin.usuario.nomeCompleto')} placeholder={t('admin.usuario.nomePlaceholder')} value={nome} onChangeText={(v) => { setCamposInvalidos((a) => ({ ...a, nome: false })); setNome(v); }} error={camposInvalidos.nome} estilo={{ marginBottom: 16 }} />
        <CampoTexto label={t('comum.email')} placeholder="usuario@example.com" value={email} onChangeText={(v) => { setCamposInvalidos((a) => ({ ...a, email: false })); setEmail(v); }} error={camposInvalidos.email} keyboardType="email-address" estilo={{ marginBottom: 16 }} />

        <CampoSelect
          label={t('admin.usuario.perfilAcesso')}
          placeholder={t('comum.acoes.selecionar')}
          options={[{ value: 'USER', label: `${'\uD83D\uDC64'} ${t('admin.usuario.perfilUser')}` }, { value: 'ADMIN', label: `${'\uD83D\uDEE1\uFE0F'} ${t('admin.usuario.perfilAdmin')}` }]}
          value={perfil}
          onChange={(value) => {
            const proximo = value as 'USER' | 'ADMIN';
            setPerfil(proximo);
            setModulosAtivos((atuais) => atuais.map((m) => m.id === '2' ? { ...m, status: proximo === 'ADMIN', telas: m.telas.map((tela) => ({ ...tela, status: proximo === 'ADMIN', funcionalidades: tela.funcionalidades.map((f) => ({ ...f, status: proximo === 'ADMIN' })) })) } : m));
          }}
        />

        <CampoSelect
          label={t('admin.usuario.status')}
          placeholder={t('comum.acoes.selecionar')}
          options={[
            { value: 'ATIVO', label: t('admin.usuario.statusAtivo') },
            { value: 'INATIVO', label: t('admin.usuario.statusInativo') },
          ]}
          value={statusUsuario ? 'ATIVO' : 'INATIVO'}
          onChange={(v) => setStatusUsuario(v === 'ATIVO')}
        />

        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 10, padding: 12, marginBottom: 20 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>
            {t('admin.usuario.permissoesTitulo')}
          </Text>

          {modulosAtivos.map((modulo) => {
            const expandido = modulosExpandidos[modulo.id] ?? false;
            return (
              <View key={modulo.id} style={{ marginBottom: 10 }}>
                <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor }}>
                  <TouchableOpacity onPress={() => alternarExpansaoModulo(modulo.id)} style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', flex: 1 }}>{modulo.nome}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Switch
                        value={modulo.status}
                        onValueChange={(status) => atualizarStatusModulo(modulo.id, status)}
                        trackColor={{ false: COLORS.borderColor, true: COLORS.accent }}
                        thumbColor={modulo.status ? COLORS.accent : COLORS.textSecondary}
                      />
                      <Text style={{ color: COLORS.accent, fontSize: 18 }}>{expandido ? '-' : '+'}</Text>
                    </View>
                  </TouchableOpacity>

                  {expandido ? (
                    <View style={{ paddingHorizontal: 10, paddingBottom: 10, gap: 8 }}>
                      {modulo.telas.map((tela) => (
                        <View key={tela.id} style={{ backgroundColor: COLORS.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderColor, padding: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity onPress={() => alternarExpansaoTela(modulo.id, tela.id)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', flex: 1 }}>{tela.nome}</Text>
                              <Text style={{ color: COLORS.accent, fontSize: 16, marginLeft: 8 }}>{(telasExpandidas[`${modulo.id}:${tela.id}`] ?? false) ? '-' : '+'}</Text>
                            </TouchableOpacity>
                            <Switch
                              value={tela.status}
                              onValueChange={(status) => atualizarStatusTela(modulo.id, tela.id, status)}
                              disabled={!modulo.status}
                              trackColor={{ false: COLORS.borderColor, true: COLORS.accent }}
                              thumbColor={tela.status ? COLORS.accent : COLORS.textSecondary}
                            />
                          </View>

                          {(telasExpandidas[`${modulo.id}:${tela.id}`] ?? false) ? (
                            <View style={{ marginTop: 6, gap: 4 }}>
                              {tela.funcionalidades.map((func) => (
                                <View key={func.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 6 }}>
                                  <Text style={{ color: func.status ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 11, flex: 1 }}>{func.nome}</Text>
                                  <Switch
                                    value={func.status}
                                    onValueChange={(status) => atualizarStatusFuncionalidade(modulo.id, tela.id, func.id, status)}
                                    disabled={!modulo.status || !tela.status}
                                    trackColor={{ false: COLORS.borderColor, true: COLORS.accent }}
                                    thumbColor={func.status ? COLORS.accent : COLORS.textSecondary}
                                  />
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Botao titulo={t('comum.acoes.cancelar')} onPress={voltarParaLista} tipo="secundario" estilo={{ flex: 1 }} disabled={carregando} />
          <Botao titulo={carregando ? t('admin.usuario.salvando') : t('comum.acoes.salvar')} onPress={handleSalvar} tipo="primario" estilo={{ flex: 1 }} disabled={carregando} />
        </View>

        {emEdicao ? <Botao titulo={t('admin.usuario.deletar')} onPress={handleDeletar} tipo="perigo" disabled={carregando} /> : null}
      </ScrollView>
    </View>
  );
}
