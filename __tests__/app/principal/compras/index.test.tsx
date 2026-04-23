import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ComprasIndex from '../../../../app/principal/compras/index';

const mockPush = jest.fn();
const mockListarListasCompraApi = jest.fn();
const mockCriarListaCompraApi = jest.fn();
const mockDuplicarListaCompraApi = jest.fn();
const mockRemoverListaCompraApi = jest.fn();
const mockListarAmigosRateioApi = jest.fn();
const mockNotificarErro = jest.fn();
const mockNotificarSucesso = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../../../src/servicos/compras', () => ({
  listarListasCompraApi: (...args: unknown[]) => mockListarListasCompraApi(...args),
  criarListaCompraApi: (...args: unknown[]) => mockCriarListaCompraApi(...args),
  duplicarListaCompraApi: (...args: unknown[]) => mockDuplicarListaCompraApi(...args),
  removerListaCompraApi: (...args: unknown[]) => mockRemoverListaCompraApi(...args),
}));

jest.mock('../../../../src/servicos/financeiro', () => ({
  listarAmigosRateioApi: (...args: unknown[]) => mockListarAmigosRateioApi(...args),
}));

jest.mock('../../../../src/utils/notificacao', () => ({
  notificarErro: (...args: unknown[]) => mockNotificarErro(...args),
  notificarSucesso: (...args: unknown[]) => mockNotificarSucesso(...args),
}));

jest.mock('../../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) => chave,
  }),
}));

jest.mock('../../../../src/store/usarAutenticacaoStore', () => ({
  usarAutenticacaoStore: (seletor: (estado: { usuario: { id: number } }) => unknown) =>
    seletor({ usuario: { id: 1 } }),
}));

jest.mock('../../../../src/componentes/comuns/Cabecalho', () => ({
  Cabecalho: ({ titulo }: { titulo: string }) => titulo,
}));

jest.mock('../../../../src/componentes/comuns/FiltroPadrao', () => ({
  FiltroPadrao: () => null,
}));

describe('tela compras/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListarAmigosRateioApi.mockResolvedValue([]);
    Object.defineProperty(global, 'window', {
      value: { confirm: jest.fn(() => true) },
      writable: true,
    });
  });

  it('deve renderizar listas carregadas do servico', async () => {
    mockListarListasCompraApi.mockResolvedValue([
      {
        id: 900,
        nome: 'Mercado da Semana',
        categoria: 'mercado',
        status: 'ativa',
        criadoPorUsuarioId: 1,
        participantes: [{ usuarioId: 1 }],
      },
    ]);

    render(<ComprasIndex />);

    await waitFor(() => {
      expect(mockListarListasCompraApi).toHaveBeenCalled();
    });
  });

  it('deve criar lista nova', async () => {
    mockListarListasCompraApi.mockResolvedValue([]);
    mockCriarListaCompraApi.mockResolvedValue({ id: 10 });

    const { getByText, getByPlaceholderText } = render(<ComprasIndex />);

    fireEvent.press(getByText('+ compras.acoes.novaLista'));
    fireEvent.changeText(getByPlaceholderText('compras.modalNovaLista.placeholderNome'), 'Lista mensal');
    fireEvent.press(getByText('comum.acoes.salvar'));

    await waitFor(() => {
      expect(mockCriarListaCompraApi).toHaveBeenCalled();
    });
  });
});
