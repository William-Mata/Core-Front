import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Entrar from '../../../app/auth/entrar';

const mockReplace = jest.fn();
const mockDefinirSessao = jest.fn();

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

jest.mock('../../../src/hooks/usarTraducao', () => ({
  usarTraducao: () => ({
    t: (chave: string, opcoes?: Record<string, string>) =>
      (
        {
          'comum.erro': 'Erro',
          'comum.sucesso': 'Sucesso',
          'comum.email': 'Email',
          'comum.senha': 'Senha',
          'comum.entrar': 'Entrar',
          'comum.carregando': 'Carregando',
          'comum.login.esqueciSenha': 'Esqueci minha senha',
          'comum.login.esqueciSenhaSucesso': 'Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.',
          'comum.login.credenciaisTeste': 'Use admin@core.com / 123456 para testar',
          'comum.login.tentativasRestantes': 'Tentativas restantes: {{tentativas}}',
          'comum.login.erros.camposObrigatorios': 'Email e Senha sao obrigatorios',
          'comum.login.erros.emailInvalido': 'Informe um email valido',
          'comum.login.erros.emailObrigatorioRecuperacao': 'Informe o email para recuperar a senha',
          'comum.login.erros.credenciaisInvalidas': 'Credenciais invalidas. Tentativas restantes: {{tentativas}}',
          'comum.login.erros.bloqueadoTentativas': 'Login bloqueado apos 5 tentativas invalidas.',
        } as Record<string, string>
      )[chave]?.replace('{{tentativas}}', String(opcoes?.tentativas ?? '')) ?? chave,
  }),
}));

describe('Tela de login', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('deve renderizar campos, botao de entrar e link de esqueci minha senha', () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getAllByText('Entrar').length).toBeGreaterThan(0);
    expect(getByText('Esqueci minha senha')).toBeTruthy();
    expect(getByText('Tentativas restantes: 5')).toBeTruthy();
  });

  it('deve bloquear login quando email ou senha estiverem vazios', () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getAllByText } = render(<Entrar />);

    fireEvent.press(getAllByText('Entrar')[1]);

    expect(alertaSpy).toHaveBeenCalledWith('Erro', 'Email e Senha sao obrigatorios');
    expect(mockDefinirSessao).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('deve bloquear login quando o email estiver em formato invalido', () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'email-invalido');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');
    fireEvent.press(getAllByText('Entrar')[1]);

    expect(alertaSpy).toHaveBeenCalledWith('Erro', 'Informe um email valido');
    expect(mockDefinirSessao).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('deve solicitar email valido no esqueci minha senha', () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = render(<Entrar />);

    fireEvent.press(getByText('Esqueci minha senha'));
    expect(alertaSpy).toHaveBeenCalledWith('Erro', 'Informe o email para recuperar a senha');

    fireEvent.changeText(getByPlaceholderText('Email'), 'email-invalido');
    fireEvent.press(getByText('Esqueci minha senha'));
    expect(alertaSpy).toHaveBeenCalledWith('Erro', 'Informe um email valido');
  });

  it('deve exibir mensagem de sucesso no esqueci minha senha com email valido', () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'teste@empresa.com');
    fireEvent.press(getByText('Esqueci minha senha'));

    expect(alertaSpy).toHaveBeenCalledWith('Sucesso', 'Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.');
  });

  it('deve contabilizar tentativas invalidas e bloquear apos 5 falhas', async () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'senha-errada');

    for (let indice = 0; indice < 4; indice += 1) {
      fireEvent.press(getAllByText('Entrar')[1]);
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(alertaSpy).toHaveBeenLastCalledWith('Erro', 'Credenciais invalidas. Tentativas restantes: 1');
    expect(getByText('Tentativas restantes: 1')).toBeTruthy();

    fireEvent.press(getAllByText('Entrar')[1]);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(alertaSpy).toHaveBeenLastCalledWith('Erro', 'Login bloqueado apos 5 tentativas invalidas.');
    expect(getByText('Tentativas restantes: 0')).toBeTruthy();
  });

  it('deve resetar o bloqueio ao usar esqueci minha senha com email valido', async () => {
    const alertaSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'senha-errada');

    for (let indice = 0; indice < 5; indice += 1) {
      fireEvent.press(getAllByText('Entrar')[1]);
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    fireEvent.press(getByText('Esqueci minha senha'));

    expect(alertaSpy).toHaveBeenLastCalledWith('Sucesso', 'Se o email estiver cadastrado, as instrucoes de recuperacao serao enviadas.');
    expect(getByText('Tentativas restantes: 5')).toBeTruthy();
  });

  it('deve definir sessao e navegar para principal quando login for bem-sucedido', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(<Entrar />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@core.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), '123456');
    fireEvent.press(getAllByText('Entrar')[1]);

    expect(getByText('Carregando')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockDefinirSessao).toHaveBeenCalledWith(
        {
          id: 1,
          nome: 'Usuario Teste',
          email: 'admin@core.com',
          perfil: {
            id: 'ADMIN',
            nome: 'Administrador',
          },
          modulosAtivos: [
            {
              id: 'financeiro',
              nome: 'Financeiro',
              status: true,
              funcionalidades: [
                { id: 'despesa', nome: 'Despesas', status: true },
                { id: 'receita', nome: 'Receitas', status: true },
                { id: 'reembolso', nome: 'Reembolsos', status: true },
                { id: 'conta-bancaria', nome: 'Contas Bancarias', status: true },
                { id: 'cartao', nome: 'Cartoes', status: true },
                { id: 'documentacao', nome: 'Documentacao', status: true },
              ],
            },
            {
              id: 'amigos',
              nome: 'Amigos',
              status: true,
              funcionalidades: [
                { id: 'lista', nome: 'Lista de Amigos', status: true },
                { id: 'convite', nome: 'Convites', status: true },
                { id: 'documentacao', nome: 'Documentacao', status: true },
              ],
            },
            {
              id: 'administracao',
              nome: 'Administracao',
              status: true,
              funcionalidades: [
                { id: 'visao-geral', nome: 'Visao Geral', status: true },
                { id: 'usuarios', nome: 'Usuarios', status: true },
                { id: 'permissoes', nome: 'Permissoes', status: true },
                { id: 'documentos', nome: 'Documentos', status: true },
                { id: 'avisos', nome: 'Avisos', status: true },
                { id: 'documentacao', nome: 'Documentacao', status: true },
              ],
            },
          ],
        },
        'mock-access-token-xyz',
      );
      expect(mockReplace).toHaveBeenCalledWith('/principal');
    });
  });
});
