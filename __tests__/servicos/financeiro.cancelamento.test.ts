import {
  cancelarDespesaApi,
  cancelarReceitaApi,
  efetivarDespesaApi,
  efetivarReceitaApi,
  estornarDespesaApi,
  estornarReceitaApi,
} from '../../src/servicos/financeiro';

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

  it('deve efetivar despesa usando endpoint dedicado', async () => {
    const payload = {
      dataEfetivacao: '2026-03-15',
      observacaoHistorico: 'teste',
      tipoPagamento: 'pix',
      valorTotal: 150,
      desconto: 5,
      acrescimo: 0,
      imposto: 0,
      juros: 0,
      documentos: [],
      contaBancariaId: 3,
      cartaoId: null,
    };
    mockPost.mockResolvedValueOnce({ data: { id: 5 } });

    await efetivarDespesaApi(5, payload);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/5/efetivar', {
      ...payload,
      dataEfetivacao: '2026-03-15T00:00:00',
    });
  });

  it('deve estornar despesa usando endpoint dedicado', async () => {
    const payload = {
      dataEstorno: '2026-03-16',
      observacaoHistorico: 'ajuste',
      ocultarDoHistorico: true,
    };
    mockPost.mockResolvedValueOnce({ data: { id: 8 } });

    await estornarDespesaApi(8, payload);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/despesas/8/estornar', {
      ...payload,
      dataEstorno: '2026-03-16T00:00:00',
    });
  });

  it('deve efetivar receita usando endpoint dedicado', async () => {
    const payload = {
      dataEfetivacao: '2026-03-15',
      observacaoHistorico: 'teste',
      tipoRecebimento: 'pix',
      valorTotal: 250,
      desconto: 0,
      acrescimo: 10,
      imposto: 5,
      juros: 0,
      documentos: [],
      contaBancariaId: 3,
      cartaoId: null,
    };
    mockPost.mockResolvedValueOnce({ data: { id: 6 } });

    await efetivarReceitaApi(6, payload);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/receitas/6/efetivar', {
      ...payload,
      dataEfetivacao: '2026-03-15T00:00:00',
    });
  });

  it('deve estornar receita usando endpoint dedicado', async () => {
    const payload = {
      dataEstorno: '2026-03-16',
      observacaoHistorico: 'ajuste',
      ocultarDoHistorico: true,
    };
    mockPost.mockResolvedValueOnce({ data: { id: 9 } });

    await estornarReceitaApi(9, payload);

    expect(mockPost).toHaveBeenCalledWith('/financeiro/receitas/9/estornar', {
      ...payload,
      dataEstorno: '2026-03-16T00:00:00',
    });
  });
});
