import { http, HttpResponse } from 'msw';

export const manipuladorAmigos = [
  // Listar amigos
  http.get('/api/amigos', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          nome: 'João Silva',
          email: 'joao@example.com',
          status: 'amigo',
          data_adicao: '2024-01-15',
        },
        {
          id: 2,
          nome: 'Maria Santos',
          email: 'maria@example.com',
          status: 'pendente',
          data_adicao: '2024-03-10',
        },
      ],
      quantidade: 2,
    });
  }),

  // Convite de amigo
  http.post('/api/amigos/convidar', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Convite enviado com sucesso',
        dados: {
          id: 3,
          email: data.email,
          status: 'convite_enviado',
        },
      },
      { status: 201 }
    );
  }),

  // Aceitar convite
  http.post('/api/amigos/:id/aceitar', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Convite aceito com sucesso',
      dados: {
        id: parseInt(id as string),
        status: 'amigo',
      },
    });
  }),

  //Rejeitar convite
  http.post('/api/amigos/:id/rejeitar', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Convite rejeitado',
      dados: {
        id: parseInt(id as string),
      },
    });
  }),

  // Remover amigo
  http.delete('/api/amigos/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Amigo removido com sucesso',
      dados: { id: parseInt(id as string) },
    });
  }),

  // Despesas compartilhadas
  http.get('/api/amigos/despesas-compartilhadas', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          titulo: 'Uber - João e Eu',
          valor: 50.00,
          meu_valor: 25.00,
          usuario_id: 1,
          amigo_id: 1,
          status: 'pendente',
        },
      ],
      total: 25.00,
    });
  }),
];
