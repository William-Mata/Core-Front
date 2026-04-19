export interface RegistroOrdenacaoLancamento {
  id: number;
  dataLancamento: string;
  dataEfetivacao?: string;
}

export function compararPorLancamentoEfetivacaoDecrescente(
  a: RegistroOrdenacaoLancamento,
  b: RegistroOrdenacaoLancamento,
): number {
  const comparacaoLancamento = b.dataLancamento.localeCompare(a.dataLancamento);
  if (comparacaoLancamento !== 0) return comparacaoLancamento;

  const dataEfetivacaoA = a.dataEfetivacao ?? '';
  const dataEfetivacaoB = b.dataEfetivacao ?? '';
  const comparacaoEfetivacao = dataEfetivacaoB.localeCompare(dataEfetivacaoA);
  if (comparacaoEfetivacao !== 0) return comparacaoEfetivacao;

  return b.id - a.id;
}

export function ordenarPorLancamentoEfetivacaoDecrescente<T extends RegistroOrdenacaoLancamento>(registros: T[]): T[] {
  return [...registros].sort(compararPorLancamentoEfetivacaoDecrescente);
}
