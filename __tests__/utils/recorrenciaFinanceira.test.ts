import {
  normalizarQuantidadeRecorrencia,
  normalizarRecorrenciaFinanceira,
  obterRotuloRecorrencia,
  obterValorRecorrencia,
  recorrenciaAceitaQuantidade,
  recorrenciaExigeQuantidade,
} from '../../src/utils/recorrenciaFinanceira';

describe('utils/recorrenciaFinanceira', () => {
  it('deve normalizar recorrencia numerica e textual', () => {
    expect(normalizarRecorrenciaFinanceira(5)).toBe('mensal');
    expect(normalizarRecorrenciaFinanceira('9')).toBe('fixa');
    expect(normalizarRecorrenciaFinanceira('semanal')).toBe('semanal');
    expect(normalizarRecorrenciaFinanceira('invalida')).toBe('unica');
  });

  it('deve aplicar as regras de quantidade por recorrencia', () => {
    expect(recorrenciaExigeQuantidade('unica')).toBe(false);
    expect(recorrenciaExigeQuantidade('mensal')).toBe(true);
    expect(recorrenciaAceitaQuantidade('fixa')).toBe(false);
    expect(recorrenciaAceitaQuantidade('anual')).toBe(true);
  });

  it('deve normalizar quantidade valida e rejeitar quantidade invalida', () => {
    expect(normalizarQuantidadeRecorrencia('3')).toBe(3);
    expect(normalizarQuantidadeRecorrencia('0')).toBeNull();
    expect(normalizarQuantidadeRecorrencia(null)).toBeNull();
  });

  it('deve mapear valor e rotulo da recorrencia', () => {
    expect(obterValorRecorrencia('fixa')).toBe(9);
    expect(obterRotuloRecorrencia('mensal', 'pt-BR')).toBe('Mensal');
    expect(obterRotuloRecorrencia('mensal', 'en-US')).toBe('Monthly');
    expect(obterRotuloRecorrencia('fixa', 'es-ES')).toBe('Fija');
  });
});
