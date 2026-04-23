import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CarregamentoGlobal } from '../../src/componentes/comuns/CarregamentoGlobal';

const mockEstadoCarregamento = {
  carregandoNavegacao: false,
  requisicoesAtivas: 0,
};

const mockTraducoes: Record<string, string> = {
  'comum.carregando': 'Carregando...',
  'comum.carregamento.textoPrincipal': 'Core',
};

jest.mock('../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) => mockTraducoes[chave] ?? chave,
  }),
}));

jest.mock('../../src/store/usarCarregamentoStore', () => ({
  usarCarregamentoStore: (seletor: (estado: typeof mockEstadoCarregamento) => unknown) =>
    seletor(mockEstadoCarregamento),
}));

describe('Componente CarregamentoGlobal', () => {
  beforeEach(() => {
    mockEstadoCarregamento.carregandoNavegacao = false;
    mockEstadoCarregamento.requisicoesAtivas = 0;
  });

  it('deve renderizar texto principal e percentual durante requisicoes ativas', async () => {
    mockEstadoCarregamento.requisicoesAtivas = 1;

    const { findByText } = render(<CarregamentoGlobal />);

    expect(await findByText('Core')).toBeTruthy();
    expect(await findByText('Carregando...')).toBeTruthy();
    expect(await findByText(/\d+%/)).toBeTruthy();
  });

  it('nao deve renderizar textos de carregamento quando nao houver requisicoes', async () => {
    const { queryByText } = render(<CarregamentoGlobal />);

    await waitFor(() => {
      expect(queryByText('Core')).toBeNull();
      expect(queryByText('Carregando...')).toBeNull();
    });
  });

  it('deve iniciar loading ao entrar em navegacao mesmo sem requisicao', async () => {
    mockEstadoCarregamento.carregandoNavegacao = true;

    const { findByText } = render(<CarregamentoGlobal />);

    expect(await findByText('Core')).toBeTruthy();
    expect(await findByText('Carregando...')).toBeTruthy();
  });

  it('deve manter um unico loading visivel quando navegacao e requisicao ocorrem juntas', async () => {
    mockEstadoCarregamento.carregandoNavegacao = true;
    mockEstadoCarregamento.requisicoesAtivas = 1;

    const { findByText, getAllByText } = render(<CarregamentoGlobal />);

    expect(await findByText('Core')).toBeTruthy();
    expect(await findByText('Carregando...')).toBeTruthy();
    expect(getAllByText('Carregando...')).toHaveLength(1);
  });
});
