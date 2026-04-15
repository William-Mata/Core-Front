import { http, HttpResponse } from 'msw';

let usuariosAdmin = [
  {
    id: 1,
    nome: 'Admin User',
    email: 'admin@example.com',
    data_nascimento: '1990-01-10',
    perfil: 'ADMIN',
    status: true,
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
        status: false,
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
    data_criacao: '2024-01-01',
  },
  {
    id: 2,
    nome: 'User Normal',
    email: 'user@example.com',
    data_nascimento: '1995-07-21',
    perfil: 'USER',
    status: true,
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
          { id: 30, nome: 'Administracao', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }] },
          { id: 31, nome: 'Usuarios', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }, { id: 2, nome: 'Criar', status: false }, { id: 3, nome: 'Editar', status: false }, { id: 4, nome: 'Excluir', status: false }] },
          { id: 32, nome: 'Permissoes', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }, { id: 2, nome: 'Criar', status: false }, { id: 3, nome: 'Editar', status: false }, { id: 4, nome: 'Excluir', status: false }] },
          { id: 33, nome: 'Documentos', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }, { id: 2, nome: 'Criar', status: false }, { id: 3, nome: 'Editar', status: false }, { id: 4, nome: 'Excluir', status: false }] },
          { id: 34, nome: 'Avisos', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }, { id: 2, nome: 'Criar', status: false }, { id: 3, nome: 'Editar', status: false }, { id: 4, nome: 'Excluir', status: false }] },
          { id: 35, nome: 'Documentacao Modulo Administracao', status: false, funcionalidades: [{ id: 1, nome: 'Visualizar', status: false }] },
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
    data_criacao: '2024-02-15',
  },
];

// Mock data para documentos
const mockDocumentos = [
  {
    id: 1,
    titulo: 'Política de Privacidade',
    descricao: 'Última atualização da política de privacidade',
    tipo: 'PDF',
    status: 'PUBLICADO',
    modulo: 'GERAL',
    dataCriacao: '2024-02-15T08:00:00Z',
    dataAtualizacao: '2024-03-10T14:30:00Z',
    criadoPor: 'Admin User',
    atualizadoPor: 'Admin User',
    versoes: [
      { numero: 1, data: '2024-02-15T08:00:00Z', alteracoes: 'Versão inicial', usuarioId: 1, usuarioNome: 'Admin User' },
      { numero: 2, data: '2024-03-10T14:30:00Z', alteracoes: 'Atualização geral', usuarioId: 1, usuarioNome: 'Admin User' },
    ],
    arquivo: { nome: 'politica-privacidade-v2.pdf', url: '/docs/politica.pdf', tamanho: 2.5, tipo: 'PDF' },
  },
  {
    id: 2,
    titulo: 'Manual do Usuário',
    descricao: 'Guia completo de funcionamento do sistema',
    tipo: 'PDF',
    status: 'PUBLICADO',
    modulo: 'GERAL',
    dataCriacao: '2024-03-01T10:00:00Z',
    dataAtualizacao: '2024-03-01T10:00:00Z',
    criadoPor: 'Admin User',
    atualizadoPor: 'Admin User',
    versoes: [{ numero: 1, data: '2024-03-01T10:00:00Z', alteracoes: 'Versão inicial', usuarioId: 1, usuarioNome: 'Admin User' }],
    arquivo: { nome: 'manual-usuario-v1.pdf', url: '/docs/manual.pdf', tamanho: 5.8, tipo: 'PDF' },
  },
  {
    id: 3,
    titulo: 'Termos de Serviço',
    descricao: 'Termos e condições de uso do aplicativo',
    tipo: 'PDF',
    status: 'RASCUNHO',
    modulo: 'GERAL',
    dataCriacao: '2024-03-10T09:00:00Z',
    dataAtualizacao: '2024-03-10T09:00:00Z',
    criadoPor: 'Admin User',
    atualizadoPor: 'Admin User',
    versoes: [
      { numero: 1, data: '2024-02-20T08:00:00Z', alteracoes: 'Versão inicial', usuarioId: 1, usuarioNome: 'Admin User' },
      { numero: 2, data: '2024-02-28T11:30:00Z', alteracoes: 'Revisão geral', usuarioId: 1, usuarioNome: 'Admin User' },
      { numero: 3, data: '2024-03-10T09:00:00Z', alteracoes: 'Atualização final', usuarioId: 1, usuarioNome: 'Admin User' },
    ],
    arquivo: { nome: 'termos-servico-v3.pdf', url: '/docs/termos.pdf', tamanho: 3.2, tipo: 'PDF' },
  },
];

