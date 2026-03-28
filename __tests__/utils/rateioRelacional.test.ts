import { montarChaveAreaSubarea, separarAreaSubarea } from '../../src/utils/rateioRelacional';

describe('utils/rateioRelacional', () => {
  it('deve montar a chave relacional de area e subarea', () => {
    expect(montarChaveAreaSubarea('alimentacao', 'almoco')).toBe('alimentacao||almoco');
  });

  it('deve separar chave relacional no formato interno', () => {
    expect(separarAreaSubarea('lazer||cinema')).toEqual({ area: 'lazer', subarea: 'cinema' });
  });

  it('deve separar chave legado no formato area / subarea', () => {
    expect(separarAreaSubarea('alimentacao / jantar')).toEqual({ area: 'alimentacao', subarea: 'jantar' });
  });

  it('deve tratar valor simples como area e subarea iguais', () => {
    expect(separarAreaSubarea('servicos')).toEqual({ area: 'servicos', subarea: 'servicos' });
  });
});
