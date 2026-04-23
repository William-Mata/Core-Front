import { manipuladoresAutenticacao } from './autenticacao.mock';
import { manipuladorFinanceiro } from './financeiro.mock';
import { manipuladorAmigos } from './amigos.mock';
import { manipuladorAdministracao } from './administracao.mock';
import { manipuladorCompras } from './compras.mock';

export const manipuladores = [
  ...manipuladoresAutenticacao,
  ...manipuladorFinanceiro,
  ...manipuladorAmigos,
  ...manipuladorAdministracao,
  ...manipuladorCompras,
];
