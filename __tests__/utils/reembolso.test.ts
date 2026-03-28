import { encontrarDespesaJaVinculada } from '../../src/utils/reembolso';

describe('utils/reembolso', () => {
  it('deve retornar null quando nenhuma despesa estiver vinculada em outro reembolso', () => {
    const resultado = encontrarDespesaJaVinculada(
      [
        { id: 1, despesasVinculadas: [10, 11] },
        { id: 2, despesasVinculadas: [12] },
      ],
      [13, 14],
    );

    expect(resultado).toBeNull();
  });

  it('deve retornar o id da primeira despesa em conflito no cadastro', () => {
    const resultado = encontrarDespesaJaVinculada(
      [
        { id: 1, despesasVinculadas: [10, 11] },
        { id: 2, despesasVinculadas: [12] },
      ],
      [12, 15],
    );

    expect(resultado).toBe(12);
  });

  it('deve ignorar o proprio reembolso ao editar', () => {
    const resultado = encontrarDespesaJaVinculada(
      [
        { id: 1, despesasVinculadas: [10, 11] },
        { id: 2, despesasVinculadas: [12] },
      ],
      [10, 11],
      1,
    );

    expect(resultado).toBeNull();
  });
});