// Mock data para avisos
const mockAvisos = [
  {
    id: 1,
    titulo: 'Manutenção Programada',
    conteudo: 'O sistema será desativado no domingo (15/03) entre 02:00-04:00 para manutenção.',
    tipo: 'AVISO',
    destinatarios: 'TODOS',
    status: 'PUBLICADO',
    modulo: 'GERAL',
    datas: { criacao: '2024-03-10T14:00:00Z', atualizacao: '2024-03-10T14:00:00Z' },
    requerCiencia: true,
    criadoPor: 'Admin User',
    ciencias: [
      { usuarioId: 1, usuarioNome: 'Admin User', dataCiencia: '2024-03-10T14:10:00Z', lido: true },
      { usuarioId: 2, usuarioNome: 'User Normal', dataCiencia: '2024-03-10T14:20:00Z', lido: true },
    ],
  },
  {
    id: 2,
    titulo: 'Atualização Crítica de Segurança',
    conteudo: 'Uma vulnerabilidade foi corrigida. Todos os usuários devem fazer logout e login novamente.',
    tipo: 'CRITICO',
    destinatarios: 'TODOS',
    status: 'PUBLICADO',
    modulo: 'GERAL',
    datas: { criacao: '2024-03-11T10:00:00Z', atualizacao: '2024-03-11T10:00:00Z' },
    requerCiencia: true,
    criadoPor: 'Admin User',
    ciencias: [
      { usuarioId: 1, usuarioNome: 'Admin User', dataCiencia: '2024-03-11T10:05:00Z', lido: true },
    ],
  },
  {
    id: 3,
    titulo: 'Novo Recurso: Reembolsos',
    conteudo: 'Agora você pode rastrear e gerenciar reembolsos de despesas entre amigos.',
    tipo: 'INFO',
    destinatarios: 'TODOS',
    status: 'RASCUNHO',
    modulo: 'GERAL',
    datas: { criacao: '2024-03-12T09:00:00Z', atualizacao: '2024-03-12T09:00:00Z' },
    requerCiencia: false,
    criadoPor: 'Admin User',
    ciencias: [],
  },
];

// Mock data para permissões
const mockPermissoes = {
  modulos: [
    {
      nome: 'Financeiro',
      expandido: true,
      permissoes: [
        { id: 'fin_vis', acao: 'Visualizar Despesas', ativo: true },
        { id: 'fin_cri', acao: 'Criar Despesas', ativo: true },
        { id: 'fin_edi', acao: 'Editar Despesas', ativo: true },
        { id: 'fin_del', acao: 'Excluir Despesas', ativo: false },
        { id: 'fin_efet', acao: 'Efetivar Despesas', ativo: true },
        { id: 'fin_est', acao: 'Estornar Despesas', ativo: false },
      ],
    },
    {
      nome: 'Amigos',
      expandido: false,
      permissoes: [
        { id: 'ami_vis', acao: 'Visualizar Contatos', ativo: true },
        { id: 'ami_cri', acao: 'Criar Contatos', ativo: true },
        { id: 'ami_edi', acao: 'Editar Contatos', ativo: true },
        { id: 'ami_del', acao: 'Excluir Contatos', ativo: false },
        { id: 'ami_conv', acao: 'Enviar Convites', ativo: true },
      ],
    },
    {
      nome: 'Admin',
      expandido: false,
      permissoes: [
        { id: 'adm_vis_usu', acao: 'Visualizar Usuários', ativo: true },
        { id: 'adm_cri_usu', acao: 'Criar Usuários', ativo: true },
        { id: 'adm_edi_per', acao: 'Editar Permissões', ativo: false },
        { id: 'adm_cri_doc', acao: 'Criar Documentos', ativo: true },
        { id: 'adm_pub_avi', acao: 'Publicar Avisos', ativo: true },
      ],
    },
  ],
};

