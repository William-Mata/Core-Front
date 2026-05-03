import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ComprasIndex from '../../../../app/(principal)/compras/planejamentos';

const mockPush = jest.fn();
const mockListarListasCompraApi = jest.fn();
const mockCriarListaCompraApi = jest.fn();
const mockAtualizarListaCompraApi = jest.fn();
const mockDuplicarListaCompraApi = jest.fn();
const mockArquivarListaCompraApi = jest.fn();
const mockRemoverListaCompraApi = jest.fn();
const mockListarAmigosRateioApi = jest.fn();
const mockNotificarErro = jest.fn();
const mockNotificarSucesso = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('../../../../src/servicos/compras', () => ({
  listarListasCompraApi: (...args: unknown[]) => mockListarListasCompraApi(...args),
  criarListaCompraApi: (...args: unknown[]) => mockCriarListaCompraApi(...args),
  atualizarListaCompraApi: (...args: unknown[]) => mockAtualizarListaCompraApi(...args),
  duplicarListaCompraApi: (...args: unknown[]) => mockDuplicarListaCompraApi(...args),
  arquivarListaCompraApi: (...args: unknown[]) => mockArquivarListaCompraApi(...args),
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
    t: (chave: string, params?: Record<string, number>) => {
      if (chave === 'compras.listas.quantidadeItensResumo' && params) {
        return `itens ${params.comprados}/${params.total}`;
      }
      return chave;
    },
  }),
}));

jest.mock('../../../../src/store/usarAutenticacaoStore', () => ({
  usarAutenticacaoStore: (seletor: (estado: { usuario: { id: number } }) => unknown) =>
    seletor({ usuario: { id: 1 } }),
}));

jest.mock('../../../../src/componentes/comuns/FiltroPadrao', () => ({
  FiltroPadrao: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('../../../../src/utils/confirmacao', () => ({
  solicitarConfirmacao: () => Promise.resolve(true),
}));

describe('tela compras/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListarAmigosRateioApi.mockResolvedValue([]);
  });

  it('deve renderizar listas carregadas do servico', async () => {
    mockListarListasCompraApi.mockResolvedValue([
      {
        id: 900,
        nome: 'Mercado da Semana',
        categoria: 'mercado',
        status: 'ativa',
        criadoPorUsuarioId: 1,
        participantes: [{ usuarioId: 1, permissao: 'proprietario' }],
      },
    ]);

    render(<ComprasIndex />);

    await waitFor(() => {
      expect(mockListarListasCompraApi).toHaveBeenCalled();
    });
  });

  it('deve criar lista nova com participante proprietario no payload', async () => {
    mockListarListasCompraApi.mockResolvedValue([]);
    mockCriarListaCompraApi.mockResolvedValue({ id: 10 });

    const { getByText, getByPlaceholderText } = render(<ComprasIndex />);

    fireEvent.press(getByText('+ compras.acoes.novaLista'));
    fireEvent.changeText(getByPlaceholderText('compras.modalNovaLista.placeholderNome'), 'Lista mensal');
    fireEvent.press(getByText('comum.acoes.salvar'));

    await waitFor(() => {
      expect(mockCriarListaCompraApi).toHaveBeenCalledWith(expect.objectContaining({
        nome: 'Lista mensal',
        participantes: [{ usuarioId: 1, permissao: 'proprietario' }],
      }));
    });
  });

  it('deve exibir apenas visualizar para participante leitor', async () => {
    mockListarListasCompraApi.mockResolvedValue([
      {
        id: 901,
        nome: 'Planejamento compartilhado',
        categoria: 'mercado',
        status: 'ativa',
        criadoPorUsuarioId: 999,
        participantes: [{ usuarioId: 1, permissao: 'leitor' }],
      },
    ]);

    const { findByText, queryByText } = render(<ComprasIndex />);

    fireEvent.press(await findByText('\u22EE'));

    expect(await findByText('comum.acoes.visualizar')).toBeTruthy();
    expect(queryByText('comum.acoes.editar')).toBeNull();
    expect(queryByText('comum.acoes.excluir')).toBeNull();
  });

  it('deve duplicar lista via modal com os mesmos campos do cadastro e participantes', async () => {
    mockListarListasCompraApi.mockResolvedValue([
      {
        id: 902,
        nome: 'Planejamento base',
        categoria: 'mercado',
        status: 'ativa',
        criadoPorUsuarioId: 1,
        participantes: [{ usuarioId: 1, permissao: 'proprietario' }, { usuarioId: 2, permissao: 'coproprietario' }],
      },
    ]);
    mockDuplicarListaCompraApi.mockResolvedValue({ id: 903, nome: 'Planejamento base', categoria: 'mercado' });

    const { findByText, getByPlaceholderText, getAllByText } = render(<ComprasIndex />);

    fireEvent.press(await findByText('\u22EE'));
    fireEvent.press(await findByText('comum.acoes.duplicar'));
    fireEvent.changeText(getByPlaceholderText('compras.modalNovaLista.placeholderNome'), 'Planejamento novo');
    const opcoesDuplicar = getAllByText('comum.acoes.duplicar');
    fireEvent.press(opcoesDuplicar[opcoesDuplicar.length - 1]);

    await waitFor(() => {
      expect(mockDuplicarListaCompraApi).toHaveBeenCalledWith(902, expect.objectContaining({
        nome: 'Planejamento novo',
        categoria: 'mercado',
        participantes: [
          { usuarioId: 1, permissao: 'proprietario' },
          { usuarioId: 2, permissao: 'coproprietario' },
        ],
      }));
    });
  });
});
