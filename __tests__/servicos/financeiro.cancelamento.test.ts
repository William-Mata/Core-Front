import { cancelarDespesaApi, cancelarReceitaApi } from '../../src/servicos/financeiro';

const mockPost = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('servico financeiro - cancelamentos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve cancelar despesa sem escopo de recorrencia', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1 } });

    await cancelarDespesaApi(1);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/1/cancelar', undefined, {});
  });

  it('deve cancelar receita sem escopo de recorrencia', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 2 } });

    await cancelarReceitaApi(2);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/receitas/2/cancelar', undefined, {});
  });

  it('deve cancelar despesa enviando escopo de recorrencia em query param', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 3 } });

    await cancelarDespesaApi(3, { escopoRecorrencia: 3 });

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/3/cancelar', undefined, { params: { escopoRecorrencia: 3 } });
  });
});
