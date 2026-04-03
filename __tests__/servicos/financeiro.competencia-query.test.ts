import {
  listarDespesasApi,
  listarReceitasApi,
  listarReembolsosApi,
} from '../../src/servicos/financeiro';

const mockGet = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('servico financeiro - filtros por competencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar dataInicio e dataFim ao listar despesas', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarDespesasApi({
      dataInicio: '2026-03-01',
      dataFim: '2026-03-31',
      competenciaMes: 3,
      competenciaAno: 2026
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/despesas', {
      signal: undefined,
      params: {
        dataInicio: '2026-03-01',
        dataFim: '2026-03-31',
        competencia: '2026-03'
      },
    });
  });

  it('deve enviar periodo ao listar receitas mantendo signal', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarReceitasApi({
      signal: controller.signal,
      dataInicio: '2026-04-01',
      dataFim: '2026-04-30',
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/receitas', {
      signal: controller.signal,
      params: {
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
      },
    });
  });

  it('deve manter chamada sem params quando periodo nao for informado', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarReembolsosApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/reembolsos', { signal: undefined });
  });
});
