---

name: semantic-commit
description: Criar commits Git com semântica convencional, staging seguro e mensagens em PT-BR. Usar para revisar alterações, garantir escopo correto, evitar arquivos indevidos e gerar commits rastreáveis e organizados.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Semantic Commit

Seguir este fluxo para criar commits seguros, claros e rastreáveis.

---

## 1) Inspeção obrigatória antes do commit

Antes de qualquer ação, analisar:

```bash
git status --short
git diff --stat
git diff --cached --stat
```

Objetivo:

* entender o escopo da mudança
* identificar arquivos não relacionados
* evitar staging incorreto

---

## 2) Staging seguro (CRÍTICO)

* Fazer stage **apenas dos arquivos relacionados à tarefa**

* Nunca incluir:

  * arquivos não relacionados
  * artefatos gerados
  * arquivos temporários
  * anotações locais

* Nunca versionar:

  * `.env`
  * tokens
  * secrets
  * configs locais (ex: `appsettings.Development.json`)

* Se houver arquivos misturados:
  → separar em múltiplos commits

---

## 3) Granularidade do commit

* Um commit deve representar **um único objetivo**

Separar commits quando houver:

* mistura de feature + fix
* refactor + regra de negócio
* testes + alteração funcional não relacionada
* documentação + código sem relação direta

Não separar quando:

* mudanças fazem parte do mesmo fluxo funcional
* testes pertencem diretamente à alteração

---

## 4) Tipos de commit (semântica)

Escolher o tipo pela intenção:

* `feat`: nova funcionalidade
* `fix`: correção de bug
* `refactor`: mudança interna sem impacto funcional
* `test`: criação ou ajuste de testes
* `docs`: documentação
* `chore`: manutenção sem impacto funcional
* `perf`: melhoria de performance
* `build`: build/dependências
* `ci`: pipeline/automação

---

## 5) Uso de escopo (RECOMENDADO)

Sempre que possível, usar escopo:

```
<type>(<modulo>): <resumo>
```

Exemplos:

* `feat(usuario): adiciona validação de CPF`
* `fix(auth): corrige expiração de token`
* `test(despesa): adiciona testes de validação`

---

## 6) Padrão da mensagem

### Assunto (obrigatório)

* formato:

```
<type>(escopo opcional): <resumo>
```

Regras:

* em PT-BR
* direto e específico
* até ~72 caracteres
* sem ponto final
* evitar termos vagos:

  * ❌ ajustes
  * ❌ mudanças
  * ❌ correções

---

### Corpo (opcional, mas recomendado)

Usar quando agregar valor:

* explicar contexto
* listar arquivos ou áreas impactadas
* descrever decisões ou limitações

Formato:

* bullets curtos
* linguagem objetiva

---

## 7) Validação antes de commitar

Antes de executar o commit, garantir:

1. Todos os arquivos staged pertencem ao mesmo objetivo
2. Nenhum arquivo sensível está incluído
3. Nenhum arquivo não relacionado está incluído
4. A mensagem está clara, específica e em PT-BR
5. O tipo do commit representa corretamente a mudança
6. O escopo (se usado) está correto

---

## 8) Boas práticas adicionais

* Preferir commits pequenos e frequentes
* Evitar commits grandes e genéricos
* Manter histórico legível e rastreável
* Não misturar responsabilidades no mesmo commit

---

## 9) Exemplos

* `fix(usuario): corrige validação de email duplicado`
* `feat(despesa): adiciona suporte a recorrência mensal`
* `refactor(api): separa camada de serviços`
* `test(login): adiciona cenários de erro e sucesso`
* `docs: atualiza documentação de autenticação`

---

## 10) Execução

Se o usuário solicitar commit:

* realizar o staging correto
* executar o commit com mensagem semântica

Não apenas sugerir a mensagem.

---

## 11) Encoding (OBRIGATÓRIO)

* Garantir UTF-8 na mensagem de commit
* Nunca gerar texto com caracteres corrompidos:

  * `�`
  * `�`
  * `Fa�a`

---