import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import Dashboard from '../../../app/principal/index';

const mockPush = jest.fn();
let ultimoLineChartProps: Record<string, any> | null = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('../../../src/componentes/comuns/Cabecalho', () => ({
  Cabecalho: ({ titulo }: { titulo: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, titulo);
  },
}));

jest.mock('react-native-gifted-charts', () => ({
  LineChart: (props: Record<string, any>) => {
    const React = require('react');
    const { Text } = require('react-native');
    ultimoLineChartProps = props;
    return React.createElement(Text, { testID: props.testID ?? 'line-chart-mock' }, 'LineChartMock');
  },
  PieChart: (props: Record<string, any>) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, `PieChartMock:${props.data?.length ?? 0}`);
  },
}));

jest.mock('../../../src/utils/formatacaoLocale', () => ({
  formatarValorPorIdioma: (valor: number) => `R$ ${valor.toFixed(2)}`,
  formatarDataPorIdioma: (valor: string) => valor,
  formatarMesPorIdioma: (data: Date) => `M${data.getMonth() + 1}`,
}));

jest.mock('../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) => {
      const mapa: Record<string, string> = {
        'dashboard.titulo': 'Dashboard',
        'dashboard.globalTitle': 'Visao geral',
        'dashboard.globalDescription': 'Resumo consolidado do sistema.',
        'dashboard.reordenarHint': 'Reordene as widgets conforme necessario.',
        'dashboard.widget': 'Widget',
        'dashboard.resumoFinanceiro': 'Resumo Financeiro',
        'dashboard.graficoAreaSubarea': 'Grafico por Area e Subarea',
        'dashboard.graficoAreaSubareaDescricao': 'Distribuicao por categoria.',
        'dashboard.graficoAnual': 'Grafico Anual',
        'dashboard.ultimasTransacoes': 'Ultimas Transacoes',
        'dashboard.balancoGeral': 'Balanco Geral',
        'dashboard.widgetGraficoInfo': 'Sem dados para exibir.',
        'dashboard.saldoAtualConta': 'Saldo atual da conta',
        'dashboard.saldoDisponivelCartao': 'Saldo disponivel do cartao',
        'dashboard.tiposBalanco.conta': 'Conta',
        'dashboard.tiposBalanco.cartao': 'Cartao',
        'dashboard.cards.receitas': 'Receitas',
        'dashboard.cards.despesas': 'Despesas',
        'dashboard.cards.reembolsos': 'Reembolsos',
        'dashboard.cards.estornos': 'Estornos',
        'dashboard.cards.saldo': 'Saldo',
        'dashboard.colunas.id': 'ID',
        'dashboard.colunas.tipo': 'Tipo',
        'dashboard.colunas.valor': 'Valor',
        'dashboard.colunas.descricao': 'Descricao',
        'dashboard.colunas.dataEfetivacao': 'Data',
        'dashboard.colunas.tipoPagamento': 'Pagamento / Recebimento',
        'dashboard.colunas.contaBancaria': 'Conta Bancaria',
        'dashboard.colunas.cartao': 'Cartao',
        'dashboard.colunas.areaSubarea': 'Area / Subarea',
        'dashboard.tipos.despesa': 'Despesa',
        'dashboard.tipos.receita': 'Receita',
        'dashboard.tipos.reembolso': 'Reembolso',
        'dashboard.tipos.estorno': 'Estorno',
        'documentacao.acao': 'Ver documentacao',
        'dashboard.widgets.resumo': 'Resumo Financeiro',
        'dashboard.widgets.graficoReceitasAreaSubarea': 'Receitas - Grafico por Area e Subarea',
        'dashboard.widgets.graficoDespesasAreaSubarea': 'Despesas - Grafico por Area e Subarea',
        'dashboard.widgets.graficoAnual': 'Grafico Anual',
        'dashboard.widgets.ultimasTransacoes': 'Ultimas Transacoes',
        'dashboard.widgets.balancoGeral': 'Balanco Geral',
        'dashboard.pagamento.PIX': 'Pix',
        'dashboard.pagamento.TRANSFERENCIA': 'Transferencia',
        'dashboard.pagamento.CARTAO_CREDITO': 'Cartao de credito',
        'dashboard.pagamento.BOLETO': 'Boleto',
        'dashboard.pagamento.DINHEIRO': 'Dinheiro',
        'dashboard.contas.ITAU': 'Itau',
        'dashboard.contas.NUBANK': 'Nubank',
        'dashboard.contas.INTER': 'Inter',
        'dashboard.contas.BANCO_XP': 'Banco XP',
        'dashboard.contas.BANCO_DIGITAL': 'Banco Digital',
      };

      if (mapa[chave]) return mapa[chave];
      if (chave.startsWith('dashboard.descricoes.')) {
        const ultimo = chave.split('.').pop();
        const descricoes: Record<string, string> = {
          ALMOCO_CLIENTE: 'Almoco com cliente',
          VENDA_SERVICO: 'Venda de servico',
          REEMBOLSO_VIAGEM: 'Reembolso de viagem',
          ESTORNO_COBRANCA: 'Estorno de cobranca',
          ASSINATURA: 'Assinatura',
          SUPERMERCADO: 'Supermercado',
          COMBUSTIVEL: 'Combustivel',
          RECEBIMENTO: 'Recebimento',
        };
        return descricoes[ultimo ?? ''] ?? (ultimo ?? chave);
      }
      if (chave.startsWith('dashboard.areas.') || chave.startsWith('dashboard.subareas.')) {
        return chave.split('.').pop()?.replaceAll('_', ' ') ?? chave;
      }
      return chave;
    },
  }),
}));

