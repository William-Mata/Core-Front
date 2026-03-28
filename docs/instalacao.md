# Guia de Instalação - Core

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Clone e Configuração](#clone-e-configuração)
3. [Instalação de Dependências](#instalação-de-dependências)
4. [Desenvolvimento Local](#desenvolvimento-local)
5. [Testes](#testes)
6. [Build de Produção](#build-de-produção)
7. [MSW (Mock Server)](#msw-mock-server)
8. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Como Instalar |
|---|---|---|
| **Node.js** | 18.17.0+ | https://nodejs.org (LTS recomendado) |
| **npm** | 8.0+ | Instalado com Node.js |
| **Expo CLI** | 6.x+ | `npm install -g expo-cli` |
| **Git** | 2.30+ | https://git-scm.com |

### Verificar Versões Instaladas

```bash
node --version          # v18.17.0 ou superior
npm --version          # 8.0 ou superior
expo --version         # 55.0 ou superior
git --version          # 2.30 ou superior
```

### Plataformas Suportadas

- ✅ **Web**: Chrome, Firefox, Safari (desktop e tablet)
- ✅ **iOS**: iPhone 12+ 
- ✅ **Android**: Android 9+ com Expo Go ou build nativo

---

## Clone e Configuração

### 1. Clone o Repositório

```bash
# Via HTTPS
git clone https://github.com/seu-usuario/core.git
cd core

# Ou via SSH
git clone git@github.com:seu-usuario/core.git
cd core
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env com seus valores
nano .env  # ou use seu editor favorito
```

**Conteúdo esperado de `.env`:**

```env
# API Backend
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_TIMEOUT=30000

# Autenticação
EXPO_PUBLIC_AUTH_MODE=mock  # 'mock' para dev, 'real' para produção

# Logging
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=debug  # debug | info | warn | error

# Idioma Padrão
EXPO_PUBLIC_DEFAULT_LANGUAGE=pt-BR
```

> **Nota:** Variáveis prefixadas com `EXPO_PUBLIC_` são expostas no bundle. Nunca coloque tokens ou senhas aí.

---

## Instalação de Dependências

### Installation Command

```bash
npm install
```

Isso irá:
- Baixar ~1,200 pacotes (350MB)
- Instalar Expo SDK 55
- Setup MSW (Mock Service Worker)
- Compilar dependências nativas (pode levar 3-5 minutos)

### Verificar Instalação

```bash
npm list react-native     # Deve listar v0.83.2
npm list expo              # Deve listar v55.0+
npm list zustand           # Deve listar v5.0+
npm list typescript        # Deve listar v5.0+
```

Se alguma dependência estiver faltando, rode:

```bash
npm install  # Tenta instalar novamente
npm cache clean --force
npm install  # Rode mais uma vez
```

---

## Desenvolvimento Local

### Web Development

#### Iniciar Servidor de Dev (Recomendado)

```bash
npm run web
```

Isso abre um menu interativo:
```
Express running at http://localhost:8081
Press 'a' to open Android emulator
Press 'i' to open iOS simulator
Press 'w' to open web
Press 'r' to reload
Press 'q' to toggle QR code
```

Pressione **'w'** para abrir no navegador automaticamente.

> **Nota:** usar `npm start -- --web` pode gerar um aviso do npm sobre `--web` ser uma configuração desconhecida; `npm run web` evita isso.

#### URL de Acesso

```
http://localhost:8081
```

O app carrega com **Hot Reload** ativado — edite qualquer arquivo TypeScript/TSX e veja as mudanças em tempo real.

#### Acessar com MSW

O Mock Service Worker está ativo por padrão. Você pode:
1. Fazer login com qualquer e-mail/senha (será mockado)
2. Navegar entre módulos
3. Criar, editar, deletar dados (tudo salvo em memory)

### Mobile Development

#### iOS (macOS only)

```bash
npm start
# Pressione 'i' ou
npx expo run:ios
```

↳ Abre iOS Simulator com app compilado nativamente

#### Android

```bash
# Requisitos: Android Studio + SDK configurado
npm start
# Pressione 'a' ou
npx expo run:android
```

#### Ou Via Expo Go (Qualquer Plataforma)

```bash
npm start
# Escanear QR code com Google Lens ou Expo Go app
# App abre no seu dispositivo
```

---

## Testes

### Executar Testes Unitários

```bash
npm test

# Modo watch (re-executa ao salvar)
npm test -- --watch

# Com coverage
npm test -- --coverage
```

Esperado: **0 testes no início** (a cobertura será construída durante o desenvolvimento)

### Estrutura de Testes

```
src/
├── componentes/
│   └── Botao.test.tsx         Tests do componente
├── hooks/
│   └── usarAutenticacao.test.ts
├── utils/
│   └── validarCPF.test.ts
└── types/
    └── financeiro.tipos.test.ts
```

### Exemplo de Teste

```typescript
// src/utils/validarCPF.test.ts
import { validarCPF } from './validarCPF';

describe('validarCPF', () => {
  it('deve validar CPF correto', () => {
    expect(validarCPF('123.456.789-87')).toBe(true);
  });
  
  it('deve rejeitar CPF com dígitos iguais', () => {
    expect(validarCPF('111.111.111-11')).toBe(false);
  });
  
  it('deve rejeitar CPF inválido', () => {
    expect(validarCPF('123.456.789-09')).toBe(false);
  });
});
```

### Cobertura de Testes

Verificar cobertura:

```bash
npm test -- --coverage

# Output esperado:
# =========== Coverage summary ===========
# Statements   : 70% ( 420/600 )
# Branches     : 65% ( 260/400 )
# Functions    : 72% ( 180/250 )
# Lines        : 70% ( 410/585 )
# =====================================
```

> **Meta:** Atingir 70% de cobertura antes de produção

---

## Build de Produção

### Build Web (Deploy Estático)

```bash
# Exportar para HTML estático
npx expo export --platform web

# Output em: dist/
# Ready para upload em Firebase, Vercel, Netlify, etc.
```

**Arquivo gerado:** `dist/index.html` (~2.5MB gzipped)

**Fazer deploy no Firebase Hosting:**

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

### Build Mobile

#### iOS Build

```bash
# Requer conta Apple e certificados
eas build --platform ios

# Ou localmente (xcode-build)
npx expo run:ios --production
```

**Output:** `.ipa` file (pronto para App Store)

#### Android Build

```bash
eas build --platform android

# Ou localmente (gradle)
npx expo run:android --production
```

**Output:** `.apk` file (instalável em Android)

### Variáveis de Ambiente em Produção

No servidor de deploy, configure:

```bash
export EXPO_PUBLIC_API_URL=https://api.core.production.com
export EXPO_PUBLIC_AUTH_MODE=real
export EXPO_PUBLIC_DEBUG_MODE=false
```

---

## MSW (Mock Server)

### O Que É MSW?

**Mock Service Worker** intercepta requisições HTTP e retorna respostas falsas — permitindo desenvolvimento sem backend real.

### Arquivo Principal

```
src/mocks/
├── handlers.ts                    # Lista de todos os endpoints
├── manipuladores/
│   ├── autenticacao.mock.ts
│   ├── financeiro.mock.ts
│   ├── amigos.mock.ts
│   ├── administracao.mock.ts
│   └── compras.mock.ts
└── mockServiceWorker.js           # Worker (auto-gerado)
```

### Usar MSW

**Já está ativo por padrão.** Nenhuma configuração adicional necessária!

Se quiser **desativar** MSW:

```typescript
// src/main.tsx
// Remover ou comentar importação:
// import { setupMSW } from './mocks/browser';
// setupMSW(); // COMENTAR ESTA LINHA
```

### Adicionar Novo Endpoint

```typescript
// src/mocks/manipuladores/novo-modulo.mock.ts

import { http, HttpResponse } from 'msw';

export const manipuladorNovoModulo = [
  http.get('/api/novo-modulo/items', () => {
    return HttpResponse.json({
      sucesso: true,
      dados: [
        { id: 1, nome: 'Item 1' },
        { id: 2, nome: 'Item 2' },
      ],
    });
  }),
  
  http.post('/api/novo-modulo/items', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      sucesso: true,
      dados: { id: 3, ...data },
    }, { status: 201 });
  }),
];
```

Depois registrar em `src/mocks/handlers.ts`:

```typescript
import { manipuladorNovoModulo } from './manipuladores/novo-modulo.mock';

export const handlers = [
  // ... handlers existentes
  ...manipuladorNovoModulo, // [ADD]
];
```

### Inspecionar Requisições MSW

No console do navegador:

```javascript
// Ativar debug logging
localStorage.setItem('msw:debug', 'true');
// Recarregar página

// Desativar:
localStorage.removeItem('msw:debug');
```

---

## Troubleshooting

### Problema: "expo: command not found"

**Solução:**
```bash
npm install -g expo-cli@55
which expo  # Verificar caminho de instalação
```

Se a global não funcionar, use `npx expo` em vez de `expo`:
```bash
npx expo start --web
```

---

### Problema: "Cannot find module 'react-native'"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

Se persistir, cheque versão do Node:
```bash
node --version  # Deve ser 18+ 
# Se não, instale nvm: https://github.com/nvm-sh/nvm
nvm install 18
nvm use 18
```

---

### Problema: "Port 8081 already in use"

**Solução:**
```bash
# Matar processo:
lsof -i :8081        # Identifica processo
kill -9 <PID>        # Mata processo

# Ou usar porta diferente:
npm start -- --web --port 3000
```

---

### Problema: TypeScript Compilation Error

**Erro típico:**
```
error TS2307: Cannot find module '@/hooks/usarAutenticacao'
```

**Solução:**
```bash
# Limpar cache TypeScript
npx tsc --version  # Verificar instalação
npx tsc --noEmit   # Recompilar

# Se ainda falhar:
rm -rf node_modules/.bin/tsc
npm install
```

---

### Problema: MSW Não Está Mockando

**Verificar:**

1. Abrir DevTools (F12)
2. Network tab → ver se requisições aparecem
3. Se aparecerem como "from cache" ou mostrarem erro 404, MSW não está ativo

**Ativar MSW:**

```typescript
// src/index.tsx (web) ou src/root.tsx (app)
import { handlers } from './mocks/handlers';
import { setupServer } from 'msw/node';

const server = setupServer(...handlers);
server.listen();
```

---

### Problema: "EACCES: permission denied"

**Erro ao instalar dependências:**

```
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules
```

**Solução (Linux/Mac):**

```bash
# Opção 1: Usar sudo (não recomendado)
sudo npm install -g expo-cli

# Opção 2: Fix npm permissions (recomendado)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
```

---

### Problema: Android Emulator Não Abre

**Solução:**

```bash
# Verificar emuladores disponíveis
emulator -list-avds

# Iniciar emulador manualmente
emulator -avd <nome-do-emulador> &

# Depois rodar:
npm start
npx expo run:android
```

---

### Problema: iOS Simulator Não Encontrado (macOS)

**Solução:**

```bash
# Instalar Xcode Command Line Tools
xcode-select --install

# Listar simuladores
xcrun simctl list devices

# Iniciar específico
xcrun simctl boot <UUID>

# Depois:
npm start
npx expo run:ios
```

---

### Problema: "Cannot find module 'jest'"

**Ao rodar testes:**

**Solução:**

```bash
npm install --save-dev jest @testing-library/react-native jest-environment-jsdom
npm test
```

---

### Problema: Banco de Dados Local Corrompido

Se local storage/MMKV estiver corrompido:

**Web:**
```javascript
// Console do navegador:
localStorage.clear();
sessionStorage.clear();
// Recarregar página
```

**Mobile:**
```bash
# Android
npx expo run:android -- --reset-cache

# iOS
npx expo run:ios -- --reset-cache
```

---

### Problema: Hot Reload Não Funciona

**Solução:**

```bash
# Parar servidor
# Ctrl+C

# Limpar cache
npm start -- --web --clear

# Reabrir browser manualmente em http://localhost:8081
```

---

### Problema: Lentidão ao Compilar

**Se `npm start` demora >30s**

**Verificação:**

```bash
# Desabilitar debug mode
echo "EXPO_PUBLIC_DEBUG_MODE=false" >> .env

# Usar essas flags:
npm start -- --web --no-dev

# Ou criar build otimizado
npx tsc --noEmit --skipLibCheck
```

---

### Problema: "Error: EMFILE: too many open files"

Comum em projetos grandes:

**Solução (Linux/Mac):**

```bash
# Aumentar limite de arquivos abertos
ulimit -n 4096

# Adicionar permanentemente em ~/.bashrc:
echo "ulimit -n 4096" >> ~/.bashrc
source ~/.bashrc
```

---

### Problema: "Cannot find module 'expo-font'"

**Se algumas fontes estão faltando:**

```bash
npm install expo-font expo-splash-screen
npm install --save-dev @expo/config-plugins
npx expo prebuild --clean
npm start
```

---

## Obter Suporte

- 📚 **Documentação:** Veja os arquivos em `/docs/`
- 🐛 **Bug Report:** Abra issue no GitHub
- 💬 **Discussão:** Veja discussions no repositório
- 📧 **Email:** suporte@core.app

---

**Última atualização:** 15 de março de 2026
**Versão:** 1.0
**Mantido por:** Time de Operações
