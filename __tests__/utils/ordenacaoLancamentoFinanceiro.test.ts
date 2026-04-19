import {
  compararPorLancamentoEfetivacaoDecrescente,
  ordenarPorLancamentoEfetivacaoDecrescente,
  type RegistroOrdenacaoLancamento,
} from '../../src/utils/ordenacaoLancamentoFinanceiro';

describe('utils/ordenacaoLancamentoFinanceiro', () => {
  it('deve priorizar dataLancamento em ordem decrescente', () => {
    const registros: RegistroOrdenacaoLancamento[] = [
      { id: 10, dataLancamento: '2026-03-01', dataEfetivacao: '2026-03-02' },
      { id: 11, dataLancamento: '2026-03-05', dataEfetivacao: '2026-03-06' },
      { id: 12, dataLancamento: '2026-02-28' },
    ];

    const ordenados = ordenarPorLancamentoEfetivacaoDecrescente(registros);

    expect(ordenados.map((item) => item.id)).toEqual([11, 10, 12]);
  });

  it('deve usar dataEfetivacao como criterio secundario quando dataLancamento for igual', () => {
    const registros: RegistroOrdenacaoLancamento[] = [
      { id: 20, dataLancamento: '2026-03-10', dataEfetivacao: '2026-03-12' },
      { id: 21, dataLancamento: '2026-03-10' },
      { id: 22, dataLancamento: '2026-03-10', dataEfetivacao: '2026-03-11' },
    ];

    const ordenados = ordenarPorLancamentoEfetivacaoDecrescente(registros);

    expect(ordenados.map((item) => item.id)).toEqual([20, 22, 21]);
  });

  it('deve usar id decrescente como desempate estavel final', () => {
    const ordenacao = compararPorLancamentoEfetivacaoDecrescente(
      { id: 1, dataLancamento: '2026-03-10', dataEfetivacao: '2026-03-12' },
      { id: 2, dataLancamento: '2026-03-10', dataEfetivacao: '2026-03-12' },
    );

    expect(ordenacao).toBeGreaterThan(0);
  });

  it('nao deve mutar o array original', () => {
    const registros: RegistroOrdenacaoLancamento[] = [
      { id: 1, dataLancamento: '2026-03-01' },
      { id: 2, dataLancamento: '2026-03-02' },
    ];

    const copiaOriginal = [...registros];
    void ordenarPorLancamentoEfetivacaoDecrescente(registros);

    expect(registros).toEqual(copiaOriginal);
  });
});
