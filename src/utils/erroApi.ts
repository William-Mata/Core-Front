export interface ProblemDetailsRfc7807 {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

const CHAVE_ERRO_NOTIFICADO = '__erro_api_notificado__';

function paraTexto(valor: unknown): string {
  return String(valor ?? '').trim();
}

export function erroApiJaNotificado(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  return Boolean((erro as Record<string, unknown>)[CHAVE_ERRO_NOTIFICADO]);
}

export function marcarErroApiComoNotificado(erro: unknown): void {
  if (!erro || typeof erro !== 'object') return;
  (erro as Record<string, unknown>)[CHAVE_ERRO_NOTIFICADO] = true;
}

export function extrairMensagemErroApi(erro: unknown, fallback = 'Falha na requisicao.'): string {
  const erroTipado = erro as {
    response?: { data?: unknown };
    message?: string;
  };

  const data = erroTipado?.response?.data;
  if (data && typeof data === 'object') {
    const payload = data as ProblemDetailsRfc7807;
    const rfcTitle = paraTexto(payload.title);
    const rfcDetail = paraTexto(payload.detail);
    const rfcErrors =
      payload.errors && typeof payload.errors === 'object'
        ? Object.values(payload.errors)
            .flatMap((valor) => (Array.isArray(valor) ? valor : [valor]))
            .map((valor) => paraTexto(valor))
            .filter(Boolean)
        : [];

    if (rfcTitle && rfcDetail && rfcErrors.length > 0) {
      return `${rfcTitle}: ${rfcDetail} ${rfcErrors.join(' ')}`;
    }
    if (rfcTitle && rfcDetail) return `${rfcTitle}: ${rfcDetail}`;
    if (rfcDetail && rfcErrors.length > 0) return `${rfcDetail} ${rfcErrors.join(' ')}`;
    if (rfcDetail) return rfcDetail;
    if (rfcTitle && rfcErrors.length > 0) return `${rfcTitle}: ${rfcErrors.join(' ')}`;
    if (rfcTitle) return rfcTitle;
    if (rfcErrors.length > 0) return rfcErrors.join(' ');
  }

  const mensagemErro = paraTexto(erroTipado?.message);
  if (mensagemErro) return mensagemErro;

  return fallback;
}
