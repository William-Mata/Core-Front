export type RecorrenciaFinanceiraChave =
  | 'unica'
  | 'diaria'
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'fixa';

export const RECORRENCIAS_FINANCEIRAS = [
  { chave: 'unica', valor: 1 },
  { chave: 'diaria', valor: 2 },
  { chave: 'semanal', valor: 3 },
  { chave: 'quinzenal', valor: 4 },
  { chave: 'mensal', valor: 5 },
  { chave: 'trimestral', valor: 6 },
  { chave: 'semestral', valor: 7 },
  { chave: 'anual', valor: 8 },
  { chave: 'fixa', valor: 9 },
] as const satisfies ReadonlyArray<{ chave: RecorrenciaFinanceiraChave; valor: number }>;

const MAPA_POR_CHAVE = new Map<RecorrenciaFinanceiraChave, number>(
  RECORRENCIAS_FINANCEIRAS.map((item) => [item.chave, item.valor]),
);
const MAPA_POR_VALOR = new Map<number, RecorrenciaFinanceiraChave>(
  RECORRENCIAS_FINANCEIRAS.map((item) => [item.valor, item.chave]),
);

const ROTULOS = {
  'pt-BR': {
    unica: 'Unica',
    diaria: 'Diaria',
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
    fixa: 'Fixa',
  },
  en: {
    unica: 'Single',
    diaria: 'Daily',
    semanal: 'Weekly',
    quinzenal: 'Biweekly',
    mensal: 'Monthly',
    trimestral: 'Quarterly',
    semestral: 'Semiannual',
    anual: 'Yearly',
    fixa: 'Fixed',
  },
  es: {
    unica: 'Unica',
    diaria: 'Diaria',
    semanal: 'Semanal',
    quinzenal: 'Quincenal',
    mensal: 'Mensual',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
    fixa: 'Fija',
  },
} as const satisfies Record<string, Record<RecorrenciaFinanceiraChave, string>>;

export function recorrenciaExigeQuantidade(recorrencia: RecorrenciaFinanceiraChave) {
  return recorrencia !== 'unica' && recorrencia !== 'fixa';
}

export function recorrenciaAceitaQuantidade(recorrencia: RecorrenciaFinanceiraChave) {
  return recorrencia !== 'fixa';
}

export function obterValorRecorrencia(recorrencia: RecorrenciaFinanceiraChave) {
  return MAPA_POR_CHAVE.get(recorrencia) ?? 1;
}

export function obterRotuloRecorrencia(recorrencia: RecorrenciaFinanceiraChave, locale: string) {
  const idioma = locale.startsWith('en') ? 'en' : locale.startsWith('es') ? 'es' : 'pt-BR';
  return ROTULOS[idioma][recorrencia];
}

export function normalizarRecorrenciaFinanceira(valor: unknown): RecorrenciaFinanceiraChave {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return MAPA_POR_VALOR.get(valor) ?? 'unica';
  }

  const texto = String(valor ?? '').trim().toLowerCase();
  if (!texto) return 'unica';

  const numero = Number(texto);
  if (Number.isFinite(numero)) {
    return MAPA_POR_VALOR.get(numero) ?? 'unica';
  }

  return (RECORRENCIAS_FINANCEIRAS.find((item) => item.chave === texto)?.chave ?? 'unica') as RecorrenciaFinanceiraChave;
}

export function normalizarQuantidadeRecorrencia(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  if (numero <= 0) return null;
  return Math.trunc(numero);
}
