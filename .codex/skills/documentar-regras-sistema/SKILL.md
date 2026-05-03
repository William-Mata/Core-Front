---
name: documentar-regras-sistema
description: Criar e atualizar documentação de regras do sistema com dois públicos: (1) técnica (Front/API) e (2) usuário final. Usar quando envolver regras de negócio, contratos, fluxos, validações ou documentação funcional.
---

# Documentar Regras do Sistema

## Objetivo

Produzir e manter duas documentações sincronizadas:

1. Técnica (Front/API)
2. Usuário final

A documentação deve ser rastreável ao código e não deve conter regras inventadas.

---

## Base obrigatória do projeto

A skill deve utilizar apenas as pastas existentes:

- `documentação tecnica/`
- `documentação do sistema/`
- `README.md`

Padrão de nome de arquivo:

- `tela-{nome-da-tela}.md`

Exemplos:

- `documentação tecnica/tela-receita.md`
- `documentação do sistema/tela-receita.md`

Não criar novas estruturas de documentação.

---

## Templates obrigatórios

Utilizar os templates:

- `references/documentacao-tecnica-template.md`
- `references/documentacao-usuario-final-template.md`

---

## Fluxo de Trabalho

1. Mapear escopo funcional (módulo, tela, fluxo, endpoint)

2. Analisar código do front e seguir obrigatoriamente o fluxo até a API:
   - identificar chamadas de API
   - localizar endpoint correspondente no backend (quando possível)
   - não inferir comportamento sem evidência

3. Identificar no front:
   - payloads
   - validações
   - estados (loading, erro, sucesso)
   - regras de exibição e edição

4. Identificar dependências com API:
   - obrigatoriedade de campos
   - formatos
   - paginação, ordenação, filtros
   - regras que dependem de resposta da API

5. Criar ou atualizar:
   - `documentação tecnica/tela-{nome}.md`
   - `documentação do sistema/tela-{nome}.md`

6. Adaptar linguagem técnica → linguagem de usuário final

7. Validar consistência entre os dois documentos

---

## Regras de alteração

- Atualizar apenas arquivos relacionados ao escopo
- Preservar conteúdo existente não relacionado
- Não remover seções existentes sem necessidade explícita
- Manter padrão estrutural já utilizado no projeto

---

## Regras de Qualidade

- Não inventar contratos de API
- Quando não houver evidência suficiente, marcar como:
  - "Não confirmado"

- Toda regra deve ser documentada de forma individual (não agrupar regras diferentes)

- Citar fonte da regra com:
  - caminho do arquivo (obrigatório)
  - método/componente (obrigatório)
  - linha do código (opcional)

- Separar claramente:
  - regra técnica
  - comportamento da interface
  - impacto para o usuário

- Registrar:
  - exceções
  - mensagens de erro observáveis
  - estados da interface (loading, erro, vazio)

- Para documentação de usuário final:
  - Utilizar linguagem simples, clara e objetiva
  - Explicar o passo a passo de utilização quando aplicável
  - Evitar termos técnicos ou explicar quando necessário
  - Garantir fácil entendimento para qualquer tipo de usuário, independentemente do nível técnico

- Manter idioma `pt-BR`
- Utilizar UTF-8

---

## Cobertura mínima obrigatória

A documentação só é considerada completa quando contém:

- Todas as validações de entrada
- Todas as regras condicionais de exibição/edição
- Todos os estados da interface (loading, erro, sucesso, vazio)
- Todas as dependências com API
- Todos os cenários de erro identificáveis

Nenhuma regra relevante pode ser omitida ou resumida.

---

## Casos de ausência de informação

Quando não for possível identificar uma regra:

- Não assumir comportamento
- Marcar explicitamente como:
  - "Não identificado no código"
- Listar dúvidas ou lacunas

---

## Formato de entrega

A resposta deve conter:

- Lista de arquivos criados ou atualizados
- Lista de telas/fluxos documentados
- Lista de regras identificadas (sem perder granularidade)
- Dependências identificadas com a API
- Pontos não confirmados ou com dúvida

---

## Critérios de Conclusão

Considerar concluído somente quando:

1. As duas documentações existirem e estiverem atualizadas
2. Regras críticas de integração Front/API estiverem descritas
3. Fluxo principal para usuário final estiver claro e de fácil entendimento
4. Lacunas e suposições estiverem explicitadas

---