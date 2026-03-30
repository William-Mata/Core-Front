import { listarAmigosRateioApi, listarAreasSubareasRateioApi } from '../../src/servicos/financeiro';

const mockGet = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('servico financeiro - opcoes de rateio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar amigos a partir da API no contrato atual', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [
          { id: 2, nome: 'Alex', email: 'alex@email.com' },
          { id: 3, nome: 'Bruna' },
          { id: 0, nome: 'Invalido' },
        ],
      },
    });

    const resultado = await listarAmigosRateioApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/amigos', { signal: undefined });
    expect(resultado).toEqual([
      { id: 2, nome: 'Alex', email: 'alex@email.com' },
      { id: 3, nome: 'Bruna', email: undefined },
    ]);
  });

  it('deve listar areas e subareas filtraveis por tipo', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [
          {
            id: 1,
            nome: 'Alimentacao',
            tipo: 'despesa',
            subAreas: [{ id: 10, nome: 'Almoco' }],
          },
          {
            id: 2,
            nome: 'Salario',
            tipo: 'receita',
            subAreas: [{ id: 20, nome: 'Holerite' }],
          },
          {
            id: 0,
            nome: 'Invalida',
            tipo: 'despesa',
            subAreas: [],
          },
        ],
      },
    });

    const resultado = await listarAreasSubareasRateioApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/areas-subareas', { signal: undefined });
    expect(resultado).toEqual([
      {
        id: 1,
        nome: 'Alimentacao',
        tipo: 'despesa',
        subAreas: [{ id: 10, nome: 'Almoco' }],
      },
      {
        id: 2,
        nome: 'Salario',
        tipo: 'receita',
        subAreas: [{ id: 20, nome: 'Holerite' }],
      },
    ]);
  });

  it('deve aceitar retorno com subareas em minusculo e ids alternativos', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [
          {
            areaId: 5,
            area: 'Lazer',
            tipo: 'despesa',
            subareas: [{ subAreaId: 51, subarea: 'Cinema' }],
          },
        ],
      },
    });

    const resultado = await listarAreasSubareasRateioApi();

    expect(resultado).toEqual([
      {
        id: 5,
        nome: 'Lazer',
        tipo: 'despesa',
        subAreas: [{ id: 51, nome: 'Cinema' }],
      },
    ]);
  });
});
