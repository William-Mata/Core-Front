const REGEX_DATA_ISO_CURTA = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDataIsoCurta(dataIso: string): Date | null {
  const match = REGEX_DATA_ISO_CURTA.exec(dataIso.trim());
  if (!match) return null;

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  if (!Number.isInteger(ano) || !Number.isInteger(mes) || !Number.isInteger(dia)) return null;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  const data = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  const anoValido = data.getFullYear() === ano;
  const mesValido = data.getMonth() === mes - 1;
  const diaValido = data.getDate() === dia;

  if (!anoValido || !mesValido || !diaValido) return null;
  return data;
}

export function idadeMinimaAtingida(
  dataNascimentoIso: string,
  idadeMinima: number = 15,
  dataReferencia: Date = new Date(),
): boolean {
  const dataNascimento = parseDataIsoCurta(dataNascimentoIso);
  if (!dataNascimento) return false;
  if (!Number.isInteger(idadeMinima) || idadeMinima < 0) return false;

  let idade = dataReferencia.getFullYear() - dataNascimento.getFullYear();
  const mesReferencia = dataReferencia.getMonth();
  const diaReferencia = dataReferencia.getDate();
  const mesNascimento = dataNascimento.getMonth();
  const diaNascimento = dataNascimento.getDate();

  const aindaNaoFezAniversario =
    mesReferencia < mesNascimento ||
    (mesReferencia === mesNascimento && diaReferencia < diaNascimento);

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  return idade >= idadeMinima;
}
