const STATUS_FATURA_PERMITE_ALTERACAO = new Set(['aberta', 'fechada', 'vencida', 'estornada']);
const STATUS_FATURA_CARTAO = new Set(['aberta', 'fechada', 'vencida', 'estornada', 'efetivada']);

export function normalizarStatusFaturaParaAcao(status: unknown): string {
  return String(status ?? '').trim().toLowerCase();
}

export function statusFaturaPermiteAlteracao(status: unknown): boolean {
  return STATUS_FATURA_PERMITE_ALTERACAO.has(normalizarStatusFaturaParaAcao(status));
}

export function ehTransacaoVinculadaAFatura(faturaCartaoId?: number, transacaoId?: number): boolean {
  return Boolean(faturaCartaoId && faturaCartaoId > 0 && transacaoId && transacaoId > 0);
}

export function podeAlterarTransacaoVinculadaAFatura(
  faturaCartaoId: number | undefined,
  transacaoId: number | undefined,
  statusFatura: unknown,
): boolean {
  if (!ehTransacaoVinculadaAFatura(faturaCartaoId, transacaoId)) {
    return true;
  }
  return statusFaturaPermiteAlteracao(statusFatura);
}

export function resolverStatusOperacionalTransacaoFatura(
  transacao: Record<string, unknown>,
  statusFatura: unknown,
): string | undefined {
  const statusFaturaNormalizado = normalizarStatusFaturaParaAcao(statusFatura);
  const statusDireto = normalizarStatusFaturaParaAcao(
    transacao.statusTransacao
    ?? transacao.transacaoStatus
    ?? transacao.statusLancamento
    ?? transacao.situacaoLancamento
    ?? transacao.statusItem
    ?? transacao.statusDespesa
    ?? transacao.statusReceita
    ?? transacao.statusReembolso
    ?? transacao.situacao
    ?? transacao.estado
    ?? transacao.status,
  );

  if (statusDireto && (!STATUS_FATURA_CARTAO.has(statusDireto) || statusDireto !== statusFaturaNormalizado)) {
    return statusDireto;
  }

  if (transacao.dataEstorno) return 'estornada';
  if (transacao.dataEfetivacao) return 'efetivada';
  return statusDireto || undefined;
}

export function statusTransacaoEfetivada(status: unknown): boolean {
  const statusNormalizado = normalizarStatusFaturaParaAcao(status);
  return statusNormalizado.includes('efetiv');
}

export function todasTransacoesFaturaEfetivadas(
  transacoes: Array<{ status?: unknown }>,
): boolean {
  return transacoes.every((transacao) => statusTransacaoEfetivada(transacao.status));
}
