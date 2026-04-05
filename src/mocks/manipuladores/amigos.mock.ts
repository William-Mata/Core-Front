import { http, HttpResponse } from 'msw';

export const manipuladorAmigos = [
  http.get('/api/financeiro/amigos', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        { id: 1, nome: 'Joao Silva', email: 'joao@example.com' },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@example.com' },
      ],
    });
  }),

  http.get('/api/financeiro/amigos/convites', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 2,
          usuarioOrigemNome: 'Maria Santos',
          usuarioOrigemEmail: 'maria@example.com',
          mensagem: 'Vamos dividir as despesas?',
          status: 'pendente',
          dataHoraCadastro: '2026-03-10T12:00:00Z',
        },
      ],
    });
  }),

  http.post('/api/financeiro/amigos/convites', async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        sucesso: true,
        dados: {
          id: 99,
          email: String(data.email ?? ''),
          status: 'pendente',
        },
      },
      { status: 201 },
    );
  }),

  http.post('/api/financeiro/amigos/convites/:id/aceitar', () => {
    return HttpResponse.json({ sucesso: true });
  }),

  http.post('/api/financeiro/amigos/convites/:id/rejeitar', () => {
    return HttpResponse.json({ sucesso: true });
  }),

  http.delete('/api/financeiro/amigos/:id', () => {
    return HttpResponse.json({ sucesso: true });
  }),
];
