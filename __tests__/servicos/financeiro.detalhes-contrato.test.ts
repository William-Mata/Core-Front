import {
  obterDespesaApi,
  obterReceitaApi,
  obterReembolsoApi,
} from '../../src/servicos/financeiro';

const mockGet = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('servico financeiro - detalhes por id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve obter despesa preservando o contrato de detalhe atual', async () => {
    const respostaApi = {
      id: 123,
      descricao: 'Aluguel apartamento',
      tipoDespesa: 'moradia',
      tipoPagamento: 'pix',
      valorTotal: 2500.0,
      contaBancariaId: 7,
      cartaoId: null,
      amigosRateio: [{ amigoId: 45, nome: 'Carlos Silva', valor: 1250.0 }],
      areasSubAreasRateio: [{ areaId: 1, areaNome: 'Casa', subAreaId: 10, subAreaNome: 'Aluguel', valor: 2500.0 }],
      documentos: [{ nomeArquivo: 'comprovante-pix.pdf', caminhoArquivo: 'https://storage.exemplo.com/docs/comprovante-pix.pdf' }],
      logs: [{ id: 9001, data: '2026-04-02', acao: 'Atualizacao', descricao: 'Despesa efetivada.' }],
    };
    mockGet.mockResolvedValueOnce({ data: { sucesso: true, dados: respostaApi } });

    const resultado = await obterDespesaApi(123);

    expect(mockGet).toHaveBeenCalledWith('/financeiro/despesas/123');
    expect(resultado).toEqual(respostaApi);
  });

  it('deve obter receita aceitando resposta sem envelope', async () => {
    const respostaApi = {
      id: 456,
      descricao: 'Salario abril',
      tipoReceita: 'salario',
      tipoRecebimento: 'transferencia',
      valorLiquido: 9800.0,
      contaBancariaId: 7,
      cartaoId: null,
      areasSubAreasRateio: [{ areaId: 2, areaNome: 'Trabalho', subAreaId: 22, subAreaNome: 'Salario', valor: 10000.0 }],
      documentos: [{ nomeArquivo: 'holerite-abril.pdf', caminhoArquivo: 'https://storage.exemplo.com/docs/holerite-abril.pdf' }],
      status: 'efetivada',
    };
    mockGet.mockResolvedValueOnce({ data: respostaApi });

    const resultado = await obterReceitaApi(456);

    expect(mockGet).toHaveBeenCalledWith('/financeiro/receitas/456');
    expect(resultado).toEqual(respostaApi);
  });

  it('deve obter reembolso com status pago e despesas vinculadas por id', async () => {
    const respostaApi = {
      id: 789,
      descricao: 'Reembolso viagem cliente ACME',
      solicitante: 'Joao Pereira',
      despesasVinculadas: [123, 124, 130],
      documentos: [{ nomeArquivo: 'nota-fiscal-hotel.pdf', caminhoArquivo: 'https://storage.exemplo.com/docs/nota-fiscal-hotel.pdf' }],
      valorTotal: 1349.9,
      status: 'PAGO',
    };
    mockGet.mockResolvedValueOnce({ data: { dados: respostaApi } });

    const resultado = await obterReembolsoApi(789);

    expect(mockGet).toHaveBeenCalledWith('/financeiro/reembolsos/789');
    expect(resultado).toEqual(respostaApi);
  });
});
