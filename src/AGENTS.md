# AGENTS.md

## Contexto do projeto

Leia o `README.md` na raiz antes de qualquer tarefa. Ele é a fonte de verdade sobre stack, módulos, configuração e como executar o projeto.

---

## Fluxo de execução da tarefa

1. Ler `README.md`
2. Identificar claramente o escopo da tarefa
3. Verificar se existe skill aplicável em `.codex/skills/`
4. Carregar e seguir a(s) skill(s) relevante(s)
5. Analisar impacto (arquivos, regras, contratos, dependências)
6. Realizar alterações mínimas necessárias
7. Validar conforme seção "Validação padrão"
8. Atualizar documentação afetada (regras, fluxos ou comportamento alterado) e o README (quando aplicável)
9. Não realizar commit automaticamente.
   Só gerar commit semântico utilizando a skill `.codex/skills/semantic-commit/SKILL.md` quando houver solicitação explícita do usuário
   Não inferir intenção de commit.

---

### Critério de uso de skills

- Utilizar uma skill sempre que a tarefa se encaixar claramente em uma situação descrita
- Evitar uso de múltiplas skills sem necessidade
- Priorizar a skill mais específica para a tarefa
- Não utilizar skill se a tarefa não corresponder claramente à sua descrição

---

## Skills disponíveis

Leia o arquivo do skill correspondente antes de iniciar a tarefa.

| Situação                                                              | Skill a carregar                                       |
|-----------------------------------------------------------------------|--------------------------------------------------------|
| Definir estratégia e aplicar boas práticas no desenvolvimento         | `.codex/skills/react-native-senior/SKILL.md`           |
| Fazer a tradução em três idiomas PT-BR, EN e ESP                      | `.codex/skills/i18n-traducao-segura/SKILL.md`          |
| Planejar e criar telas com foco em usabilidade para o usuário final   | `.codex/skills/react-native-uix/SKILL.md`              |
| Gerar e atualizar documentações técnicas, de usuário e do README      | `.codex/skills/documentar-regras-sistema/SKILL.md`     |
| Criar e atualizar testes conforme alterações realizadas no sistema    | `.codex/skills/sdet-react-native-tests/SKILL.md`       |
| Fazer staging e escrever mensagem de commit e realizar push           | `.codex/skills/semantic-commit/SKILL.md`               |

> Se houver outros skills na pasta `.codex/skills/`, avaliar relevância antes de iniciar a tarefa.

---

## Regras gerais

- Toda nomenclatura deve estar em **PT-BR** sem exceção: pastas, arquivos, componentes, funções, variáveis, tipos, stores, enums. Exceções apenas para APIs externas e palavras-chave do TypeScript/JavaScript.
- Proibido uso de `any` sem justificativa explícita no código
- Proibido uso de strings hardcoded em componentes (JSX/TSX); toda string deve vir de i18n
- Nenhum `console.log` em código de produção
- Quando houver solicitação explícita de commit, utilizar PT-BR com semântica convencional
- Nunca versionar `.env`, tokens, secrets ou chaves reais
- Em formulários, todo campo obrigatório deve exibir `*` no label ou no padrão visual adotado pelo sistema
- A regra do `*` também vale para campos condicionalmente obrigatórios
- Campos opcionais não devem exibir `*`
- Garantir que qualquer ação de exclusão ou potencialmente perigosa exija confirmação explícita do usuário
- Ao alterar regra de negócio, fluxo ou comportamento, atualizar a documentação afetada utilizando `.codex/skills/documentar-regras-sistema/SKILL.md`
- Manter consistência com padrões existentes, se baseando em outras telas e funcionalidades similares
- Remover logs de debug antes de finalizar a tarefa

---

## Regras de alteração

- Não modificar arquivos que não estejam diretamente relacionados à tarefa solicitada pelo usuário
- Não refatorar código fora do escopo, mesmo que existam melhorias aparentes
- Não alterar contratos (API, DTOs, payloads), nem direta nem indiretamente, sem necessidade explícita do usuário, pois isso pode impactar outros módulos
- Preservar comportamento existente, garantindo que funcionalidades atuais não sejam afetadas
- Realizar apenas as alterações necessárias para resolver a tarefa, evitando mudanças adicionais

---

## Validação padrão

Antes de encerrar qualquer tarefa que altere código:

1. Rodar testes do escopo afetado:
   ```bash
   npm test -- --testPathPattern=<modulo>
   ```
2. Rodar suíte completa ao tocar contratos compartilhados, stores, interceptors ou autenticação:
   ```bash
   npm test -- --watchAll=false --coverage
   ```
3. Confirmar nomenclatura PT-BR sem exceções indevidas.
4. Confirmar que não há strings hardcoded em componentes (JSX/TSX)
5. Não realizar commit automaticamente.
   Só gerar commit semântico em PT-BR com apenas os arquivos alterados no contexto atual quando houver solicitação explícita do usuário.
   Não inferir intenção de commit.
6. Garantir:
   - Nenhum erro de build
   - Nenhum erro de lint
   - Nenhum import não utilizado

---
