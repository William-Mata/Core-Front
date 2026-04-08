export interface LancamentoComSinal {
  tipoTransacao: 'despesa' | 'receita' | 'reembolso';
  tipoOperacao: 'efetivacao' | 'estorno';
  valor: number;
}

function paraCentavos(valor: number) {
  return Math.round(Math.abs(valor) * 100);
}

function lancamentoEhCredito(lancamento: LancamentoComSinal) {
  return lancamento.tipoOperacao === 'estorno' || lancamento.tipoTransacao !== 'despesa';
}

export function calcularTotalLancamentos(lancamentos: LancamentoComSinal[]) {
  const totalEmCentavos = lancamentos.reduce((acumulado, lancamento) => {
    const valorEmCentavos = paraCentavos(lancamento.valor);
    return acumulado + (lancamentoEhCredito(lancamento) ? valorEmCentavos : -valorEmCentavos);
  }, 0);

  return Math.abs(totalEmCentavos) / 100;
}
