import {
  aceitarConviteAmizadeApi,
  aprovarDespesaPendenteApi,
  aprovarReceitaPendenteApi,
  enviarConviteAmizadeApi,
  listarConvitesAmizadeApi,
  listarAprovacoesDespesasApi,
  listarAprovacoesReceitasApi,
  rejeitarConviteAmizadeApi,
  rejeitarDespesaPendenteApi,
  rejeitarReceitaPendenteApi,
  removerAmizadeApi,
} from '../../src/servicos/financeiro';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('servico financeiro - amizade e aprovacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar convite de amizade', async () => {
    mockPost.mockResolvedValueOnce({ data: { dados: { id: 11, email: 'alex@email.com', status: 'pendente' } } });

    const resposta = await enviarConviteAmizadeApi({ email: 'alex@email.com', mensagem: 'bora' });

    expect(mockPost).toHaveBeenCalledWith('/financeiro/amigos/convites', { email: 'alex@email.com', mensagem: 'bora' });
    expect(resposta).toEqual({ id: 11, email: 'alex@email.com', status: 'pendente' });
  });

  it('deve listar convites de amizade', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        dados: [
          { id: 10, nome: 'Alex', email: 'alex@email.com', status: 'pendente', dataCriacao: '2026-03-29T10:00:00Z' },
        ],
      },
    });

    const resposta = await listarConvitesAmizadeApi();

    expect(mockGet).toHaveBeenCalledWith('/financeiro/amigos/convites', { signal: undefined });
    expect(resposta).toHaveLength(1);
    expect(resposta[0].id).toBe(10);
    expect(resposta[0].email).toBe('alex@email.com');
  });

  it('deve chamar acoes de convite e amizade', async () => {
    mockPost.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });

    await aceitarConviteAmizadeApi(7);
    await rejeitarConviteAmizadeApi(8);
    await removerAmizadeApi(9);

    expect(mockPost).toHaveBeenNthCalledWith(1, '/financeiro/amigos/convites/7/aceitar');
    expect(mockPost).toHaveBeenNthCalledWith(2, '/financeiro/amigos/convites/8/rejeitar');
    expect(mockDelete).toHaveBeenCalledWith('/financeiro/amigos/9');
  });

  it('deve listar e acionar aprovacoes de despesas/receitas', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { dados: [{ id: 1, status: 'PendenteAprovacao' }] } })
      .mockResolvedValueOnce({ data: { dados: [{ id: 2, status: 'PendenteAprovacao' }] } });
    mockPost.mockResolvedValue({ data: {} });

    const despesas = await listarAprovacoesDespesasApi();
    const receitas = await listarAprovacoesReceitasApi();

    await aprovarDespesaPendenteApi(1);
    await rejeitarDespesaPendenteApi(1);
    await aprovarReceitaPendenteApi(2);
    await rejeitarReceitaPendenteApi(2);

    expect(despesas).toEqual([{ id: 1, status: 'PendenteAprovacao' }]);
    expect(receitas).toEqual([{ id: 2, status: 'PendenteAprovacao' }]);
    expect(mockGet).toHaveBeenNthCalledWith(1, '/financeiro/aprovacoes/despesas', { signal: undefined });
    expect(mockGet).toHaveBeenNthCalledWith(2, '/financeiro/aprovacoes/receitas', { signal: undefined });
    expect(mockPost).toHaveBeenCalledWith('/financeiro/aprovacoes/despesas/1/aprovar');
    expect(mockPost).toHaveBeenCalledWith('/financeiro/aprovacoes/despesas/1/rejeitar');
    expect(mockPost).toHaveBeenCalledWith('/financeiro/aprovacoes/receitas/2/aprovar');
    expect(mockPost).toHaveBeenCalledWith('/financeiro/aprovacoes/receitas/2/rejeitar');
  });
});
