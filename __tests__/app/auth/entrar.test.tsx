import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Entrar from '../../../app/auth/entrar';

const mockReplace = jest.fn();
const mockDefinirSessao = jest.fn();
const mockAutenticar = jest.fn();
const mockSolicitarRecuperacaoSenha = jest.fn();
const mockSalvarTokens = jest.fn();
const mockNotificarErro = jest.fn();
const mockNotificarSucesso = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('../../../src/store/usarAutenticacaoStore', () => ({
  usarAutenticacaoStore: () => ({
    definirSessao: mockDefinirSessao,
  }),
}));

jest.mock('../../../src/servicos/autenticacao', () => ({
  autenticar: (...args: unknown[]) => mockAutenticar(...args),
  solicitarRecuperacaoSenha: (...args: unknown[]) => mockSolicitarRecuperacaoSenha(...args),
}));

jest.mock('../../../src/utils/armazenamento', () => ({
  salvarTokens: (...args: unknown[]) => mockSalvarTokens(...args),
}));

jest.mock('../../../src/utils/notificacao', () => ({
  notificarErro: (...args: unknown[]) => mockNotificarErro(...args),
  notificarSucesso: (...args: unknown[]) => mockNotificarSucesso(...args),
}));

jest.mock('../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string) =>
      (
        {
          'comum.email': 'Email',
          'comum.senha': 'Senha',
          'comum.entrar': 'Entrar',
          'comum.carregando': 'Carregando',
          'comum.login.esqueciSenha': 'Esqueci minha senha',
          'comum.login.esqueciSenhaSucesso': 'Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.',
          'comum.login.erros.camposObrigatorios': 'Email e Senha sao obrigatorios',
          'comum.login.erros.emailInvalido': 'Informe um email valido',
          'comum.login.erros.emailObrigatorioRecuperacao': 'Informe o email para recuperar a senha',
          'comum.login.erros.credenciaisInvalidas': 'Credenciais invalidas',
          'comum.login.erros.bloqueadoTentativas': 'Login bloqueado apos 5 tentativas invalidas.',
          'admin.usuarios.criar': 'Cadastrar',
        } as Record<string, string>
      )[chave] ?? chave,
  }),
}));

