# AGENTS.md — Core Front

## Visão geral

Aplicação React Native multiplataforma (Web, Android e iOS) de gestão pessoal e financeira.
Leia o `README.md` para entender stack, módulos, configuração e como executar o projeto.

---

## Skills

Identifique o tipo de tarefa e leia o skill correspondente **antes de escrever qualquer código**.
Quando a tarefa envolver mais de um tipo, leia todos os skills relevantes.

| Tipo de tarefa                                              | Skill                                             |
|-------------------------------------------------------------|---------------------------------------------------|
| Implementar, corrigir ou revisar código e arquitetura       | `.codex/skills/react-native-senior.md`            |
| Interface, layout, responsividade ou fluxo de telas         | `.codex/skills/react-native-uix.md`               |
| Criar, ajustar ou investigar testes                         | `.codex/skills/sdet-react-native-tests.md`        |
| Adicionar ou corrigir traduções i18n                        | `.codex/skills/i18n-traducao-segura.md`           |
| Criar ou atualizar documentação técnica ou de usuário       | `.codex/skills/documentar-regras-sistema.md`      |
| Commit                                                      | `.codex/skills/semantic-commit.md`                |

---

## Regras inegociáveis

Estas regras se aplicam a qualquer tarefa, independente do skill ativo.

### Nomenclatura
Toda nomenclatura deve estar em **PT-BR** sem exceção: pastas, arquivos, componentes, funções, variáveis, tipos, stores e enums.
Exceções permitidas apenas para APIs de bibliotecas externas e palavras-chave do TypeScript/JavaScript.

### Código
- TypeScript strict — zero `any` não justificado
- Zero strings hardcoded em componentes — tudo via chaves i18n
- Nenhum `console.log` em código de produção
- Isolar regras de negócio em hooks e serviços, nunca nas telas

### i18n
Qualquer texto novo ou alterado deve estar presente nos três idiomas: **PT-BR**, **EN-US** e **ES-ES**.

### Segurança
- Nunca versionar `.env`, tokens, senhas ou chaves reais
- `accessToken` → MMKV | `refreshToken` → SecureStore (mobile) / sessionStorage (web)

### Documentação
- Documentação técnica → `documentação tecnica/`
- Documentação de usuário → `documentação do sistema/`

### Commits
Sempre em PT-BR com semântica convencional. Leia `.codex/skills/semantic-commit.md`.

---

## Estrutura de pastas relevante

```
app/                   # Rotas (Expo Router)
src/
  componentes/         # Componentes reutilizáveis — sem regra de negócio
  modulos/             # Lógica por domínio (hooks, serviços, tipos, validações, testes)
  servicos/            # Axios com interceptors de autenticação
  store/               # Estado global (Zustand por módulo)
  hooks/               # Hooks compartilhados
  i18n/                # Traduções PT-BR · EN-US · ES-ES
  tipos/               # Interfaces e tipos TypeScript
  utils/               # Formatações, validações, armazenamento
__tests__/             # Testes globais e utilitários de teste
documentação tecnica/  # Documentação de integração e regras de frontend
documentação do sistema/ # Documentação para usuário final
```

---

## Validação antes de concluir

Antes de encerrar qualquer tarefa que altere código:

1. **Testes** — rodar o escopo afetado:
   ```bash
   npm test -- --testPathPattern=<modulo>
   ```
2. **Suite completa** — obrigatório ao tocar autenticação, stores globais ou interceptors:
   ```bash
   npm test -- --watchAll=false --coverage
   ```
3. **Nomenclatura** — confirmar PT-BR em todos os artefatos criados ou alterados
4. **i18n** — confirmar que PT-BR, EN-US e ES-ES estão sincronizados
5. **Strings hardcoded** — confirmar ausência em componentes
6. **Commit** — semântico, em PT-BR, apenas com arquivos da mudança