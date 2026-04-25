import { http, HttpResponse } from 'msw';
import { calcularValorTotalItemCompra } from '../../utils/compras.util';
import { DesejoCompra, ItemListaCompra, ListaCompra, ListaCompraLog, ParticipanteListaCompra } from '../../tipos/compras.tipos';

const usuarioAtualId = 1;

let listasCompra: ListaCompra[] = [
  {
    id: 900,
    nome: 'Mercado da Semana',
    categoria: 'mercado',
    status: 'ativa',
    criadoPorUsuarioId: usuarioAtualId,
    participantes: [
      { usuarioId: 1, nomeUsuario: 'William', permissao: 'proprietario' },
      { usuarioId: 2, nomeUsuario: 'Maria', permissao: 'coproprietario' },
    ],
    criadoEm: '2026-04-20',
    atualizadoEm: '2026-04-20',
  },
];

let itensListaCompra: ItemListaCompra[] = [
  {
    id: 5001,
    listaId: 900,
    descricao: 'Arroz',
    observacao: '',
    unidadeMedida: 'kg',
    quantidade: 5,
    marcadorCor: '#22c55e',
    valorUnitario: 7.5,
    valorTotal: 37.5,
    comprado: false,
    versao: 1,
    atualizadoEm: '2026-04-20',
  },
  {
    id: 5002,
    listaId: 900,
    descricao: 'Leite',
    observacao: 'Integral',
    unidadeMedida: 'l',
    quantidade: 6,
    marcadorCor: '#3b82f6',
    valorUnitario: 4.2,
    valorTotal: 25.2,
    comprado: true,
    versao: 2,
    atualizadoEm: '2026-04-20',
  },
];

let desejosCompra: DesejoCompra[] = [
  {
    id: 7001,
    descricao: 'Cadeira Gamer',
    observacao: 'Encosto reclinavel',
    unidadeMedida: 'unidade',
    quantidade: 1,
    valorAlvo: 980,
    selecionado: false,
    criadoEm: '2026-04-19',
  },
  {
    id: 7002,
    descricao: 'Monitor 27',
    observacao: 'IPS',
    unidadeMedida: 'unidade',
    quantidade: 1,
    valorAlvo: 1200,
    selecionado: false,
    criadoEm: '2026-04-19',
  },
];

let logsListasCompra: ListaCompraLog[] = [
  {
    id: 1,
    listaId: 900,
    evento: 'lista_criada',
    usuarioId: 1,
    dataHoraUtc: '2026-04-20T10:00:00Z',
  },
];

function respostaComDados<T>(dados: T) {
  return HttpResponse.json({ sucesso: true, dados });
}

function calcularResumoLista(lista: ListaCompra) {
  const itens = itensListaCompra.filter((item) => item.listaId === lista.id);
  const quantidadeItensComprados = itens.filter((item) => item.comprado).length;
  const valorTotal = Number(itens.reduce((soma, item) => soma + item.valorTotal, 0).toFixed(2));
  const valorComprado = Number(
    itens.filter((item) => item.comprado).reduce((soma, item) => soma + item.valorTotal, 0).toFixed(2),
  );
  const percentualComprado = itens.length > 0 ? Number(((quantidadeItensComprados / itens.length) * 100).toFixed(2)) : 0;
  return {
    itens,
    valorTotal,
    valorComprado,
    percentualComprado,
    quantidadeItens: itens.length,
    quantidadeItensComprados,
  };
}

function mapearListaResumo(lista: ListaCompra) {
  const resumo = calcularResumoLista(lista);
  const papelUsuario = lista.participantes.find((participante) => participante.usuarioId === usuarioAtualId)?.permissao ?? 'leitor';

  return {
    id: lista.id,
    nome: lista.nome,
    categoria: lista.categoria,
    observacao: lista.observacao ?? '',
    status: lista.status,
    papelUsuario: papelUsuario === 'proprietario' ? 'Proprietario' : papelUsuario === 'coproprietario' ? 'CoProprietario' : 'Leitor',
    valorTotal: resumo.valorTotal,
    valorComprado: resumo.valorComprado,
    percentualComprado: resumo.percentualComprado,
    quantidadeItens: resumo.quantidadeItens,
    quantidadeItensComprados: resumo.quantidadeItensComprados,
    quantidadeParticipantes: lista.participantes.length,
    dataHoraAtualizacao: `${lista.atualizadoEm}T00:00:00Z`,
  };
}

