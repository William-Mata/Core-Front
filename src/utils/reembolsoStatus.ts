export type StatusReembolso = 'pendente' | 'efetivada' | 'cancelada';

export function parseStatusReembolso(valor: unknown): StatusReembolso {
  const texto = String(valor ?? '').trim().toLowerCase();
  if (texto.includes('cancel')) return 'cancelada';
  if (['efetivada', 'efetivado', 'aprovado', 'approved', 'pago', 'paid', 'pago_parcial'].includes(texto)) {
    return 'efetivada';
  }
  return 'pendente';
}

export function serializarStatusReembolso(status: StatusReembolso): 'PENDENTE' | 'EFETIVADA' | 'CANCELADA' {
  if (status === 'efetivada') return 'EFETIVADA';
  if (status === 'cancelada') return 'CANCELADA';
  return 'PENDENTE';
}

export function podeEditarReembolso(status: StatusReembolso): boolean {
  return status === 'pendente';
}

export function podeEfetivarReembolso(status: StatusReembolso): boolean {
  return status === 'pendente';
}

export function podeEstornarReembolso(status: StatusReembolso): boolean {
  return status === 'efetivada';
}
