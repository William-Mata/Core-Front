# AGENT_GUIA_DESENVOLVIMENTO.md
# Core — Guia Completo para Agente de Desenvolvimento

> **INSTRUÇÃO PARA O AGENTE:** Leia este arquivo integralmente antes de escrever qualquer linha de código.
> Siga cada seção na ordem apresentada. Ao concluir cada fase, informe o que foi entregue e aguarde
> confirmação antes de avançar para a próxima. Nenhuma regra aqui pode ser ignorada ou simplificada
> sem justificativa técnica explícita e aprovação do solicitante.

---

## ÍNDICE

1. [Papel e Contexto do Agente](#1-papel-e-contexto-do-agente)
2. [Visão Geral do Sistema](#2-visão-geral-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Regras Absolutas de Nomenclatura](#4-regras-absolutas-de-nomenclatura)
5. [Arquitetura de Pastas](#5-arquitetura-de-pastas)
6. [Identidade Visual](#6-identidade-visual)
7. [Autenticação e Refresh Token](#7-autenticação-e-refresh-token)
8. [Contrato de API com .NET](#8-contrato-de-api-com-net)
9. [Regras Gerais da Aplicação](#9-regras-gerais-da-aplicação)
10. [Dashboard Global](#10-dashboard-global)
11. [Módulo Financeiro](#11-módulo-financeiro)
12. [Módulo de Amigos e Contatos](#12-módulo-de-amigos-e-contatos)
13. [Módulo de Administração](#13-módulo-de-administração)
14. [Segurança e Autorização](#14-segurança-e-autorização)
15. [Requisitos Técnicos](#15-requisitos-técnicos)
16. [Plano de Fases de Desenvolvimento](#16-plano-de-fases-de-desenvolvimento)
17. [Entregáveis Obrigatórios](#17-entregáveis-obrigatórios)
18. [Checklist de Qualidade](#18-checklist-de-qualidade)

---

## 1. PAPEL E CONTEXTO DO AGENTE

Você é um **Engenheiro Front-End Sênior** especialista em:
- Arquitetura de aplicações React Native multiplataforma
- Sistemas de gestão modular escaláveis
- Design systems futuristas e acessíveis
- TypeScript strict, Expo Router e padrões de projeto corporativos
- Integração com APIs REST .NET (com suporte a JWT + Refresh Token)

Você escreve código limpo, tipado, testado e documentado. Nunca entrega código parcial sem avisar.
Sempre justifica decisões técnicas que desviem das especificações.

---

## 2. VISÃO GERAL DO SISTEMA

**Nome da aplicação:** Core
**Tipo:** Sistema de gestão pessoal modular (web + mobile via React Native Web + Expo)

**Módulos previstos:**
| Módulo | Status nesta entrega |
|---|---|
| Dashboard Global | ✅ Implementar |
| Módulo Financeiro | ✅ Implementar (completo) |
| Módulo de Amigos e Contatos | ✅ Implementar (completo) |
| Módulo de Administração do Sistema | ✅ Implementar (completo) |
| Lista de Compras e demais módulos futuros | 🔲 Estrutura plugável preparada |

> A arquitetura deve ser **completamente plugável**: adicionar um novo módulo no futuro
> não pode exigir refatoração do núcleo da aplicação.

---

## 3. STACK TECNOLÓGICA

| Camada | Tecnologia | Versão / Observação |
|---|---|---|
| Framework base | React Native + React Native Web | Última estável |
| Plataforma | Expo | SDK mais recente (Managed Workflow) |
| Roteamento | Expo Router | v3+ (file-based routing) |
| Linguagem | TypeScript | strict: true — zero `any` não justificado |
| Estado global | Zustand | Slices por módulo |
| Formulários | React Hook Form + Zod | Validação totalmente tipada |
| Gráficos | Victory Native (mobile) / Recharts (web) | Abstraídos em componente comum |
| Drag & Drop | @dnd-kit/core (web) + react-native-draggable (mobile) | Abstração unificada via hook |
| i18n | i18next + react-i18next | PT-BR, EN, ES |
| HTTP Client | Axios | Com interceptors de auth + refresh token |
| Cache / Requisições | TanStack Query (React Query v5) | |
| Testes | Jest + React Native Testing Library | Cobertura mínima 70% |
| Estilo | NativeWind v4 + Design Tokens | Tema futurista dark |
| Armazenamento local | MMKV (preferências) + SecureStore (tokens) | |
| Mock Server | MSW (Mock Service Worker) | Para dev sem backend |
| Virtualização de listas | FlashList (mobile) + react-window (web) | |

---

## 4. REGRAS ABSOLUTAS DE NOMENCLATURA

> ⚠️ ESTA É A REGRA MAIS IMPORTANTE DO PROJETO. SEM EXCEÇÕES.

**TODA** nomenclatura deve estar em **português brasileiro (pt-BR)**:

- ✅ Pastas: `componentes/`, `modulos/`, `servicos/`, `hooks/`, `tipos/`
- ✅ Arquivos: `usarDespesa.ts`, `formatarMoeda.ts`, `tabelaTransacoes.tsx`
- ✅ Componentes: `<TabelaTransacoes />`, `<FiltroUniversal />`, `<BotaoAcao />`
- ✅ Funções/métodos: `buscarDespesas()`, `formatarData()`, `validarRateio()`
- ✅ Variáveis: `totalDespesas`, `listaReceitas`, `usuarioAtivo`
- ✅ Tipos/interfaces: `TipoDespesa`, `InterfaceUsuario`, `RespostaApi`
- ✅ Stores: `usarAutenticacaoStore`, `usarNotificacaoStore`
- ✅ Enums: `TipoTransacao`, `StatusDespesa`, `TipoPagamento`
- ✅ Constantes: `ROTAS`, `TAMANHO_PAGINA`, `TEMPO_DEBOUNCE`

**Exceções permitidas** (apenas):
- Nomes de bibliotecas externas (ex.: `useState`, `useEffect`, `axios`)
- Palavras-chave do TypeScript/JavaScript
- Variáveis de ambiente com prefixo `EXPO_PUBLIC_`

**Validação obrigatória:** Ao final de cada fase, executar:
```bash
grep -r "const [a-z]" src/ | grep -v "pt-BR" # checar nomenclatura suspeita
```

---

## 5. ARQUITETURA DE PASTAS

```
meu-app/
├── app/                                        # Expo Router (file-based routing)
│   ├── _layout.tsx                             # Root layout (providers globais)
│   ├── (autenticacao)/
│   │   ├── _layout.tsx
│   │   ├── entrar.tsx
│   │   └── recuperar-senha.tsx
│   ├── principal/
│   │   ├── _layout.tsx                         # Layout com MenuLateral + Cabecalho
│   │   ├── dashboard.tsx
│   │   └── financeiro/
│   │       ├── _layout.tsx
│   │       ├── despesa/
│   │       │   ├── index.tsx                   # Listagem
│   │       │   ├── [id].tsx                    # Detalhe/Edição
│   │       │   └── novo.tsx                    # Cadastro
│   │       ├── receita/
│   │       │   ├── index.tsx
│   │       │   ├── [id].tsx
│   │       │   └── novo.tsx
│   │       ├── reembolso/
│   │       │   ├── index.tsx
│   │       │   ├── [id].tsx
│   │       │   └── novo.tsx
│   │       ├── conta-bancaria/
│   │       │   ├── index.tsx
│   │       │   ├── [id].tsx
│   │       │   └── extrato/[id].tsx
│   │       ├── cartao-credito/
│   │       │   ├── index.tsx
│   │       │   ├── [id].tsx
│   │       │   └── fatura/[id].tsx
│   │       ├── centro-custo/
│   │       │   ├── index.tsx
│   │       │   └── [id].tsx
│   │       ├── conta-analitica/
│   │       │   ├── index.tsx
│   │       │   └── [id].tsx
│   │       ├── conta-sintetica/
│   │       │   ├── index.tsx
│   │       │   └── [id].tsx
│   │       └── documentacao/
│   │           └── index.tsx
│   ├── amigos/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                    # Listagem de amigos/contatos
│   │   ├── novo.tsx                     # Cadastro
│   │   ├── [id].tsx                     # Detalhe/Edição
│   │   └── convite/
│   │       └── index.tsx                # Enviar convite por e-mail
│   └── administracao/                          # Subsistema isolado
│       ├── _layout.tsx                         # Layout próprio com botão "Voltar"
│       ├── painel.tsx
│       ├── usuarios/
│       │   ├── index.tsx
│       │   ├── [id].tsx
│       │   └── novo.tsx
│       ├── permissoes/
│       │   └── [usuarioId].tsx
│       ├── documentos/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       └── avisos/
│           ├── index.tsx
│           └── [id].tsx
│
└── src/
    │
    ├── componentes/
    │   ├── comuns/
    │   │   ├── Botao/
    │   │   │   ├── index.tsx
    │   │   │   ├── Botao.tipos.ts
    │   │   │   └── Botao.teste.tsx
    │   │   ├── CampoTexto/
    │   │   ├── Modal/
    │   │   │   ├── index.tsx
    │   │   │   └── ModalAviso/                 # Modal geral de avisos
    │   │   ├── Tabela/
    │   │   │   ├── index.tsx
    │   │   │   ├── ConfigurarColunas/          # Painel de toggle de colunas
    │   │   │   └── Tabela.teste.tsx
    │   │   ├── FiltroUniversal/
    │   │   │   ├── index.tsx
    │   │   │   └── FiltroUniversal.teste.tsx
    │   │   ├── Paginacao/
    │   │   ├── Sininho/                        # Componente de notificações
    │   │   ├── SeletorIdioma/                  # Bandeiras + troca de idioma
    │   │   ├── AcessoNegado/
    │   │   ├── EsqueletoCarregamento/          # Skeleton loader
    │   │   ├── UploadArquivo/
    │   │   ├── VisualizadorPdf/
    │   │   └── Avatar/
    │   │
    │   ├── layout/
    │   │   ├── MenuLateral/
    │   │   │   ├── index.tsx
    │   │   │   ├── ItemMenu/
    │   │   │   └── GrupoDropdown/
    │   │   ├── Cabecalho/
    │   │   └── RodaPe/
    │   │
    │   ├── dashboard/
    │   │   ├── Widget/                         # Wrapper arrastável
    │   │   ├── GradeWidgets/                   # Container DnD
    │   │   └── widgets/
    │   │       ├── ResumoFinanceiro/
    │   │       ├── FluxoCaixa/
    │   │       ├── DespesasCategoria/
    │   │       ├── CartoesCredito/
    │   │       ├── ContasBancarias/
    │   │       └── UltimasTransacoes/
    │   │
    │   └── graficos/
    │       ├── GraficoLinha/
    │       ├── GraficoBarra/
    │       ├── GraficoPizza/
    │       └── GraficoArea/
    │
    ├── modulos/
    │   ├── financeiro/
    │   │   ├── despesa/
    │   │   │   ├── componentes/
    │   │   │   │   ├── FormularioDespesa/
    │   │   │   │   ├── ModalEfetivacao/
    │   │   │   │   ├── ModalEstorno/
    │   │   │   │   ├── ModalRateio/
    │   │   │   │   └── ReguraParcelas/
    │   │   │   ├── hooks/
    │   │   │   │   ├── usarDespesas.ts
    │   │   │   │   ├── usarEfetivacao.ts
    │   │   │   │   └── usarRateio.ts
    │   │   │   ├── servicos/
    │   │   │   │   └── despesaServico.ts
    │   │   │   ├── tipos/
    │   │   │   │   └── despesa.tipos.ts
    │   │   │   ├── validacoes/
    │   │   │   │   └── despesa.schema.ts       # Schemas Zod
    │   │   │   └── testes/
    │   │   │       ├── usarDespesas.teste.ts
    │   │   │       └── despesa.schema.teste.ts
    │   │   ├── receita/                        # mesma estrutura de despesa
    │   │   ├── reembolso/                      # mesma estrutura
    │   │   ├── contaBancaria/
    │   │   ├── cartaoCredito/
    │   │   ├── centroCusto/
    │   │   ├── contaAnalitica/
    │   │   ├── contaSintetica/
    │   │   └── documentacao/
    │   │
    │   ├── amigos/
    │   │   ├── componentes/
    │   │   │   ├── CartaoAmigo/             # Card com avatar, tipo (PF/PJ), status, ações
    │   │   │   ├── FormularioAmigo/         # Cadastro/edição de amigo ou contato
    │   │   │   ├── ModalConvite/            # Envio de convite por e-mail
    │   │   │   ├── SeletorAmigos/           # Componente reutilizável para rateio
    │   │   │   └── ListaAmigos/             # Grid de contatos com busca rápida
    │   │   ├── hooks/
    │   │   │   ├── usarAmigos.ts
    │   │   │   ├── usarConvite.ts
    │   │   │   └── usarBuscarAmigo.ts       # Busca por nome, e-mail, CPF ou CNPJ
    │   │   ├── servicos/
    │   │   │   └── amigoServico.ts
    │   │   ├── tipos/
    │   │   │   └── amigo.tipos.ts
    │   │   ├── validacoes/
    │   │   │   └── amigo.schema.ts          # Zod: CPF, CNPJ, e-mail, nome
    │   │   └── testes/
    │   │       ├── usarAmigos.teste.ts
    │   │       └── amigo.schema.teste.ts
    │   │
    │   └── administracao/
    │       ├── usuarios/
    │       ├── permissoes/
    │       ├── documentos/
    │       └── avisos/
    │
    ├── servicos/
    │   ├── api.ts                              # Instância Axios + interceptors
    │   ├── autenticacaoServico.ts              # Login, logout, refresh token
    │   ├── notificacaoServico.ts
    │   └── index.ts
    │
    ├── store/
    │   ├── usarAutenticacaoStore.ts
    │   ├── usarNotificacaoStore.ts
    │   ├── usarPreferenciasStore.ts            # Colunas ocultas, ordem widgets
    │   ├── usarSimulacaoStore.ts               # Simulação de usuário (admin)
    │   ├── usarAmigosStore.ts                  # Lista de amigos/contatos em cache
    │   └── financeiro/
    │       ├── usarDespesaStore.ts
    │       ├── usarReceitaStore.ts
    │       └── usarReembolsoStore.ts
    │
    ├── hooks/
    │   ├── usarFiltro.ts
    │   ├── usarPaginacao.ts
    │   ├── usarPermissao.ts
    │   ├── usarModuloAtivo.ts
    │   ├── usarNotificacoes.ts
    │   ├── usarDragDrop.ts                     # Abstração DnD cross-platform
    │   ├── usarPreferenciasTabela.ts
    │   └── usarSeletorAmigos.ts                # Hook reutilizável p/ seleção em rateio/reembolso
    │
    ├── tipos/
    │   ├── autenticacao.tipos.ts
    │   ├── financeiro.tipos.ts
    │   ├── notificacao.tipos.ts
    │   ├── permissao.tipos.ts
    │   ├── usuario.tipos.ts
    │   ├── amigo.tipos.ts                   # TipoAmigo, TipoDocumento, StatusConvite
    │   └── api.tipos.ts                        # Tipos de resposta genérica da API
    │
    ├── constantes/
    │   ├── rotas.ts
    │   ├── enumeradores.ts
    │   ├── temas.ts
    │   └── configuracao.ts                     # Timeouts, URLs base, etc.
    │
    ├── utils/
    │   ├── formatacoes.ts                      # Moeda, datas, CPF, CNPJ, máscaras
    │   ├── validacoes.ts
    │   ├── permissoes.ts
    │   └── armazenamento.ts                    # Wrappers MMKV + SecureStore
    │
    ├── i18n/
    │   ├── configuracao.ts
    │   └── traducoes/
    │       ├── pt-BR/
    │       │   ├── comum.json
    │       │   ├── financeiro.json
    │       │   ├── amigos.json
    │       │   ├── administracao.json
    │       │   └── erros.json
    │       ├── en/
    │       │   ├── comum.json
    │       │   ├── financeiro.json
    │       │   ├── amigos.json
    │       │   ├── administracao.json
    │       │   └── erros.json
    │       └── es/
    │           ├── comum.json
    │           ├── financeiro.json
    │           ├── amigos.json
    │           ├── administracao.json
    │           └── erros.json
    │
    ├── mocks/                                  # MSW handlers
    │   ├── manipuladores/
    │   │   ├── autenticacao.mock.ts
    │   │   ├── financeiro.mock.ts
    │   │   ├── amigos.mock.ts
    │   │   └── administracao.mock.ts
    │   └── servidor.ts
    │
    └── testes/
        ├── configuracao/
        │   └── configuracaoTeste.ts
        ├── fabricas/                           # Factory functions
        │   ├── despesaFabrica.ts
        │   ├── receitaFabrica.ts
        │   ├── amigoFabrica.ts
        │   └── usuarioFabrica.ts
        └── utilitarios/
            └── renderizarComProvedor.tsx
```

---

## 6. IDENTIDADE VISUAL

**Tema:** Dark Futurista — inspirado na paleta da FIAP (https://www.fiap.com.br/)

```typescript
// src/constantes/temas.ts
export const TEMA_ESCURO = {
  cores: {
    fundo:           '#090909',
    superficie:      '#111111',
    cartao:          '#1A1A1A',
    bordaSutil:      '#2A2A2A',
    primaria:        '#ED145B',      // Rosa FIAP principal
    primariaVivo:    '#FF2D78',      // Rosa hover/foco
    primariaEscuro:  '#C4004A',      // Rosa pressionado
    texto:           '#F0F0F0',
    textoSuave:      '#888888',
    textoDesabilitado: '#444444',
    sucesso:         '#00E676',
    aviso:           '#FFB300',
    erro:            '#FF3D57',
    info:            '#00B0FF',
    overlay:         'rgba(0,0,0,0.75)',
  },
  efeitos: {
    brilhoRosa:      '0 0 12px rgba(237, 20, 91, 0.55)',
    brilhoSuave:     '0 0 6px rgba(237, 20, 91, 0.25)',
    brilhoIntenso:   '0 0 20px rgba(237, 20, 91, 0.8)',
    vidro:           'rgba(26, 26, 26, 0.85)',       // glassmorphism
    backdropBlur:    '12px',
  },
  tipografia: {
    familia:         'Inter, system-ui, sans-serif',
    tituloGrande:    { tamanho: 28, peso: '700' },
    titulo:          { tamanho: 20, peso: '600' },
    subtitulo:       { tamanho: 16, peso: '600' },
    corpo:           { tamanho: 14, peso: '400' },
    legenda:         { tamanho: 12, peso: '400' },
    codigo:          { familia: 'JetBrains Mono, monospace', tamanho: 13 },
  },
  raios: {
    pequeno:  6,
    medio:    12,
    grande:   20,
    circular: 9999,
  },
  espacamentos: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  transicoes: {
    rapida:   '150ms ease',
    normal:   '250ms ease',
    lenta:    '400ms ease',
  },
} as const;
```

**Requisitos visuais obrigatórios:**
- Cards com borda `1px solid #2A2A2A` e brilho rosa animado no hover
- Menu lateral com glassmorphism (`backdrop-filter: blur(12px)`)
- Gráficos com gradiente rosa `#ED145B` → preto `#090909`
- Botões primários com `box-shadow` neon rosa
- Tabelas: linhas alternadas `#111111` / `#1A1A1A`
- Scrollbars customizadas: trilho `#1A1A1A`, polegar `#ED145B`
- Badges de status: Despesa 🔴 `#FF3D57` | Receita 🟢 `#00E676` | Reembolso 🔵 `#00B0FF` | Estorno 🟡 `#FFB300`
- Animações de entrada: `fade-in` + `slide-up` (200ms) em modais e páginas

---

## 7. AUTENTICAÇÃO E REFRESH TOKEN

Esta seção é crítica. A API será desenvolvida em **.NET** e usará **JWT com Refresh Token**.

### 7.1 Fluxo de Autenticação

```
[Usuário faz login]
        ↓
POST /api/autenticacao/entrar
        ↓
API retorna:
  {
    "accessToken": "eyJ...",          // JWT de curta duração (ex: 15min)
    "refreshToken": "uuid-longo...",  // Token de longa duração (ex: 7 dias)
    "expiracao": "2024-01-01T00:15:00Z",
    "usuario": { id, nome, email, perfil, modulosAtivos }
  }
        ↓
[Armazenar tokens com segurança]
  - accessToken  → MMKV (memória rápida, não persistir entre sessões)
  - refreshToken → SecureStore (mobile) / httpOnly cookie (web)
        ↓
[Usar accessToken em toda requisição]
  Authorization: Bearer {accessToken}
```

### 7.2 Fluxo de Refresh Token

```
[Requisição qualquer retorna 401]
        ↓
[Interceptor Axios detecta 401]
        ↓
[Verificar se já existe refresh em andamento]
  SE SIM: Enfileirar a requisição original
  SE NÃO: Iniciar processo de refresh
        ↓
POST /api/autenticacao/renovar
  Body: { "refreshToken": "uuid-longo..." }
        ↓
  SE SUCESSO (200):
    - Atualizar accessToken no store
    - Atualizar refreshToken (rotação de token)
    - Reprocessar fila de requisições aguardando
    - Repetir requisição original
        ↓
  SE FALHA (401/403):
    - Limpar todos os tokens
    - Limpar estado global
    - Redirecionar para /entrar
    - Exibir toast: "Sessão expirada. Faça login novamente."
```

### 7.3 Implementação Obrigatória — `src/servicos/api.ts`

```typescript
// src/servicos/api.ts
// IMPLEMENTAR EXATAMENTE DESTA FORMA

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { obterTokenAcesso, obterRefreshToken, salvarTokens, limparTokens } from '../utils/armazenamento';
import { usarAutenticacaoStore } from '../store/usarAutenticacaoStore';

// Controle de refresh em andamento
let estaRenovando = false;
let filaAguardando: Array<{
  resolver: (valor: string) => void;
  rejeitar: (erro: unknown) => void;
}> = [];

const processarFila = (erro: unknown, token: string | null = null): void => {
  filaAguardando.forEach(({ resolver, rejeitar }) => {
    if (erro) rejeitar(erro);
    else if (token) resolver(token);
  });
  filaAguardando = [];
};

export const criarInstanciaApi = (): AxiosInstance => {
  const instancia = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // ── INTERCEPTOR DE REQUISIÇÃO ──────────────────────────────
  instancia.interceptors.request.use(
    async (configuracao: InternalAxiosRequestConfig) => {
      const tokenAcesso = await obterTokenAcesso();
      if (tokenAcesso && configuracao.headers) {
        configuracao.headers.Authorization = `Bearer ${tokenAcesso}`;
      }
      return configuracao;
    },
    (erro) => Promise.reject(erro),
  );

  // ── INTERCEPTOR DE RESPOSTA ────────────────────────────────
  instancia.interceptors.response.use(
    (resposta: AxiosResponse) => resposta,
    async (erro) => {
      const requisicaoOriginal = erro.config;

      // Evitar loop infinito na rota de renovar
      if (requisicaoOriginal?.url?.includes('/autenticacao/renovar')) {
        await limparTokens();
        usarAutenticacaoStore.getState().deslogar();
        return Promise.reject(erro);
      }

      if (erro.response?.status === 401 && !requisicaoOriginal?._jaRenovado) {
        requisicaoOriginal._jaRenovado = true;

        if (estaRenovando) {
          // Enfileirar enquanto refresh está em andamento
          return new Promise((resolver, rejeitar) => {
            filaAguardando.push({ resolver, rejeitar });
          }).then((novoToken) => {
            requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
            return instancia(requisicaoOriginal);
          });
        }

        estaRenovando = true;

        try {
          const refreshToken = await obterRefreshToken();
          if (!refreshToken) throw new Error('Sem refresh token');

          const { data } = await instancia.post('/autenticacao/renovar', { refreshToken });
          const { accessToken: novoAccessToken, refreshToken: novoRefreshToken } = data;

          await salvarTokens(novoAccessToken, novoRefreshToken);
          usarAutenticacaoStore.getState().atualizarToken(novoAccessToken);

          processarFila(null, novoAccessToken);
          requisicaoOriginal.headers.Authorization = `Bearer ${novoAccessToken}`;
          return instancia(requisicaoOriginal);
        } catch (erroRefresh) {
          processarFila(erroRefresh, null);
          await limparTokens();
          usarAutenticacaoStore.getState().deslogar();
          return Promise.reject(erroRefresh);
        } finally {
          estaRenovando = false;
        }
      }

      // Tratar outros erros globalmente
      if (erro.response?.status === 403) {
        // Emitir evento para componente <AcessoNegado>
        usarAutenticacaoStore.getState().definirAcessoNegado(true);
      }

      if (erro.response?.status >= 500) {
        // Toast global de erro de servidor
        usarNotificacaoStore?.getState?.().adicionarToast({
          tipo: 'erro',
          mensagem: 'erros.servidorIndisponivel',
        });
      }

      return Promise.reject(erro);
    },
  );

  return instancia;
};

export const api = criarInstanciaApi();
```

### 7.4 Armazenamento Seguro dos Tokens

```typescript
// src/utils/armazenamento.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const armazenamento = new MMKV({ id: 'mylife-storage' });

const CHAVES = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
  PREFERENCIAS:  'preferencias_usuario',
  IDIOMA:        'idioma_selecionado',
} as const;

export const salvarTokens = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  // accessToken em MMKV (rápido, memória)
  armazenamento.set(CHAVES.ACCESS_TOKEN, accessToken);
  // refreshToken em SecureStore (seguro, criptografado)
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(CHAVES.REFRESH_TOKEN, refreshToken);
  } else {
    // No web, usar httpOnly cookie via API ou sessionStorage como fallback
    sessionStorage.setItem(CHAVES.REFRESH_TOKEN, refreshToken);
  }
};

export const obterTokenAcesso = async (): Promise<string | null> =>
  armazenamento.getString(CHAVES.ACCESS_TOKEN) ?? null;

export const obterRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') {
    return SecureStore.getItemAsync(CHAVES.REFRESH_TOKEN);
  }
  return sessionStorage.getItem(CHAVES.REFRESH_TOKEN);
};

export const limparTokens = async (): Promise<void> => {
  armazenamento.delete(CHAVES.ACCESS_TOKEN);
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(CHAVES.REFRESH_TOKEN);
  } else {
    sessionStorage.removeItem(CHAVES.REFRESH_TOKEN);
  }
};
```

### 7.5 Store de Autenticação

```typescript
// src/store/usarAutenticacaoStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InterfaceUsuario } from '../tipos/usuario.tipos';

interface EstadoAutenticacao {
  usuario: InterfaceUsuario | null;
  accessToken: string | null;
  estaAutenticado: boolean;
  estaSimulando: boolean;
  usuarioSimulado: InterfaceUsuario | null;
  acessoNegado: boolean;

  // Ações
  definirSessao: (usuario: InterfaceUsuario, token: string) => void;
  atualizarToken: (novoToken: string) => void;
  deslogar: () => void;
  iniciarSimulacao: (usuario: InterfaceUsuario) => void;
  encerrarSimulacao: () => void;
  definirAcessoNegado: (valor: boolean) => void;
}

export const usarAutenticacaoStore = create<EstadoAutenticacao>()(
  persist(
    (definir, obter) => ({
      usuario: null,
      accessToken: null,
      estaAutenticado: false,
      estaSimulando: false,
      usuarioSimulado: null,
      acessoNegado: false,

      definirSessao: (usuario, token) =>
        definir({ usuario, accessToken: token, estaAutenticado: true, acessoNegado: false }),

      atualizarToken: (novoToken) => definir({ accessToken: novoToken }),

      deslogar: () =>
        definir({
          usuario: null,
          accessToken: null,
          estaAutenticado: false,
          estaSimulando: false,
          usuarioSimulado: null,
        }),

      iniciarSimulacao: (usuarioAlvo) =>
        definir({ estaSimulando: true, usuarioSimulado: usuarioAlvo }),

      encerrarSimulacao: () =>
        definir({ estaSimulando: false, usuarioSimulado: null }),

      definirAcessoNegado: (valor) => definir({ acessoNegado: valor }),
    }),
    {
      name: 'autenticacao-storage',
      storage: createJSONStorage(() => sessionStorage), // Não persistir entre abas no web
      partialize: (estado) => ({
        usuario: estado.usuario,
        estaAutenticado: estado.estaAutenticado,
      }),
    },
  ),
);
```

---

## 8. CONTRATO DE API COM .NET

> A API será desenvolvida em .NET posteriormente. O front-end deve ser construído
> contra estes contratos. Use MSW para mockar todas as rotas durante o desenvolvimento.

### 8.1 Padrão de Resposta da API

```typescript
// src/tipos/api.tipos.ts

// Resposta de sucesso paginada
interface RespostaPaginada<T> {
  dados: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

// Resposta de sucesso simples
interface RespostaSucesso<T> {
  dados: T;
  mensagem?: string;
}

// Resposta de erro
interface RespostaErro {
  codigo: string;          // Ex: "DESPESA_NAO_ENCONTRADA"
  mensagem: string;
  detalhes?: string[];
  timestamp: string;
}
```

### 8.2 Endpoints de Autenticação

```
POST   /api/autenticacao/entrar
       Body:    { email: string, senha: string }
       Return:  { accessToken, refreshToken, expiracao, usuario }

POST   /api/autenticacao/renovar
       Body:    { refreshToken: string }
       Return:  { accessToken, refreshToken, expiracao }

POST   /api/autenticacao/sair
       Header:  Authorization: Bearer {token}
       Return:  204 No Content

POST   /api/autenticacao/recuperar-senha
       Body:    { email: string }
       Return:  204 No Content
```

### 8.3 Endpoints do Módulo Financeiro

```
# Despesas
GET    /api/financeiro/despesas              ?pagina&tamanhoPagina&id&descricao&dataCadastroInicio&dataCadastroFim&dataEfetivacaoInicio&dataEfetivacaoFim&status&centroCustoId&tipoPagamento&valorMin&valorMax
POST   /api/financeiro/despesas
GET    /api/financeiro/despesas/{id}
PUT    /api/financeiro/despesas/{id}
DELETE /api/financeiro/despesas/{id}
POST   /api/financeiro/despesas/{id}/efetivar
POST   /api/financeiro/despesas/{id}/estornar
POST   /api/financeiro/despesas/{id}/ratear
GET    /api/financeiro/despesas/{id}/parcelas

# Receitas
GET    /api/financeiro/receitas              ?pagina&tamanhoPagina&...mesmos filtros...
POST   /api/financeiro/receitas
GET    /api/financeiro/receitas/{id}
PUT    /api/financeiro/receitas/{id}
DELETE /api/financeiro/receitas/{id}
POST   /api/financeiro/receitas/{id}/efetivar
POST   /api/financeiro/receitas/{id}/estornar
POST   /api/financeiro/receitas/{id}/ratear

# Reembolsos
GET    /api/financeiro/reembolsos            ?pagina&tamanhoPagina&...
POST   /api/financeiro/reembolsos
GET    /api/financeiro/reembolsos/{id}
PUT    /api/financeiro/reembolsos/{id}
DELETE /api/financeiro/reembolsos/{id}
POST   /api/financeiro/reembolsos/{id}/efetivar
POST   /api/financeiro/reembolsos/{id}/vincular-despesa
DELETE /api/financeiro/reembolsos/{id}/desvincular-despesa/{despesaId}

# Contas Bancárias
GET    /api/financeiro/contas-bancarias
POST   /api/financeiro/contas-bancarias
GET    /api/financeiro/contas-bancarias/{id}
PUT    /api/financeiro/contas-bancarias/{id}
DELETE /api/financeiro/contas-bancarias/{id}
GET    /api/financeiro/contas-bancarias/{id}/extrato   ?dataInicio&dataFim

# Cartões de Crédito
GET    /api/financeiro/cartoes-credito
POST   /api/financeiro/cartoes-credito
GET    /api/financeiro/cartoes-credito/{id}
PUT    /api/financeiro/cartoes-credito/{id}
DELETE /api/financeiro/cartoes-credito/{id}
GET    /api/financeiro/cartoes-credito/{id}/faturas
GET    /api/financeiro/cartoes-credito/{id}/faturas/{anoMes}   # ex: 2024-01
POST   /api/financeiro/cartoes-credito/{id}/faturas/{anoMes}/pagar

# Centro de Custo
GET    /api/financeiro/centros-custo         ?pagina&tamanhoPagina&...
POST   /api/financeiro/centros-custo
GET    /api/financeiro/centros-custo/{id}
PUT    /api/financeiro/centros-custo/{id}
DELETE /api/financeiro/centros-custo/{id}

# Conta Analítica
GET    /api/financeiro/contas-analiticas
POST   /api/financeiro/contas-analiticas
GET    /api/financeiro/contas-analiticas/{id}
PUT    /api/financeiro/contas-analiticas/{id}
DELETE /api/financeiro/contas-analiticas/{id}

# Conta Sintética
GET    /api/financeiro/contas-sinteticas
POST   /api/financeiro/contas-sinteticas
GET    /api/financeiro/contas-sinteticas/{id}
PUT    /api/financeiro/contas-sinteticas/{id}
DELETE /api/financeiro/contas-sinteticas/{id}

# Dashboard
GET    /api/financeiro/dashboard/resumo            ?mes&ano
GET    /api/financeiro/dashboard/fluxo-caixa       ?meses=12
GET    /api/financeiro/dashboard/despesas-categoria ?mes&ano
GET    /api/financeiro/dashboard/ultimas-transacoes ?limite=50
```

### 8.4 Endpoints de Notificações

```
GET    /api/notificacoes                     ?pagina&apenasNaoLidas=true
PATCH  /api/notificacoes/{id}/marcar-lida
PATCH  /api/notificacoes/marcar-todas-lidas
GET    /api/avisos/pendentes-ciencia
POST   /api/avisos/{id}/dar-ciencia
```

### 8.5 Endpoints de Administração

```
# Usuários
GET    /api/admin/usuarios                   ?pagina&tamanhoPagina&...
POST   /api/admin/usuarios
GET    /api/admin/usuarios/{id}
PUT    /api/admin/usuarios/{id}
DELETE /api/admin/usuarios/{id}
POST   /api/admin/usuarios/{id}/redefinir-senha
POST   /api/admin/usuarios/{id}/iniciar-simulacao
POST   /api/admin/simulacao/encerrar

# Permissões
GET    /api/admin/permissoes/arvore
GET    /api/admin/permissoes/usuario/{usuarioId}
PUT    /api/admin/permissoes/usuario/{usuarioId}
GET    /api/admin/permissoes/perfil/{perfil}
PUT    /api/admin/permissoes/perfil/{perfil}

# Documentos
GET    /api/admin/documentos                 ?moduloId&...
POST   /api/admin/documentos                 (multipart/form-data)
GET    /api/admin/documentos/{id}
PUT    /api/admin/documentos/{id}
DELETE /api/admin/documentos/{id}
POST   /api/admin/documentos/{id}/publicar

# Avisos
GET    /api/admin/avisos                     ?pagina&...
POST   /api/admin/avisos                     (multipart/form-data)
GET    /api/admin/avisos/{id}
PUT    /api/admin/avisos/{id}
DELETE /api/admin/avisos/{id}
POST   /api/admin/avisos/{id}/publicar
GET    /api/admin/avisos/{id}/relatorio-ciencia

# Dashboard Admin
GET    /api/admin/dashboard/resumo
GET    /api/admin/dashboard/ultimos-acessos
GET    /api/admin/dashboard/modulos-utilizados
```

---

### 8.6 Endpoints de Amigos e Contatos

```
# CRUD de Amigos/Contatos
GET    /api/amigos                            ?pagina&tamanhoPagina&busca&tipo&status
       # busca: pesquisa simultânea em nome, e-mail, CPF e CNPJ
       # tipo: PESSOA_FISICA | PESSOA_JURIDICA
       # status: ATIVO | INATIVO | CONVIDADO | VINCULADO
POST   /api/amigos
GET    /api/amigos/{id}
PUT    /api/amigos/{id}
DELETE /api/amigos/{id}
PATCH  /api/amigos/{id}/ativar
PATCH  /api/amigos/{id}/inativar

# Busca rápida (usada em modais de rateio e seleção)
GET    /api/amigos/buscar                     ?q=<termo>
       # Retorna até 10 resultados pesquisando em: nome, e-mail, CPF, CNPJ
       # Response: [{ id, nomeExibicao, documento, tipoDocumento, avatar, status }]

# Convite por e-mail
POST   /api/amigos/convidar
       # Body: { email: string, nomeAmigo?: string, mensagemPersonalizada?: string }
       # Envia e-mail de convite para o usuário se cadastrar na plataforma
GET    /api/amigos/convites                   ?pagina&status
       # Lista convites enviados (pendente, aceito, expirado)
DELETE /api/amigos/convites/{id}              # Cancelar convite pendente

# Histórico financeiro compartilhado
GET    /api/amigos/{id}/historico-rateios     ?pagina&dataInicio&dataFim
       # Transações onde este amigo participou de rateio com o usuário logado
GET    /api/amigos/{id}/pendencias
       # Valores ainda não quitados nos rateios com este amigo
       # Response: { totalAReceber: number, totalAPagar: number, transacoes: [] }
```

---

## 9. REGRAS GERAIS DA APLICAÇÃO

### 9.1 Internacionalização (i18n)

- Idiomas suportados: **PT-BR** (padrão), **EN**, **ES**
- Seletor no cabeçalho com bandeiras SVG reais (🇧🇷 🇺🇸 🇪🇸)
- Idioma persistido via MMKV
- **Zero strings hardcoded** em componentes — absolutamente tudo via chaves de tradução
- Inclui: labels, placeholders, mensagens de erro, tooltips, textos de confirmação, datas formatadas

Estrutura das chaves:
```json
// pt-BR/financeiro.json
{
  "despesa": {
    "titulo": "Despesas",
    "nova": "Nova Despesa",
    "campos": {
      "descricao": "Descrição",
      "valor": "Valor",
      "vencimento": "Data de Vencimento",
      "efetivacao": "Data de Efetivação"
    },
    "acoes": {
      "efetivar": "Efetivar Pagamento",
      "estornar": "Estornar",
      "ratear": "Ratear"
    },
    "status": {
      "pendente": "Pendente",
      "efetivada": "Efetivada",
      "estornada": "Estornada",
      "parcelada": "Parcelada"
    }
  }
}
```

### 9.2 Filtros Universais

Todo componente `<FiltroUniversal>` deve conter:
- **ID:** busca exata numérica
- **Descrição:** busca parcial (debounce 300ms, case-insensitive)
- **Data de Cadastro:** range (DatePicker de/até)
- **Slot extra:** campo configurável por módulo via `props.camposExtras`
- **Ações:** Botão "Filtrar", Botão "Limpar", Botão "Exportar CSV"
- Estado dos filtros persistido na URL (query params) para compartilhamento de link
- Skeleton durante carregamento de dados filtrados

### 9.3 Tabelas/Grids Configuráveis

- Ícone ⚙️ em cada tabela abre painel `<ConfigurarColunas>`
- Toggle individual por coluna com label traduzida
- Configuração salva via API por `usuarioId + rotaDaTela` (MMKV como fallback offline)
- Funcionalidades obrigatórias em toda tabela:
  - Ordenação por coluna (seta indicando direção)
  - Paginação com opções: 10 / 25 / 50 / 100 itens por página
  - Seleção múltipla de linhas (checkbox)
  - Ações em lote (aparecem quando há seleção)
  - Skeleton loader durante carregamento
  - Estado vazio com ilustração e mensagem traduzida

### 9.4 Sistema de Notificações

**Modal Geral de Avisos (`<ModalAviso>`):**
- Verificar avisos pendentes de ciência a cada login
- Exibir um aviso por vez em modal fullscreen com prioridade (Crítico → Alto → Normal)
- Botão "Ciente" confirma via `POST /api/avisos/{id}/dar-ciencia`
- Suporte a PDF inline e imagens em anexo
- Não pode ser fechado sem confirmar ciência

**Sininho (`<Sininho>`):**
- Badge numérico com contagem de não lidas
- Polling a cada 60 segundos para verificar novas notificações
- Dropdown com scroll mostrando últimas 10 notificações
- Cada item: ícone de tipo, título, resumo, data relativa (ex: "há 5 minutos")
- Clicar navega para conteúdo relacionado
- "Marcar todas como lidas" no topo do dropdown

---

## 10. DASHBOARD GLOBAL

**Rota:** `/dashboard` (protegida, requer autenticação)

**Comportamento:**
- Conteúdo filtrado por módulos ativos do usuário
- Grade responsiva com widgets arrastáveis via `@dnd-kit`
- Ordem salva por usuário via `usarPreferenciasStore`
- Botão "↺ Resetar Layout" visível no cabeçalho do dashboard
- Cada widget tem: título, ícone, botão de minimizar, indicador de carregamento individual

**Widgets do Módulo Financeiro:**

| Widget | Endpoint | Atualização |
|---|---|---|
| `<ResumoFinanceiro>` | `GET /dashboard/resumo` | Ao entrar na página |
| `<FluxoCaixa>` | `GET /dashboard/fluxo-caixa` | Ao entrar na página |
| `<DespesasCategoria>` | `GET /dashboard/despesas-categoria` | Ao entrar na página |
| `<CartoesCredito>` | Reutiliza lista de cartões | Cache 5min |
| `<ContasBancarias>` | Reutiliza lista de contas | Cache 5min |
| `<UltimasTransacoes>` | `GET /dashboard/ultimas-transacoes` | A cada 2min |

**Widget `<UltimasTransacoes>` — colunas:**

| Coluna | Visível por padrão | Regra |
|---|---|---|
| ID Transação | ✅ | |
| Tipo | ✅ | Badge colorido |
| Valor | ✅ | Negativo para despesas/estornos |
| Descrição | ✅ | Truncado em 40 chars + tooltip |
| Data Efetivação | ✅ | Formatada por locale |
| Tipo de Pagamento | ✅ | |
| Conta Bancária | ⚙️ Condicional | Exibir SOMENTE se tipo de pagamento = Débito / PIX / TED |

---

## 11. MÓDULO FINANCEIRO

> Renderizar apenas se `usarModuloAtivo('financeiro')` retornar `true`.

### 11.1 Enumeradores

```typescript
// src/constantes/enumeradores.ts
export enum TipoTransacao {
  DESPESA   = 'DESPESA',
  RECEITA   = 'RECEITA',
  REEMBOLSO = 'REEMBOLSO',
  ESTORNO   = 'ESTORNO',
}

export enum TipoPagamento {
  DINHEIRO  = 'DINHEIRO',
  PIX       = 'PIX',
  DEBITO    = 'DEBITO',
  CREDITO   = 'CREDITO',
  BOLETO    = 'BOLETO',
  TED_DOC   = 'TED_DOC',
}

export enum StatusDespesa {
  PENDENTE   = 'PENDENTE',
  EFETIVADA  = 'EFETIVADA',
  ESTORNADA  = 'ESTORNADA',
  PARCELADA  = 'PARCELADA',
}

export enum StatusReembolso {
  AGUARDANDO  = 'AGUARDANDO',
  EM_ANALISE  = 'EM_ANALISE',
  APROVADO    = 'APROVADO',
  PAGO        = 'PAGO',
  REJEITADO   = 'REJEITADO',
}

export enum StatusFatura {
  ABERTA   = 'ABERTA',
  FECHADA  = 'FECHADA',
  PAGA     = 'PAGA',
}

// Pagamentos com vínculo a conta bancária
export const PAGAMENTOS_COM_CONTA: TipoPagamento[] = [
  TipoPagamento.DEBITO,
  TipoPagamento.PIX,
  TipoPagamento.TED_DOC,
];
```

### 11.2 Tela de Despesas

**Campos do formulário:**

| Campo | Tipo | Obrigatoriedade |
|---|---|---|
| Descrição | TextInput | Obrigatório |
| Valor Total | NumberInput | Obrigatório |
| Data de Vencimento | DatePicker | Opcional |
| Data de Efetivação | DatePicker | Opcional |
| Tipo de Pagamento | Select | Obrigatório |
| Conta Bancária | Select | Obrigatório se tipo = DEBITO/PIX/TED |
| Cartão de Crédito | Select | Obrigatório se tipo = CREDITO |
| Centro de Custo | Select | Opcional |
| Conta Analítica | Select | Opcional (filtrada por conta sintética) |
| Conta Sintética | Select | Opcional |
| Parcelar em X vezes | NumberInput | Opcional (1 = sem parcelamento) |
| Tags | MultiSelect | Opcional |
| Observações | TextArea | Opcional |
| Anexo | FileUpload | Opcional (PDF/JPG/PNG até 10MB) |

**Regras de negócio da despesa:**
- Se "Parcelar em X vezes" > 1: gerar X registros vinculados (pai + filhos)
- Cada parcela herda: descrição + " - Parcela N/X", valor = total/X (arredondar última parcela), data de vencimento incrementada mensalmente
- Estorno disponível somente para status = EFETIVADA
- Rateio por amigos: usar `<SeletorAmigos>` para buscar contatos por nome, e-mail, CPF ou CNPJ; se o amigo não tiver cadastro, oferecer envio de convite inline; gerar cobrança pendente por participante
- Rateio por área: soma dos percentuais deve ser exatamente 100% (validar com Zod)
- Conta Bancária exibida na grid apenas quando `PAGAMENTOS_COM_CONTA.includes(tipoPagamento)`

**Filtros específicos (além dos universais):**
- Status (multi-select): Pendente / Efetivada / Estornada / Parcelada
- Data de Efetivação (range)
- Centro de Custo (select)
- Tipo de Pagamento (select)
- Faixa de Valor (mín / máx)

### 11.3 Tela de Receitas

Mesma estrutura da Tela de Despesas com as diferenças:
- "Tipo de Pagamento" → "Meio de Recebimento"
- "Efetivar Pagamento" → "Confirmar Recebimento"
- Sem campo "Cartão de Crédito"
- Sem vínculo obrigatório com cartão

### 11.4 Tela de Reembolso

**Regras críticas:**
- Não pode ser criado sem no mínimo 1 despesa vinculada
- Campo "Valor Total" = somatório das despesas vinculadas (calculado automaticamente, readonly)
- Adicionar despesa: modal de busca de despesas com filtros
- Remover despesa: recalcula total automaticamente
- Efetivação disponível apenas para status = APROVADO

**Campos adicionais:**
- Solicitante (usuário — select)
- Responsável pela Aprovação (usuário — select)
- Data de Solicitação
- Data de Aprovação/Pagamento
- Motivo da Rejeição (obrigatório quando status → REJEITADO)
- Anexos (múltiplos comprovantes)

### 11.5 Conta Bancária

**Extrato:**
- Timeline cronológica de transações (receitas em verde, despesas em vermelho)
- Saldo anterior (início do período) e saldo atual (fim do período)
- Filtro por período (DatePicker de/até)
- Botão "Exportar CSV" e "Exportar PDF"

### 11.6 Cartão de Crédito

**Faturas:**
- Seletor de mês/ano no topo
- Status da fatura em badge
- Listagem de todas as despesas daquele período
- Totais: total em aberto, total parcelado, total à vista
- Ação "Pagar Fatura": modal com valor, data de pagamento, conta bancária → efetiva débito na conta vinculada

---

## 12. MÓDULO DE AMIGOS E CONTATOS

> Acessível a todos os usuários autenticados via menu lateral.
> Os contatos cadastrados aqui são a fonte única de verdade para funcionalidades
> que envolvem terceiros — rateio de despesas/receitas, reembolsos, etc.
> Módulo desacoplado: qualquer módulo futuro pode consumir `<SeletorAmigos>` sem depender do módulo financeiro.

### 12.1 Tipos e Enumeradores

```typescript
// src/constantes/enumeradores.ts (adicionar)

export enum TipoAmigo {
  PESSOA_FISICA   = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}

export enum StatusAmigo {
  ATIVO      = 'ATIVO',       // Contato cadastrado manualmente e ativo
  INATIVO    = 'INATIVO',     // Contato desativado
  CONVIDADO  = 'CONVIDADO',   // Convite enviado, ainda não aceito
  VINCULADO  = 'VINCULADO',   // Amigo que também é usuário da plataforma
}

export enum StatusConvite {
  PENDENTE   = 'PENDENTE',
  ACEITO     = 'ACEITO',
  EXPIRADO   = 'EXPIRADO',
  CANCELADO  = 'CANCELADO',
}
```

```typescript
// src/tipos/amigo.tipos.ts

export interface InterfaceAmigo {
  id:               number;
  nomeCompleto:     string;
  apelido?:         string;           // Nome de exibição curto (ex: "João P.")
  tipo:             TipoAmigo;
  cpf?:             string;           // Apenas PF — armazenar sem máscara
  cnpj?:            string;           // Apenas PJ — armazenar sem máscara
  email?:           string;
  telefone?:        string;
  avatar?:          string;           // URL da imagem
  status:           StatusAmigo;
  usuarioVinculadoId?: number;        // ID do usuário da plataforma (se VINCULADO)
  observacoes?:     string;
  dataCadastro:     string;
  dataAtualizacao:  string;
}

export interface InterfaceConvite {
  id:           number;
  emailDestino: string;
  nomeAmigo?:   string;
  mensagem?:    string;
  status:       StatusConvite;
  dataCriacao:  string;
  dataExpiracao: string;
  amigoId?:     number;             // Preenchido após aceite
}

// Payload leve para uso em selects/modais de rateio
export interface InterfaceAmigoResumido {
  id:              number;
  nomeExibicao:    string;          // apelido ?? nomeCompleto
  documento?:      string;          // CPF formatado ou CNPJ formatado
  tipoDocumento?:  'CPF' | 'CNPJ';
  avatar?:         string;
  status:          StatusAmigo;
}

// Item de rateio usado em despesa/receita
export interface InterfaceParticipanteRateio {
  amigo:           InterfaceAmigoResumido;
  valorFixo?:      number;          // Valor em R$ atribuído a este participante
  percentual?:     number;          // Percentual (0–100); mutuamente exclusivo com valorFixo
  quitado:         boolean;         // Se já pagou sua parte
  dataQuitacao?:   string;
}
```

### 12.2 Tela de Amigos e Contatos — CRUD Completo

**Rota:** `/amigos`

**Layout da listagem:**
- Alternável entre visualização em **cards** (`<CartaoAmigo>`) e **tabela** (`<Tabela>`)
- Barra de busca rápida com debounce 300ms — pesquisa simultaneamente em: nome, apelido, e-mail, CPF, CNPJ
- Filtros: Tipo (PF / PJ), Status, Data de Cadastro
- Indicador visual de status: badge colorido (Ativo 🟢, Inativo ⚫, Convidado 🟡, Vinculado 🔵)
- Para contatos com `status = VINCULADO`: exibir avatar do usuário da plataforma

**Campos do formulário de cadastro:**

| Campo | Tipo | Obrigatoriedade | Regra |
|---|---|---|---|
| Tipo de Pessoa | Radio (PF / PJ) | Obrigatório | Altera campos exibidos |
| Nome Completo / Razão Social | TextInput | Obrigatório | |
| Apelido / Nome Fantasia | TextInput | Opcional | Usado como nome de exibição |
| CPF | TextInput com máscara | Obrigatório se PF | Validação Zod (algoritmo CPF) |
| CNPJ | TextInput com máscara | Obrigatório se PJ | Validação Zod (algoritmo CNPJ) |
| E-mail | TextInput | Opcional | Validação de formato |
| Telefone | TextInput com máscara | Opcional | |
| Avatar | ImagePicker | Opcional | Upload ou URL |
| Observações | TextArea | Opcional | |

**Regras de negócio:**
- CPF e CNPJ são validados com algoritmo completo via Zod (não apenas formato)
- CPF e CNPJ devem ser únicos por usuário (não permitir duplicata na lista de contatos)
- Não é permitido excluir um amigo que possua rateios pendentes não quitados — exibir aviso com lista de pendências
- Ao inativar um amigo com pendências: exibir alerta, mas permitir a inativação
- Um contato `VINCULADO` não pode ter CPF/CNPJ alterados manualmente (sincronizado via plataforma)

**Ações disponíveis por registro:**

| Ação | Condição | Comportamento |
|---|---|---|
| Editar | Sempre | Abre formulário de edição |
| Inativar / Ativar | Sempre | Altera status; confirma se houver pendências |
| Excluir | Sem rateios pendentes | Confirmação obrigatória |
| Convidar para a plataforma | Status ≠ VINCULADO e tem e-mail | Abre `<ModalConvite>` |
| Ver Pendências | Sempre | Abre modal com resumo financeiro do contato |
| Ver Histórico de Rateios | Sempre | Navega para `/amigos/{id}` aba "Histórico" |

### 12.3 Tela de Detalhe do Amigo

**Rota:** `/amigos/{id}`

Organizada em **abas**:

**Aba "Dados Cadastrais":**
- Exibe e permite editar os dados do contato
- Se `status = VINCULADO`: mostra card do perfil do usuário vinculado (somente leitura)

**Aba "Pendências Financeiras":**
- Total a receber deste amigo (soma de rateios onde ele deve ao usuário logado)
- Total a pagar a este amigo (soma de rateios onde o usuário logado deve a ele)
- Tabela com cada rateio: descrição, tipo (Despesa/Receita), valor, data, status (Quitado/Pendente)
- Botão "Marcar como Quitado" por item (confirma via API)

**Aba "Histórico de Rateios":**
- Todas as transações compartilhadas com este contato
- Filtros: período, tipo de transação, status
- Exportar CSV

### 12.4 Modal de Convite (`<ModalConvite>`)

Campos:
- E-mail de destino (pré-preenchido se o contato tiver e-mail cadastrado)
- Nome do amigo (pré-preenchido)
- Mensagem personalizada (opcional, textarea)

Comportamento:
- Chama `POST /api/amigos/convidar`
- Exibe confirmação com data de expiração do convite (padrão: 7 dias)
- Lista convites pendentes abaixo (com opção de reenviar ou cancelar)

### 12.5 Tela de Gerenciamento de Convites

**Rota:** `/amigos/convite`

- Tabela de convites enviados com colunas: E-mail, Nome, Status, Data de Envio, Expira em
- Ações por convite: Reenviar (cria novo token), Cancelar
- Badge contador de convites pendentes no menu lateral

### 12.6 Componente Reutilizável `<SeletorAmigos>`

> Este é o componente central de integração entre o Módulo de Amigos e os demais módulos.
> Deve ser completamente independente e reutilizável em qualquer contexto.

```typescript
// Interface do componente
interface PropsSeletorAmigos {
  // Configuração
  modoSelecao:        'simples' | 'multiplo';
  modoRateio?:        'valor_fixo' | 'percentual' | 'ambos'; // undefined = apenas seleção
  valorTotalRateio?:  number;      // Necessário quando modoRateio está ativo

  // Estado controlado
  selecionados:       InterfaceParticipanteRateio[];
  onChange:           (participantes: InterfaceParticipanteRateio[]) => void;

  // Callbacks
  onConvidarNovo?:    (email: string) => void;  // Abre ModalConvite

  // Apresentação
  placeholder?:       string;
  desabilitado?:      boolean;
  erroMensagem?:      string;     // Exibe erro (ex: "soma ≠ 100%")
}
```

**Comportamento do componente:**
- Campo de busca com debounce 300ms que chama `GET /api/amigos/buscar?q=<termo>`
- Pesquisa simultânea em: nome, apelido, e-mail, CPF, CNPJ
- Resultados em dropdown com avatar, nome de exibição, documento e badge de status
- Se nenhum resultado encontrado E o campo parece um e-mail válido: exibir opção "Convidar [email] para a plataforma"
- Quando `modoRateio` ativo:
  - Campo de valor fixo OU percentual por participante adicionado
  - Indicador de soma atual vs. valor total (barra de progresso rosa)
  - Erro em tempo real se soma ≠ 100% (percentual) ou soma > valorTotal (fixo)
  - Botão "Distribuir igualmente" calcula e preenche valores automaticamente

**Uso nos módulos:**

```typescript
// Exemplo em ModalRateio de Despesa
<SeletorAmigos
  modoSelecao="multiplo"
  modoRateio="percentual"
  valorTotalRateio={despesa.valor}
  selecionados={participantes}
  onChange={setParticipantes}
  erroMensagem={errors.participantes?.message}
/>
```

### 12.7 Validações Zod Obrigatórias

```typescript
// src/modulos/amigos/validacoes/amigo.schema.ts

import { z } from 'zod';
import { validarCPF, validarCNPJ } from '../../../utils/validacoes';

export const schemaCadastroPessoaFisica = z.object({
  tipo:          z.literal('PESSOA_FISICA'),
  nomeCompleto:  z.string().min(3, 'Nome muito curto').max(150),
  apelido:       z.string().max(50).optional(),
  cpf:           z.string().refine(validarCPF, { message: 'CPF inválido' }),
  email:         z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone:      z.string().optional(),
  observacoes:   z.string().max(500).optional(),
});

export const schemaCadastroPessoaJuridica = z.object({
  tipo:          z.literal('PESSOA_JURIDICA'),
  nomeCompleto:  z.string().min(3).max(200),   // Razão social
  apelido:       z.string().max(100).optional(), // Nome fantasia
  cnpj:          z.string().refine(validarCNPJ, { message: 'CNPJ inválido' }),
  email:         z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone:      z.string().optional(),
  observacoes:   z.string().max(500).optional(),
});

export const schemaCadastroAmigo = z.discriminatedUnion('tipo', [
  schemaCadastroPessoaFisica,
  schemaCadastroPessoaJuridica,
]);

export const schemaConvite = z.object({
  emailDestino:  z.string().email('E-mail inválido'),
  nomeAmigo:     z.string().min(2).optional(),
  mensagem:      z.string().max(500).optional(),
});

export const schemaRateioPercentual = z.object({
  participantes: z.array(z.object({
    amigoId:    z.number(),
    percentual: z.number().min(0.01).max(100),
  })).refine(
    (itens) => Math.abs(itens.reduce((acc, i) => acc + i.percentual, 0) - 100) < 0.01,
    { message: 'A soma dos percentuais deve ser exatamente 100%' },
  ),
});

export const schemaRateioValorFixo = (valorTotal: number) =>
  z.object({
    participantes: z.array(z.object({
      amigoId:    z.number(),
      valorFixo:  z.number().min(0.01),
    })).refine(
      (itens) => Math.abs(itens.reduce((acc, i) => acc + i.valorFixo, 0) - valorTotal) < 0.01,
      { message: `A soma dos valores deve ser igual a ${valorTotal}` },
    ),
  });
```

### 12.8 Permissões do Módulo de Amigos

Adicionar à árvore de permissões do Módulo de Administração:

```
Módulo Amigos e Contatos
├── Contatos
│   ├── Visualizar       [ toggle ]
│   ├── Criar            [ toggle ]
│   ├── Editar           [ toggle ]
│   ├── Excluir          [ toggle ]
│   └── Ver Pendências   [ toggle ]
└── Convites
    ├── Enviar           [ toggle ]
    └── Gerenciar        [ toggle ]
```

---

## 13. MÓDULO DE ADMINISTRAÇÃO

> Renderizar apenas se `usarPermissao('ADMIN')` retornar `true`.
> Layout isolado com botão "← Voltar ao Sistema" em destaque no cabeçalho.

### 13.1 Simulação de Usuário

- Botão "Simular este Usuário" na tela de usuários
- Chama `POST /api/admin/usuarios/{id}/iniciar-simulacao`
- API retorna tokens do usuário simulado
- Front-end deve:
  1. Salvar estado atual do admin em `usarSimulacaoStore`
  2. Carregar tokens e perfil do usuário simulado
  3. Renderizar banner PERMANENTE e FIXO no topo:
     ```
     ⚠️  MODO SIMULAÇÃO — Você está visualizando o sistema como [Nome do Usuário]
                           [Encerrar Simulação]
     ```
  4. Banner: fundo laranja `#FF8C00`, texto preto, z-index máximo
  5. "Encerrar Simulação" chama `POST /api/admin/simulacao/encerrar` e restaura sessão do admin

### 13.2 Árvore de Permissões

Estrutura hierárquica completa:
```
Módulo Financeiro
├── Despesas
│   ├── Visualizar       [ toggle ]
│   ├── Criar            [ toggle ]
│   ├── Editar           [ toggle ]
│   ├── Excluir          [ toggle ]
│   ├── Efetivar         [ toggle ]
│   ├── Estornar         [ toggle ]
│   └── Ratear           [ toggle ]
├── Receitas             (mesma estrutura)
├── Reembolsos           (mesma estrutura)
└── ...demais telas

Módulo Amigos e Contatos
├── Contatos
│   ├── Visualizar       [ toggle ]
│   ├── Criar            [ toggle ]
│   ├── Editar           [ toggle ]
│   ├── Excluir          [ toggle ]
│   └── Ver Pendências   [ toggle ]
└── Convites
    ├── Enviar           [ toggle ]
    └── Gerenciar        [ toggle ]

Módulo Administração
├── Usuários             (CRUD)
├── Permissões           (Visualizar/Editar)
├── Documentos           (CRUD)
└── Avisos               (CRUD/Publicar)
```

---

## 14. SEGURANÇA E AUTORIZAÇÃO

### 14.1 Guards de Rota

```typescript
// Implementar como Higher-Order Component e como hook

// Hook
const { podeAcessar } = usarPermissao();
if (!podeAcessar('financeiro.despesas.visualizar')) return <AcessoNegado />;

// Guard de rota (Expo Router middleware)
// app/principal/_layout.tsx
export default function LayoutPrincipal() {
  const { estaAutenticado } = usarAutenticacaoStore();
  if (!estaAutenticado) return <Redirect href="/entrar" />;
  return <Slot />;
}
```

### 14.2 Guard de Funcionalidade

Botões e ações devem ser ocultados (não apenas desabilitados) quando o usuário não tem permissão:

```typescript
// Componente wrapper
<GuardPermissao permissao="financeiro.despesas.efetivar">
  <BotaoAcao onPress={abrirModalEfetivacao} label={t('despesa.acoes.efetivar')} />
</GuardPermissao>
```

### 14.3 Logout Seguro

```typescript
const deslogarCompletamente = async () => {
  await api.post('/autenticacao/sair').catch(() => {}); // Ignorar erro de rede
  await limparTokens();
  usarAutenticacaoStore.getState().deslogar();
  usarPreferenciasStore.getState().limparPreferenciasVolateis();
  queryClient.clear(); // Limpar cache do React Query
  router.replace('/entrar');
};
```

---

## 15. REQUISITOS TÉCNICOS

### 15.1 Performance

- Lazy loading de módulos via `React.lazy` + `Suspense` com `<EsqueletoCarregamento>`
- Virtualização: `FlashList` (mobile), `react-window` (web) para listas > 50 itens
- `React.memo` em componentes de lista (obrigatório), com comentário justificando
- `useMemo` e `useCallback` somente onde há evidência de custo real
- Debounce 300ms em campos de filtro por texto
- Skeleton loaders em TODOS os estados de carregamento (nunca usar spinner genérico)
- Cache com React Query: `staleTime: 5 * 60 * 1000` (5min) para dados estáticos

### 15.2 Responsividade

| Breakpoint | Largura | Comportamento |
|---|---|---|
| Mobile | < 768px | Menu como drawer, tabelas com scroll horizontal, widgets empilhadas |
| Tablet | 768px – 1024px | Menu fixo colapsável (ícones), grid 2 colunas |
| Desktop | > 1024px | Menu fixo expandido, grid completa, todos os recursos visíveis |

### 15.3 Testes Obrigatórios (cobertura mínima 70%)

Testar obrigatoriamente:
- `usarFiltro.ts` — todas as combinações de filtros
- `usarPaginacao.ts` — navegação e limites
- `usarPermissao.ts` — cenários com/sem permissão
- `usarRateio.ts` — validação de soma = 100%
- `usarAmigos.ts` — busca, cadastro, inativação com pendências
- `usarBuscarAmigo.ts` — busca por nome, e-mail, CPF e CNPJ
- `SeletorAmigos` — seleção simples, múltipla e modo rateio
- `amigo.schema.ts` — CPF válido, CPF inválido, CNPJ válido, CNPJ inválido, e-mail, discriminatedUnion PF/PJ
- `schemaRateioPercentual` — soma = 100%, soma ≠ 100%, arredondamento
- `schemaRateioValorFixo` — soma = total, soma > total, soma < total
- `Tabela` component — ocultação e restauração de colunas
- `despesa.schema.ts` — todos os casos de validação Zod
- `reembolso` — não criar sem despesa vinculada
- `armazenamento.ts` — salvar e recuperar tokens
- Store de autenticação — todos os fluxos de estado

### 15.4 Variáveis de Ambiente

```bash
# .env.example
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_NAME=Core
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_POLLING_NOTIFICACOES_MS=60000
EXPO_PUBLIC_STALE_TIME_CACHE_MS=300000
EXPO_PUBLIC_TIMEOUT_REQUISICAO_MS=30000
```

---

## 16. PLANO DE FASES DE DESENVOLVIMENTO

> O agente DEVE seguir esta ordem. Não avançar sem confirmação ao final de cada fase.

### FASE 1 — Infraestrutura e Design System
**Duração estimada:** 1–2 dias

Entregas:
- [ ] Projeto Expo criado com TypeScript strict
- [ ] Estrutura de pastas completa conforme arquitetura definida
- [ ] Design tokens implementados (`src/constantes/temas.ts`)
- [ ] NativeWind configurado com tema customizado
- [ ] i18n configurado com PT-BR, EN e ES (chaves básicas)
- [ ] MSW configurado com handlers vazios
- [ ] `.env.example` com todas as variáveis
- [ ] Componentes base: `Botao`, `CampoTexto`, `Modal`, `EsqueletoCarregamento`
- [ ] Testes unitários dos componentes base

**Confirmação necessária antes de avançar:** ✋

---

### FASE 2 — Autenticação e Layout Principal
**Duração estimada:** 1–2 dias

Entregas:
- [ ] Tela de login com validação Zod
- [ ] Tela de recuperação de senha
- [ ] Instância Axios com interceptor de refresh token completo
- [ ] `usarAutenticacaoStore` com todos os estados
- [ ] `usarArmazenamento` (tokens seguros)
- [ ] Guards de rota (autenticação + módulo + funcionalidade)
- [ ] Layout principal: `<MenuLateral>` + `<Cabecalho>` + `<Sininho>` + `<SeletorIdioma>`
- [ ] Menu lateral com Dropdowns por módulo e funcionalidade de colapsar
- [ ] Mock de login no MSW
- [ ] Testes: fluxo de auth, refresh token, guards

**Confirmação necessária antes de avançar:** ✋

---

### FASE 3 — Sistema de Notificações
**Duração estimada:** 1 dia

Entregas:
- [ ] `<ModalAviso>` com confirmação de ciência
- [ ] `<Sininho>` com polling a cada 60s
- [ ] `usarNotificacaoStore` completo
- [ ] Integração com endpoints de notificação (via MSW)
- [ ] Testes: modal de aviso, sininho, polling

**Confirmação necessária antes de avançar:** ✋

---

### FASE 4 — Componentes Genéricos Reutilizáveis
**Duração estimada:** 1–2 dias

Entregas:
- [ ] `<FiltroUniversal>` com persistência em query params
- [ ] `<Tabela>` com: ordenação, paginação, seleção múltipla, configuração de colunas
- [ ] `<ConfigurarColunas>` com persistência via API + fallback MMKV
- [ ] `<UploadArquivo>` com preview
- [ ] `<VisualizadorPdf>` inline
- [ ] Hooks: `usarFiltro`, `usarPaginacao`, `usarPreferenciasTabela`
- [ ] Testes: tabela (colunas), filtro, paginação

**Confirmação necessária antes de avançar:** ✋

---

### FASE 5 — Dashboard Global
**Duração estimada:** 1–2 dias

Entregas:
- [ ] `<GradeWidgets>` com Drag & Drop (@dnd-kit)
- [ ] Persistência de ordem via `usarPreferenciasStore`
- [ ] Botão "Resetar Layout"
- [ ] Todos os widgets do módulo financeiro
- [ ] `<UltimasTransacoes>` com coluna condicional de conta bancária
- [ ] Gráficos com abstração cross-platform (Victory/Recharts)
- [ ] Mocks MSW para todos os endpoints do dashboard
- [ ] Responsividade: empilhado mobile, grade desktop

**Confirmação necessária antes de avançar:** ✋

---

### FASE 6 — Módulo Financeiro: Cadastros Base
**Duração estimada:** 2 dias

Entregas:
- [ ] CRUD: Centro de Custo (com hierarquia)
- [ ] CRUD: Conta Sintética
- [ ] CRUD: Conta Analítica (vinculada à sintética)
- [ ] CRUD: Conta Bancária + Extrato
- [ ] CRUD: Cartão de Crédito + Faturas
- [ ] Filtros, tabelas configuráveis e exportação CSV
- [ ] Testes unitários dos hooks e schemas

**Confirmação necessária antes de avançar:** ✋

---

### FASE 7 — Módulo de Amigos e Contatos
**Duração estimada:** 2 dias

Entregas:
- [ ] Enumeradores: `TipoAmigo`, `StatusAmigo`, `StatusConvite`
- [ ] Tipos TypeScript: `InterfaceAmigo`, `InterfaceConvite`, `InterfaceAmigoResumido`, `InterfaceParticipanteRateio`
- [ ] CRUD completo da tela `/amigos` (listagem em cards e tabela)
- [ ] Busca simultânea por nome, e-mail, CPF e CNPJ com debounce
- [ ] Validações Zod: CPF (algoritmo), CNPJ (algoritmo), e-mail, `discriminatedUnion` PF/PJ
- [ ] Tela de detalhe `/amigos/{id}` com abas (Dados, Pendências, Histórico)
- [ ] `<ModalConvite>` com envio de e-mail e listagem de convites pendentes
- [ ] Tela `/amigos/convite` — gerenciamento de convites
- [ ] Componente `<SeletorAmigos>` com modos: simples, múltiplo, rateio por percentual, rateio por valor fixo
- [ ] Hook `usarBuscarAmigo.ts` com cache React Query
- [ ] `usarAmigosStore.ts` com lista em cache
- [ ] Mock MSW completo para todos os endpoints de amigos
- [ ] Testes: schemas Zod (CPF/CNPJ válido e inválido), `<SeletorAmigos>` (rateio 100%), inativação com pendências
- [ ] Bloquear exclusão quando existem rateios pendentes (exibir lista de pendências)
- [ ] Botão "Distribuir igualmente" no `<SeletorAmigos>`

**Confirmação necessária antes de avançar:** ✋

---

### FASE 8 — Módulo Financeiro: Despesas e Receitas
**Duração estimada:** 2–3 dias

Entregas:
- [ ] CRUD completo de Despesas
- [ ] Parcelamento com régua de parcelas
- [ ] Modal de Efetivação
- [ ] Modal de Estorno (somente efetivadas)
- [ ] Modal de Rateio usando `<SeletorAmigos>` integrado (amigos e por área)
- [ ] CRUD completo de Receitas (mesma estrutura)
- [ ] Todos os filtros específicos
- [ ] Testes: validação Zod, rateio percentual e valor fixo, efetivação, estorno

**Confirmação necessária antes de avançar:** ✋

---

### FASE 9 — Módulo Financeiro: Reembolso e Documentação
**Duração estimada:** 1–2 dias

Entregas:
- [ ] CRUD de Reembolso com vínculo obrigatório de despesas
- [ ] Cálculo automático do valor total
- [ ] Modal de busca e seleção de despesas
- [ ] Fluxo de status (Aguardando → Aprovado → Pago / Rejeitado)
- [ ] Tela de Documentação do módulo com visualizador PDF
- [ ] Testes: reembolso sem despesa, cálculo automático

**Confirmação necessária antes de avançar:** ✋

---

### FASE 10 — Módulo de Administração
**Duração estimada:** 2–3 dias

Entregas:
- [ ] Subsistema Admin com layout isolado e botão "Voltar"
- [ ] Dashboard Admin com métricas
- [ ] CRUD de Usuários com redefinição de senha
- [ ] Simulação de usuário com banner laranja permanente
- [ ] Árvore de Permissões com toggles e herança (incluindo módulo Amigos)
- [ ] CRUD de Documentos com upload e versionamento
- [ ] CRUD de Avisos com editor rich text e publicação
- [ ] Relatório de ciência por aviso
- [ ] Testes: simulação, permissões

**Confirmação necessária antes de avançar:** ✋

---

### FASE 11 — Polimento, Testes e Documentação
**Duração estimada:** 2 dias

Entregas:
- [ ] Cobertura de testes ≥ 70% verificada
- [ ] Build web sem erros (`npx expo export --platform web`)
- [ ] Build mobile sem erros (`npx expo build`)
- [ ] Verificação de nomenclatura pt-BR (grep)
- [ ] Zero strings hardcoded (grep)
- [ ] `/docs/manual-usuario.md` completo
- [ ] `/docs/manual-tecnico.md` com diagrama Mermaid
- [ ] `/docs/instalacao.md` com troubleshooting
- [ ] README.md atualizado

**Entrega final:** ✅

---

## 17. ENTREGÁVEIS OBRIGATÓRIOS

### Código-Fonte
- Repositório organizado conforme estrutura de pastas
- `.gitignore` configurado (node_modules, .env, build)
- `.env.example` com todas as variáveis documentadas
- `README.md` com visão geral, badges de status e link para documentação

### `/docs/manual-usuario.md`
Seções obrigatórias:
1. Introdução e visão geral da aplicação
2. Primeiros passos (login, troca de idioma, notificações)
3. Dashboard — como interpretar e reorganizar widgets
4. Módulo Financeiro — guia completo de cada tela
5. Módulo de Amigos e Contatos — cadastrar, buscar, convidar e ver pendências
6. Configuração de colunas nas tabelas
7. Gerenciamento de notificações e avisos
8. FAQ com dúvidas comuns

### `/docs/manual-tecnico.md`
Seções obrigatórias:
1. Arquitetura geral e decisões técnicas justificadas
2. Diagrama de componentes em Mermaid
3. Fluxo de autenticação + refresh token (diagrama de sequência)
4. Estrutura dos stores Zustand (todos os slices)
5. Contratos de API completos (método, rota, payload tipado, response tipado)
6. Sistema de permissões — hierarquia e herança
7. Componente `<SeletorAmigos>` — guia de integração com outros módulos
8. Validações de CPF e CNPJ — algoritmo e casos de teste
9. Como adicionar um novo módulo (passo a passo)
10. Como adicionar uma nova tradução

### `/docs/instalacao.md`
Seções obrigatórias:
1. Pré-requisitos (Node 18+, Expo CLI, versões exatas)
2. Clone e configuração do `.env`
3. Instalação de dependências
4. Executar em desenvolvimento — web: `npx expo start --web`
5. Executar em desenvolvimento — mobile: `npx expo start`
6. Executar testes: `jest --coverage`
7. Build de produção — web e mobile
8. Configurar e usar o MSW (mock server)
9. Troubleshooting: erros comuns e soluções

---

## 18. CHECKLIST DE QUALIDADE

> O código só está pronto e pode ser entregue quando TODOS os itens estiverem marcados.

### Código
- [ ] Zero strings hardcoded em componentes (verificar com `grep -r "\"[A-Z]" src/componentes`)
- [ ] Zero `any` não justificado no TypeScript (`npx tsc --noEmit` sem erros)
- [ ] Toda nomenclatura em pt-BR (validado com grep)
- [ ] Nenhum `console.log` em código de produção
- [ ] Todos os `TODO` e `FIXME` resolvidos ou documentados

### Funcionalidades
- [ ] Login → Dashboard funcionando via MSW
- [ ] Refresh token automático (testar com token expirado no mock)
- [ ] Modal de avisos exibido até ciência do usuário
- [ ] Sininho atualizado via polling
- [ ] Configuração de colunas salva e restaurada
- [ ] Ordem de widgets do dashboard salva e restaurada
- [ ] Drag & Drop funcionando em web e mobile
- [ ] Simulação de usuário com banner permanente laranja
- [ ] CRUD de Amigos: cadastro de PF (CPF validado) e PJ (CNPJ validado)
- [ ] Busca de amigos simultânea por nome, e-mail, CPF e CNPJ
- [ ] Convite por e-mail funcional (endpoint mockado)
- [ ] Exclusão bloqueada para amigos com rateios pendentes
- [ ] `<SeletorAmigos>` modo rateio percentual: valida soma = 100%
- [ ] `<SeletorAmigos>` modo rateio valor fixo: valida soma = valor total
- [ ] `<SeletorAmigos>` botão "Distribuir igualmente" funcional
- [ ] Aba "Pendências" do detalhe do amigo exibe totais corretos
- [ ] Rateio valida soma = 100% (erro Zod se diferente)
- [ ] Reembolso bloqueia criação sem despesa vinculada
- [ ] Valor do reembolso calculado automaticamente e readonly
- [ ] Estorno disponível somente para transações efetivadas
- [ ] Conta Bancária na grid de transações: condicional por tipo de pagamento
- [ ] Exportação CSV funcionando nas tabelas
- [ ] i18n: PT-BR, EN e ES funcionando em todas as telas (incluindo módulo Amigos)

### Qualidade
- [ ] Testes passando: `jest --ci --coverage` ≥ 70%
- [ ] Build web sem erros: `npx expo export --platform web`
- [ ] Build mobile sem erros: `npx expo prebuild && npx expo run:android`
- [ ] Responsividade validada em mobile (375px), tablet (768px) e desktop (1280px)
- [ ] Acessibilidade básica: labels em todos os campos, contraste mínimo WCAG AA

### Documentação
- [ ] `manual-usuario.md` completo
- [ ] `manual-tecnico.md` com diagramas Mermaid
- [ ] `instalacao.md` com troubleshooting
- [ ] `README.md` atualizado
- [ ] `.env.example` com todas as variáveis documentadas

---

*Fim do guia. Versão 1.0 — Core.*
*API Backend: .NET (a ser desenvolvida separadamente seguindo os contratos das Seções 8.3–8.6)*
