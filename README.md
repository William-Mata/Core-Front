# Financeiro Frontend 3

Aplicacao frontend multiplataforma (Web, Android e iOS) para gestao pessoal/financeira, com autenticacao, dashboard e modulos por permissao.

## Stack
- React Native + React Native Web
- Expo 54
- Expo Router
- TypeScript
- React Query
- i18n (PT-BR, EN, ES)
- Jest + Testing Library

## Requisitos
- Node.js 18+
- npm 9+

## Configuracao
1. Instale dependencias:
```bash
npm install
```

2. Crie o `.env` a partir do exemplo:
```bash
cp .env.example .env
```

3. Ajuste a URL da API no `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

## Executando
- Web:
```bash
npm run web
```

- Android:
```bash
npm run android
```

- iOS:
```bash
npm run ios
```

- Menu do Expo:
```bash
npm start
```

## Testes
- Rodar testes:
```bash
npm test
```

- Rodar cobertura:
```bash
npm test -- --watchAll=false --coverage
```

## Estrutura do projeto
```text
app/
  auth/
  principal/
    admin/
    amigos/
    financeiro/
src/
  componentes/
  hooks/
  i18n/
  servicos/
  store/
  estilos/
  tipos/
__tests__/
documentacao do sistema/
documentacao tecnica/
```

## Documentacao
- Usuario final: pasta `documentacao do sistema/`
- Tecnica (integracao e regras de frontend): pasta `documentacao tecnica/`

## Integracao com API
- Autenticacao com `accessToken` e `refreshToken`
- Tratamento de erro no padrao RFC 7807
- Endpoints principais:
  - `/api/autenticacao/*`
  - `/api/usuarios/*`
  - `/api/financeiro/*`
  - `/api/admin/*`

## Observacoes
- O sistema possui controles por modulo, tela e funcionalidade vindos da API do usuario autenticado.
- Para ambiente local, mantenha backend e frontend com CORS e URL alinhados no `.env`.
