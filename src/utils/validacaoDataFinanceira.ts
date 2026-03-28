export function dataIsoMaiorQue(dataComparada: string, dataReferencia: string): boolean {
  if (!dataComparada || !dataReferencia) return false;
  return dataComparada > dataReferencia;
}
