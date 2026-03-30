import {
  avancarCompetencia,
  formatarCompetencia,
  obterCompetenciaAtual,
  obterIntervaloCompetencia,
} from '../../src/utils/competenciaFinanceira';

describe('utils/competenciaFinanceira', () => {
  it('deve obter a competencia atual com base em uma data de referencia', () => {
    const competencia = obterCompetenciaAtual(new Date(2026, 2, 29, 12, 0, 0, 0));

    expect(competencia).toEqual({ ano: 2026, mes: 3 });
  });

  it('deve avancar e retroceder competencia atravessando anos', () => {
    expect(avancarCompetencia({ ano: 2026, mes: 1 }, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(avancarCompetencia({ ano: 2026, mes: 12 }, 1)).toEqual({ ano: 2027, mes: 1 });
  });

  it('deve montar intervalo correto para fevereiro em ano bissexto', () => {
    const intervalo = obterIntervaloCompetencia({ ano: 2024, mes: 2 });

    expect(intervalo).toEqual({ dataInicio: '2024-02-01', dataFim: '2024-02-29' });
  });

  it('deve formatar o rotulo da competencia conforme locale', () => {
    const competencia = { ano: 2026, mes: 12 };

    expect(formatarCompetencia(competencia, 'pt-BR')).toBe('Dez/2026');
    expect(formatarCompetencia(competencia, 'en-US')).toBe('Dec/2026');
    expect(formatarCompetencia(competencia, 'es-ES')).toBe('Dic/2026');
  });
});