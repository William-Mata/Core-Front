import { usarNotificacaoStore, type TipoToast } from '../store/usarNotificacaoStore';

function notificar(tipo: TipoToast, mensagem: string, duracao = 4000) {
  usarNotificacaoStore.getState().adicionarToast({ tipo, mensagem, duracao });
}

export function notificarErro(mensagem: string, duracao?: number) {
  notificar('erro', mensagem, duracao);
}

export function notificarSucesso(mensagem: string, duracao?: number) {
  notificar('sucesso', mensagem, duracao);
}

export function notificarInfo(mensagem: string, duracao?: number) {
  notificar('info', mensagem, duracao);
}

