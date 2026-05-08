import { type ReactElement } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatarDataPorIdioma, formatarValorPorIdioma } from '../../../utils/formatacaoLocale';
import { COLORS } from '../../../styles/variables';

export type IdWidgetCompras =
  | 'comprasResumoRapido'
  | 'comprasEvolucaoMensal'
  | 'comprasTipos'
  | 'comprasProdutosTop'
  | 'comprasUltimasCompras'
  | 'comprasUltimosDesejos'
  | 'comprasVariacaoPrecos'
  | 'comprasEconomiaPotencial';

type PesoFonte = '400' | '500' | '600' | '700';
type Traduzir = (chave: string, opcoes?: Record<string, string>) => string;

interface ResumoComprasKpi {
  totalGastoMes: number;
  planejamentosAtivos: number;
  itensCompradosMes: number;
  desejosPendentes: number;
  economiaPotencialMes: number;
  possuiEconomiaPotencial: boolean;
}

interface EvolucaoMensalComprasItem {
  chaveMes: string;
  rotuloMes: string;
  valorTotal: number;
  quantidadeItens: number;
  listasFinalizadas: number;
}

interface TipoCompraAgregado {
  rotulo: string;
  valorTotal: number;
  percentual: number;
  quantidadeItens: number;
}

interface ProdutoCompradoAgregado {
  descricao: string;
  quantidade: number;
}

interface ItemCompraRecente {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  planejamento: string;
  corMarcador: string;
}

interface DesejoRecenteItem {
  id: string;
  descricao: string;
  valorEstimado: number;
  data: string;
  status: 'pendente' | 'selecionado';
}

interface VariacaoPrecoItem {
  id: string;
  produto: string;
  ultimoPreco: number;
  menorPreco: number;
  maiorPreco: number;
  mediaPreco: number;
  percentualVariacao: number;
  potencialEconomiaUnitaria: number;
}

interface EconomiaPotencialProduto {
  id: string;
  produto: string;
  economiaUnitaria: number;
  ultimoPreco: number;
  menorPreco: number;
}

interface ParametrosValorMonetario {
  valor: number;
  cor: string;
  tamanhoFonte: number;
  pesoFonte: PesoFonte;
  deveAnimar: boolean;
  margemTopo?: number;
}

interface ParametrosNumeroAnimado {
  valor: number;
  cor: string;
  tamanhoFonte: number;
  pesoFonte: PesoFonte;
  deveAnimar: boolean;
}

interface RenderizadorWidgetsComprasProps {
  idWidget: IdWidgetCompras;
  larguraTela: number;
  carregandoCompras: boolean;
  erroCompras: boolean;
  aoTentarNovamente: () => void;
  traduzir: Traduzir;
  resumoComprasKpi: ResumoComprasKpi;
  evolucaoMensalCompras: EvolucaoMensalComprasItem[];
  tiposComprasAgregados: TipoCompraAgregado[];
  produtosMaisComprados: ProdutoCompradoAgregado[];
  ultimasCompras: ItemCompraRecente[];
  ultimosDesejos: DesejoRecenteItem[];
  variacoesPrecos: VariacaoPrecoItem[];
  produtosComMelhorEconomia: EconomiaPotencialProduto[];
  economiaPotencialTotal: number;
  renderizarValorMonetario: (parametros: ParametrosValorMonetario) => ReactElement;
  renderizarNumeroAnimado: (parametros: ParametrosNumeroAnimado) => ReactElement;
}

const LIMITE_ITENS_LISTA = 8;

function formatarPercentual(valor: number): string {
  return `${Number(valor || 0).toFixed(Math.abs(valor) >= 10 ? 0 : 1)}%`;
}

function limitarPercentual(valor: number): number {
  return Math.min(Math.max(valor, 0), 100);
}

