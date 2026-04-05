import { rateioConfereValorTotal, rateioConfereValorTotalExato, somaRateioSelecionado } from '../../src/utils/rateioValidacao';

describe('utils/rateioValidacao', () => {
  it('deve somar os valores selecionados', () => {
    const total = somaRateioSelecionado(['a', 'b'], { a: 100, b: 50, c: 10 });
    expect(total).toBe(150);
  });

  it('deve retornar true quando nao houver rateio selecionado', () => {
    expect(rateioConfereValorTotal(200, [], {})).toBe(true);
  });

  it('deve retornar true quando a soma do rateio bater com o total', () => {
    expect(rateioConfereValorTotal(200, ['a', 'b'], { a: 100, b: 100 })).toBe(true);
  });

  it('deve retornar false quando a soma do rateio for diferente do total', () => {
    expect(rateioConfereValorTotal(200, ['a', 'b'], { a: 120, b: 50 })).toBe(false);
  });

  it('deve exigir igualdade exata por centavos no rateio por area/subarea', () => {
    expect(rateioConfereValorTotalExato(100.01, ['a', 'b'], { a: 50, b: 50.01 })).toBe(true);
    expect(rateioConfereValorTotalExato(100.01, ['a', 'b'], { a: 50, b: 50 })).toBe(false);
  });
});
