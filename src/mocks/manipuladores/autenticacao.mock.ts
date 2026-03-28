import { http } from 'msw';

export const manipuladoresAutenticacao = [
  http.post('/api/autenticacao/entrar', async (req) => {
    const { email } = (await req.request.json()) as { email: string };
    const emailNormalizado = String(email || '').trim().toLowerCase();

    if (emailNormalizado === 'admin@core.com' || emailNormalizado === 'primeiro.acesso@core.com') {
      return new Response(
        JSON.stringify({
          type: 'https://httpstatuses.com/400',
          title: 'Requisicao invalida',
          status: 400,
          detail: 'No primeiro acesso, voce deve criar sua senha.',
          instance: '/api/autenticacao/entrar',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiracao: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        usuario: {
          id: 1,
          nome: 'Usuario Mock',
          email: emailNormalizado,
          status: true,
          perfil: {
            id: 1,
            nome: 'Administrador',
          },
          modulosAtivos: [
            {
              id: 1,
              nome: 'Geral',
              status: true,
              telas: [
                { id: 1, nome: 'Dashboard', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
                { id: 2, nome: 'Painel do Usuario', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
                { id: 3, nome: 'Lista de Amigos', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 4, nome: 'Convites', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 5, nome: 'Documentacao Modulo Geral', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
              ],
            },
            {
              id: 2,
              nome: 'Administracao',
              status: true,
              telas: [
                { id: 30, nome: 'Administracao', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
                { id: 31, nome: 'Usuarios', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 32, nome: 'Permissoes', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 33, nome: 'Documentos', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 34, nome: 'Avisos', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 35, nome: 'Documentacao Modulo Administracao', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
              ],
            },
            {
              id: 3,
              nome: 'Financeiro',
              status: true,
              telas: [
                { id: 100, nome: 'Despesas', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 101, nome: 'Receitas', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 102, nome: 'Reembolso', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 103, nome: 'Contas Bancarias', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 104, nome: 'Cartoes de Credito', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }, { id: 2, nome: 'Criar', status: true }, { id: 3, nome: 'Editar', status: true }, { id: 4, nome: 'Excluir', status: true }] },
                { id: 105, nome: 'Documentacao Modulo Financeiro', status: true, funcionalidades: [{ id: 1, nome: 'Visualizar', status: true }] },
              ],
            },
          ],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }),

  http.post('/api/autenticacao/renovar', async () =>
    new Response(
      JSON.stringify({
        accessToken: 'mock-access-token-refreshed',
        refreshToken: 'mock-refresh-token-refreshed',
        expiracao: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  ),

  http.post('/api/autenticacao/criar-primeira-senha', async () =>
    new Response(
      JSON.stringify({
        mensagem: 'Senha criada com sucesso.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  ),

  http.post('/api/usuarios/alterar-senha', async () =>
    new Response(
      JSON.stringify({
        mensagem: 'Senha alterada com sucesso.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  ),
];
