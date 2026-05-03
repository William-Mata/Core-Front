---
name: i18n-traducao-segura
description: Traduzir e manter i18n com segurança em PT-BR, EN-US e ES-ES, garantindo sincronização entre idiomas, integridade das chaves e consistência de renderização. Corrigir ortografia e gramática sem quebrar acentuação, placeholders ou estrutura, e sem alterar traduções existentes fora do escopo. Preservar significado, estrutura e variáveis dinâmicas, realizando apenas alterações mínimas necessárias.
---

# i18n Tradução Segura

Use este fluxo para traduzir sem causar regressão de i18n.

---

## 1) Idiomas obrigatórios

- Sempre manter os 3 idiomas sincronizados:
  - PT-BR
  - EN-US
  - ES-ES
- Nenhuma chave nova deve ficar faltando em um dos idiomas

---

## 2) Integridade de chaves (CRÍTICO)

- Todas as chaves devem existir nos 3 idiomas
- A estrutura (aninhamento) deve ser idêntica entre os arquivos
- Não pode haver diferença de caminho entre idiomas
- Garantir que nenhuma chave seja exibida na interface no lugar do valor

---

## 3) Regra principal de segurança

- Editar somente as chaves relacionadas ao pedido
- Não reescrever em massa arquivos inteiros de tradução
- Não "melhorar" chaves antigas fora do escopo sem autorização
- Preservar nomes de chave, estrutura JSON/objeto e ordem lógica existente

---

## 4) Proteção de placeholders (OBRIGATÓRIO)

- Nunca alterar placeholders dinâmicos, como:
  - `{nome}`, `{count}`, `{{value}}`, `%s`, `%d`
- Preservar exatamente o mesmo nome e formato entre os idiomas
- Não traduzir nomes de variáveis dentro das chaves
- Não remover nem adicionar placeholders

---

## 5) Consistência estrutural

- Garantir que a estrutura das chaves (inclusive aninhamento) seja idêntica entre PT-BR, EN-US e ES-ES
- Não transformar string em objeto ou objeto em string
- Não alterar tipos de valor

---

## 6) Qualidade linguística

- Corrigir ortografia, acentuação e concordância quando a chave estiver no escopo
- Corrigir textos sem acento quando identificado (ex: "Configuracao" → "Configuração")
- Manter tom e contexto funcional do sistema
- Evitar tradução literal sem sentido de negócio
- Em EN-US e ES-ES, usar termos consistentes com o restante do sistema

---

## 7) Preservação de significado

- Não alterar o significado original da mensagem
- A tradução deve manter a mesma intenção funcional:
  - erro
  - sucesso
  - alerta
  - instrução

---

## 8) Contexto de uso

- Considerar o tipo de mensagem:
  - botão → curto e direto
  - label → claro e objetivo
  - erro → explicativo
  - instrução → orientativo
  - título → resumido

---

## 9) Anti-quebra de encoding (OBRIGATÓRIO)

- Salvar arquivos em UTF-8 (sem corrupção de acentos)
- Nunca introduzir texto corrompido como:
  - `�`, `Ã§`, `Ã£`, `Ã¡`
- Nunca introduzir texto mojibake: 
  - `�`, `�`, `—`
- Se detectar texto quebrado, corrigir automaticamente para o valor legível

---

## 10) Processo de alteração

1. Mapear quais chaves realmente precisam mudar
2. Garantir existência das chaves nos 3 idiomas
3. Aplicar alteração mínima somente nessas chaves
4. Validar placeholders e estrutura
5. Validar encoding e acentuação
6. Validar que nenhuma chave será exibida na UI

---

## 11) Fallback seguro

- Quando não houver contexto suficiente:
  - evitar tradução ambígua ou inventada
  - usar forma neutra
  - ou manter texto original e sinalizar

---

## 12) Validação obrigatória antes de finalizar

- Confirmar diff pequeno e focado no escopo
- Confirmar inexistência de caracteres corrompidos
- Confirmar que PT-BR, EN-US e ES-ES possuem as mesmas chaves
- Confirmar que JSON/objeto continua válido
- Confirmar que placeholders foram preservados
- Confirmar que estrutura não foi alterada
- Confirmar que o significado foi mantido
- Confirmar que nenhuma chave será exibida na interface

---

## 13) Checklist de entrega

- Chaves alteradas listadas explicitamente
- Traduções apresentadas nos 3 idiomas
- Nenhuma tradução fora de escopo modificada
- Nenhum problema de encoding introduzido
- Placeholders preservados corretamente
- Estrutura consistente entre idiomas

---

## 14) Formato de resposta ao usuário

Sempre informar:

- quais chaves foram adicionadas/alteradas
- os novos textos em PT-BR, EN-US e ES-ES
- confirmação de:
  - encoding válido
  - placeholders preservados
  - estrutura mantida
  - nenhuma chave sendo exibida na interface

Se o usuário pedir tradução, aplicar diretamente nos arquivos, não apenas sugerir.

---