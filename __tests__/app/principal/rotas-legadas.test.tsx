import React from 'react';
import { render } from '@testing-library/react-native';

import RotaLegadaAmigo from '../../../app/(principal)/amigos/amigo';

let mockParametros: Record<string, string | string[]> = {};

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'redirect-href' }, href);
  },
  useLocalSearchParams: () => mockParametros,
}));

describe('Rotas legadas', () => {
  beforeEach(() => {
    mockParametros = {};
  });

  it('deve redirecionar /amigos/amigo para /amigos/convite', () => {
    const { getByTestId } = render(<RotaLegadaAmigo />);

    expect(getByTestId('redirect-href').props.children).toBe('/amigos/convite');
  });
});
