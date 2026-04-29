import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { FiltroPadrao, type FiltroPadraoValor } from '../../../src/componentes/comuns/FiltroPadrao';
import { Modal } from '../../../src/componentes/comuns/Modal';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import {
  converterDesejosParaListaCompraApi,
  criarDesejoCompraApi,
  listarDesejosCompraApi,
  listarListasCompraApi,
  removerDesejoCompraApi,
  atualizarDesejoCompraApi,
} from '../../../src/servicos/compras';
import { DesejoCompra, ListaCompra } from '../../../src/tipos/compras.tipos';
import {
  aplicarMascaraNumeroPorLocale,
  converterTextoNumeroPorLocale,
  formatarNumeroEntradaPorLocale,
} from '../../../src/utils/compras.util';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { estaDentroIntervalo } from '../../../src/utils/filtroData';
import { formatarValorPorIdioma, obterLocaleAtivo } from '../../../src/utils/formatacaoLocale';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { COLORS } from '../../../src/styles/variables';

const opcoesUnidade = ['unidade', 'kg', 'g', 'mg', 'l', 'ml', 'pacote', 'caixa'] as const;
type UnidadeFiltroDesejos = 'todas' | DesejoCompra['unidadeMedida'];

const filtroInicial: FiltroPadraoValor = {
  id: '',
  descricao: '',
  dataInicio: '',
  dataFim: '',
};

