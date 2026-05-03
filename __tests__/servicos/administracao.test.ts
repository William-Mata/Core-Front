import {
  listarUsuariosAdminApi,
  obterUsuarioAdminApi,
} from '../../src/servicos/administracao';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../src/servicos/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe('servico administracao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mapear lista resumida de usuarios retornada pela API', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        {
          id: 2,
          nome: 'william de mata',
          email: 'william.xavante@gmail.com',
          perfil: 'USER',
          dataCriacao: '2026-03-26T14:00:03',
        },
        {
          id: 1,
          nome: 'Usuario',
          email: 'admin@core.com',
          perfil: 'ADMIN',
          dataCriacao: '2026-01-01T00:00:00',
        },
      ],
    });

    const usuarios = await listarUsuariosAdminApi();

    expect(mockGet).toHaveBeenCalledWith('/usuarios', { signal: undefined });
    expect(usuarios).toEqual([
      {
        id: 2,
        nome: 'william de mata',
        email: 'william.xavante@gmail.com',
        dataNascimento: '',
        perfil: 'USER',
        status: true,
        modulosAtivos: [],
        dataCriacao: '2026-03-26T14:00:03',
      },
      {
        id: 1,
        nome: 'Usuario',
        email: 'admin@core.com',
        dataNascimento: '',
        perfil: 'ADMIN',
        status: true,
        modulosAtivos: [],
        dataCriacao: '2026-01-01T00:00:00',
      },
    ]);
  });

  it('deve buscar e mapear usuario por id com modulos, telas e funcionalidades', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sucesso: true,
        dados: {
          id: 1,
          nome: 'Usuario',
          email: 'admin@core.com',
          perfil: 'ADMIN',
          status: true,
          dataCriacao: '2026-01-01T00:00:00',
          modulosAtivos: [
            {
              id: 3,
              nome: 'Financeiro',
              status: true,
              telas: [
                {
                  id: 100,
                  nome: 'Despesas',
                  status: true,
                  funcionalidades: [
                    { id: 1, nome: 'Visualizar', status: true },
                    { id: 2, nome: 'Criar', status: false },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    const usuario = await obterUsuarioAdminApi(1);

    expect(mockGet).toHaveBeenCalledWith('/usuarios/1', { signal: undefined });
    expect(usuario).toEqual({
      id: 1,
      nome: 'Usuario',
      email: 'admin@core.com',
      dataNascimento: '',
      perfil: 'ADMIN',
      status: true,
      dataCriacao: '2026-01-01T00:00:00',
      modulosAtivos: [
        {
          id: '3',
          nome: 'Financeiro',
          status: true,
          telas: [
            {
              id: '100',
              nome: 'Despesas',
              status: true,
              funcionalidades: [
                { id: '1', nome: 'Visualizar', status: true },
                { id: '2', nome: 'Criar', status: false },
              ],
            },
          ],
        },
      ],
    });
  });
});

