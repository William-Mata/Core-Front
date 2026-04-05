# AGENTS.md

## Contexto do projeto

Leia o `README.md` na raiz antes de qualquer tarefa. Ele é a fonte de verdade sobre stack, módulos, configuração e como executar o projeto.

---

## Skills disponíveis

Leia o arquivo do skill correspondente antes de iniciar a tarefa.

| Situação                                                              | Skill a carregar                    |
|-----------------------------------------------------------------------|-------------------------------------|
| Definir estratégia de testes, criar/ajustar testes, investigar falhas | `.codex/skills/sdet.md`             |
| Fazer staging e escrever mensagem de commit                           | `.codex/skills/semantic-commit.md`  |

> Se houver outros skills na pasta `.codex/skills/`, verifique se algum é relevante para a tarefa antes de começar.

---

## Regras gerais

- **Toda** nomenclatura em **PT-BR** sem exceção: pastas, arquivos, componentes, funções, variáveis, tipos, stores, enums. Exceções apenas para APIs externas e palavras-chave do TypeScript/JavaScript.
- Zero `any` não justificado — TypeScript strict.
- Zero strings hardcoded em componentes — tudo via chaves i18n.
- Nenhum `console.log` em código de produção.
- Commits sempre em PT-BR com semântica convencional.
- Nunca versionar `.env`, tokens, secrets ou chaves reais.
- Em formulários, todo campo obrigatório deve exibir `*` no label ou no padrão visual adotado pelo sistema.
- A regra do `*` também vale para campos condicionalmente obrigatórios.
- Campos opcionais não devem exibir `*`.

---

## Validação padrão

Antes de encerrar qualquer tarefa que altere código:

1. Rodar testes do escopo afetado:
   ```bash
   npm test -- --testPathPattern=<modulo>
   ```
2. Rodar suite completa ao tocar contratos compartilhados, stores, interceptors ou autenticação:
   ```bash
   npm test -- --watchAll=false --coverage
   ```
3. Confirmar nomenclatura PT-BR sem exceções indevidas.
4. Confirmar zero strings hardcoded em componentes.
5. Fazer commit semântico em PT-BR com apenas os arquivos da mudança.
