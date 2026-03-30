import { ehPagamentoParcelado } from '../../src/utils/pagamentoParcelado';

describe('utils/pagamentoParcelado', () => {
  it('deve identificar pagamentos parcelados por cartao', () => {
    expect(ehPagamentoParcelado('cartaoCredito')).toBe(true);
    expect(ehPagamentoParcelado('cartaoDebito')).toBe(true);
    expect(ehPagamentoParcelado('pix')).toBe(false);
    expect(ehPagamentoParcelado('dinheiro')).toBe(false);
  });
});