export default function DesejosCompraTela() {
  const { t } = usarTraducao();
  const router = useRouter();
  const [desejos, setDesejos] = useState<DesejoCompra[]>([]);
  const [listas, setListas] = useState<ListaCompra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalDesejo, setModalDesejo] = useState(false);
  const [modalConverter, setModalConverter] = useState(false);
  const [desejoEdicao, setDesejoEdicao] = useState<DesejoCompra | null>(null);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const localeAtivo = obterLocaleAtivo();
  const [valorAlvo, setValorAlvo] = useState(() => formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
  const [observacao, setObservacao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<DesejoCompra['unidadeMedida']>('unidade');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [modoConversao, setModoConversao] = useState<'listaExistente' | 'novaLista'>('novaLista');
  const [listaDestinoId, setListaDestinoId] = useState<string>('');
  const [nomeNovaLista, setNomeNovaLista] = useState('');
  const [categoriaNovaLista, setCategoriaNovaLista] = useState<ListaCompra['categoria']>('outros');
  const [acaoPosConversao, setAcaoPosConversao] = useState<'Manter' | 'Arquivar' | 'MarcarComoConvertido'>('MarcarComoConvertido');
  const [filtro, setFiltro] = useState<FiltroPadraoValor>(filtroInicial);
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPadraoValor>(filtroInicial);
  const [filtroUnidade, setFiltroUnidade] = useState<UnidadeFiltroDesejos>('todas');
  const [filtroUnidadeAplicado, setFiltroUnidadeAplicado] = useState<UnidadeFiltroDesejos>('todas');

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const [desejosResposta, listasResposta] = await Promise.all([listarDesejosCompraApi(), listarListasCompraApi()]);
      setDesejos(desejosResposta);
      setListas(listasResposta);
    } catch {
      notificarErro(t('compras.mensagens.erroCarregarDesejos'));
    } finally {
      setCarregando(false);
    }
  }, [t]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const quantidadeSelecionados = useMemo(() => selecionados.length, [selecionados.length]);
  const tituloModalDesejo = desejoEdicao ? t('compras.desejos.editarTitulo') : t('compras.desejos.novoTitulo');
  const desejosFiltrados = useMemo(() => {
    const termoId = filtroAplicado.id.trim();
    const termoDescricao = filtroAplicado.descricao.trim().toLowerCase();

    return desejos.filter((desejo) => {
      const bateId = !termoId || String(desejo.id).includes(termoId);
      const bateDescricao = !termoDescricao || desejo.descricao.toLowerCase().includes(termoDescricao);
      const bateData = estaDentroIntervalo(desejo.criadoEm, filtroAplicado.dataInicio, filtroAplicado.dataFim);
      const bateUnidade = filtroUnidadeAplicado === 'todas' || desejo.unidadeMedida === filtroUnidadeAplicado;
      return bateId && bateDescricao && bateData && bateUnidade;
    });
  }, [desejos, filtroAplicado, filtroUnidadeAplicado]);

  const resumoDesejos = useMemo(() => {
    const totalDesejos = desejosFiltrados.length;
    const totalSelecionados = desejosFiltrados.filter((desejo) => selecionados.includes(desejo.id)).length;
    const totalValorAlvo = desejosFiltrados.reduce((soma, desejo) => soma + desejo.valorAlvo, 0);
    return {
      totalDesejos,
      totalSelecionados,
      totalValorAlvo,
    };
  }, [desejosFiltrados, selecionados]);

  const consultarFiltros = () => {
    setFiltroAplicado({
      id: filtro.id.trim(),
      descricao: filtro.descricao.trim(),
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
    });
    setFiltroUnidadeAplicado(filtroUnidade);
  };

  const limparFormularioDesejo = () => {
    setDesejoEdicao(null);
    setDescricao('');
    setObservacao('');
    setQuantidade('1');
    setValorAlvo(formatarNumeroEntradaPorLocale(0, localeAtivo, 2));
    setUnidadeMedida('unidade');
  };

  const abrirNovoDesejo = () => {
    limparFormularioDesejo();
    setModalDesejo(true);
  };

  const abrirEditarDesejo = (desejo: DesejoCompra) => {
    setDesejoEdicao(desejo);
    setDescricao(desejo.descricao);
    setObservacao(desejo.observacao);
    setQuantidade(String(desejo.quantidade));
    setValorAlvo(formatarNumeroEntradaPorLocale(desejo.valorAlvo, localeAtivo, 2));
    setUnidadeMedida(desejo.unidadeMedida);
    setModalDesejo(true);
  };

  const alternarSelecao = (desejoId: number) => {
    setSelecionados((atual) => (atual.includes(desejoId) ? atual.filter((id) => id !== desejoId) : [...atual, desejoId]));
  };

  const salvarDesejo = async () => {
    const quantidadeNumero = converterTextoNumeroPorLocale(quantidade, localeAtivo);
    const valorAlvoNumero = converterTextoNumeroPorLocale(valorAlvo, localeAtivo);
    if (!descricao.trim() || quantidadeNumero <= 0) {
      notificarErro(t('compras.mensagens.itemInvalido'));
      return;
    }

    try {
      if (desejoEdicao) {
        await atualizarDesejoCompraApi(desejoEdicao.id, {
          descricao: descricao.trim(),
          observacao: observacao.trim(),
          unidadeMedida,
          quantidade: quantidadeNumero,
          valorAlvo: valorAlvoNumero > 0 ? valorAlvoNumero : 0,
        });
        notificarSucesso(t('compras.mensagens.desejoAtualizado'));
      } else {
        await criarDesejoCompraApi({
          descricao: descricao.trim(),
          observacao: observacao.trim(),
          unidadeMedida,
          quantidade: quantidadeNumero,
          valorAlvo: valorAlvoNumero > 0 ? valorAlvoNumero : 0,
        });
        notificarSucesso(t('compras.mensagens.desejoCriado'));
      }
      setModalDesejo(false);
      limparFormularioDesejo();
      await carregarDados();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarDesejo'));
    }
  };

  const removerDesejo = async (desejoId: number) => {
    const confirmar = await solicitarConfirmacao(t('compras.confirmacoes.removerDesejo'), {
      titulo: t('comum.confirmacoes.tituloExclusao'),
      textoConfirmar: t('comum.acoes.remover'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
      tipoConfirmar: 'perigo',
    });
    if (!confirmar) return;

    try {
      await removerDesejoCompraApi(desejoId);
      setSelecionados((atual) => atual.filter((id) => id !== desejoId));
      notificarSucesso(t('compras.mensagens.desejoRemovido'));
      await carregarDados();
    } catch {
      notificarErro(t('compras.mensagens.erroSalvarDesejo'));
    }
  };

  const abrirModalConversao = () => {
    if (selecionados.length === 0) {
      notificarErro(t('compras.mensagens.selecioneDesejos'));
      return;
    }
    setModoConversao('novaLista');
    setListaDestinoId('');
    setNomeNovaLista(t('compras.desejos.nomeListaConvertida'));
    setCategoriaNovaLista('outros');
    setAcaoPosConversao('MarcarComoConvertido');
    setModalConverter(true);
  };

  const converterSelecionados = async () => {
    if (selecionados.length === 0) {
      notificarErro(t('compras.mensagens.selecioneDesejos'));
      return;
    }

    const listaIdNumero = Number(listaDestinoId);
    const usarListaExistente = modoConversao === 'listaExistente';
    if (usarListaExistente && !Number.isInteger(listaIdNumero)) {
      notificarErro(t('compras.mensagens.listaDestinoObrigatoria'));
      return;
    }

    try {
      const resposta = await converterDesejosParaListaCompraApi({
        desejosIds: selecionados,
        ...(usarListaExistente ? { listaDestinoId: listaIdNumero } : {}),
        ...(!usarListaExistente ? { nomeNovaLista: nomeNovaLista.trim(), categoriaNovaLista } : {}),
        acaoPosConversao,
      });

      notificarSucesso(
        t('compras.mensagens.desejosConvertidosComResumo', {
          itensCriados: String(resposta.itensCriados),
          desejosProcessados: String(resposta.desejosProcessados),
        }),
      );
      setSelecionados([]);
      setModalConverter(false);
      await carregarDados();
      router.push(`/principal/compras/lista?listaId=${resposta.listaId}` as never);
    } catch {
      notificarErro(t('compras.mensagens.erroConverterDesejos'));
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
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.menu.desejos')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Botao titulo={`+ ${t('compras.acoes.novoDesejo')}`} onPress={abrirNovoDesejo} tipo="primario" />
          <Botao
            titulo={t('compras.desejos.converterSelecionados', { quantidade: String(quantidadeSelecionados) })}
            tipo="secundario"
            onPress={abrirModalConversao}
          />
        </View>

        <View style={{ backgroundColor: COLORS.bgTertiary, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('compras.desejos.totalDesejos')}</Text>
          <Text style={{ color: COLORS.accent, fontSize: 28, fontWeight: '700' }}>{resumoDesejos.totalDesejos}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>{t('compras.desejos.totalSelecionados')}: {resumoDesejos.totalSelecionados}</Text>
            <Text style={{ color: COLORS.textSecondary }}>
              {t('compras.desejos.totalValorAlvo')}: {formatarValorPorIdioma(resumoDesejos.totalValorAlvo)}
            </Text>
          </View>
        </View>

        <FiltroPadrao valor={filtro} aoMudar={setFiltro}>
          <CampoSelect
            label={t('compras.desejos.filtroUnidade')}
            value={filtroUnidade}
            onChange={(valor) => setFiltroUnidade(valor as UnidadeFiltroDesejos)}
            options={[
              { value: 'todas', label: t('compras.historico.todasUnidades') },
              ...opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) })),
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
        {!carregando && desejosFiltrados.length === 0 ? <Text style={{ color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 24 }}>{t('compras.desejos.vazio')}</Text> : null}

        <View style={{ gap: 10 }}>
          {desejosFiltrados.map((desejo) => {
            const ativo = selecionados.includes(desejo.id);
            return (
              <View
                key={desejo.id}
                style={{
                  backgroundColor: COLORS.bgTertiary,
                  borderWidth: 1,
                  borderColor: ativo ? COLORS.borderAccent : COLORS.borderColor,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <TouchableOpacity onPress={() => alternarSelecao(desejo.id)} activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1 }}>{desejo.descricao}</Text>
                    <View
                      style={{
                        backgroundColor: ativo ? COLORS.accent : COLORS.bgSecondary,
                        borderColor: ativo ? COLORS.borderAccent : COLORS.borderColor,
                        borderWidth: 1,
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: ativo ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        #{desejo.id}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: COLORS.textSecondary, marginTop: 6 }}>
                    {t('compras.item.quantidade')}: {desejo.quantidade}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary }}>
                    {t('compras.item.unidade')}: {t(`compras.unidades.${desejo.unidadeMedida}`)}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('compras.desejos.valorAlvo')}: {formatarValorPorIdioma(desejo.valorAlvo)}</Text>
                  {desejo.observacao ? <Text style={{ color: COLORS.textSecondary }}>{desejo.observacao}</Text> : null}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <Botao titulo={t('comum.acoes.editar')} tipo="secundario" onPress={() => abrirEditarDesejo(desejo)} />
                  <Botao titulo={t('comum.acoes.remover')} tipo="perigo" onPress={() => void removerDesejo(desejo.id)} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visivel={modalDesejo} onFechar={() => setModalDesejo(false)} titulo={tituloModalDesejo}>
        <CampoTexto label={t('compras.item.descricao')} value={descricao} onChangeText={setDescricao} />
        <CampoTexto
          label={t('compras.item.observacao')}
          value={observacao}
          onChangeText={setObservacao}
          multiline
          numberOfLines={4}
        />
        <CampoSelect
          label={t('compras.item.unidade')}
          value={unidadeMedida}
          onChange={(valor) => setUnidadeMedida(valor as DesejoCompra['unidadeMedida'])}
          options={opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) }))}
        />
        <CampoTexto label={t('compras.item.quantidade')} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
        <CampoTexto
          label={t('compras.desejos.valorAlvo')}
          value={valorAlvo}
          onChangeText={(valorDigitado) => setValorAlvo(aplicarMascaraNumeroPorLocale(valorDigitado, localeAtivo, 2))}
          keyboardType="numeric"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalDesejo(false)} />
          <Botao titulo={t('comum.acoes.salvar')} onPress={() => void salvarDesejo()} />
        </View>
      </Modal>

      <Modal visivel={modalConverter} onFechar={() => setModalConverter(false)} titulo={t('compras.desejos.converterTitulo')}>
        <CampoSelect
          label={t('compras.desejos.modoConversao')}
          value={modoConversao}
          onChange={(valor) => setModoConversao(valor as 'listaExistente' | 'novaLista')}
          options={[
            { value: 'novaLista', label: t('compras.desejos.conversaoNovaLista') },
            { value: 'listaExistente', label: t('compras.desejos.conversaoListaExistente') },
          ]}
        />

        {modoConversao === 'listaExistente' ? (
          <CampoSelect
            label={t('compras.desejos.listaDestino')}
            value={listaDestinoId}
            onChange={setListaDestinoId}
            options={listas.map((lista) => ({ value: String(lista.id), label: lista.nome }))}
          />
        ) : (
          <View>
            <CampoTexto label={t('compras.desejos.nomeNovaLista')} value={nomeNovaLista} onChangeText={setNomeNovaLista} />
            <CampoSelect
              label={t('compras.desejos.categoriaNovaLista')}
              value={categoriaNovaLista}
              onChange={(valor) => setCategoriaNovaLista(valor as ListaCompra['categoria'])}
              options={[
                { value: 'mercado', label: t('compras.categorias.mercado') },
                { value: 'moveis', label: t('compras.categorias.moveis') },
                { value: 'roupas', label: t('compras.categorias.roupas') },
                { value: 'farmacia', label: t('compras.categorias.farmacia') },
                { value: 'construcao', label: t('compras.categorias.construcao') },
                { value: 'outros', label: t('compras.categorias.outros') },
              ]}
            />
          </View>
        )}

        <CampoSelect
          label={t('compras.desejos.acaoPosConversao')}
          value={acaoPosConversao}
          onChange={(valor) => setAcaoPosConversao(valor as 'Manter' | 'Arquivar' | 'MarcarComoConvertido')}
          options={[
            { value: 'Manter', label: t('compras.desejos.acaoPosConversaoManter') },
            { value: 'Arquivar', label: t('compras.desejos.acaoPosConversaoArquivar') },
            { value: 'MarcarComoConvertido', label: t('compras.desejos.acaoPosConversaoMarcarComoConvertido') },
          ]}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => setModalConverter(false)} />
          <Botao titulo={t('comum.acoes.confirmar')} onPress={() => void converterSelecionados()} />
        </View>
      </Modal>
    </View>
  );
}
