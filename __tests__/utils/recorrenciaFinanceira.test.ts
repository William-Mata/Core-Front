import {
  LIMITE_RECORRENCIA_NORMAL,
  normalizarQuantidadeRecorrencia,
  normalizarRecorrenciaBaseFinanceira,
  quantidadeRecorrenciaNormalDentroDoLimite,
  normalizarRecorrenciaFinanceira,
  obterRotuloRecorrencia,
  obterValorRecorrencia,
  recorrenciaAceitaQuantidade,
  recorrenciaExigeQuantidade,
  aplicarModoRecorrenciaFinanceira,
} from '../../src/utils/recorrenciaFinanceira';

describe('utils/recorrenciaFinanceira', () => {
  it('deve normalizar recorrencia textual da API e do front', () => {
    expect(normalizarRecorrenciaFinanceira('Mensal')).toBe('mensal');
    expect(normalizarRecorrenciaFinanceira('Semanal')).toBe('semanal');
    expect(normalizarRecorrenciaFinanceira('monthly')).toBe('mensal');
    expect(normalizarRecorrenciaFinanceira(5)).toBe('mensal');
    expect(normalizarRecorrenciaFinanceira('8')).toBe('anual');
    expect(normalizarRecorrenciaFinanceira('invalida')).toBe('unica');
  });

  it('deve normalizar recorrencia base mantendo apenas frequencias validas', () => {
    expect(normalizarRecorrenciaBaseFinanceira('Quinzenal')).toBe('quinzenal');
    expect(normalizarRecorrenciaBaseFinanceira('Semestral')).toBe('semestral');
  });

  it('deve aplicar as regras de quantidade por recorrencia', () => {
    expect(recorrenciaExigeQuantidade('unica')).toBe(false);
    expect(recorrenciaExigeQuantidade('mensal')).toBe(true);
    expect(recorrenciaAceitaQuantidade('unica')).toBe(false);
    expect(recorrenciaAceitaQuantidade('anual')).toBe(true);
  });

  it('deve normalizar quantidade valida e rejeitar quantidade invalida', () => {
    expect(normalizarQuantidadeRecorrencia('3')).toBe(3);
    expect(normalizarQuantidadeRecorrencia('0')).toBeNull();
    expect(normalizarQuantidadeRecorrencia(null)).toBeNull();
  });

  it('deve limitar a recorrencia normal a 100 ocorrencias', () => {
    expect(quantidadeRecorrenciaNormalDentroDoLimite(LIMITE_RECORRENCIA_NORMAL)).toBe(true);
    expect(quantidadeRecorrenciaNormalDentroDoLimite(LIMITE_RECORRENCIA_NORMAL + 1)).toBe(false);
  });


  it('nao deve permitir recorrencia fixa quando a base for unica', () => {
    expect(aplicarModoRecorrenciaFinanceira('unica', 'fixa')).toEqual({
      recorrenciaBase: 'unica',
      recorrenciaFixa: false,
      quantidadeRecorrencia: '',
    });

    expect(aplicarModoRecorrenciaFinanceira('mensal', 'fixa')).toEqual({
      recorrenciaBase: 'mensal',
      recorrenciaFixa: true,
      quantidadeRecorrencia: '',
    });
  });
  it('deve mapear valor e rotulo da recorrencia', () => {
    expect(obterValorRecorrencia('mensal')).toBe(5);
    expect(obterRotuloRecorrencia('mensal', 'pt-BR')).toBe('Mensal');
    expect(obterRotuloRecorrencia('mensal', 'en-US')).toBe('Monthly');
    expect(obterRotuloRecorrencia('anual', 'es-ES')).toBe('Anual');
  });
});
