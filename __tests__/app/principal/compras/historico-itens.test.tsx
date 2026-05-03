import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HistoricoItensCompraTela from '../../../../app/(principal)/compras/historico-precos';

const mockListarHistoricoItensCompraApi = jest.fn();

jest.mock('../../../../src/servicos/compras', () => ({
  listarHistoricoItensCompraApi: (...args: unknown[]) => mockListarHistoricoItensCompraApi(...args),
}));

jest.mock('../../../../src/utils/notificacao', () => ({
  notificarErro: jest.fn(),
}));

jest.mock('../../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) => chave,
  }),
}));

jest.mock('../../../../src/componentes/comuns/Cabecalho', () => ({
  Cabecalho: ({ titulo }: { titulo: string }) => titulo,
}));

jest.mock('react-native-gifted-charts', () => ({
  LineChart: () => null,
}));

describe('tela compras/historico-itens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir historico carregado da api', async () => {
    mockListarHistoricoItensCompraApi.mockResolvedValue([
      {
        produtoId: 1,
        descricao: 'Arroz',
        unidade: 'kg',
        ultimoPreco: 10,
        menorPreco: 8,
        maiorPreco: 12,
        mediaPreco: 9,
        dataUltimoPreco: '2026-04-21',
        totalOcorrencias: 3,
        historicoPrecos: [
          { data: '2026-04-19', valor: 8 },
          { data: '2026-04-20', valor: 9 },
          { data: '2026-04-21', valor: 10 },
        ],
      },
    ]);

    const { getByText } = render(<HistoricoItensCompraTela />);

    await waitFor(() => {
      expect(getByText('Arroz')).toBeTruthy();
    });
  });

  it('deve consultar novamente com filtros', async () => {
    mockListarHistoricoItensCompraApi.mockResolvedValue([]);

    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<HistoricoItensCompraTela />);

    fireEvent.changeText(getByPlaceholderText('compras.historico.placeholderFiltroDescricao'), 'Leite');
    fireEvent.changeText(getAllByPlaceholderText('compras.historico.placeholderDataIso')[0], '2026-01-01');
    fireEvent.press(getByText('comum.acoes.consultar'));

    await waitFor(() => {
      expect(mockListarHistoricoItensCompraApi).toHaveBeenCalled();
    });
  });
});
