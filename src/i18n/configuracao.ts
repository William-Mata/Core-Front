import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBRComum from './traducoes/pt-BR/comum.json';
import ptBRFinanceiro from './traducoes/pt-BR/financeiro.json';
import ptBRCompras from './traducoes/pt-BR/compras.json';

import enComum from './traducoes/en/comum.json';
import enFinanceiro from './traducoes/en/financeiro.json';
import enCompras from './traducoes/en/compras.json';

import esComum from './traducoes/es/comum.json';
import esFinanceiro from './traducoes/es/financeiro.json';
import esCompras from './traducoes/es/compras.json';

const normalizarMojibake = (texto: string): string => {
  if (!texto) return texto;

  let atual = texto;
  for (let tentativa = 0; tentativa < 12; tentativa += 1) {
    if (!/[\u00C3\u00C2\u00E2\u00EF]/.test(atual)) break;
    try {
      const decodificado = decodeURIComponent(escape(atual));
      if (decodificado === atual) break;
      atual = decodificado;
    } catch {
      break;
    }
  }

  return atual;
};

const normalizarRecursivo = <T,>(valor: T): T => {
  if (typeof valor === 'string') {
    return normalizarMojibake(valor) as T;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarRecursivo(item)) as T;
  }

  if (valor && typeof valor === 'object') {
    const entries = Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
      chave,
      normalizarRecursivo(item),
    ]);
    return Object.fromEntries(entries) as T;
  }

  return valor;
};
export const LANGUAGES = ['pt-BR', 'en', 'es'] as const;

i18n.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'pt-BR': {
      comum: normalizarRecursivo(ptBRComum),
      financeiro: normalizarRecursivo(ptBRFinanceiro),
      compras: normalizarRecursivo(ptBRCompras),
    },
    en: {
      comum: normalizarRecursivo(enComum),
      financeiro: normalizarRecursivo(enFinanceiro),
      compras: normalizarRecursivo(enCompras),
    },
    es: {
      comum: normalizarRecursivo(esComum),
      financeiro: normalizarRecursivo(esFinanceiro),
      compras: normalizarRecursivo(esCompras),
    },
  },
});

export default i18n;
