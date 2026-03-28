export interface ReembolsoComDespesas {
  id: number;
  despesasVinculadas: number[];
}

export function encontrarDespesaJaVinculada(
  reembolsos: ReembolsoComDespesas[],
  despesasSelecionadas: number[],
  reembolsoAtualId?: number,
): number | null {
  for (const despesaId of despesasSelecionadas) {
    const jaVinculada = reembolsos.some(
      (reembolso) =>
        reembolso.id !== reembolsoAtualId &&
        reembolso.despesasVinculadas.includes(despesaId),
    );

    if (jaVinculada) {
      return despesaId;
    }
  }

  return null;
}

