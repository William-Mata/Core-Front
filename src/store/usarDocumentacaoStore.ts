import { create } from 'zustand';

export type ModuloDocumentacao = 'dashboard' | 'financeiro' | 'amigos' | 'admin';
export type StatusDocumentacao = 'RASCUNHO' | 'PUBLICADO';

export interface DocumentoModulo {
  id: number;
  modulo: ModuloDocumentacao;
  titulo: string;
  descricao: string;
  conteudo: string;
  status: StatusDocumentacao;
  atualizadoEm: string;
  criadoPor: string;
}

interface DocumentacaoState {
  documentos: DocumentoModulo[];
  listarPorModulo: (modulo: ModuloDocumentacao) => DocumentoModulo[];
  obterPorId: (id: number) => DocumentoModulo | undefined;
  salvar: (documento: Omit<DocumentoModulo, 'id' | 'atualizadoEm'> & { id?: number }) => DocumentoModulo;
  publicar: (id: number) => void;
  remover: (id: number) => void;
}

const documentosIniciais: DocumentoModulo[] = [
  {
    id: 1,
    modulo: 'dashboard',
    titulo: 'Visao geral do dashboard',
    descricao: 'Explica os widgets, filtros e leitura consolidada dos dados.',
    conteudo:
      'O dashboard consolida indicadores de receitas, despesas, reembolsos e estornos. Os widgets podem ser reordenados e os filtros por periodo e descricao alteram toda a leitura da tela.',
    status: 'PUBLICADO',
    atualizadoEm: '2026-03-22',
    criadoPor: 'Admin',
  },
  {
    id: 2,
    modulo: 'financeiro',
    titulo: 'Operacoes do modulo financeiro',
    descricao: 'Resume os CRUDs de despesas, receitas, reembolsos, contas e cartoes.',
    conteudo:
      'No modulo financeiro o usuario registra despesas, receitas, reembolsos, contas bancarias e cartoes. Reembolsos vinculam despesas. O extrato aparece dentro da conta bancaria e a fatura dentro de cartoes de credito.',
    status: 'PUBLICADO',
    atualizadoEm: '2026-03-22',
    criadoPor: 'Admin',
  },
  {
    id: 3,
    modulo: 'amigos',
    titulo: 'Gestao de amigos e convites',
    descricao: 'Explica a diferenca entre amigos ativos e convites pendentes.',
    conteudo:
      'O modulo amigos permite convidar contatos, acompanhar convites pendentes e consultar amigos ativos. Os filtros ajudam a localizar registros por nome, email e data de adicao.',
    status: 'PUBLICADO',
    atualizadoEm: '2026-03-22',
    criadoPor: 'Admin',
  },
  {
    id: 4,
    modulo: 'admin',
    titulo: 'Recursos administrativos',
    descricao: 'Resume usuarios, permissoes, simulacao, avisos e documentacao.',
    conteudo:
      'A administracao centraliza usuarios, permissoes, simulacao de acesso, avisos e a manutencao da documentacao publicada para cada modulo do sistema.',
    status: 'PUBLICADO',
    atualizadoEm: '2026-03-22',
    criadoPor: 'Admin',
  },
];

export const usarDocumentacaoStore = create<DocumentacaoState>((set, get) => ({
  documentos: documentosIniciais,
  listarPorModulo: (modulo) => get().documentos.filter((doc) => doc.modulo === modulo),
  obterPorId: (id) => get().documentos.find((doc) => doc.id === id),
  salvar: (documento) => {
    const atualizadoEm = new Date().toISOString().split('T')[0];
    let salvo: DocumentoModulo;

    set((state) => {
      if (documento.id) {
        salvo = {
          ...state.documentos.find((doc) => doc.id === documento.id)!,
          ...documento,
          id: documento.id,
          atualizadoEm,
        };
        return {
          documentos: state.documentos.map((doc) => (doc.id === documento.id ? salvo : doc)),
        };
      }

      const novoId = state.documentos.length > 0 ? Math.max(...state.documentos.map((doc) => doc.id)) + 1 : 1;
      salvo = {
        ...documento,
        id: novoId,
        atualizadoEm,
      };
      return {
        documentos: [...state.documentos, salvo],
      };
    });

    return salvo!;
  },
  publicar: (id) =>
    set((state) => ({
      documentos: state.documentos.map((doc) => (doc.id === id ? { ...doc, status: 'PUBLICADO', atualizadoEm: new Date().toISOString().split('T')[0] } : doc)),
    })),
  remover: (id) =>
    set((state) => ({
      documentos: state.documentos.filter((doc) => doc.id !== id),
    })),
}));