describe('Tela de dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ultimoLineChartProps = null;
  });

  it('deve renderizar os widgets principais e a coluna de cartao nas ultimas transacoes', () => {
    const { getByText, getAllByText, queryByText } = render(<Dashboard />);

    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Widget: Resumo Financeiro')).toBeTruthy();
    expect(getByText('Widget: Receitas - Grafico por Area e Subarea')).toBeTruthy();
    expect(getByText('Widget: Despesas - Grafico por Area e Subarea')).toBeTruthy();
    expect(getByText('Widget: Grafico Anual')).toBeTruthy();
    expect(getByText('Widget: Ultimas Transacoes')).toBeTruthy();
    expect(getByText('Widget: Balanco Geral')).toBeTruthy();
    expect(queryByText('FiltroPadraoMock')).toBeNull();
    expect(getAllByText('Cartao').length).toBeGreaterThan(0);
    expect(getAllByText('Visa Platinum').length).toBeGreaterThan(0);
  });

  it('deve navegar para a documentacao do modulo ao acionar o botao da tela', () => {
    const { getByText } = render(<Dashboard />);

    fireEvent.press(getByText('Ver documentacao'));

    expect(mockPush).toHaveBeenCalledWith('/principal/documentacao');
  });

  it('deve permitir ocultar uma serie do grafico anual sem remover as demais', () => {
    const { getByTestId } = render(<Dashboard />);

    expect(ultimoLineChartProps?.thickness1).toBe(3);
    expect(ultimoLineChartProps?.thickness2).toBe(3);

    act(() => {
      fireEvent.press(getByTestId('dashboard-serie-receitas'));
    });

    expect(ultimoLineChartProps?.thickness1).toBe(0);
    expect(ultimoLineChartProps?.hideDataPoints1).toBe(true);
    expect(ultimoLineChartProps?.thickness2).toBe(3);
    expect(ultimoLineChartProps?.thickness3).toBe(3);
    expect(ultimoLineChartProps?.thickness4).toBe(3);
  });

  it('deve reordenar widgets ao mover uma widget para cima', () => {
    const { getByTestId, getAllByText } = render(<Dashboard />);

    fireEvent.press(getByTestId('dashboard-widget-graficoAnual-cima'));

    const titulos = getAllByText(/Widget:/).map((item) => item.props.children.join(''));

    expect(titulos[2]).toBe('Widget: Grafico Anual');
  });
});
