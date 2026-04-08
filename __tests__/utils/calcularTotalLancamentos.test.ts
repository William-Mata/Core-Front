import { calcularTotalLancamentos } from '../../src/utils/calcularTotalLancamentos';

describe('utils/calcularTotalLancamentos', () => {
  it('deve calcular o total com sinal correto para fatura/extrato', () => {
    const total = calcularTotalLancamentos([
      { tipoTransacao: 'despesa', tipoOperacao: 'efetivacao', valor: 42.23 },
      { tipoTransacao: 'despesa', tipoOperacao: 'efetivacao', valor: 42.23 },
      { tipoTransacao: 'receita', tipoOperacao: 'efetivacao', valor: 42.23 },
    ]);

    expect(total).toBe(42.23);
  });

  it('deve tratar estorno como credito', () => {
    const total = calcularTotalLancamentos([
      { tipoTransacao: 'despesa', tipoOperacao: 'efetivacao', valor: 100 },
      { tipoTransacao: 'despesa', tipoOperacao: 'estorno', valor: 30 },
    ]);

    expect(total).toBe(70);
  });
});
