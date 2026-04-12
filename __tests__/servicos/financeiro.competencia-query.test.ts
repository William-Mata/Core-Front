import {
  listarDespesasApi,
  listarHistoricoTransacoesApi,
  listarResumoHistoricoTransacoesApi,
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

  it('deve enviar competencia ao listar despesas', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarDespesasApi({
      competenciaMes: 3,
      competenciaAno: 2026
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/despesas', {
      signal: undefined,
      params: {
        competencia: '2026-03'
      },
    });
  });

  it('deve enviar competencia ao listar receitas mantendo signal', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarReceitasApi({
      signal: controller.signal,
      competencia: '04/2026',
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/receitas', {
      signal: controller.signal,
      params: {
        competencia: '04/2026',
      },
    });
  });

  it('deve enviar verificarUltimaRecorrencia em lowercase na listagem de receitas', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarReceitasApi({
      competencia: '2026-04',
      verificarUltimaRecorrencia: true,
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/receitas', {
      signal: undefined,
      params: {
        competencia: '2026-04',
        verificarUltimaRecorrencia: true,
      },
    });
  });

  it('deve manter chamada sem params quando periodo nao for informado', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarReembolsosApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/reembolsos', { signal: undefined });
  });

  it('deve enviar parametros padrao ao listar historico de transacoes', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarHistoricoTransacoesApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/historico-transacoes', {
      signal: undefined,
      params: {
        quantidadeRegistros: 50,
        ordemRegistros: 'MaisRecentes',
      },
    });
  });

  it('deve aceitar ordem por valor numerico no historico de transacoes', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarHistoricoTransacoesApi({
      quantidadeRegistros: 10,
      ordemRegistros: 2,
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/historico-transacoes', {
      signal: undefined,
      params: {
        quantidadeRegistros: 10,
        ordemRegistros: 'MaisAntigos',
      },
    });
  });

  it('deve falhar quando quantidadeRegistros for invalido no historico', async () => {
    await expect(
      listarHistoricoTransacoesApi({
        quantidadeRegistros: 0,
      }),
    ).rejects.toThrow('Parametro quantidadeRegistros invalido. O valor deve ser inteiro e maior que zero.');
  });

  it('deve falhar quando ordemRegistros for invalida no historico', async () => {
    await expect(
      listarHistoricoTransacoesApi({
        ordemRegistros: 'Invalida' as never,
      }),
    ).rejects.toThrow('Parametro ordemRegistros invalido. Valores permitidos: 1, 2, MaisRecentes, MaisAntigos.');
  });

  it('deve listar resumo do historico por ano enviando ano obrigatorio', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    await listarResumoHistoricoTransacoesApi({ ano: 2026 });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/historico-transacoes/resumo', {
      signal: undefined,
      params: {
        ano: 2026,
      },
    });
  });

  it('deve validar ano no resumo do historico', async () => {
    await expect(
      listarResumoHistoricoTransacoesApi({
        ano: 0,
      }),
    ).rejects.toThrow('Parametro ano invalido. O valor deve ser inteiro e maior que zero.');
  });
});
