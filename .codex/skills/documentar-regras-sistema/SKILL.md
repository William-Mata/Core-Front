---
name: documentar-regras-sistema
description: Criar e atualizar documentação de regras do sistema com dois públicos: (1) documentação técnica explicando regras que o front-end espera da API e comportamento do front, e (2) documentação para usuário final com linguagem simples e orientada a uso. Usar quando o pedido envolver mapear regras de negócio, contratos API/frontend, fluxos de tela, validações, mensagens de erro ou atualizar documentação funcional.
---

# Documentar Regras do Sistema

## Objetivo

Produzir e manter duas documentações sincronizadas:

1. Técnica (Front/API)
2. Usuário final

Gerar conteúdo rastreável ao código e sem inventar regras.

## Base obrigatoria do projeto

A skill deve se basear nas pastas ja existentes no repositorio:

- `documentação tecnica/`
- `documentação do sistema/`

Padrao de nome de arquivo:

- `tela-{nome-da-tela}.md`

Exemplos:

- `documentação tecnica/tela-receita.md`
- `documentação do sistema/tela-receita.md`

Nunca criar uma terceira estrutura paralela de documentacao se essas pastas ja existirem.

## Estrutura da Skill

Usar os templates em:

- `references/documentacao-tecnica-template.md`
- `references/documentacao-usuario-final-template.md`

## Fluxo de Trabalho

1. Mapear escopo funcional solicitado (módulo, tela, fluxo, endpoint).
2. Ler código-fonte relevante do front para identificar:
   - chamadas de API;
   - payloads esperados;
   - validações;
   - estados de carregamento/erro/sucesso;
   - regras de exibição/edição e permissões.
3. Identificar regras implícitas no front que dependem da API (campos obrigatórios, formatos, status, paginação, ordenação, filtros, limites).
4. Escrever/atualizar `documentação tecnica/tela-{nome}.md`.
5. Traduzir as mesmas regras para linguagem de usuário final em `documentação do sistema/tela-{nome}.md`.
6. Validar consistência entre as duas documentações.

## Regras de Qualidade

- Não inventar contrato de API; marcar como "Não confirmado" quando faltar evidência.
- Citar fonte de cada regra com caminho de arquivo e linha quando possível.
- Preservar o estilo textual e organizacao de secoes ja usados nas documentacoes existentes.
- Separar claramente:
  - regra técnica;
  - comportamento de interface;
  - impacto para o usuário.
- Registrar exceções e mensagens de erro observáveis.
- Manter idioma `pt-BR`, salvo pedido explícito diferente.
- Utilizar UTF-8 e evitar caracteres especiais que possam quebrar renderização.

## Critérios de Conclusão

Considerar concluído somente quando:

1. As duas documentações existirem e estiverem atualizadas.
2. Regras críticas de integração Front/API estiverem descritas.
3. Fluxo principal para usuário final estiver claro e acionável.
4. Divergências, lacunas ou suposições estiverem explicitadas.