export const manipuladorAdministracao = [
  // Usuarios
  http.get('/api/usuarios', () => {
    const usuariosResumo = [...usuariosAdmin]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        dataCriacao: u.data_criacao,
      }));

    return HttpResponse.json(usuariosResumo);
  }),

  http.get('/api/usuarios/:id', ({ params }) => {
    const id = Number(params.id);
    const usuario = usuariosAdmin.find((u) => u.id === id);

    if (!usuario) {
      return HttpResponse.json(
        {
          type: 'https://httpstatuses.com/404',
          title: 'Nao encontrado',
          status: 404,
          detail: 'Usuario nao encontrado.',
          instance: `/api/usuarios/${id}`,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      sucesso: true,
      dados: usuario,
    });
  }),

  http.post('/api/usuarios', async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>;
    const novoId = usuariosAdmin.length > 0 ? Math.max(...usuariosAdmin.map((u) => Number(u.id))) + 1 : 1;
    const novoUsuario = {
      id: novoId,
      nome: String(data.nome ?? ''),
      email: String(data.email ?? ''),
      data_nascimento: String(data.dataNascimento ?? data.data_nascimento ?? ''),
      perfil: String(data.perfil ?? 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      status: data.status === undefined ? true : Boolean(data.status),
      modulosAtivos: Array.isArray(data.modulosAtivos) ? data.modulosAtivos : [],
      data_criacao: new Date().toISOString().slice(0, 10),
    };
    usuariosAdmin = [...usuariosAdmin, novoUsuario];

    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Usuario criado com sucesso',
        dados: novoUsuario,
      },
      { status: 201 },
    );
  }),

  http.put('/api/usuarios/:id', async ({ request, params }) => {
    const id = Number(params.id);
    const data = (await request.json()) as Record<string, unknown>;
    const indice = usuariosAdmin.findIndex((u) => u.id === id);

    if (indice < 0) {
      return HttpResponse.json(
        {
          type: 'https://httpstatuses.com/404',
          title: 'Nao encontrado',
          status: 404,
          detail: 'Usuario nao encontrado.',
          instance: `/api/usuarios/${id}`,
        },
        { status: 404 },
      );
    }

    const atual = usuariosAdmin[indice];
    const atualizado = {
      ...atual,
      nome: String(data.nome ?? atual.nome),
      email: String(data.email ?? atual.email),
      data_nascimento: String(data.dataNascimento ?? data.data_nascimento ?? atual.data_nascimento ?? ''),
      perfil: String(data.perfil ?? atual.perfil).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
      status: data.status === undefined ? atual.status : Boolean(data.status),
      modulosAtivos: Array.isArray(data.modulosAtivos) ? data.modulosAtivos : atual.modulosAtivos,
    };
    usuariosAdmin = usuariosAdmin.map((u) => (u.id === id ? atualizado : u));

    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Usuario atualizado com sucesso',
      dados: atualizado,
    });
  }),

  http.delete('/api/usuarios/:id', ({ params }) => {
    const id = Number(params.id);
    const indice = usuariosAdmin.findIndex((u) => u.id === id);

    if (indice < 0) {
      return HttpResponse.json(
        {
          type: 'https://httpstatuses.com/404',
          title: 'Nao encontrado',
          status: 404,
          detail: 'Usuario nao encontrado.',
          instance: `/api/usuarios/${id}`,
        },
        { status: 404 },
      );
    }

    usuariosAdmin = usuariosAdmin.filter((u) => u.id !== id);
    return HttpResponse.json({ sucesso: true, mensagem: 'Usuario removido com sucesso' });
  }),
  // Obter estatísticas
  http.get('/api/admin/estatisticas', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: {
        total_usuarios: 2,
        total_despesas: 145.40,
        total_receitas: 3000.00,
        usuarios_ativos_hoje: 1,
        despesas_ultimos_30_dias: 145.40,
        receitas_ultimas_30_dias: 3000.00,
      },
    });
  }),

  // Iniciar simulação
  http.post('/api/admin/simulacao/iniciar', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Simulação iniciada',
      dados: {
        simulacao_id: 'sim_' + Date.now(),
        usuario_simulado_id: (data as any).usuario_id,
        data_inicio: new Date().toISOString(),
      },
    });
  }),

  // Finalizar simulação
  http.post('/api/admin/simulacao/finalizar', () => {
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Simulação finalizada',
    });
  }),

  // Logs de atividade
  http.get('/api/admin/logs', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        {
          id: 1,
          usuario_id: 1,
          acao: 'LOGIN',
          descricao: 'Usuário realizou login',
          data: '2024-03-15T10:30:00Z',
        },
        {
          id: 2,
          usuario_id: 1,
          acao: 'CRIAR_DESPESA',
          descricao: 'Criou despesa de R$45.50',
          data: '2024-03-15T11:00:00Z',
        },
      ],
      quantidade: 2,
    });
  }),

  // ===== PHASE 10: PERMISSÕES =====
  // Listar permissões
  http.get('/api/admin/permissoes', async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      dados: mockPermissoes,
    });
  }),

  // Salvar permissões
  http.post('/api/admin/permissoes', async ({ request }) => {
    const data = await request.json();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Permissões atualizadas com sucesso',
      dados: data,
    });
  }),

  // ===== PHASE 10: DOCUMENTOS =====
  // Listar documentos
  http.get('/api/admin/documentos', async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      dados: mockDocumentos,
      quantidade: mockDocumentos.length,
    });
  }),

  // Criar documento
  http.post('/api/admin/documentos', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Documento criado com sucesso',
        dados: {
          id: mockDocumentos.length + 1,
          ...data,
          versoes: [
            {
              numero: 1,
              data: new Date().toISOString(),
              alteracoes: 'Versão inicial',
              usuarioId: 1,
              usuarioNome: 'Admin User',
            },
          ],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          criadoPor: 'Admin User',
          atualizadoPor: 'Admin User',
        },
      },
      { status: 201 }
    );
  }),

  // Obter documento específico
  http.get('/api/admin/documentos/:id', async ({ params }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const doc = mockDocumentos.find((d) => d.id === parseInt(params.id as string));
    if (!doc) {
      return HttpResponse.json(
        { sucesso: false, mensagem: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ sucesso: true, dados: doc });
  }),

  // Atualizar documento
  http.put('/api/admin/documentos/:id', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Documento atualizado com sucesso',
      dados: {
        id: parseInt(data.id as string),
        ...data,
        dataAtualizacao: new Date().toISOString(),
        atualizadoPor: 'Admin User',
      },
    });
  }),

  // Deletar documento
  http.delete('/api/admin/documentos/:id', async ({ params }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Documento deletado com sucesso',
      dados: { id: params.id },
    });
  }),

  // Publicar documento
  http.post('/api/admin/documentos/:id/publicar', async ({ params, request }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Documento publicado com sucesso',
      dados: {
        id: params.id,
        status: 'PUBLICADO',
        dataPublicacao: new Date().toISOString(),
      },
    });
  }),

  // ===== PHASE 10: AVISOS =====
  // Listar avisos
  http.get('/api/admin/avisos', async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      dados: mockAvisos,
      quantidade: mockAvisos.length,
    });
  }),

  // Criar aviso
  http.post('/api/admin/avisos', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json(
      {
        sucesso: true,
        mensagem: 'Aviso criado com sucesso',
        dados: {
          id: mockAvisos.length + 1,
          ...data,
          ciencias: [],
          datas: {
            criacao: new Date().toISOString(),
            atualizacao: new Date().toISOString(),
          },
          criadoPor: 'Admin User',
        },
      },
      { status: 201 }
    );
  }),

  // Obter aviso específico
  http.get('/api/admin/avisos/:id', async ({ params }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const aviso = mockAvisos.find((a) => a.id === parseInt(params.id as string));
    if (!aviso) {
      return HttpResponse.json(
        { sucesso: false, mensagem: 'Aviso não encontrado' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ sucesso: true, dados: aviso });
  }),

  // Atualizar aviso
  http.put('/api/admin/avisos/:id', async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Aviso atualizado com sucesso',
      dados: {
        id: parseInt(data.id as string),
        ...data,
        datas: {
          criacao: data.dataCriacao || new Date().toISOString(),
          atualizacao: new Date().toISOString(),
        },
      },
    });
  }),

  // Deletar aviso
  http.delete('/api/admin/avisos/:id', async ({ params }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Aviso deletado com sucesso',
      dados: { id: params.id },
    });
  }),

  // Publicar aviso
  http.post('/api/admin/avisos/:id/publicar', async ({ params }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Aviso publicado com sucesso',
      dados: {
        id: params.id,
        status: 'PUBLICADO',
        dataPublicacao: new Date().toISOString(),
      },
    });
  }),

  // Dar ciência de aviso
  http.post('/api/admin/avisos/:id/dar-ciencia', async ({ params, request }) => {
    const data = (await request.json()) as Record<string, any>;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Ciência registrada com sucesso',
      dados: {
        avisoId: params.id,
        usuarioId: (data as any).usuarioId,
        dataCiencia: new Date().toISOString(),
        lido: true,
      },
    });
  }),

  // Listar avisos pendentes de ciência
  http.get('/api/avisos/pendentes-ciencia', async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      sucesso: true,
      dados: mockAvisos.filter((a) => a.requerCiencia && a.status === 'PUBLICADO'),
      quantidade: mockAvisos.filter((a) => a.requerCiencia && a.status === 'PUBLICADO').length,
    });
  }),
];

