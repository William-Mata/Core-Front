# Tela de Administracao - Usuarios

## Objetivo
Orientar o administrador no gerenciamento de usuarios e permissoes.

## Onde acessar
- Menu lateral -> `Administracao` -> `Usuarios`
- Rota: `/admin/usuarios`

## O que e possivel fazer
- visualizar usuarios cadastrados
- filtrar por id, nome/email e periodo
- criar usuario
- editar usuario
- excluir usuario
- ativar/inativar usuario
- configurar acessos por modulo, tela e funcionalidade

## Confirmacao antes de excluir
- Ao excluir um usuario, o sistema sempre abre uma confirmacao antes de concluir.
- A janela mostra o contexto da exclusao e um alerta de impacto.
- Se voce clicar em `Cancelar`, nada e excluido.

Escopo no modulo Administracao:
- Avisos e Documentos tambem seguem confirmacao obrigatoria antes de excluir.

## Cadastro e edicao
Campos:
- Nome
- E-mail
- Perfil (`USER` ou `ADMIN`)
- Status (`Ativo` ou `Inativo`)

Regras:
- nome e email sao obrigatorios
- email precisa estar em formato valido

## Permissoes por modulo
Na mesma tela, o administrador configura:
- status do modulo
- status das telas do modulo
- status das funcionalidades de cada tela

Comportamento:
- e possivel expandir modulo e tela para configurar os niveis internos
- desativar modulo ou tela impacta os itens filhos

## Resultado esperado
- usuario salvo com dados e permissoes atualizados
- o menu do usuario passa a exibir apenas o que estiver ativo
- usuarios comuns nao devem ver telas administrativas quando inativas

## Mensagens comuns
- campos obrigatorios
- email invalido
- sucesso ao criar/atualizar/excluir
- erro retornado pela API

