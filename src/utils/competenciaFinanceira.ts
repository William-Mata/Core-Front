import { obterLocaleAtivo } from './formatacaoLocale';

export interface CompetenciaFinanceira {
  ano: number;
  mes: number;
}

function normalizarAnoMes(ano: number, mes: number): CompetenciaFinanceira {
  const data = new Date(ano, mes - 1, 1, 12, 0, 0, 0);
  return {
    ano: data.getFullYear(),
    mes: data.getMonth() + 1,
  };
}

export function obterCompetenciaAtual(referencia: Date = new Date()): CompetenciaFinanceira {
  return {
    ano: referencia.getFullYear(),
    mes: referencia.getMonth() + 1,
  };
}

export function avancarCompetencia(competencia: CompetenciaFinanceira, deslocamentoMeses: number): CompetenciaFinanceira {
  return normalizarAnoMes(competencia.ano, competencia.mes + deslocamentoMeses);
}

export function obterIntervaloCompetencia(competencia: CompetenciaFinanceira): { dataInicio: string; dataFim: string } {
  const inicio = new Date(competencia.ano, competencia.mes - 1, 1, 12, 0, 0, 0);
  const fim = new Date(competencia.ano, competencia.mes, 0, 12, 0, 0, 0);

  const dataInicio = [
    String(inicio.getFullYear()),
    String(inicio.getMonth() + 1).padStart(2, '0'),
    String(inicio.getDate()).padStart(2, '0'),
  ].join('-');

  const dataFim = [
    String(fim.getFullYear()),
    String(fim.getMonth() + 1).padStart(2, '0'),
    String(fim.getDate()).padStart(2, '0'),
  ].join('-');

  return { dataInicio, dataFim };
}

export function formatarCompetencia(competencia: CompetenciaFinanceira, locale: string = obterLocaleAtivo()): string {
  const data = new Date(competencia.ano, competencia.mes - 1, 1, 12, 0, 0, 0);
  const mes = data
    .toLocaleDateString(locale, { month: 'short' })
    .trim()
    .replace(/\.$/, '');
  const mesCapitalizado = mes ? mes[0].toUpperCase() + mes.slice(1) : '';
  return `${mesCapitalizado}/${competencia.ano}`;
}