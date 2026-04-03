import {
  extrairConteudoBase64SemPrefixo,
  montarDocumentosPayload,
  normalizarDocumentosApi,
} from '../../src/utils/documentoUpload';

describe('utils/documentoUpload', () => {
  it('deve remover prefixo data url do base64', () => {
    const valor = 'data:application/pdf;base64,QUJDRA==';
    expect(extrairConteudoBase64SemPrefixo(valor)).toBe('QUJDRA==');
    expect(extrairConteudoBase64SemPrefixo('QUJDRA==')).toBe('QUJDRA==');
  });

  it('deve normalizar metadados de documentos retornados pela api', () => {
    const lista = normalizarDocumentosApi([
      {
        nomeArquivo: 'nota-fiscal.pdf',
        caminho: 'C:/temp/123_nota-fiscal.pdf',
        contentType: 'application/pdf',
        tamanhoBytes: 184322,
      },
    ]);

    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      nomeArquivo: 'nota-fiscal.pdf',
      caminho: 'C:/temp/123_nota-fiscal.pdf',
      contentType: 'application/pdf',
      tamanhoBytes: 184322,
    });
  });

  it('deve aceitar caminhoArquivo no contrato de detalhe financeiro', () => {
    const lista = normalizarDocumentosApi([
      {
        nomeArquivo: 'holerite-abril.pdf',
        caminhoArquivo: 'https://storage.exemplo.com/docs/holerite-abril.pdf',
        contentType: 'application/pdf',
        tamanhoBytes: 252001,
      },
    ]);

    expect(lista).toEqual([
      {
        nomeArquivo: 'holerite-abril.pdf',
        caminho: 'https://storage.exemplo.com/docs/holerite-abril.pdf',
        contentType: 'application/pdf',
        tamanhoBytes: 252001,
      },
    ]);
  });

  it('deve montar payload apenas com documentos que possuem base64', () => {
    const payload = montarDocumentosPayload([
      {
        nomeArquivo: 'nota-fiscal.pdf',
        conteudoBase64: 'data:application/pdf;base64,QUJDRA==',
        contentType: 'application/pdf',
      },
      {
        nomeArquivo: 'sem-conteudo.pdf',
      },
    ]);

    expect(payload).toEqual([
      {
        nomeArquivo: 'nota-fiscal.pdf',
        conteudoBase64: 'QUJDRA==',
        contentType: 'application/pdf',
      },
    ]);
  });

  it('deve retornar lista vazia quando documentos for vazio ou indefinido', () => {
    expect(montarDocumentosPayload([])).toEqual([]);
    expect(montarDocumentosPayload(undefined)).toEqual([]);
  });
});
