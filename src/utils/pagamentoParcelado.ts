export function ehPagamentoParcelado(tipoPagamento: string) {
  return tipoPagamento === 'cartaoCredito' || tipoPagamento === 'cartaoDebito';
}
