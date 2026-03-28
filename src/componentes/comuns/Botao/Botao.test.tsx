import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { Botao } from './index';

describe('Botao', () => {
  it('renderiza e responde ao clique', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao label="Teste" onPress={onPress} />);

    fireEvent.press(getByText('Teste'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('bloqueia clique quando carregando', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao label="Salvando" onPress={onPress} carregando />);

    fireEvent.press(getByText('Salvando'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
