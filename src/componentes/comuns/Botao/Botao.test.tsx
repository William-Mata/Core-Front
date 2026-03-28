import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { Botao } from './index';

describe('Botao', () => {
  it('renderiza e responde ao clique', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Botao label="Teste" onPress={onPress} />);

    const botao = getByText('Teste');
    fireEvent.press(botao);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