function mapearPapelPayload(papel?: string): ParticipanteListaCompra['permissao'] {
  const valor = String(papel ?? '').toLowerCase();
  if (valor === 'proprietario') return 'proprietario';
  if (valor === 'coproprietario') return 'coproprietario';
  return 'leitor';
}

export const manipuladorCompras = [
  http.get('/api/compras/listas', () => respostaComDados(listasCompra.map(mapearListaResumo))),

  http.get('/api/compras/listas/:listaId', ({ params }) => {
    const listaId = Number(params.listaId);
    const lista = listasCompra.find((item) => item.id === listaId);
    if (!lista) {
      return HttpResponse.json({ sucesso: false, codigo: 'lista_compra_nao_encontrada' }, { status: 404 });
    }

    const resumo = calcularResumoLista(lista);

    return respostaComDados({
      id: lista.id,
      nome: lista.nome,
      observacao: lista.observacao ?? '',
      categoria: lista.categoria,
      status: lista.status,
      valorTotal: resumo.valorTotal,
      valorComprado: resumo.valorComprado,
      percentualComprado: resumo.percentualComprado,
      quantidadeItens: resumo.quantidadeItens,
      quantidadeItensComprados: resumo.quantidadeItensComprados,
      itens: resumo.itens,
      participantes: lista.participantes,
      dataHoraAtualizacao: `${lista.atualizadoEm}T00:00:00Z`,
    });
  }),

  http.get('/api/compras/listas/:listaId/detalhe', ({ params }) => {
    const listaId = Number(params.listaId);
    const lista = listasCompra.find((item) => item.id === listaId);
    if (!lista) {
      return HttpResponse.json({ sucesso: false, codigo: 'lista_compra_nao_encontrada' }, { status: 404 });
    }

    return respostaComDados({
      id: lista.id,
      nome: lista.nome,
      observacao: lista.observacao ?? '',
      categoria: lista.categoria,
      status: lista.status,
      participantes: lista.participantes.map((participante) => ({
        usuarioId: participante.usuarioId,
        nome: participante.nomeUsuario,
        papel: participante.permissao === 'proprietario'
          ? 'Proprietario'
          : participante.permissao === 'coproprietario'
            ? 'CoProprietario'
            : 'Leitor',
      })),
      logs: logsListasCompra.filter((log) => log.listaId === listaId).map((log) => ({
        id: log.id,
        dataHoraCadastro: log.dataHoraUtc,
        usuarioCadastroId: log.usuarioId,
        itemListaCompraId: log.itemListaCompraId ?? null,
        acao: log.evento,
        descricao: log.descricao ?? '',
        valorAnterior: log.valorAnterior ?? '',
        valorNovo: log.valorNovo ?? '',
      })),
      dataHoraAtualizacao: `${lista.atualizadoEm}T00:00:00Z`,
    });
  }),

  http.post('/api/compras/listas', async ({ request }) => {
    const payload = (await request.json()) as {
      nome: string;
      categoria: ListaCompra['categoria'];
      observacao?: string;
      participantes?: Array<{ usuarioId: number; papel: 'Proprietario' | 'CoProprietario' | 'Leitor' }>;
    };
    const participantesPayload = Array.isArray(payload.participantes) ? payload.participantes : [];
    const participantes = participantesPayload.length > 0
      ? participantesPayload.map((participante) => ({
          usuarioId: participante.usuarioId,
          nomeUsuario: participante.usuarioId === usuarioAtualId ? 'William' : `Usuario ${participante.usuarioId}`,
          permissao: mapearPapelPayload(participante.papel),
        }))
      : [{ usuarioId: usuarioAtualId, nomeUsuario: 'William', permissao: 'proprietario' as const }];

    const novaLista: ListaCompra = {
      id: Date.now(),
      nome: payload.nome,
      observacao: payload.observacao ?? '',
      categoria: payload.categoria,
      status: 'ativa',
      criadoPorUsuarioId: usuarioAtualId,
      participantes,
      criadoEm: '2026-04-21',
      atualizadoEm: '2026-04-21',
    };
    listasCompra = [novaLista, ...listasCompra];
    return respostaComDados(novaLista);
  }),

  http.put('/api/compras/listas/:listaId', async ({ params, request }) => {
    const listaId = Number(params.listaId);
    const payload = (await request.json()) as Partial<ListaCompra> & {
      participantes?: Array<{ usuarioId: number; papel: 'Proprietario' | 'CoProprietario' | 'Leitor' }>;
    };
    listasCompra = listasCompra.map((lista) => {
      if (lista.id !== listaId) return lista;

      const participantesAtualizados = Array.isArray(payload.participantes)
        ? payload.participantes.map((participante) => ({
            usuarioId: participante.usuarioId,
            nomeUsuario: participante.usuarioId === usuarioAtualId ? 'William' : `Usuario ${participante.usuarioId}`,
            permissao: mapearPapelPayload(participante.papel),
          }))
        : lista.participantes;

      return {
        ...lista,
        ...payload,
        participantes: participantesAtualizados,
        atualizadoEm: '2026-04-21',
      };
    });
    const listaAtualizada = listasCompra.find((lista) => lista.id === listaId);
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId, evento: 'lista_atualizada', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:00:00Z' },
    ];
    return respostaComDados(listaAtualizada ?? null);
  }),

  http.post('/api/compras/listas/:listaId/arquivar', ({ params }) => {
    const listaId = Number(params.listaId);
    const lista = listasCompra.find((item) => item.id === listaId);
    if (!lista) {
      return HttpResponse.json({ sucesso: false, codigo: 'lista_compra_nao_encontrada' }, { status: 404 });
    }
    if (lista.status === 'arquivada') {
      return HttpResponse.json({ sucesso: false, codigo: 'lista_compra_ja_arquivada' }, { status: 400 });
    }
    listasCompra = listasCompra.map((item) =>
      item.id === listaId ? { ...item, status: 'arquivada', atualizadoEm: '2026-04-21' } : item,
    );
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId, evento: 'lista_arquivada', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:01:00Z' },
    ];
    return respostaComDados(listasCompra.find((item) => item.id === listaId));
  }),

  http.post('/api/compras/listas/:listaId/duplicar', async ({ params, request }) => {
    const listaId = Number(params.listaId);
    const payload = (await request.json()) as {
      nome?: string;
      categoria?: ListaCompra['categoria'];
      observacao?: string;
      participantes?: Array<{ usuarioId: number; papel: 'Proprietario' | 'CoProprietario' | 'Leitor' }>;
    };
    const listaBase = listasCompra.find((lista) => lista.id === listaId);
    if (!listaBase) {
      return HttpResponse.json({ sucesso: false, mensagem: 'Lista nao encontrada.' }, { status: 404 });
    }

    const novaListaId = Date.now();
    const participantes = Array.isArray(payload.participantes) && payload.participantes.length > 0
      ? payload.participantes.map((participante) => ({
          usuarioId: participante.usuarioId,
          nomeUsuario: participante.usuarioId === usuarioAtualId ? 'William' : `Usuario ${participante.usuarioId}`,
          permissao: mapearPapelPayload(participante.papel),
        }))
      : listaBase.participantes;
    const listaDuplicada: ListaCompra = {
      ...listaBase,
      id: novaListaId,
      nome: payload.nome ?? `${listaBase.nome} (copia)`,
      observacao: payload.observacao ?? listaBase.observacao ?? '',
      categoria: payload.categoria ?? listaBase.categoria,
      participantes,
      criadoEm: '2026-04-21',
      atualizadoEm: '2026-04-21',
    };
    listasCompra = [listaDuplicada, ...listasCompra];

    const itensDaLista = itensListaCompra.filter((item) => item.listaId === listaBase.id);
    const itensDuplicados = itensDaLista.map((item, indice) => ({
      ...item,
      id: novaListaId + indice + 1,
      listaId: novaListaId,
      comprado: false,
      versao: 1,
      atualizadoEm: '2026-04-21',
    }));
    itensListaCompra = [...itensListaCompra, ...itensDuplicados];
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId: listaBase.id, evento: 'lista_duplicada', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:02:00Z' },
      { id: Date.now() + 1, listaId: novaListaId, evento: 'lista_derivada_criada', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:02:00Z' },
    ];

    return respostaComDados(listaDuplicada);
  }),

  http.delete('/api/compras/listas/:listaId', ({ params }) => {
    const listaId = Number(params.listaId);
    listasCompra = listasCompra.filter((lista) => lista.id !== listaId);
    itensListaCompra = itensListaCompra.filter((item) => item.listaId !== listaId);
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId, evento: 'lista_excluida', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:03:00Z' },
    ];
    return HttpResponse.json({ sucesso: true });
  }),

  http.post('/api/compras/listas/:listaId/itens', async ({ params, request }) => {
    const listaId = Number(params.listaId);
    const payload = (await request.json()) as Omit<ItemListaCompra, 'id' | 'listaId' | 'valorTotal' | 'comprado' | 'versao' | 'atualizadoEm'> & {
      precoUnitario: number;
      quantidade: number;
      marcadorCor?: string;
      etiquetaCor?: string;
      observacao?: string;
      unidade?: ItemListaCompra['unidadeMedida'];
    };

    const novoItem: ItemListaCompra = {
      id: Date.now(),
      listaId,
      descricao: payload.descricao,
      observacao: payload.observacao ?? '',
      unidadeMedida: payload.unidade ?? payload.unidadeMedida,
      quantidade: payload.quantidade,
      marcadorCor: payload.etiquetaCor ?? payload.marcadorCor ?? '#9ca3af',
      valorUnitario: payload.precoUnitario,
      valorTotal: calcularValorTotalItemCompra(payload.quantidade, payload.precoUnitario),
      comprado: false,
      versao: 1,
      atualizadoEm: '2026-04-21',
    };
    itensListaCompra = [novoItem, ...itensListaCompra];
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId, evento: 'item_criado', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:06:00Z' },
    ];
    return respostaComDados(novoItem);
  }),

  http.put('/api/compras/listas/:listaId/itens/:itemId', async ({ params, request }) => {
    const itemId = Number(params.itemId);
    const payload = (await request.json()) as Partial<ItemListaCompra> & {
      precoUnitario?: number;
      unidade?: ItemListaCompra['unidadeMedida'];
      etiquetaCor?: string;
    };
    let itemAtualizado: ItemListaCompra | null = null;
    itensListaCompra = itensListaCompra.map((item) => {
      if (item.id !== itemId) return item;
      itemAtualizado = {
        ...item,
        valorTotal: calcularValorTotalItemCompra(payload.quantidade ?? item.quantidade, payload.precoUnitario ?? item.valorUnitario),
        valorUnitario: payload.precoUnitario ?? item.valorUnitario,
        unidadeMedida: payload.unidade ?? item.unidadeMedida,
        marcadorCor: payload.etiquetaCor ?? payload.marcadorCor ?? item.marcadorCor,
        descricao: payload.descricao ?? item.descricao,
        observacao: payload.observacao ?? item.observacao,
        comprado: payload.comprado ?? item.comprado,
        versao: item.versao + 1,
        atualizadoEm: '2026-04-21',
      };
      return itemAtualizado;
    });
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId: Number(params.listaId), evento: 'item_atualizado', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:07:00Z' },
    ];
    return respostaComDados(itemAtualizado);
  }),

  http.delete('/api/compras/listas/:listaId/itens/:itemId', ({ params }) => {
    const itemId = Number(params.itemId);
    const listaId = Number(params.listaId);
    itensListaCompra = itensListaCompra.filter((item) => item.id !== itemId);
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId, evento: 'item_excluido', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:07:30Z' },
    ];
    return HttpResponse.json({ sucesso: true });
  }),

  http.patch('/api/compras/listas/:listaId/itens/:itemId/edicao-rapida', async ({ params, request }) => {
    const itemId = Number(params.itemId);
    const payload = (await request.json()) as { quantidade: number; precoUnitario: number };
    let itemAtualizado: ItemListaCompra | null = null;
    itensListaCompra = itensListaCompra.map((item) => {
      if (item.id !== itemId) return item;
      itemAtualizado = {
        ...item,
        quantidade: payload.quantidade,
        valorUnitario: payload.precoUnitario,
        valorTotal: calcularValorTotalItemCompra(payload.quantidade, payload.precoUnitario),
        versao: item.versao + 1,
        atualizadoEm: '2026-04-21',
      };
      return itemAtualizado;
    });
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId: Number(params.listaId), evento: 'item_edicao_rapida', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:08:00Z' },
    ];
    return respostaComDados(itemAtualizado);
  }),

  http.post('/api/compras/listas/:listaId/itens/:itemId/marcar-comprado', async ({ params, request }) => {
    const payload = (await request.json()) as { comprado?: boolean };
    const itemId = Number(params.itemId);
    const listaId = Number(params.listaId);
    let itemAtualizado: ItemListaCompra | null = null;
    let itemMarcadoComoComprado = false;
    itensListaCompra = itensListaCompra.map((item) => {
      if (item.id !== itemId) return item;
      itemMarcadoComoComprado = typeof payload.comprado === 'boolean' ? payload.comprado : !item.comprado;
      itemAtualizado = {
        ...item,
        comprado: itemMarcadoComoComprado,
        versao: item.versao + 1,
        atualizadoEm: '2026-04-21',
      };
      return itemAtualizado;
    });
    logsListasCompra = [
      ...logsListasCompra,
      {
        id: Date.now(),
        listaId,
        evento: itemMarcadoComoComprado ? 'item_comprado' : 'item_desmarcado',
        usuarioId: usuarioAtualId,
        dataHoraUtc: '2026-04-21T12:09:00Z',
      },
    ];
    return respostaComDados(itemAtualizado);
  }),

  http.post('/api/compras/listas/:listaId/acoes-lote', async ({ params, request }) => {
    const listaId = Number(params.listaId);
    const payload = (await request.json()) as { acao: string };
    const itensDaLista = itensListaCompra.filter((item) => item.listaId === listaId);

    if (
      payload.acao === 'MarcarSelecionadosComprados' ||
      payload.acao === 'DesmarcarSelecionados' ||
      payload.acao === 'marcarSelecionadosComprados' ||
      payload.acao === 'desmarcarSelecionados'
    ) {
      const alvo = payload.acao === 'MarcarSelecionadosComprados' || payload.acao === 'marcarSelecionadosComprados';
      const payloadComIds = payload as { itensIds?: number[]; itemIds?: number[] };
      const idsSelecionados = Array.isArray(payloadComIds.itensIds)
        ? payloadComIds.itensIds
        : Array.isArray(payloadComIds.itemIds)
          ? payloadComIds.itemIds
          : [];
      itensListaCompra = itensListaCompra.map((item) =>
        item.listaId === listaId && idsSelecionados.includes(item.id)
          ? { ...item, comprado: alvo, versao: item.versao + 1, atualizadoEm: '2026-04-21' }
          : item,
      );
      logsListasCompra = [
        ...logsListasCompra,
        { id: Date.now(), listaId, evento: 'lote_executado', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:10:00Z' },
      ];
      return respostaComDados(itensListaCompra.filter((item) => item.listaId === listaId));
    }

    if (payload.acao === 'LimparLista' || payload.acao === 'limparLista') {
      itensListaCompra = itensListaCompra.filter((item) => item.listaId !== listaId);
      logsListasCompra = [
        ...logsListasCompra,
        { id: Date.now(), listaId, evento: 'lote_executado', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:10:00Z' },
      ];
      return respostaComDados([]);
    }

    if (payload.acao === 'ResetarPrecos' || payload.acao === 'resetarPrecos') {
      itensListaCompra = itensListaCompra.map((item) =>
        item.listaId === listaId
          ? { ...item, valorUnitario: 0, valorTotal: 0, versao: item.versao + 1, atualizadoEm: '2026-04-21' }
          : item,
      );
      logsListasCompra = [
        ...logsListasCompra,
        { id: Date.now(), listaId, evento: 'lote_executado', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:10:00Z' },
      ];
      return respostaComDados(itensListaCompra.filter((item) => item.listaId === listaId));
    }

    return respostaComDados(itensDaLista);
  }),

  http.get('/api/compras/desejos', () => respostaComDados(desejosCompra)),

  http.post('/api/compras/desejos', async ({ request }) => {
    const payload = (await request.json()) as Partial<DesejoCompra>;
    const novoDesejo: DesejoCompra = {
      id: Date.now(),
      descricao: payload.descricao ?? '',
      observacao: payload.observacao ?? '',
      unidadeMedida: payload.unidadeMedida ?? (payload as { unidade?: DesejoCompra['unidadeMedida'] }).unidade ?? 'unidade',
      quantidade: payload.quantidade ?? 1,
      valorAlvo: payload.valorAlvo ?? (payload as { precoEstimado?: number }).precoEstimado ?? 0,
      selecionado: false,
      criadoEm: '2026-04-21',
    };
    desejosCompra = [novoDesejo, ...desejosCompra];
    return respostaComDados(novoDesejo);
  }),

  http.put('/api/compras/desejos/:desejoId', async ({ params, request }) => {
    const desejoId = Number(params.desejoId);
    const payload = (await request.json()) as Partial<DesejoCompra> & { unidade?: DesejoCompra['unidadeMedida']; precoEstimado?: number };
    desejosCompra = desejosCompra.map((desejo) =>
      desejo.id === desejoId
        ? {
            ...desejo,
            ...payload,
            unidadeMedida: payload.unidade ?? payload.unidadeMedida ?? desejo.unidadeMedida,
            valorAlvo: payload.precoEstimado ?? payload.valorAlvo ?? desejo.valorAlvo,
          }
        : desejo,
    );
    return respostaComDados(desejosCompra.find((desejo) => desejo.id === desejoId) ?? null);
  }),

  http.delete('/api/compras/desejos/:desejoId', ({ params }) => {
    const desejoId = Number(params.desejoId);
    desejosCompra = desejosCompra.filter((desejo) => desejo.id !== desejoId);
    return HttpResponse.json({ sucesso: true });
  }),

  http.post('/api/compras/desejos/converter', async ({ request }) => {
    const payload = (await request.json()) as { desejosIds: number[]; nomeNovaLista?: string };
    const desejosSelecionados = desejosCompra.filter((desejo) => payload.desejosIds.includes(desejo.id));
    const listaCriada: ListaCompra = {
      id: Date.now(),
      nome: payload.nomeNovaLista || 'Nova lista convertida',
      categoria: 'outros',
      status: 'ativa',
      criadoPorUsuarioId: usuarioAtualId,
      participantes: [{ usuarioId: usuarioAtualId, nomeUsuario: 'William', permissao: 'proprietario' }],
      criadoEm: '2026-04-21',
      atualizadoEm: '2026-04-21',
    };
    listasCompra = [listaCriada, ...listasCompra];

    const itensNovos: ItemListaCompra[] = desejosSelecionados.map((desejo, indice) => ({
      id: listaCriada.id + indice + 1,
      listaId: listaCriada.id,
      descricao: desejo.descricao,
      observacao: desejo.observacao,
      unidadeMedida: desejo.unidadeMedida,
      quantidade: desejo.quantidade,
      marcadorCor: '#9ca3af',
      valorUnitario: desejo.valorAlvo,
      valorTotal: calcularValorTotalItemCompra(desejo.quantidade, desejo.valorAlvo),
      comprado: false,
      versao: 1,
      atualizadoEm: '2026-04-21',
    }));
    itensListaCompra = [...itensListaCompra, ...itensNovos];
    logsListasCompra = [
      ...logsListasCompra,
      { id: Date.now(), listaId: listaCriada.id, evento: 'desejos_convertidos', usuarioId: usuarioAtualId, dataHoraUtc: '2026-04-21T12:11:00Z' },
    ];

    return respostaComDados({
      listaId: listaCriada.id,
      itensCriados: itensNovos.length,
      desejosProcessados: desejosSelecionados.length,
    });
  }),

  http.get('/api/compras/historico-precos', ({ request }) => {
    const url = new URL(request.url);
    const filtroDescricao = (url.searchParams.get('descricao') ?? '').toLowerCase();
    const agrupado = new Map<string, { descricao: string; unidadeMedida: string; valores: number[]; datas: string[] }>();

    for (const item of itensListaCompra) {
      const chave = `${item.descricao.toLowerCase()}::${item.unidadeMedida}`;
      const atual = agrupado.get(chave) ?? { descricao: item.descricao, unidadeMedida: item.unidadeMedida, valores: [], datas: [] };
      if (item.valorUnitario > 0) {
        atual.valores.push(item.valorUnitario);
        atual.datas.push(item.atualizadoEm);
      }
      agrupado.set(chave, atual);
    }

    const historico = Array.from(agrupado.values())
      .filter((registro) => !filtroDescricao || registro.descricao.toLowerCase().includes(filtroDescricao))
      .map((registro) => {
        const ultimoValor = registro.valores[registro.valores.length - 1] ?? 0;
        const menorValor = registro.valores.length ? Math.min(...registro.valores) : 0;
        const mediaValor = registro.valores.length
          ? Number((registro.valores.reduce((soma, valor) => soma + valor, 0) / registro.valores.length).toFixed(2))
          : 0;
        const variacaoPercentual = mediaValor > 0 ? Number((((ultimoValor - mediaValor) / mediaValor) * 100).toFixed(2)) : 0;
        return {
          descricao: registro.descricao,
          produtoId: Math.abs(`${registro.descricao}-${registro.unidadeMedida}`.split('').reduce((acc, letra) => acc + letra.charCodeAt(0), 0)),
          unidade: registro.unidadeMedida,
          ultimoPreco: ultimoValor,
          menorPreco: menorValor,
          maiorPreco: registro.valores.length ? Math.max(...registro.valores) : 0,
          mediaPreco: mediaValor,
          dataUltimoPreco: registro.datas[registro.datas.length - 1] ?? '2026-04-21',
          totalOcorrencias: registro.valores.length,
        };
      });

    return respostaComDados(historico);
  }),

  http.get('/api/compras/listas/:listaId/sugestoes-itens', ({ request }) => {
    const url = new URL(request.url);
    const termo = (url.searchParams.get('descricao') ?? '').trim().toLowerCase();
    const limite = Number(url.searchParams.get('limite') ?? '8');
    if (termo.length < 3) return respostaComDados([]);

    const sugestoes = itensListaCompra
      .filter((item) => item.descricao.toLowerCase().includes(termo))
      .map((item) => ({
        descricao: item.descricao,
        unidadeMedida: item.unidadeMedida,
        valorReferencia: item.valorUnitario,
        etiquetaCor: item.marcadorCor,
      }));

    const deduplicadas = Array.from(
      new Map(sugestoes.map((item) => [`${item.descricao.toLowerCase()}::${item.unidadeMedida}`, item])).values(),
    );

    return respostaComDados(deduplicadas.slice(0, limite));
  }),
];
