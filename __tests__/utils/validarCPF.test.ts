// __tests__/utils/validarCPF.test.ts
import { validarCPF } from '../../src/utils/validarCPF';

describe('validarCPF', () => {
  describe('validações básicas', () => {
    it('deve retornar false para CPF vazio', () => {
      expect(validarCPF('')).toBe(false);
    });

    it('deve retornar false para CPF nulo/undefined', () => {
      expect(validarCPF(null as any)).toBe(false);
      expect(validarCPF(undefined as any)).toBe(false);
    });

    it('deve retornar false para CPF com menos de 11 dígitos', () => {
      expect(validarCPF('123.456.789')).toBe(false);
    });

    it('deve retornar false para CPF com mais de 11 dígitos', () => {
      expect(validarCPF('123.456.789-0987')).toBe(false);
    });
  });

  describe('validações de dígitos iguais', () => {
    it('deve retornar false para CPF com todos os dígitos iguais', () => {
      expect(validarCPF('111.111.111-11')).toBe(false);
      expect(validarCPF('222.222.222-22')).toBe(false);
      expect(validarCPF('000.000.000-00')).toBe(false);
    });
  });

  describe('validações com pontuação', () => {
    it('deve aceitar CPF com pontos e hífen', () => {
      expect(validarCPF('123.456.789-87')).toBe(true);
    });

    it('deve aceitar CPF sem pontos', () => {
      expect(validarCPF('12345678987')).toBe(true);
    });

    it('deve remover caracteres especiais antes de validar', () => {
      expect(validarCPF('123-456-789-87')).toBe(true);
    });
  });

  describe('validações de checksum', () => {
    it('deve retornar false para CPF com primeiro dígito verificador inválido', () => {
      expect(validarCPF('123.456.789-88')).toBe(false);
    });

    it('deve retornar false para CPF com segundo dígito verificador inválido', () => {
      expect(validarCPF('123.456.789-86')).toBe(false);
    });
  });

  describe('casos de teste válidos', () => {
    it('deve validar CPF genuíno', () => {
      // CPF válido de teste
      expect(validarCPF('123.456.789-87')).toBe(true);
    });
  });
});
