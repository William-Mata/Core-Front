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

export const estaDentroIntervalo = (dataIso: string, inicioBr: string, fimBr: string): boolean => {
  if (!inicioBr && !fimBr) return true;

  const dataAlvo = new Date(`${dataIso}T00:00:00`);
  if (Number.isNaN(dataAlvo.getTime())) return false;

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
