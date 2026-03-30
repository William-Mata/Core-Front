export interface DocumentoFinanceiro {
  nomeArquivo: string;
  conteudoBase64?: string;
  contentType?: string;
  caminho?: string;
  tamanhoBytes?: number;
}

export interface DocumentoFinanceiroPayload {
  nomeArquivo: string;
  conteudoBase64: string;
  contentType?: string;
}

function texto(valor: unknown) {
  return String(valor ?? '').trim();
}

export function extrairConteudoBase64SemPrefixo(valor: string) {
  const bruto = texto(valor);
  if (!bruto) return '';
  if (!bruto.toLowerCase().startsWith('data:')) return bruto;

  const indiceSeparador = bruto.indexOf(',');
  if (indiceSeparador < 0) return '';
  return bruto.slice(indiceSeparador + 1).trim();
}

export function normalizarDocumentosApi(entrada: unknown): DocumentoFinanceiro[] {
  if (!Array.isArray(entrada)) return [];

  return entrada
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const registro = item as Record<string, unknown>;
      const nomeArquivo = texto(registro.nomeArquivo ?? registro.nome ?? registro.fileName);
      if (!nomeArquivo) return null;

      const conteudoBase64 = extrairConteudoBase64SemPrefixo(texto(registro.conteudoBase64 ?? registro.base64));
      const contentType = texto(registro.contentType ?? registro.tipo);
      const caminho = texto(registro.caminho ?? registro.path);
      const tamanhoBytes = Number(registro.tamanhoBytes ?? registro.sizeBytes ?? registro.tamanho ?? 0);

      return {
        nomeArquivo,
        conteudoBase64: conteudoBase64 || undefined,
        contentType: contentType || undefined,
        caminho: caminho || undefined,
        tamanhoBytes: Number.isFinite(tamanhoBytes) && tamanhoBytes > 0 ? tamanhoBytes : undefined,
      } as DocumentoFinanceiro;
    })
    .filter((item): item is DocumentoFinanceiro => Boolean(item));
}

export function montarDocumentosPayload(documentos: DocumentoFinanceiro[] | undefined | null): DocumentoFinanceiroPayload[] {
  if (!Array.isArray(documentos) || documentos.length === 0) return [];

  return documentos
    .map((documento) => {
      const nomeArquivo = texto(documento.nomeArquivo);
      const conteudoBase64 = extrairConteudoBase64SemPrefixo(texto(documento.conteudoBase64));
      const contentType = texto(documento.contentType);
      if (!nomeArquivo || !conteudoBase64) return null;
      return {
        nomeArquivo,
        conteudoBase64,
        contentType: contentType || undefined,
      } as DocumentoFinanceiroPayload;
    })
    .filter((item): item is DocumentoFinanceiroPayload => Boolean(item));
}
