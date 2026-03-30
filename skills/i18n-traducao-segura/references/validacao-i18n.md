# Referencia Rapida - Validacao i18n

## Objetivo
Evitar regressao de traducao e corrupcao de caracteres.

## Verificacoes recomendadas
- Rodar busca por caracteres suspeitos de mojibake:
  - `�`
  - `�`
  - `—`
  - `�`
- Revisar diff para garantir alteracao minima por chave.
- Conferir paridade de chaves nos 3 idiomas para o escopo alterado.

## Exemplo de padrao de erro
- errado: `AdministraÃƒÂ§ÃƒÂ£o`
- correto: `Administracao` (ou `Administra��o`, conforme padrao de encoding do arquivo)

## Regra de ouro
Nao aceitar PR com texto corrompido, mesmo que build e testes passem.
