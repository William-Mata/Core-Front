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

export function formatarDataHoraPorIdioma(data: string | Date): string {
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
      dataFinal = new Date(ano, mes, dia, 0, 0, 0, 0);
    } else {
      dataFinal = new Date(valor);
    }
  } else {
    dataFinal = data;
  }

  if (Number.isNaN(dataFinal.getTime())) return '';

  return new Intl.DateTimeFormat(obterLocaleAtivo(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dataFinal);
}

export function converterDateParaIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function converterDateParaIsoComHora(data: Date): string {
  const dataIso = converterDateParaIso(data);
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${dataIso}T${hora}:${minuto}`;
}

export function obterDataHoraAtualIso(): string {
  return converterDateParaIsoComHora(new Date());
}

export function normalizarIsoDataHora(
  valor: string | Date | null | undefined,
  horaPadrao: string = '00:00',
): string {
  const fallback = `${converterDateParaIso(new Date())}T${horaPadrao}`;
  if (!valor) {
    return fallback;
  }

  if (valor instanceof Date) {
    return converterDateParaIsoComHora(valor);
  }

  const texto = String(valor).trim();
  if (!texto) return fallback;

  const [parteDataBruta, parteTempoBruta = ''] = texto.split('T');
  const matchData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parteDataBruta);
  const dataIso = matchData ? parteDataBruta : converterDateParaIso(new Date(texto));
  if (!dataIso || Number.isNaN(new Date(`${dataIso}T00:00:00`).getTime())) {
    return fallback;
  }

  const matchTempo = /^(\d{2}):(\d{2})/.exec(parteTempoBruta);
  if (matchTempo) {
    return `${dataIso}T${matchTempo[1]}:${matchTempo[2]}`;
  }

  return `${dataIso}T${horaPadrao}`;
}

export function converterIsoParaDate(dataIso?: string): Date {
  if (!dataIso) return new Date();

  const texto = String(dataIso).trim();
  if (!texto) return new Date();

  const matchIsoCurto = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (matchIsoCurto) {
    const ano = Number(matchIsoCurto[1]);
    const mes = Number(matchIsoCurto[2]) - 1;
    const dia = Number(matchIsoCurto[3]);
    return new Date(ano, mes, dia, 12, 0, 0, 0);
  }

  const dataParseada = new Date(texto);
  if (!Number.isNaN(dataParseada.getTime())) return dataParseada;

  return new Date();
}

export function formatarMesPorIdioma(data: Date): string {
  return data
    .toLocaleDateString(obterLocaleAtivo(), { month: 'short' })
    .replace('.', '');
}
