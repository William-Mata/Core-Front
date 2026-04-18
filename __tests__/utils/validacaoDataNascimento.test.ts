import { idadeMinimaAtingida } from '../../src/utils/validacaoDataNascimento';

describe('utils/validacaoDataNascimento', () => {
  it('deve validar idade minima de 15 anos', () => {
    const referencia = new Date(2026, 3, 17, 12, 0, 0, 0);

    expect(idadeMinimaAtingida('2011-04-17', 15, referencia)).toBe(true);
    expect(idadeMinimaAtingida('2011-04-18', 15, referencia)).toBe(false);
    expect(idadeMinimaAtingida('2000-01-01', 15, referencia)).toBe(true);
  });

  it('deve rejeitar data invalida', () => {
    const referencia = new Date(2026, 3, 17, 12, 0, 0, 0);

    expect(idadeMinimaAtingida('', 15, referencia)).toBe(false);
    expect(idadeMinimaAtingida('2012-02-31', 15, referencia)).toBe(false);
    expect(idadeMinimaAtingida('abc', 15, referencia)).toBe(false);
  });
});
