import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SeletorDespesas from '../../../../app/(principal)/financeiro/seletorDespesas';

const mockBack = jest.fn();
const mockListarDespesasApi = jest.fn();
const mockNotificarErro = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
  }),
}));

jest.mock('../../../../src/servicos/financeiro', () => ({
  listarDespesasApi: (...args: unknown[]) => mockListarDespesasApi(...args),
}));

jest.mock('../../../../src/utils/notificacao', () => ({
  notificarErro: (...args: unknown[]) => mockNotificarErro(...args),
}));

jest.mock('../../../../src/utils/erroApi', () => ({
  erroApiJaNotificado: () => false,
  extrairMensagemErroApi: (_erro: unknown, fallback: string) => fallback,
}));

jest.mock('../../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string, params?: Record<string, string>) => {
      const mapa: Record<string, string> = {
        'financeiro.seletorDespesas.titulo': 'Selecionar despesas',
        'financeiro.seletorDespesas.buscar': 'Buscar',
        'financeiro.seletorDespesas.nenhuma': 'Nenhuma despesa encontrada',
        'financeiro.seletorDespesas.selecioneUma': 'Selecione ao menos uma despesa',
        'comum.carregando': 'Carregando...',
        'comum.acoes.cancelar': 'Cancelar',
        'comum.acoes.confirmar': 'Confirmar',
        'financeiro.despesa.categorias.alimentacao': 'Alimentacao',
        'financeiro.despesa.categorias.transporte': 'Transporte',
      };

      if (chave === 'financeiro.seletorDespesas.selecionadas') {
        return `${params?.count ?? '0'} selecionada${params?.s ?? ''}`;
      }

      return mapa[chave] ?? chave;
    },
  }),
}));

jest.mock('../../../../src/utils/formatacaoLocale', () => ({
  formatarDataPorIdioma: (valor: string) => valor,
  formatarValorPorIdioma: (valor: number) => `R$ ${valor.toFixed(2)}`,
}));

describe('Tela SeletorDespesas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar despesas da API e exibir apenas despesas efetivadas', async () => {
    mockListarDespesasApi.mockResolvedValue([
      { id: 1, titulo: 'Almoco cliente', categoria: 'alimentacao', valor: 30, data: '2026-03-20', status: 'EFETIVADA' },
      { id: 2, titulo: 'Corrida app', categoria: 'transporte', valor: 15, data: '2026-03-21', status: 'PENDENTE' },
    ]);

    const { getByText, queryByText } = render(<SeletorDespesas />);

    await waitFor(() => {
      expect(getByText('Almoco cliente')).toBeTruthy();
    });

    expect(queryByText('Corrida app')).toBeNull();
  });

  it('deve validar seleção obrigatória antes de confirmar', async () => {
    mockListarDespesasApi.mockResolvedValue([
      { id: 10, titulo: 'Hospedagem', categoria: 'alimentacao', valor: 99, data: '2026-03-22', status: 'EFETIVADA' },
    ]);

    const { getByText } = render(<SeletorDespesas />);

    await waitFor(() => {
      expect(getByText('Hospedagem')).toBeTruthy();
    });

    fireEvent.press(getByText('Confirmar'));
    expect(mockNotificarErro).toHaveBeenCalledWith('Selecione ao menos uma despesa');

    fireEvent.press(getByText('Hospedagem'));
    fireEvent.press(getByText('Confirmar'));
    expect(mockBack).toHaveBeenCalled();
  });
});
