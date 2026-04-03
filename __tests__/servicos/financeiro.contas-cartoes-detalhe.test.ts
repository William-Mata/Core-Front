import {
  obterCartaoApi,
  obterContaBancariaApi,
  listarCartoesDetalheApi,
  listarContasBancariasDetalheApi,
  listarLancamentosCartaoApi,
  listarLancamentosContaBancariaApi,
  criarCartaoApi,
  atualizarCartaoApi,
  inativarCartaoApi,
  ativarCartaoApi,
  criarContaBancariaApi,
  atualizarContaBancariaApi,
  inativarContaBancariaApi,
  ativarContaBancariaApi,
} from '../../src/servicos/financeiro';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

describe('servico financeiro - detalhes de cartao e conta bancaria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar cartoes detalhados com filtros', async () => {
    mockGet.mockResolvedValueOnce({ data: { dados: [{ id: 1, descricao: 'Cartao A' }] } });

    const resultado = await listarCartoesDetalheApi({
      descricao: 'A',
      dataInicio: '2026-04-01',
      dataFim: '2026-04-30',
    });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/cartoes', {
      signal: undefined,
      params: {
        dataInicio: '2026-04-01',
        dataFim: '2026-04-30',
        descricao: 'A',
      },
    });
    expect(resultado).toEqual([{ id: 1, descricao: 'Cartao A' }]);
  });

  it('deve listar contas bancarias detalhadas', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 2, descricao: 'Conta A' }] });

    const resultado = await listarContasBancariasDetalheApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/contas-bancarias', { signal: undefined });
    expect(resultado).toEqual([{ id: 2, descricao: 'Conta A' }]);
  });

  it('deve obter cartao por id extraindo envelope', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sucesso: true,
        dados: { id: 8, descricao: 'Cartao principal' },
      },
    });

    const resultado = await obterCartaoApi(8);

    expect(mockGet).toHaveBeenCalledWith('/financeiro/cartoes/8');
    expect(resultado).toEqual({ id: 8, descricao: 'Cartao principal' });
  });

  it('deve obter cartao por id com competencia', async () => {
    mockGet.mockResolvedValueOnce({
      data: { dados: { id: 8, descricao: 'Cartao principal' } },
    });

    await obterCartaoApi(8, { competencia: '2026-04' });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/cartoes/8', {
      signal: undefined,
      params: { competencia: '2026-04' },
    });
  });

  it('deve listar lancamentos do cartao por competencia', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{ id: 10, transacaoId: 99 }],
      },
    });

    const resultado = await listarLancamentosCartaoApi(8, { competencia: '04/2026' });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/cartoes/8/lancamentos', {
      signal: undefined,
      params: { competencia: '04/2026' },
    });
    expect(resultado).toEqual([{ id: 10, transacaoId: 99 }]);
  });

  it('deve obter conta bancaria por id quando resposta vier sem envelope', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: 15, descricao: 'Conta empresa' },
    });

    const resultado = await obterContaBancariaApi(15);

    expect(mockGet).toHaveBeenCalledWith('/financeiro/contas-bancarias/15');
    expect(resultado).toEqual({ id: 15, descricao: 'Conta empresa' });
  });

  it('deve obter conta bancaria por id com competencia', async () => {
    mockGet.mockResolvedValueOnce({
      data: { dados: { id: 15, descricao: 'Conta empresa' } },
    });

    await obterContaBancariaApi(15, { competencia: '2026-04' });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/contas-bancarias/15', {
      signal: undefined,
      params: { competencia: '2026-04' },
    });
  });

  it('deve listar lancamentos da conta por competencia', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [{ id: 20, transacaoId: 199 }],
      },
    });

    const resultado = await listarLancamentosContaBancariaApi(15, { competencia: '04/2026' });

    expect(mockGet).toHaveBeenCalledWith('/financeiro/contas-bancarias/15/lancamentos', {
      signal: undefined,
      params: { competencia: '04/2026' },
    });
    expect(resultado).toEqual([{ id: 20, transacaoId: 199 }]);
  });

  it('deve criar e atualizar cartao', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 12, descricao: 'Novo cartao' } });
    mockPut.mockResolvedValueOnce({ data: { dados: { id: 12, descricao: 'Cartao editado' } } });

    const criado = await criarCartaoApi({ descricao: 'Novo cartao' });
    const atualizado = await atualizarCartaoApi(12, { descricao: 'Cartao editado' });

    expect(mockPost).toHaveBeenCalledWith('/financeiro/cartoes', { descricao: 'Novo cartao' });
    expect(mockPut).toHaveBeenCalledWith('/financeiro/cartoes/12', { descricao: 'Cartao editado' });
    expect(criado).toEqual({ id: 12, descricao: 'Novo cartao' });
    expect(atualizado).toEqual({ id: 12, descricao: 'Cartao editado' });
  });

  it('deve inativar e ativar cartao pelos endpoints dedicados', async () => {
    mockPost.mockResolvedValueOnce({ data: { dados: { id: 12, status: 'inativo' } } });
    mockPost.mockResolvedValueOnce({ data: { dados: { id: 12, status: 'ativo' } } });

    const inativado = await inativarCartaoApi(12, {});
    const ativado = await ativarCartaoApi(12);

    expect(mockPost).toHaveBeenNthCalledWith(1, '/financeiro/cartoes/12/inativar', {});
    expect(mockPost).toHaveBeenNthCalledWith(2, '/financeiro/cartoes/12/ativar');
    expect(inativado).toEqual({ id: 12, status: 'inativo' });
    expect(ativado).toEqual({ id: 12, status: 'ativo' });
  });

  it('deve criar e atualizar conta bancaria', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 33, descricao: 'Conta nova' } });
    mockPut.mockResolvedValueOnce({ data: { dados: { id: 33, descricao: 'Conta editada' } } });

    const criada = await criarContaBancariaApi({ descricao: 'Conta nova' });
    const atualizada = await atualizarContaBancariaApi(33, { descricao: 'Conta editada' });

    expect(mockPost).toHaveBeenCalledWith('/financeiro/contas-bancarias', { descricao: 'Conta nova' });
    expect(mockPut).toHaveBeenCalledWith('/financeiro/contas-bancarias/33', { descricao: 'Conta editada' });
    expect(criada).toEqual({ id: 33, descricao: 'Conta nova' });
    expect(atualizada).toEqual({ id: 33, descricao: 'Conta editada' });
  });

  it('deve inativar e ativar conta bancaria pelos endpoints dedicados', async () => {
    mockPost.mockResolvedValueOnce({ data: { dados: { id: 33, status: 'inativa' } } });
    mockPost.mockResolvedValueOnce({ data: { dados: { id: 33, status: 'ativa' } } });

    const inativada = await inativarContaBancariaApi(33, {});
    const ativada = await ativarContaBancariaApi(33);

    expect(mockPost).toHaveBeenNthCalledWith(1, '/financeiro/contas-bancarias/33/inativar', {});
    expect(mockPost).toHaveBeenNthCalledWith(2, '/financeiro/contas-bancarias/33/ativar');
    expect(inativada).toEqual({ id: 33, status: 'inativa' });
    expect(ativada).toEqual({ id: 33, status: 'ativa' });
  });
});
