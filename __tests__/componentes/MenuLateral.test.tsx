import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MenuLateral } from '../../src/componentes/comuns/MenuLateral';
import type { InterfaceModuloUsuario, InterfaceUsuario } from '../../src/tipos/usuario.tipos';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDeslogar = jest.fn();
const mockDefinirIdioma = jest.fn();

let mockPathname = '/';
let mockUsuario: InterfaceUsuario | null = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

jest.mock('../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) => chave,
  }),
}));

jest.mock('../../src/componentes/comuns/SeletorIdioma', () => ({
  SeletorIdioma: () => null,
}));

jest.mock('../../src/store/usarIdiomaStore', () => ({
  usarIdiomaStore: () => ({
    idiomaSelecionado: 'pt-BR',
    definirIdioma: mockDefinirIdioma,
  }),
}));

jest.mock('../../src/store/usarAutenticacaoStore', () => ({
  usarAutenticacaoStore: () => ({
    deslogar: mockDeslogar,
    usuario: mockUsuario,
  }),
}));

function criarModulosAtivos(overrides?: Partial<Record<string, { status: boolean; telasAtivas: string[] }>>): InterfaceModuloUsuario[] {
  const config = {
    '1': { status: true, telasAtivas: ['1', '2', '3', '4', '5'] },
    '2': { status: true, telasAtivas: ['30', '31', '33', '34', '35'] },
    '3': { status: true, telasAtivas: ['100', '101', '102', '103', '104', '105'] },
    ...(overrides ?? {}),
  };

  return [
    {
      id: '1',
      nome: 'Geral',
      status: config['1'].status,
      telas: ['1', '2', '3', '4', '5'].map((id) => ({
        id,
        nome: `Tela ${id}`,
        status: config['1'].status && config['1'].telasAtivas.includes(id),
        funcionalidades: [],
      })),
    },
    {
      id: '2',
      nome: 'Administracao',
      status: config['2'].status,
      telas: ['30', '31', '33', '34', '35'].map((id) => ({
        id,
        nome: `Tela ${id}`,
        status: config['2'].status && config['2'].telasAtivas.includes(id),
        funcionalidades: [],
      })),
    },
    {
      id: '3',
      nome: 'Financeiro',
      status: config['3'].status,
      telas: ['100', '101', '102', '103', '104', '105'].map((id) => ({
        id,
        nome: `Tela ${id}`,
        status: config['3'].status && config['3'].telasAtivas.includes(id),
        funcionalidades: [],
      })),
    },
  ];
}

function criarModuloComprasAtivo(): InterfaceModuloUsuario {
  return {
    id: '4',
    nome: 'Compras',
    status: true,
    telas: [],
  };
}

describe('MenuLateral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockUsuario = {
      id: 1,
      nome: 'Usuario',
      email: 'usuario@teste.com',
      perfil: { id: 2, nome: 'Usuario' },
      modulosAtivos: [],
    };
  });

  it('deve exibir itens do modulo financeiro quando ativo', () => {
    const { getByText } = render(
      <MenuLateral modulosAtivos={criarModulosAtivos()} rotaAtual="financeiro" />,
    );

    expect(getByText('menu.financeiro')).toBeTruthy();
    expect(getByText('menu.despesas')).toBeTruthy();
    expect(getByText('menu.receitas')).toBeTruthy();
  });

  it('nao deve exibir modulo financeiro quando modulo estiver inativo', () => {
    const { queryByText } = render(
      <MenuLateral
        modulosAtivos={criarModulosAtivos({
          '3': { status: false, telasAtivas: [] },
        })}
        rotaAtual="dashboard"
      />,
    );

    expect(queryByText('menu.financeiro')).toBeNull();
    expect(queryByText('menu.despesas')).toBeNull();
  });

  it('deve ocultar filhos de telas inativas', () => {
    const { getByText, queryByText } = render(
      <MenuLateral
        modulosAtivos={criarModulosAtivos({
          '3': { status: true, telasAtivas: ['100'] },
        })}
        rotaAtual="financeiro"
      />,
    );

    expect(getByText('menu.despesas')).toBeTruthy();
    expect(queryByText('menu.receitas')).toBeNull();
    expect(queryByText('menu.reembolsos')).toBeNull();
  });

  it('nao deve exibir grupo admin para usuario nao admin', () => {
    mockUsuario = {
      id: 2,
      nome: 'Comum',
      email: 'comum@teste.com',
      perfil: { id: 2, nome: 'Usuario' },
      modulosAtivos: [],
    };

    const { queryByText } = render(
      <MenuLateral modulosAtivos={criarModulosAtivos()} rotaAtual="dashboard" />,
    );

    expect(queryByText('menu.administracao')).toBeNull();
  });

  it('deve exibir grupo admin para perfil administrador e navegar em filho', () => {
    mockUsuario = {
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      perfil: { id: 1, nome: 'Administrador' },
      modulosAtivos: [],
    };

    const { getByText } = render(
      <MenuLateral modulosAtivos={criarModulosAtivos()} rotaAtual="admin" />,
    );

    fireEvent.press(getByText('menu.administracao'));
    fireEvent.press(getByText('menu.usuarios'));

    expect(mockPush).toHaveBeenCalledWith('/principal/administracao/usuario');
  });

  it('deve deslogar e redirecionar ao clicar em sair', async () => {
    mockDeslogar.mockResolvedValue(undefined);

    const { getByText } = render(
      <MenuLateral modulosAtivos={criarModulosAtivos()} rotaAtual="dashboard" />,
    );

    fireEvent.press(getByText('comum.sair'));

    await waitFor(() => {
      expect(mockDeslogar).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/auth/entrar');
    });
  });

  it('deve destacar apenas o submenu correto de compras conforme rota atual', () => {
    mockPathname = '/principal/compras/desejos';

    const { getByText } = render(
      <MenuLateral
        modulosAtivos={[...criarModulosAtivos(), criarModuloComprasAtivo()]}
        rotaAtual="compras"
      />,
    );

    fireEvent.press(getByText('menu.compras'));

    const itemPlanejamento = getByText('compras.menu.listas');
    const itemDesejos = getByText('compras.menu.desejos');

    expect(itemDesejos).toHaveStyle({ fontWeight: '700' });
    expect(itemPlanejamento).toHaveStyle({ fontWeight: '500' });
  });
});
