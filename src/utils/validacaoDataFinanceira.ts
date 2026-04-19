function converterDataIsoParaDate(valor: string): Date | null {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;

  const matchSomenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (matchSomenteData) {
    const ano = Number(matchSomenteData[1]);
    const mes = Number(matchSomenteData[2]) - 1;
    const dia = Number(matchSomenteData[3]);
    return new Date(ano, mes, dia, 0, 0, 0, 0);
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return null;
  return data;
}

export function dataIsoMaiorQue(dataComparada: string, dataReferencia: string): boolean {
  if (!dataComparada || !dataReferencia) return false;

  const comparada = converterDataIsoParaDate(dataComparada);
  const referencia = converterDataIsoParaDate(dataReferencia);
  if (!comparada || !referencia) return false;

  return comparada.getTime() > referencia.getTime();
}
