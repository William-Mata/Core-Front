import {
  listarReembolsosApi,
  criarReembolsoApi,
  atualizarReembolsoApi,
  deletarReembolsoApi,
} from '../../src/servicos/financeiro';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('servico financeiro - reembolso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar reembolsos extraindo envelope de dados', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sucesso: true,
        dados: [{ id: 1, descricao: 'Reembolso A' }],
      },
    });

    const resultado = await listarReembolsosApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/reembolsos', { signal: undefined });
    expect(resultado).toEqual([{ id: 1, descricao: 'Reembolso A' }]);
  });

  it('deve criar reembolso', async () => {
    const payload = { descricao: 'Novo reembolso' };
    mockPost.mockResolvedValueOnce({
      data: { id: 10, descricao: 'Novo reembolso' },
    });

    const resultado = await criarReembolsoApi(payload);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/reembolsos', payload);
    expect(resultado).toEqual({ id: 10, descricao: 'Novo reembolso' });
  });

  it('deve atualizar reembolso', async () => {
    const payload = { descricao: 'Atualizado' };
    mockPut.mockResolvedValueOnce({
      data: {
        sucesso: true,
        dados: { id: 2, descricao: 'Atualizado' },
      },
    });

    const resultado = await atualizarReembolsoApi(2, payload);

    expect(mockPut).toHaveBeenCalledWith('/financeiro/reembolsos/2', payload);
    expect(resultado).toEqual({ id: 2, descricao: 'Atualizado' });
  });

  it('deve deletar reembolso', async () => {
    mockDelete.mockResolvedValueOnce({});

    await deletarReembolsoApi(7);

    expect(mockDelete).toHaveBeenCalledWith('/financeiro/reembolsos/7');
  });
});

