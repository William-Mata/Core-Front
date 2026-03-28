import { dataIsoMaiorQue } from '../../src/utils/validacaoDataFinanceira';

describe('validacaoDataFinanceira', () => {
  it('retorna true quando a data comparada e maior que a referencia', () => {
    expect(dataIsoMaiorQue('2026-03-30', '2026-03-28')).toBe(true);
  });

  it('retorna false quando a data comparada e igual a referencia', () => {
    expect(dataIsoMaiorQue('2026-03-28', '2026-03-28')).toBe(false);
  });

  it('retorna false quando a data comparada e menor que a referencia', () => {
    expect(dataIsoMaiorQue('2026-03-20', '2026-03-28')).toBe(false);
  });

  it('retorna false quando qualquer data esta vazia', () => {
    expect(dataIsoMaiorQue('', '2026-03-28')).toBe(false);
    expect(dataIsoMaiorQue('2026-03-28', '')).toBe(false);
  });
});
