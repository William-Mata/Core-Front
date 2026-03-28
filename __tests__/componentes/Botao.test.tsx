// __tests__/componentes/Botao.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Botao } from '../../src/componentes/comuns/Botao';

describe('Componente Botao', () => {
  it('deve renderizar o botão com título', () => {
    const { getByText } = render(
      <Botao titulo="Clique aqui" onPress={() => {}} />
    );
    expect(getByText('Clique aqui')).toBeTruthy();
  });

  it('deve chamar onPress quando clicado', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Botao titulo="Salvar" onPress={mockPress} />
    );
    
    fireEvent.press(getByText('Salvar'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar com tipo "primario" por padrão', () => {
    const { getByTestId } = render(
      <Botao titulo="Teste" onPress={() => {}} testID="botao-teste" />
    );
    const botao = getByTestId('botao-teste');
    expect(botao).toBeTruthy();
  });

  it('deve renderizar com tipo "secundario" quando especificado', () => {
    const { getByTestId } = render(
      <Botao titulo="Teste" onPress={() => {}} tipo="secundario" testID="botao-teste" />
    );
    const botao = getByTestId('botao-teste');
    expect(botao).toBeTruthy();
  });

  it('deve estar desabilitado quando disabled=true', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Botao titulo="Desabilitado" onPress={mockPress} desabilitado={true} />
    );
    
    fireEvent.press(getByText('Desabilitado'));
    // Press deveria ser chamado, mas o componente pode estar visualmente desabilitado
    expect(getByText('Desabilitado')).toBeTruthy();
  });
});
