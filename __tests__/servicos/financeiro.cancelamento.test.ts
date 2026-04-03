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

  it('deve cancelar despesa enviando body vazio', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1 } });

    await cancelarDespesaApi(1);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/1/cancelar', {});
  });

  it('deve cancelar receita enviando body vazio', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 2 } });

    await cancelarReceitaApi(2);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/receitas/2/cancelar', {});
  });

  it('deve cancelar despesa enviando escopo de recorrencia quando informado', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 3 } });

    await cancelarDespesaApi(3, { tipoCancelamentoRecorrencia: 'todasPendentes' });

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/3/cancelar', { tipoCancelamentoRecorrencia: 'todasPendentes' });
  });
});
