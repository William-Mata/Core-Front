export function somaRateioSelecionado(chavesSelecionadas: string[], valores: Record<string, number>) {
  return chavesSelecionadas.reduce((acumulado, chave) => acumulado + Number(valores[chave] ?? 0), 0);
}

function converterParaCentavos(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100);
}

export function rateioConfereValorTotal(
  valorTotal: number,
  chavesSelecionadas: string[],
  valores: Record<string, number>,
  tolerancia = 0.01,
) {
  if (chavesSelecionadas.length === 0) return true;
  const soma = somaRateioSelecionado(chavesSelecionadas, valores);
  return Math.abs(soma - valorTotal) <= tolerancia;
}

export function rateioNaoUltrapassaValorTotal(
  valorTotal: number,
  chavesSelecionadas: string[],
  valores: Record<string, number>,
  tolerancia = 0.01,
) {
  if (chavesSelecionadas.length === 0) return true;
  const soma = somaRateioSelecionado(chavesSelecionadas, valores);
  return soma <= valorTotal + tolerancia;
}

export function rateioConfereValorTotalExato(
  valorTotal: number,
  chavesSelecionadas: string[],
  valores: Record<string, number>,
) {
  if (chavesSelecionadas.length === 0) return true;
  const soma = somaRateioSelecionado(chavesSelecionadas, valores);
  return converterParaCentavos(soma) === converterParaCentavos(valorTotal);
}
