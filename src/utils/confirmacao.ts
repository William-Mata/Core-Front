import { Alert, Platform } from 'react-native';

export interface OpcoesConfirmacao {
  titulo: string;
  textoConfirmar: string;
  textoCancelar: string;
  mensagemImpacto?: string;
  tipoConfirmar?: 'primario' | 'perigo';
}

type SolicitadorConfirmacao = (
  mensagem: string,
  opcoes: OpcoesConfirmacao,
) => Promise<boolean>;

let solicitarConfirmacaoAtual: SolicitadorConfirmacao | null = null;

export const registrarSolicitadorConfirmacao = (
  solicitador: SolicitadorConfirmacao | null,
) => {
  solicitarConfirmacaoAtual = solicitador;
};

export const solicitarConfirmacao = (
  mensagem: string,
  opcoes: OpcoesConfirmacao,
): Promise<boolean> => {
  if (solicitarConfirmacaoAtual) {
    return solicitarConfirmacaoAtual(mensagem, opcoes);
  }

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
