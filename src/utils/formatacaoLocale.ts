import i18n from '../i18n/configuracao';

export function obterLocaleAtivo(): string {
  const idioma = i18n.resolvedLanguage || i18n.language || 'pt-BR';
  if (idioma.startsWith('en')) return 'en-US';
  if (idioma.startsWith('es')) return 'es-ES';
  return 'pt-BR';
}

export function formatarValorPorIdioma(valor: number, moeda: string = 'BRL'): string {
  return new Intl.NumberFormat(obterLocaleAtivo(), {
    style: 'currency',
    currency: moeda,
  }).format(valor);
}

export function formatarDataPorIdioma(data: string | Date): string {
  if (!data) return '';

  let dataFinal: Date;
  if (typeof data === 'string') {
    const valor = data.trim();
    if (!valor) return '';

    const matchIsoCurto = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (matchIsoCurto) {
      const ano = Number(matchIsoCurto[1]);
      const mes = Number(matchIsoCurto[2]) - 1;
      const dia = Number(matchIsoCurto[3]);
      dataFinal = new Date(ano, mes, dia, 12, 0, 0, 0);
    } else {
      dataFinal = new Date(valor);
    }
  } else {
    dataFinal = data;
  }

  if (Number.isNaN(dataFinal.getTime())) return '';
  return new Intl.DateTimeFormat(obterLocaleAtivo()).format(dataFinal);
}

export function converterDateParaIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function converterIsoParaDate(dataIso?: string): Date {
  if (!dataIso) return new Date();

  const [ano, mes, dia] = dataIso.split('-').map(Number);
  if (!ano || !mes || !dia) return new Date();

  return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
}

export function formatarMesPorIdioma(data: Date): string {
  return data
    .toLocaleDateString(obterLocaleAtivo(), { month: 'short' })
    .replace('.', '');
}
