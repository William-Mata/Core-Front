# Tela de Administracao - Usuarios

## Objetivo
Orientar o usuario administrador no uso da tela de gerenciamento de usuarios.

## Onde acessar
- Menu lateral -> `Administracao` -> `Usuarios`
- Rota interna: `/principal/admin/usuario`

## O que voce pode fazer nesta tela
- visualizar usuarios cadastrados
- filtrar usuarios
- criar novo usuario
- editar usuario existente
- remover usuario existente

## Lista de usuarios
Na lista, cada item mostra:
- nome
- email
- data de criacao
- perfil (`USER` ou `ADMIN`)

## Filtros disponiveis
- filtro por id
- filtro por nome/email (descricao)
- filtro por periodo (data inicio e data fim)

## Como criar um usuario
1. Clique em `+ Criar Novo Usuario`.
2. Preencha:
   - Nome completo
   - E-mail
   - Perfil de acesso
3. Clique em `Salvar`.

## Como editar um usuario
1. Clique no usuario na lista.
2. Altere os campos desejados.
3. Clique em `Salvar`.

## Como remover um usuario
1. Abra o usuario em modo de edicao.
2. Clique em `Deletar`.
3. O usuario e removido da listagem.

## Regras importantes
- nome e email sao obrigatorios
- email deve estar em formato valido
- perfil `ADMIN` exibe aviso de privilegios elevados
- durante salvamento, os botoes podem ficar bloqueados

## Mensagens que podem aparecer
- nome e email obrigatorios
- email invalido
- usuario criado com sucesso
- usuario atualizado com sucesso
- usuario deletado com sucesso
- erro de operacao retornado pela API

## Boas praticas para administradores
- confira o email antes de salvar
- use perfil `ADMIN` apenas quando realmente necessario
- revise os filtros para localizar usuarios rapidamente
- mantenha os cadastros atualizados para evitar acessos indevidos

## Observacao
- esta tela e destinada a usuarios com permissao administrativa
- para sair do formulario sem salvar, use o botao `Cancelar` ou feche a tela

