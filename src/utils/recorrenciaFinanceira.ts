export type RecorrenciaFinanceiraChave =
  | 'unica'
  | 'diaria'
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export type RecorrenciaFinanceiraCodigo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RecorrenciaFinanceiraBaseChave = RecorrenciaFinanceiraChave;
export type ModoRecorrenciaFinanceira = 'normal' | 'fixa';

export const LIMITE_RECORRENCIA_NORMAL = 100;

export const RECORRENCIAS_FINANCEIRAS = [
  { chave: 'unica', codigo: 1, valorApi: 'Unica' },
  { chave: 'diaria', codigo: 2, valorApi: 'Diaria' },
  { chave: 'semanal', codigo: 3, valorApi: 'Semanal' },
  { chave: 'quinzenal', codigo: 4, valorApi: 'Quinzenal' },
  { chave: 'mensal', codigo: 5, valorApi: 'Mensal' },
  { chave: 'trimestral', codigo: 6, valorApi: 'Trimestral' },
  { chave: 'semestral', codigo: 7, valorApi: 'Semestral' },
  { chave: 'anual', codigo: 8, valorApi: 'Anual' },
] as const satisfies ReadonlyArray<{
  chave: RecorrenciaFinanceiraChave;
  codigo: RecorrenciaFinanceiraCodigo;
  valorApi: string;
}>;

export const RECORRENCIAS_FINANCEIRAS_BASE = RECORRENCIAS_FINANCEIRAS;

const MAPA_CODIGO_POR_CHAVE = new Map<RecorrenciaFinanceiraChave, RecorrenciaFinanceiraCodigo>(
  RECORRENCIAS_FINANCEIRAS.map((item) => [item.chave, item.codigo]),
);

const MAPA_POR_TEXTO = new Map<string, RecorrenciaFinanceiraChave>([
  ['1', 'unica'],
  ['unica', 'unica'],
  ['única', 'unica'],
  ['single', 'unica'],
  ['2', 'diaria'],
  ['diaria', 'diaria'],
  ['diária', 'diaria'],
  ['daily', 'diaria'],
  ['3', 'semanal'],
  ['semanal', 'semanal'],
  ['weekly', 'semanal'],
  ['4', 'quinzenal'],
  ['quinzenal', 'quinzenal'],
  ['biweekly', 'quinzenal'],
  ['5', 'mensal'],
  ['mensal', 'mensal'],
  ['monthly', 'mensal'],
  ['6', 'trimestral'],
  ['trimestral', 'trimestral'],
  ['quarterly', 'trimestral'],
  ['7', 'semestral'],
  ['semestral', 'semestral'],
  ['semiannual', 'semestral'],
  ['8', 'anual'],
  ['anual', 'anual'],
  ['annual', 'anual'],
  ['yearly', 'anual'],
]);

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
  },
} as const satisfies Record<string, Record<RecorrenciaFinanceiraChave, string>>;

export function recorrenciaExigeQuantidade(recorrencia: RecorrenciaFinanceiraChave) {
  return recorrencia !== 'unica';
}

export function recorrenciaAceitaQuantidade(recorrencia: RecorrenciaFinanceiraChave) {
  return recorrencia !== 'unica';
}

export function obterValorRecorrencia(recorrencia: RecorrenciaFinanceiraChave): RecorrenciaFinanceiraCodigo {
  return MAPA_CODIGO_POR_CHAVE.get(recorrencia) ?? 1;
}

export function obterRotuloRecorrencia(recorrencia: RecorrenciaFinanceiraChave, locale: string) {
  const idioma = locale.startsWith('en') ? 'en' : locale.startsWith('es') ? 'es' : 'pt-BR';
  return ROTULOS[idioma][recorrencia];
}

export function normalizarRecorrenciaFinanceira(valor: unknown): RecorrenciaFinanceiraChave {
  const texto = String(valor ?? '').trim().toLowerCase();
  if (!texto) return 'unica';
  return MAPA_POR_TEXTO.get(texto) ?? 'unica';
}

export function normalizarRecorrenciaBaseFinanceira(
  valor: unknown,
  fallback: RecorrenciaFinanceiraBaseChave = 'unica',
): RecorrenciaFinanceiraBaseChave {
  const recorrencia = normalizarRecorrenciaFinanceira(valor);
  return recorrencia || fallback;
}

export function normalizarQuantidadeRecorrencia(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  if (numero <= 0) return null;
  return Math.trunc(numero);
}

export function quantidadeRecorrenciaNormalDentroDoLimite(valor: unknown) {
  const quantidade = normalizarQuantidadeRecorrencia(valor);
  if (!quantidade) return false;
  return quantidade <= LIMITE_RECORRENCIA_NORMAL;
}

export function aplicarModoRecorrenciaFinanceira(
  recorrenciaBase: RecorrenciaFinanceiraBaseChave,
  modo: ModoRecorrenciaFinanceira,
) {
  if (modo === 'fixa') {
    return {
      recorrenciaBase,
      recorrenciaFixa: recorrenciaBase !== 'unica',
      quantidadeRecorrencia: '',
    };
  }

  return {
    recorrenciaBase,
    recorrenciaFixa: false,
    quantidadeRecorrencia: '',
  };
}
