export interface InterfacePerfilUsuario {
  id: number;
  nome: string;
}

export interface InterfaceFuncionalidadeModulo {
  id: string;
  nome: string;
  status: boolean;
}

export interface InterfaceTelaModulo {
  id: string;
  nome: string;
  status: boolean;
  funcionalidades: InterfaceFuncionalidadeModulo[];
}

export interface InterfaceModuloUsuario {
  id: string;
  nome: string;
  status: boolean;
  telas: InterfaceTelaModulo[];
  funcionalidades?: InterfaceFuncionalidadeModulo[];
}

export interface InterfaceUsuario {
  id: number;
  nome: string;
  email: string;
  status?: boolean;
  perfil: InterfacePerfilUsuario;
  modulosAtivos: InterfaceModuloUsuario[];
}
