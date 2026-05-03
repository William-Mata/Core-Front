# Tela de Usuario

## Objetivo
Orientar o usuario final sobre como usar o painel de usuario.

## Onde acessar
- Menu lateral -> `Painel do Usuario`
- Rota interna: `/usuario`

## O que existe nesta tela
- bloco com seus dados:
  - Nome
  - E-mail
  - Perfil de acesso
- bloco para alterar senha:
  - Senha atual
  - Nova senha
  - Confirmar nova senha

## Como alterar sua senha
1. Preencha `Senha atual`.
2. Preencha `Nova senha`.
3. Preencha `Confirmar nova senha` igual ao campo anterior.
4. Clique em `Salvar Nova Senha`.

## Regras da tela
- os 3 campos de senha sao obrigatorios
- a nova senha deve ter no minimo 10 caracteres
- a confirmacao deve ser igual a nova senha
- se houver erro, os campos invalidos ficam destacados
- as mensagens aparecem em tela (canto superior direito na web)

## Resultado esperado
- em caso de sucesso:
  - a senha e alterada
  - os campos do formulario sao limpos
  - o sistema mostra mensagem de sucesso

## Mensagens que o usuario pode encontrar
- "Preencha todos os campos de senha."
- "A nova senha deve ter no minimo 10 caracteres."
- "A confirmacao da senha esta diferente."
- mensagens de erro retornadas pela API

## Boas praticas para o usuario
- use senha forte com letras, numeros e caracteres especiais
- nao reutilize senhas antigas
- confirme com atencao antes de salvar
- se esquecer a senha atual, use a recuperacao na tela de login

## Observação
- esta tela mostra os dados do usuario autenticado no momento
- para voltar ao sistema principal, use o botao de fechar da tela

