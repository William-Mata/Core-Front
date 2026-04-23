# Core

> Aplicação multiplataforma de gestão pessoal e financeira para Web, Android e iOS.

Construída com React Native + Expo, com autenticação JWT, módulos financeiros e controle de permissões por módulo, tela e funcionalidade.

---

## Índice

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Módulos e telas](#módulos-e-telas)
- [Integração com API](#integração-com-api)
- [Internacionalização](#internacionalização)
- [Documentação](#documentação)
- [Boas práticas](#boas-práticas)

---

## Stack

| Camada            | Tecnologia                          | Versão        |
|-------------------|-------------------------------------|---------------|
| Framework         | React Native + React Native Web     | 0.81.0        |
| Runtime           | React                               | 19.1.0        |
| Plataforma        | Expo                                | ~54.0.0       |
| Roteamento        | Expo Router                         | ~6.0.23       |
| Linguagem         | TypeScript (strict)                 | ~5.9.2        |
| Estado global     | Zustand                             | ^5.0.11       |
| Requisições       | Axios + TanStack Query              | ^1.13 / ^5.90 |
| Formulários       | React Hook Form + Zod               | ^7.71 / ^4.3  |
| Gráficos          | React Native Gifted Charts          | ^1.4.76       |
| Datas             | date-fns                            | ^4.1.0        |
| Armazenamento     | Expo SecureStore                    | ~15.0.8       |
| Upload de arquivo | Expo Document Picker                | ~14.0.8       |
| i18n              | i18next + react-i18next             | ^25.8 / ^16.5 |
| Mocking           | MSW (Mock Service Worker)           | ^2.12.10      |
| Testes            | Jest + React Native Testing Library | ^29.7 / ^13.3 |

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [npm 9+](https://www.npmjs.com/)
- Para Android: Android Studio com emulador ou dispositivo físico
- Para iOS: Xcode com simulador (apenas macOS)
- Backend [Core API](https://github.com/William-Mata/Core) rodando localmente

---

## Instalação

```bash
git clone https://github.com/William-Mata/Core-Front.git
cd Core-Front
npm install
```

---

## Configuração

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Variáveis disponíveis:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_NAME=Core
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_POLLING_NOTIFICACOES_MS=60000
EXPO_PUBLIC_STALE_TIME_CACHE_MS=300000
EXPO_PUBLIC_TIMEOUT_REQUISICAO_MS=300000
```

> ⚠️ Nunca versione o arquivo `.env` nem inclua tokens, senhas ou URLs de produção no repositório.

---

## Executando

```bash
# Menu interativo do Expo
npm start

# Web
npm run web

# Android
npm run android

# iOS
npm run ios
```

---

## Testes

```bash
# Modo watch (padrão)
npm test

# Com cobertura
npm test -- --watchAll=false --coverage

# Escopo específico
npm test -- --watchAll=false --testPathPattern=<modulo>

# Escopo módulo Compras
npm test -- --watchAll=false --testPathPattern=compras
```

---

## Estrutura do projeto

```
Core-Front/
├── app/                              # Rotas — Expo Router (file-based routing)
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── auth/                         # Autenticação
│   └── principal/                    # Área autenticada
│       ├── _layout.tsx
│       ├── index.tsx                 # Dashboard
│       ├── usuario.tsx
│       ├── documentacao.tsx
│       ├── financeiro/
│       ├── compras/
│       ├── amigos/
│       └── administracao/
├── src/
│   ├── componentes/
│   │   ├── comuns/                   # Botao, CampoTexto, Modal, Sininho, etc.
│   │   └── layout/                   # Cabecalho, MenuLateral
│   ├── constantes/                   # Temas e tokens de design
│   ├── hooks/                        # Hooks compartilhados
│   ├── i18n/                         # Configuração e traduções
│   ├── mocks/                        # MSW handlers por módulo
│   ├── servicos/                     # Axios e serviços por módulo
│   ├── store/                        # Stores Zustand
│   ├── styles/                       # Variáveis de estilo
│   ├── tipos/                        # Tipos TypeScript por módulo
│   └── utils/                        # Utilitários por domínio
├── __tests__/                        # Testes organizados por camada
├── android/                          # Build nativo Android
├── assets/                           # Ícones e splash screen
├── docs/                             # Manuais técnico e de usuário
├── documentação do sistema/          # Documentação por tela — usuário final
├── documentação tecnica/             # Documentação por tela — integração
├── skills/                           # Skills de desenvolvimento para IA
├── .env.example
├── index.tsx                         # Entry point (expo-router/entry)
├── app.json
├── babel.config.js
├── jest.config.js
└── tsconfig.json
```

---

## Módulos e telas

### Autenticação
- Entrar (login)
- Primeiro acesso

### Financeiro
- Dashboard financeiro
- Despesa
- Receita
- Reembolso
- Cartão de crédito
- Conta bancária

### Compras
- Listas de compras
- Detalhe da lista (itens, filtros, ordenação e ações em lote)
- Lista de desejos
- Histórico de itens
- Documentação do módulo

### Amigos
- Lista de amigos
- Detalhe do amigo

### Administração
- Painel administrativo
- Usuário
- Avisos (lista e detalhe)
- Documentos (lista e detalhe)
- Simulação de usuário

### Perfil
- Dados do usuário autenticado

---

## Integração com API

Consome a [Core API](https://github.com/William-Mata/Core) via Axios com:

- **JWT** — `accessToken` + `refreshToken`
- **Refresh automático** — interceptor renova o token ao receber `401`
- **Armazenamento seguro** — tokens via `expo-secure-store`
- **Mocking** — MSW disponível para simular endpoints sem backend, com handlers para autenticação, financeiro, compras, amigos e administração
- **Compras** — endpoints para listas, itens, ações em lote, desejos, histórico e sugestões de itens
- **Tempo real** — SignalR para sincronização de listas compartilhadas (com fallback por reconsulta)

---

## Internacionalização

Três idiomas com arquivos sincronizados obrigatoriamente:

| Idioma               | Código  |
|----------------------|---------|
| Português Brasileiro | `pt-BR` (padrão) |
| Inglês               | `en`    |
| Espanhol             | `es`    |

Arquivos em `src/i18n/traducoes/`. Namespaces ativos: `comum`, `financeiro`, `compras`.

---

## Documentação

| Tipo                         | Local                       |
|------------------------------|-----------------------------|
| Manual do usuário            | `docs/manual-usuario.md`    |
| Manual técnico               | `docs/manual-tecnico.md`    |
| Instalação                   | `docs/instalacao.md`        |
| Documentação por tela (UX)   | `documentação do sistema/`  |
| Documentação por tela (API)  | `documentação tecnica/`     |

---

## Boas práticas

- Nomenclatura em PT-BR — arquivos, componentes, funções, variáveis e tipos
- TypeScript strict — zero `any` não justificado
- Zero strings hardcoded — tudo via chaves i18n
- Regras de negócio nos serviços e utilitários, nunca nas telas
- Não versionar `.env`, tokens ou chaves reais
- Testes organizados em `__tests__/` espelhando a estrutura do projeto