describe('Tela de login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar campos, botao de entrar e link de esqueci minha senha', () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    expect(getByPlaceholderText('Email *')).toBeTruthy();
    expect(getByPlaceholderText('Senha *')).toBeTruthy();
    expect(getAllByText('Entrar').length).toBeGreaterThan(0);
    expect(getByText('Esqueci minha senha')).toBeTruthy();
    expect(getByText('Cadastrar')).toBeTruthy();
  });

  it('deve bloquear login quando email ou senha estiverem vazios', () => {
    const { getAllByText } = render(<Entrar />);

    fireEvent.press(getAllByText('Entrar')[1]);

    expect(mockNotificarErro).toHaveBeenCalledWith('Email e Senha sao obrigatorios');
    expect(mockDefinirSessao).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('deve bloquear login quando o email estiver em formato invalido', () => {
    const { getByPlaceholderText, getAllByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email *'), 'email-invalido');
    fireEvent.changeText(getByPlaceholderText('Senha *'), '123456');
    fireEvent.press(getAllByText('Entrar')[1]);

    expect(mockNotificarErro).toHaveBeenCalledWith('Informe um email valido');
    expect(mockDefinirSessao).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('deve validar email no fluxo de recuperacao de senha', () => {
    const { getByText, getByPlaceholderText } = render(<Entrar />);

    fireEvent.press(getByText('Esqueci minha senha'));
    fireEvent.press(getByText('Esqueci minha senha'));
    expect(mockNotificarErro).toHaveBeenCalledWith('Informe o email para recuperar a senha');

    fireEvent.changeText(getByPlaceholderText('Email *'), 'email-invalido');
    fireEvent.press(getByText('Esqueci minha senha'));
    expect(mockNotificarErro).toHaveBeenCalledWith('Informe um email valido');
  });

  it('deve enviar recuperacao de senha com email valido', async () => {
    mockSolicitarRecuperacaoSenha.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email *'), 'TESTE@empresa.com');
    fireEvent.press(getByText('Esqueci minha senha'));
    fireEvent.press(getByText('Esqueci minha senha'));

    await waitFor(() => {
      expect(mockSolicitarRecuperacaoSenha).toHaveBeenCalledWith({ email: 'teste@empresa.com' });
    });
    expect(mockNotificarSucesso).toHaveBeenCalledWith('Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.');
  });

  it('deve contabilizar tentativas invalidas e bloquear apos 5 falhas', async () => {
    mockAutenticar.mockRejectedValue({ response: { status: 401 } });

    const { getByPlaceholderText, getAllByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email *'), 'admin@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha *'), 'senha-errada');

    for (let indice = 0; indice < 5; indice += 1) {
      fireEvent.press(getAllByText('Entrar')[1]);
      await waitFor(() => {
        expect(mockAutenticar).toHaveBeenCalledTimes(indice + 1);
      });
    }

    expect(mockNotificarErro).toHaveBeenLastCalledWith('Login bloqueado apos 5 tentativas invalidas.');

    fireEvent.press(getAllByText('Entrar')[1]);
    expect(mockAutenticar).toHaveBeenCalledTimes(5);
    expect(mockNotificarErro).toHaveBeenLastCalledWith('Login bloqueado apos 5 tentativas invalidas.');
  });

  it('deve resetar o bloqueio ao recuperar senha com email valido', async () => {
    mockAutenticar.mockRejectedValue({ response: { status: 401 } });
    mockSolicitarRecuperacaoSenha.mockResolvedValue(undefined);

    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email *'), 'admin@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha *'), 'senha-errada');

    for (let indice = 0; indice < 5; indice += 1) {
      fireEvent.press(getAllByText('Entrar')[1]);
      await waitFor(() => {
        expect(mockAutenticar).toHaveBeenCalledTimes(indice + 1);
      });
    }

    fireEvent.press(getByText('Esqueci minha senha'));
    fireEvent.press(getByText('Esqueci minha senha'));

    await waitFor(() => {
      expect(mockSolicitarRecuperacaoSenha).toHaveBeenCalledWith({ email: 'admin@core.com' });
    });
    expect(mockNotificarSucesso).toHaveBeenCalledWith('Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.');

    fireEvent.press(getAllByText('Entrar')[1]);
    fireEvent.press(getAllByText('Entrar')[1]);

    await waitFor(() => {
      expect(mockAutenticar).toHaveBeenCalledTimes(6);
    });
  });

  it('deve definir sessao e navegar para principal quando login for bem-sucedido', async () => {
    const usuario = {
      id: 1,
      nome: 'Usuario Teste',
      email: 'admin@core.com',
      perfil: {
        id: 1,
        nome: 'Administrador',
      },
      status: true,
      modulosAtivos: [],
    };

    mockAutenticar.mockResolvedValue({
      accessToken: 'mock-access-token-xyz',
      refreshToken: 'mock-refresh-token-xyz',
      usuario,
    });

    const { getByPlaceholderText, getAllByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email *'), 'ADMIN@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha *'), '123456');
    fireEvent.press(getAllByText('Entrar')[1]);

    await waitFor(() => {
      expect(mockAutenticar).toHaveBeenCalledWith('admin@core.com', '123456');
      expect(mockSalvarTokens).toHaveBeenCalledWith('mock-access-token-xyz', 'mock-refresh-token-xyz');
      expect(mockDefinirSessao).toHaveBeenCalledWith(usuario, 'mock-access-token-xyz');
      expect(mockReplace).toHaveBeenCalledWith('/principal');
    });
  });
});
