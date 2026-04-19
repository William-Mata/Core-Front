const parseDataFiltro = (valor: string): Date | null => {
  if (valor.includes('-')) {
    const [ano, mes, dia] = valor.split('-').map((p) => Number(p));
    if (!dia || !mes || !ano) return null;

    const dataIso = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    if (Number.isNaN(dataIso.getTime())) return null;
    return dataIso;
  }

  const partes = valor.split('/');
  if (partes.length !== 3) return null;

  const [dia, mes, ano] = partes.map((p) => Number(p));
  if (!dia || !mes || !ano) return null;

  const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  if (Number.isNaN(data.getTime())) return null;
  return data;
};

const parseDataIsoAlvo = (valor: string): Date | null => {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;

  const parteData = texto.includes('T') ? texto.split('T')[0] : texto;
  const [ano, mes, dia] = parteData.split('-').map((p) => Number(p));
  if (!ano || !mes || !dia) return null;

  const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  if (Number.isNaN(data.getTime())) return null;
  return data;
};

export const estaDentroIntervalo = (dataIso: string, inicioBr: string, fimBr: string): boolean => {
  if (!inicioBr && !fimBr) return true;

  const dataAlvo = parseDataIsoAlvo(dataIso);
  if (!dataAlvo) return false;

  const inicio = inicioBr ? parseDataFiltro(inicioBr) : null;
  const fim = fimBr ? parseDataFiltro(fimBr) : null;

  if (inicio && dataAlvo < inicio) return false;
  if (fim) {
    const fimDia = new Date(fim);
    fimDia.setHours(23, 59, 59, 999);
    if (dataAlvo > fimDia) return false;
  }

  return true;
};
