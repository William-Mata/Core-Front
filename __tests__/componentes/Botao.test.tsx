import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Botao } from '../../src/componentes/comuns/Botao';

describe('Componente Botao', () => {
  it('deve renderizar o botao com titulo', () => {
    const { getByText } = render(<Botao titulo="Clique aqui" onPress={() => {}} />);
    expect(getByText('Clique aqui')).toBeTruthy();
  });

  it('deve chamar onPress quando clicado', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao titulo="Salvar" onPress={onPress} />);

    fireEvent.press(getByText('Salvar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deve respeitar estado disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao titulo="Desabilitado" onPress={onPress} disabled />);

    fireEvent.press(getByText('Desabilitado'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('deve desabilitar clique quando estiver carregando', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao titulo="Processando" onPress={onPress} carregando />);

    fireEvent.press(getByText('Processando'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
