import { Alert, Platform } from 'react-native';

interface OpcoesConfirmacao {
  titulo: string;
  textoConfirmar: string;
  textoCancelar: string;
}

export const solicitarConfirmacao = (
  mensagem: string,
  opcoes: OpcoesConfirmacao,
): Promise<boolean> => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return Promise.resolve(true);
    }
    return Promise.resolve(window.confirm(mensagem));
  }

  return new Promise((resolver) => {
    Alert.alert(
      opcoes.titulo,
      mensagem,
      [
        {
          text: opcoes.textoCancelar,
          style: 'cancel',
          onPress: () => resolver(false),
        },
        {
          text: opcoes.textoConfirmar,
          style: 'destructive',
          onPress: () => resolver(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolver(false),
      },
    );
  });
};
