import { http, HttpResponse } from 'msw';

export const manipuladorFinanceiro = [
  // Listar despesas
  http.get('/api/financeiro/despesas', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          titulo: 'Almoço',
          categoria: 'Alimentação',
          valor: 45.50,
          data: '2024-03-15',
          descricao: 'Almoço no restaurante',
          usuario_id: 1,
        },
        {
          id: 2,
          titulo: 'Mensalidade Internet',
          categoria: 'Utilidades',
          valor: 99.90,
          data: '2024-03-10',
          descricao: 'Internet residencial',
          usuario_id: 1,
        },
      ],
      total: 145.40,
      quantidade: 2,
    });
  }),

  // Criar despesa
  http.post('/api/financeiro/despesas', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Despesa criada com sucesso',
        dados: {
          id: 3,
          ...data,
        },
      },
      { status: 201 }
    );
  }),

  // Obter despesa por ID
  http.get('/api/financeiro/despesas/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      dados: {
        id: parseInt(id as string),
        titulo: 'Despesa Exemplo',
        categoria: 'Alimentação',
        valor: 45.50,
        data: '2024-03-15',
        descricao: 'Descricao da despesa',
        usuario_id: 1,
      },
    });
  }),

  // Atualizar despesa
  http.put('/api/financeiro/despesas/:id', async ({ request, params }) => {
    const { id } = params;
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Despesa atualizada com sucesso',
      dados: {
        id: parseInt(id as string),
        ...data,
      },
    });
  }),

  // Deletar despesa
  http.delete('/api/financeiro/despesas/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Despesa deletada com sucesso',
      dados: { id: parseInt(id as string) },
    });
  }),

  // Listar receitas
  http.get('/api/financeiro/receitas', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          titulo: 'Salário',
          categoria: 'Renda',
          valor: 3000.00,
          data: '2024-03-01',
          descricao: 'Salário mensal',
          usuario_id: 1,
        },
      ],
      total: 3000.00,
      quantidade: 1,
    });
  }),

  // Criar receita
  http.post('/api/financeiro/receitas', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Receita criada com sucesso',
        dados: {
          id: 2,
          ...data,
        },
      },
      { status: 201 }
    );
  }),

  // Resumo Financeiro
  http.get('/api/financeiro/resumo', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: {
        receita_total: 3000.00,
        despesa_total: 145.40,
        saldo: 2854.60,
        categorias_despesas: {
          Alimentacao: 45.50,
          Utilidades: 99.90,
        },
        categorias_receitas: {
          Renda: 3000.00,
        },
      },
    });
  }),

  // ---- REEMBOLSOS ----

  // Listar reembolsos
  http.get('/api/financeiro/reembolsos', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          descricao: 'Reembolso de despesas da reunião',
          valorTotal: 250.00,
          status: 'AGUARDANDO',
          solicitanteId: 1,
          solicitanteName: 'João Silva',
          dataLancamento: '2024-03-15',
          despesasVinculadas: [
            { id: 1, titulo: 'Almoço', valor: 45.50 },
            { id: 2, titulo: 'Uber', valor: 35.00 },
          ],
          dataCadastro: '2024-03-15',
          dataAtualizacao: '2024-03-15',
        },
        {
          id: 2,
          descricao: 'Reembolso de combustível',
          valorTotal: 150.00,
          status: 'APROVADO',
          solicitanteId: 2,
          solicitanteName: 'Maria Santos',
          dataLancamento: '2024-03-10',
          responsavelAprovacaoId: 5,
          responsavelAprovacaoName: 'Admin User',
          dataAprovacao: '2024-03-12',
          despesasVinculadas: [
            { id: 5, titulo: 'Combustível', valor: 150.00 },
          ],
          dataCadastro: '2024-03-10',
          dataAtualizacao: '2024-03-12',
        },
      ],
      total: 400.00,
      quantidade: 2,
    });
  }),

  // Historico de transacoes
  http.get('/api/financeiro/historico-transacoes', ({ request }) => {
    const url = new URL(request.url);
    const quantidadeRegistros = Number(url.searchParams.get('quantidadeRegistros') ?? 50);
    const ordemRegistrosEntrada = url.searchParams.get('ordemRegistros') ?? 'MaisRecentes';
    const ordemRegistros = ordemRegistrosEntrada === '2' || ordemRegistrosEntrada === 'MaisAntigos' ? 'MaisAntigos' : 'MaisRecentes';

    const historico = [
      {
        idTransacao: 11,
        tipoTransacao: 'Despesa',
        valor: 145.5,
        descricao: 'Almoco com cliente',
        dataEfetivacao: '2026-03-15',
        tipoPagamento: 'CARTAO_CREDITO',
        cartao: 'Visa Platinum',
        tipoDespesa: 'SUPRIMENTOS',
      },
      {
        idTransacao: 12,
        tipoTransacao: 'Receita',
        valor: 980.0,
        descricao: 'Recebimento de servico',
        dataEfetivacao: '2026-03-16',
        tipoPagamento: 'PIX',
        contaBancaria: 'Conta Principal',
        tipoReceita: 'SERVICOS',
      },
      {
        idTransacao: 13,
        tipoTransacao: 'Reembolso',
        valor: 120.0,
        descricao: 'Reembolso de viagem',
        dataEfetivacao: '2026-03-14',
        tipoPagamento: 'TRANSFERENCIA',
        contaBancaria: 'Conta Principal',
      },
    ];

    const historicoOrdenado = [...historico].sort((a, b) => {
      if (a.dataEfetivacao !== b.dataEfetivacao) {
        return ordemRegistros === 'MaisAntigos'
          ? a.dataEfetivacao.localeCompare(b.dataEfetivacao)
          : b.dataEfetivacao.localeCompare(a.dataEfetivacao);
      }
      return ordemRegistros === 'MaisAntigos' ? a.idTransacao - b.idTransacao : b.idTransacao - a.idTransacao;
    });

    return HttpResponse.json({
      sucesso: true,
      dados: historicoOrdenado.slice(0, Math.max(quantidadeRegistros, 0)),
    });
  }),

  // Resumo do historico de transacoes por ano
  http.get('/api/financeiro/historico-transacoes/resumo-por-ano', ({ request }) => {
    const url = new URL(request.url);
    const ano = Number(url.searchParams.get('ano') ?? 0);

    if (!Number.isInteger(ano) || ano <= 0) {
      return HttpResponse.json({ codigo: 'ano_invalido' }, { status: 400 });
    }

    return HttpResponse.json({
      sucesso: true,
      dados: [
        { mes: 'Janeiro', totalReceitas: 1200.0, totalDespesas: -350.0, totalReembolsos: 0.0, totalEstornos: 0.0 },
        { mes: 'Fevereiro', totalReceitas: 1400.0, totalDespesas: -390.0, totalReembolsos: 100.0, totalEstornos: 30.0 },
        { mes: 'Marco', totalReceitas: 1100.0, totalDespesas: -310.0, totalReembolsos: 0.0, totalEstornos: 0.0 },
        { mes: 'Abril', totalReceitas: 1300.0, totalDespesas: -420.0, totalReembolsos: 0.0, totalEstornos: 20.0 },
        { mes: 'Maio', totalReceitas: 1250.0, totalDespesas: -380.0, totalReembolsos: 0.0, totalEstornos: 0.0 },
        { mes: 'Junho', totalReceitas: 1500.0, totalDespesas: -440.0, totalReembolsos: 80.0, totalEstornos: 0.0 },
        { mes: 'Julho', totalReceitas: 1600.0, totalDespesas: -470.0, totalReembolsos: 0.0, totalEstornos: 10.0 },
        { mes: 'Agosto', totalReceitas: 1550.0, totalDespesas: -460.0, totalReembolsos: 40.0, totalEstornos: 0.0 },
        { mes: 'Setembro', totalReceitas: 1480.0, totalDespesas: -430.0, totalReembolsos: 0.0, totalEstornos: 15.0 },
        { mes: 'Outubro', totalReceitas: 1700.0, totalDespesas: -520.0, totalReembolsos: 0.0, totalEstornos: 0.0 },
        { mes: 'Novembro', totalReceitas: 1750.0, totalDespesas: -540.0, totalReembolsos: 0.0, totalEstornos: 0.0 },
        { mes: 'Dezembro', totalReceitas: 1900.0, totalDespesas: -610.0, totalReembolsos: 120.0, totalEstornos: 50.0 },
      ],
    });
  }),

  // Criar reembolso
  http.post('/api/financeiro/reembolsos', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Reembolso criado com sucesso',
        dados: {
          id: 3,
          status: 'AGUARDANDO',
          dataCadastro: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ...data,
        },
      },
      { status: 201 }
    );
  }),

  // Obter reembolso por ID
  http.get('/api/financeiro/reembolsos/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      dados: {
        id: parseInt(id as string),
        descricao: 'Reembolso Exemplo',
        valorTotal: 250.00,
        status: 'AGUARDANDO',
        solicitanteId: 1,
        solicitanteName: 'João Silva',
        dataLancamento: '2024-03-15',
        despesasVinculadas: [
          { id: 1, titulo: 'Despesa 1', valor: 125.00 },
          { id: 2, titulo: 'Despesa 2', valor: 125.00 },
        ],
        dataCadastro: '2024-03-15',
        dataAtualizacao: '2024-03-15',
      },
    });
  }),

  // Atualizar reembolso
  http.put('/api/financeiro/reembolsos/:id', async ({ request, params }) => {
    const { id } = params;
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Reembolso atualizado com sucesso',
      dados: {
        id: parseInt(id as string),
        dataAtualizacao: new Date().toISOString(),
        ...data,
      },
    });
  }),

  // Deletar reembolso
  http.delete('/api/financeiro/reembolsos/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Reembolso deletado com sucesso',
      dados: { id: parseInt(id as string) },
    });
  }),

  // Efetivar reembolso
  http.post('/api/financeiro/reembolsos/:id/efetivar', async ({ request, params }) => {
    const { id } = params;
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Reembolso efetivado com sucesso',
      dados: {
        id: parseInt(id as string),
        status: 'PAGO',
        dataPagamento: new Date().toISOString(),
        ...data,
      },
    });
  }),

  // Vincular despesa ao reembolso
  http.post('/api/financeiro/reembolsos/:id/vincular-despesa', async ({ request, params }) => {
    const { id } = params;
    const data = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Despesa vinculada com sucesso',
      dados: {
        reembolsoId: parseInt(id as string),
        despesaId: data.despesaId,
      },
    });
  }),

  // Desvinc despesa do reembolso
  http.delete('/api/financeiro/reembolsos/:id/desvincular-despesa/:despesaId', ({ params }) => {
    const { id, despesaId } = params;
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Despesa desvinculada com sucesso',
      dados: {
        reembolsoId: parseInt(id as string),
        despesaId: parseInt(despesaId as string),
      },
    });
  }),
];
