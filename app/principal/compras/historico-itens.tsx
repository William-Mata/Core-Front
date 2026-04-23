import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { listarHistoricoItensCompraApi } from '../../../src/servicos/compras';
import { HistoricoItemCompra, UnidadeMedidaItemCompra } from '../../../src/tipos/compras.tipos';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../src/utils/formatacaoLocale';
import { notificarErro } from '../../../src/utils/notificacao';
import { COLORS } from '../../../src/styles/variables';

const opcoesUnidade: UnidadeMedidaItemCompra[] = ['unidade', 'kg', 'g', 'mg', 'l', 'ml', 'pacote', 'caixa'];

export default function HistoricoItensCompraTela() {
  const router = useRouter();
  const { t } = usarTraducao();
  const [historico, setHistorico] = useState<HistoricoItemCompra[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroDescricao, setFiltroDescricao] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const carregarHistorico = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta = await listarHistoricoItensCompraApi({
        descricao: filtroDescricao.trim() || undefined,
        unidade: (filtroUnidade || undefined) as UnidadeMedidaItemCompra | undefined,
        dataInicio: filtroDataInicio.trim() || undefined,
        dataFim: filtroDataFim.trim() || undefined,
      });
      setHistorico(resposta);
    } catch {
      notificarErro(t('compras.mensagens.erroCarregarHistorico'));
    } finally {
      setCarregando(false);
    }
  }, [filtroDataFim, filtroDataInicio, filtroDescricao, filtroUnidade, t]);

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  const totalOcorrencias = useMemo(
    () => historico.reduce((acumulado, item) => acumulado + item.totalOcorrencias, 0),
    [historico],
  );

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
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>{t('compras.menu.historicoItens')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 22 }}>{'\u2715'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 12, marginBottom: 12 }}>
          <CampoTexto
            label={t('compras.historico.filtroDescricao')}
            value={filtroDescricao}
            onChangeText={setFiltroDescricao}
            placeholder={t('compras.historico.placeholderFiltroDescricao')}
          />
          <CampoSelect
            label={t('compras.historico.filtroUnidade')}
            value={filtroUnidade}
            onChange={setFiltroUnidade}
            options={[
              { value: '', label: t('compras.historico.todasUnidades') },
              ...opcoesUnidade.map((opcao) => ({ value: opcao, label: t(`compras.unidades.${opcao}`) })),
            ]}
          />
          <CampoTexto
            label={t('compras.historico.filtroDataInicio')}
            value={filtroDataInicio}
            onChangeText={setFiltroDataInicio}
            placeholder={t('compras.historico.placeholderDataIso')}
          />
          <CampoTexto
            label={t('compras.historico.filtroDataFim')}
            value={filtroDataFim}
            onChangeText={setFiltroDataFim}
            placeholder={t('compras.historico.placeholderDataIso')}
          />
          <Botao titulo={t('comum.acoes.consultar')} onPress={() => void carregarHistorico()} tipo="secundario" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
            {t('compras.historico.totalOcorrencias')}: {totalOcorrencias}
          </Text>
        </View>

        {carregando ? <Text style={{ color: COLORS.textSecondary }}>{t('comum.carregando')}</Text> : null}
        {!carregando && historico.length === 0 ? <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.vazio')}</Text> : null}

        <View style={{ gap: 10 }}>
          {historico.map((item) => (
            <View key={`${item.produtoId}-${item.unidade}`} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderColor, padding: 12 }}>
              <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{item.descricao}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.item.unidade')}: {t(`compras.unidades.${item.unidade}`)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.ultimoPreco')}: {formatarValorPorIdioma(item.ultimoPreco)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.menorPreco')}: {formatarValorPorIdioma(item.menorPreco)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.maiorPreco')}: {formatarValorPorIdioma(item.maiorPreco)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.mediaPreco')}: {formatarValorPorIdioma(item.mediaPreco)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.dataUltimoPreco')}: {formatarDataPorIdioma(item.dataUltimoPreco)}</Text>
              <Text style={{ color: COLORS.textSecondary }}>{t('compras.historico.totalOcorrencias')}: {item.totalOcorrencias}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
