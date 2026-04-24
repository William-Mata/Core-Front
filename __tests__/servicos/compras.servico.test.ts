import {
  atualizarItemRapidoListaCompraApi,
  buscarSugestoesItensCompraApi,
  converterDesejosParaListaCompraApi,
  criarItemListaCompraApi,
  listarHistoricoItensCompraApi,
  listarListasCompraApi,
} from '../../src/servicos/compras';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

describe('servico compras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar listas de compras com suporte ao envelope dados', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{
          id: 1,
          nome: 'Mercado',
          categoria: 'mercado',
          status: 'ativa',
          papelUsuario: 'Proprietario',
          valorTotal: 245.9,
          valorComprado: 80,
          percentualComprado: 33.33,
          quantidadeItens: 9,
          quantidadeItensComprados: 3,
          quantidadeParticipantes: 2,
        }],
      },
    });

    const resultado = await listarListasCompraApi();

    expect(mockGet).toHaveBeenCalledWith('/compras/listas', { signal: undefined });
    expect(resultado[0]).toMatchObject({
      id: 1,
      nome: 'Mercado',
      categoria: 'mercado',
      papelUsuario: 'proprietario',
      quantidadeParticipantes: 2,
      quantidadeItens: 9,
    });
  });

  it('deve mapear papelUsuario CoProprietario para coproprietario', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{
          id: 2,
          nome: 'Casa',
          categoria: 'outros',
          status: 'ativa',
          papelUsuario: 'CoProprietario',
        }],
      },
    });

    const resultado = await listarListasCompraApi();

    expect(resultado[0]).toMatchObject({
      id: 2,
      papelUsuario: 'coproprietario',
    });
  });

  it('deve manter compatibilidade legado para papelUsuario Editor', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{
          id: 3,
          nome: 'Casa legado',
          categoria: 'outros',
          status: 'ativa',
          papelUsuario: 'Editor',
        }],
      },
    });

    const resultado = await listarListasCompraApi();

    expect(resultado[0]).toMatchObject({
      id: 3,
      papelUsuario: 'coproprietario',
    });
  });

  it('deve mapear papelUsuario Coproprietário para coproprietario', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{
          id: 4,
          nome: 'Casa acentuado',
          categoria: 'outros',
          status: 'ativa',
          papelUsuario: 'Coproprietário',
        }],
      },
    });

    const resultado = await listarListasCompraApi();

    expect(resultado[0]).toMatchObject({
      id: 4,
      papelUsuario: 'coproprietario',
    });
  });

  it('deve criar item em lista com contrato precoUnitario', async () => {
    mockPost.mockResolvedValueOnce({
      data: { id: 10, descricao: 'Arroz', unidade: 'kg', precoUnitario: 7, quantidade: 1 },
    });

    await criarItemListaCompraApi(100, {
      descricao: 'Arroz',
      unidadeMedida: 'kg',
      quantidade: 1,
      valorUnitario: 7,
    });

    expect(mockPost).toHaveBeenCalledWith('/compras/listas/100/itens', {
      descricao: 'Arroz',
      observacao: undefined,
      unidade: 'kg',
      quantidade: 1,
      marcadorCor: undefined,
      precoUnitario: 7,
    });
  });

  it('deve atualizar item rapido com quantidade e preco unitario', async () => {
    mockPatch.mockResolvedValueOnce({
      data: { id: 44, quantidade: 3, precoUnitario: 4.5 },
    });

    const resultado = await atualizarItemRapidoListaCompraApi(7, 44, 3, 4.5, 2);

    expect(mockPatch).toHaveBeenCalledWith('/compras/listas/7/itens/44/edicao-rapida', {
      quantidade: 3,
      precoUnitario: 4.5,
      versao: 2,
    });
    expect(resultado).toMatchObject({ id: 44, quantidade: 3, valorUnitario: 4.5 });
  });

  it('deve converter desejos com payload e response do contrato atual', async () => {
    mockPost.mockResolvedValueOnce({
      data: { dados: { listaId: 500, itensCriados: 2, desejosProcessados: 2 } },
    });

    const resultado = await converterDesejosParaListaCompraApi({
      desejosIds: [1, 2],
      nomeNovaLista: 'Nova lista',
      categoriaNovaLista: 'outros',
      acaoPosConversao: 'MarcarComoConvertido',
    });

    expect(mockPost).toHaveBeenCalledWith('/compras/desejos/converter', {
      desejosIds: [1, 2],
      nomeNovaLista: 'Nova lista',
      categoriaNovaLista: 'outros',
      acaoPosConversao: 'MarcarComoConvertido',
    });
    expect(resultado).toEqual({ listaId: 500, itensCriados: 2, desejosProcessados: 2 });
  });

  it('deve consultar historico de precos com filtros opcionais', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ produtoId: 1, descricao: 'Arroz', unidade: 'kg' }],
    });

    const resultado = await listarHistoricoItensCompraApi({
      descricao: 'Arroz',
      unidade: 'kg',
      dataInicio: '2026-01-01',
      dataFim: '2026-04-21',
    });

    expect(mockGet).toHaveBeenCalledWith('/compras/historico-precos', {
      signal: undefined,
      params: {
        descricao: 'Arroz',
        unidade: 'kg',
        dataInicio: '2026-01-01',
        dataFim: '2026-04-21',
      },
    });
    expect(resultado[0]).toMatchObject({ produtoId: 1, descricao: 'Arroz', unidade: 'kg' });
  });

  it('deve retornar lista vazia de sugestoes quando termo tiver menos de 3 caracteres', async () => {
    const resultado = await buscarSugestoesItensCompraApi(100, { termo: 'ar' });
    expect(resultado).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
