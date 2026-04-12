import { obterLocaleAtivo } from './formatacaoLocale';

export interface CompetenciaFinanceira {
  ano: number;
  mes: number;
}

export function serializarCompetencia(competencia: CompetenciaFinanceira): string {
  return `${String(competencia.ano)}-${String(competencia.mes).padStart(2, '0')}`;
}

export function desserializarCompetencia(competencia: string | null | undefined): CompetenciaFinanceira | null {
  if (!competencia) return null;

  const texto = String(competencia).trim();
  const [primeiraParte, segundaParte] = texto.includes('/') ? texto.split('/') : texto.split('-');
  const mes = Number(primeiraParte);
  const ano = Number(segundaParte);

  if (!Number.isInteger(mes) || !Number.isInteger(ano) || mes < 1 || mes > 12 || ano < 1) {
    return null;
  }

  return { mes, ano };
}

export function obterCompetenciaPorData(data: string | Date | null | undefined, referencia: Date = new Date()): CompetenciaFinanceira {
  if (!data) return obterCompetenciaAtual(referencia);

  const valor = data instanceof Date ? data : new Date(`${data}T12:00:00`);
  if (Number.isNaN(valor.getTime())) return obterCompetenciaAtual(referencia);

  return {
    ano: valor.getFullYear(),
    mes: valor.getMonth() + 1,
  };
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
