---

name: sdet-react-native-tests
description: Planejar, criar e manter testes SDET para React Native (Web, Android e iOS) com foco em confiabilidade, padronização, estabilidade e baixa flakiness. Usar para validar regras de negócio, integração com API, estados de tela, navegação e contratos, garantindo consistência entre ambientes.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# SDET React Native Tests

Seguir este fluxo para criar testes robustos, determinísticos e de alta confiabilidade.

---

## 1) Estratégia de teste (obrigatório antes de codar)

* Mapear risco funcional:

  * regra crítica
  * fluxo financeiro
  * autenticação/permissão
  * status e cálculos

* Escolher nível correto:

  * unitário → funções puras, utils, hooks isolados
  * integração → tela + hooks + serviços mockados
  * contrato → payloads, enums e estrutura da API
  * regressão → bugs corrigidos

* Evitar testes de snapshot sem valor comportamental

---

## 2) Priorização por impacto

* Cobrir primeiro regras críticas

* Garantir cenários:

  * sucesso
  * erro
  * vazio
  * loading
  * desabilitado

* Validar bordas:

  * null / undefined
  * valores limite
  * datas inválidas
  * enums inesperados

---

## 3) Padrões técnicos obrigatórios

* Testes devem ser determinísticos:

  * não usar tempo real
  * não usar rede real
  * não depender de locale real

* Mock obrigatório de:

  * Date.now
  * Math.random
  * uuid
  * APIs externas

* Reset entre testes:

```ts
afterEach(() => {
  jest.clearAllMocks()
})
```

* Usar `jest.resetModules()` apenas quando realmente necessário

* Não compartilhar estado global entre testes

* Nomear testes pelo comportamento esperado (não pela implementação)

---

## 4) Padronização de render (OBRIGATÓRIO)

* Utilizar **um único helper centralizado de render** (ex: `renderComProviders`)

* Esse helper deve conter:

  * i18n
  * navigation
  * theme
  * store

* Nunca renderizar componente sem os providers necessários

* Não criar múltiplos padrões de render no projeto

---

## 5) i18n (CRÍTICO)

* Nunca depender de texto literal fixo quando houver i18n

* Garantir que:

  * todas as chaves usadas no teste existem
  * nenhuma tela renderiza a chave ao invés do valor

* Se for detectado retorno da chave (ex: `tela.titulo`):
  → o teste deve falhar

* Se necessário:

  * mockar i18n para retorno previsível

---

## 6) Boas práticas React Native

* Usar React Native Testing Library

* Testar comportamento visível:

  * texto
  * ação
  * feedback

* Não testar implementação interna

* Cobrir:

  * navegação (entrada, retorno, params)
  * estados de tela
  * interação do usuário

---

## 7) API, serviços e contratos

* Validar:

  * mapeamento API → UI
  * enums esperados
  * campos obrigatórios

* Testar erros por status:

  * 400, 401, 403, 404, 500

* Mockar API de forma consistente e reutilizável

---

## 8) Anti-flaky (OBRIGATÓRIO)

* Não usar:

  * sleep fixo
  * waits arbitrários

* Usar:

  * waitFor orientado a comportamento

* Evitar:

  * múltiplos waitFor desnecessários
  * dependência de timing

* Corrigir causa raiz antes de aumentar timeout

---

## 9) Performance de testes

* Evitar render de telas completas sem necessidade

* Preferir testes unitários para lógica

* Reduzir uso de integração pesada

* Evitar:

  * mocks complexos desnecessários
  * re-render múltiplo

---

## 10) Evitar redundância

* Não duplicar cenários já cobertos
* Não criar múltiplos testes com mesma intenção
* Cada teste deve validar um comportamento claro

---

## 11) Estrutura dos testes

Seguir padrão:

* Arrange → preparação
* Act → execução
* Assert → validação

Garantir:

* clareza
* legibilidade
* isolamento

---

## 12) Cobertura mínima

* Priorizar qualidade, não percentual global

* Para código alterado:

  * alta cobertura em regras de negócio

* Sempre incluir:

  * pelo menos 1 teste negativo por regra crítica

---

## 13) Checklist de entrega

* Testes cobrem:

  * sucesso
  * erro
  * borda

* Sem dependência externa imprevisível

* Mocks limpos entre testes

* i18n validado

* Sem flakiness

* Sem regressão funcional

---

## 14) Formato de resposta ao usuário

Sempre informar:

* o que foi testado
* quais riscos foram mitigados
* o que ficou fora e por quê
* próximos testes recomendados

Se o usuário pedir implementação:
→ aplicar diretamente no código, não apenas sugerir

---