function renderizarEstadoVazio(traduzir: Traduzir): ReactElement {
  return (
    <View style={{ paddingVertical: 14 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{traduzir('dashboard.compras.semDados')}</Text>
    </View>
  );
}

interface CartaoMetricaProps {
  titulo: string;
  conteudo: ReactElement;
  subtitulo?: string;
}

function CartaoMetrica({ titulo, conteudo, subtitulo }: CartaoMetricaProps): ReactElement {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: COLORS.bgSecondary,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        padding: 12,
      }}
    >
      <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{titulo}</Text>
      {conteudo}
      {subtitulo ? <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>{subtitulo}</Text> : null}
    </View>
  );
}

interface BarraHorizontalProps {
  percentual: number;
  cor?: string;
}

function BarraHorizontal({ percentual, cor = COLORS.accent }: BarraHorizontalProps): ReactElement {
  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: COLORS.bgPrimary, overflow: 'hidden', marginTop: 8 }}>
      <View
        style={{
          width: `${limitarPercentual(percentual)}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: cor,
        }}
      />
    </View>
  );
}

export function RenderizadorWidgetsCompras({
  idWidget,
  larguraTela,
  carregandoCompras,
  erroCompras,
  aoTentarNovamente,
  traduzir,
  resumoComprasKpi,
  evolucaoMensalCompras,
  tiposComprasAgregados,
  produtosMaisComprados,
  ultimasCompras,
  ultimosDesejos,
  variacoesPrecos,
  produtosComMelhorEconomia,
  economiaPotencialTotal,
  renderizarValorMonetario,
  renderizarNumeroAnimado,
}: RenderizadorWidgetsComprasProps): ReactElement {
  if (carregandoCompras) {
    return (
      <View style={{ paddingVertical: 14 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{traduzir('comum.carregando')}</Text>
      </View>
    );
  }

  if (erroCompras) {
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ color: COLORS.error, fontSize: 12 }}>{traduzir('dashboard.compras.erroCarregamento')}</Text>
        <TouchableOpacity
          onPress={aoTentarNovamente}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: COLORS.accentSubtle,
            borderColor: COLORS.borderAccent,
            borderRadius: 8,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{traduzir('compras.acoes.recarregar')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (idWidget === 'comprasResumoRapido') {
    return (
      <View style={{ flexDirection: larguraTela > 920 ? 'row' : 'column', gap: 10 }}>
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.totalGastoMes')}
          conteudo={renderizarValorMonetario({
            valor: resumoComprasKpi.totalGastoMes,
            cor: COLORS.accent,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.planejamentosAtivos')}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.planejamentosAtivos,
            cor: COLORS.textPrimary,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.itensCompradosMes')}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.itensCompradosMes,
            cor: COLORS.success,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.desejosPendentes')}
          conteudo={renderizarNumeroAnimado({
            valor: resumoComprasKpi.desejosPendentes,
            cor: COLORS.warning,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
          })}
        />
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.economiaPotencialMes')}
          conteudo={renderizarValorMonetario({
            valor: resumoComprasKpi.economiaPotencialMes,
            cor: resumoComprasKpi.possuiEconomiaPotencial ? COLORS.success : COLORS.textSecondary,
            tamanhoFonte: 20,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
        />
      </View>
    );
  }

  if (idWidget === 'comprasEvolucaoMensal') {
    const maiorValor = Math.max(0, ...evolucaoMensalCompras.map((item) => item.valorTotal));
    if (!evolucaoMensalCompras.some((item) => item.valorTotal > 0 || item.quantidadeItens > 0 || item.listasFinalizadas > 0)) {
      return renderizarEstadoVazio(traduzir);
    }

    return (
      <ScrollView horizontal={larguraTela < 820} showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: larguraTela < 820 ? 760 : '100%', gap: 8 }}>
          {evolucaoMensalCompras.map((item) => {
            const percentual = maiorValor > 0 ? (item.valorTotal / maiorValor) * 100 : 0;
            return (
              <View key={item.chaveMes} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', minWidth: 74 }}>{item.rotuloMes}</Text>
                  <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.valorTotal)}</Text>
                </View>
                <BarraHorizontal percentual={percentual} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>
                  {traduzir('dashboard.compras.resumoMensal', {
                    itens: String(item.quantidadeItens),
                    listas: String(item.listasFinalizadas),
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (idWidget === 'comprasTipos') {
    if (!tiposComprasAgregados.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ gap: 8 }}>
        {tiposComprasAgregados.map((item) => (
          <View key={item.rotulo} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.rotulo}</Text>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.valorTotal)}</Text>
            </View>
            <BarraHorizontal percentual={item.percentual} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 6 }}>
              {traduzir('dashboard.compras.resumoTipoCompra', {
                percentual: formatarPercentual(item.percentual),
                itens: String(item.quantidadeItens),
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasProdutosTop') {
    if (!produtosMaisComprados.length) return renderizarEstadoVazio(traduzir);
    const maiorQuantidade = Math.max(1, ...produtosMaisComprados.map((item) => item.quantidade));

    return (
      <View style={{ gap: 8 }}>
        {produtosMaisComprados.slice(0, LIMITE_ITENS_LISTA).map((item, indice) => (
          <View key={`${item.descricao}-${indice}`} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.descricao}</Text>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{item.quantidade}</Text>
            </View>
            <BarraHorizontal percentual={(item.quantidade / maiorQuantidade) * 100} cor={COLORS.success} />
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasUltimasCompras') {
    if (!ultimasCompras.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ gap: 8 }}>
        {ultimasCompras.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: item.corMarcador }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.descricao}</Text>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.valor)}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textSecondary, fontSize: 10 }}>{item.planejamento}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.data)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasUltimosDesejos') {
    if (!ultimosDesejos.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ gap: 8 }}>
        {ultimosDesejos.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.descricao}</Text>
              <Text style={{ color: COLORS.warning, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.valorEstimado)}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{formatarDataPorIdioma(item.data)}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>{traduzir(`dashboard.compras.statusDesejo.${item.status}`)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasVariacaoPrecos') {
    if (!variacoesPrecos.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ gap: 8 }}>
        {variacoesPrecos.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.produto}</Text>
              <Text style={{ color: item.percentualVariacao > 0 ? COLORS.error : COLORS.success, fontSize: 12, fontWeight: '700' }}>
                {formatarPercentual(item.percentualVariacao)}
              </Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 5 }}>
              {traduzir('dashboard.compras.resumoVariacaoPreco', {
                ultimo: formatarValorPorIdioma(item.ultimoPreco),
                menor: formatarValorPorIdioma(item.menorPreco),
                media: formatarValorPorIdioma(item.mediaPreco),
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (idWidget === 'comprasEconomiaPotencial') {
    if (!produtosComMelhorEconomia.length) return renderizarEstadoVazio(traduzir);

    return (
      <View style={{ gap: 10 }}>
        <CartaoMetrica
          titulo={traduzir('dashboard.compras.economiaPotencialTotal')}
          conteudo={renderizarValorMonetario({
            valor: economiaPotencialTotal,
            cor: COLORS.success,
            tamanhoFonte: 22,
            pesoFonte: '700',
            deveAnimar: true,
            margemTopo: 8,
          })}
          subtitulo={traduzir('dashboard.compras.economiaPotencialDescricao')}
        />
        {produtosComMelhorEconomia.slice(0, LIMITE_ITENS_LISTA).map((item) => (
          <View key={item.id} style={{ backgroundColor: COLORS.bgSecondary, borderRadius: 8, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text numberOfLines={1} style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>{item.produto}</Text>
              <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '700' }}>{formatarValorPorIdioma(item.economiaUnitaria)}</Text>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 5 }}>
              {traduzir('dashboard.compras.resumoEconomiaProduto', {
                ultimo: formatarValorPorIdioma(item.ultimoPreco),
                menor: formatarValorPorIdioma(item.menorPreco),
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return renderizarEstadoVazio(traduzir);
}
