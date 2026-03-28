import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBRComum from './traducoes/pt-BR/comum.json';
import ptBRFinanceiro from './traducoes/pt-BR/financeiro.json';

import enComum from './traducoes/en/comum.json';
import enFinanceiro from './traducoes/en/financeiro.json';

import esComum from './traducoes/es/comum.json';
import esFinanceiro from './traducoes/es/financeiro.json';

export const LANGUAGES = ['pt-BR', 'en', 'es'] as const;

i18n.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'pt-BR': {
      comum: ptBRComum,
      financeiro: ptBRFinanceiro,
    },
    en: {
      comum: enComum,
      financeiro: enFinanceiro,
    },
    es: {
      comum: esComum,
      financeiro: esFinanceiro,
    },
  },
});

export default i18n;
