// src/utils/validarCPF.ts

/**
 * Valida um CPF usando o algoritmo de módulo 11
 * @param cpf - CPF com ou sem pontuação
 * @returns true se o CPF é válido, false caso contrário
 */
export function validarCPF(cpf: string | null | undefined): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }

  // Remove pontuação
  const limpo = cpf.replace(/\D/g, '');

  // Must be 11 digits
  if (limpo.length !== 11) {
    return false;
  }

  // Can't be all same digits
  if (/^(\d)\1{10}$/.test(limpo)) {
    return false;
  }

  // Verify first check digit (módulo 11)
  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
  }

  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(limpo.substring(9, 10))) {
    return false;
  }

  // Verify second check digit (módulo 11)
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(limpo.substring(10, 11))) {
    return false;
  }

  return true;
}
