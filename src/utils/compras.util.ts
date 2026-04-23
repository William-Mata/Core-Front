import {
  DirecaoOrdenacao,
  FiltroStatusCompra,
  ItemListaCompra,
  OrdenacaoItensCompra,
  ResumoListaCompra,
} from '../tipos/compras.tipos';

export function calcularValorTotalItemCompra(quantidade: number, valorUnitario: number): number {
  const quantidadeValida = Number.isFinite(quantidade) ? quantidade : 0;
  const valorValido = Number.isFinite(valorUnitario) ? valorUnitario : 0;
  return Number((quantidadeValida * valorValido).toFixed(2));
}

export function calcularResumoListaCompra(itens: ItemListaCompra[]): ResumoListaCompra {
  const totalLista = itens.reduce((soma, item) => soma + item.valorTotal, 0);
  const itensComprados = itens.filter((item) => item.comprado);
  const totalComprado = itensComprados.reduce((soma, item) => soma + item.valorTotal, 0);
  const percentualComprado = itens.length > 0 ? Number(((itensComprados.length / itens.length) * 100).toFixed(2)) : 0;

  return {
    totalLista: Number(totalLista.toFixed(2)),
    totalComprado: Number(totalComprado.toFixed(2)),
    percentualComprado,
    quantidadeItens: itens.length,
    quantidadeItensComprados: itensComprados.length,
  };
}

export function filtrarItensCompra(itens: ItemListaCompra[], filtro: FiltroStatusCompra): ItemListaCompra[] {
  if (filtro === 'comprados') {
    return itens.filter((item) => item.comprado);
  }
  if (filtro === 'naoComprados') {
    return itens.filter((item) => !item.comprado);
  }
  return itens;
}

function compararTexto(a: string, b: string, direcao: DirecaoOrdenacao): number {
  const resultado = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
  return direcao === 'asc' ? resultado : -resultado;
}

function compararNumero(a: number, b: number, direcao: DirecaoOrdenacao): number {
  return direcao === 'asc' ? a - b : b - a;
}

export function ordenarItensCompra(
  itens: ItemListaCompra[],
  ordenacao: OrdenacaoItensCompra,
  direcao: DirecaoOrdenacao,
): ItemListaCompra[] {
  return [...itens].sort((a, b) => {
    if (ordenacao === 'alfabetica') {
      return compararTexto(a.descricao, b.descricao, direcao);
    }
    if (ordenacao === 'preco') {
      return compararNumero(a.valorUnitario, b.valorUnitario, direcao);
    }
    return compararTexto(a.marcadorCor, b.marcadorCor, direcao);
  });
}

export function removerItensRepetidosCompra(itens: ItemListaCompra[]): ItemListaCompra[] {
  const chaves = new Set<string>();
  const itensFiltrados: ItemListaCompra[] = [];

  for (const item of itens) {
    const chave = `${item.descricao.trim().toLowerCase()}::${item.unidadeMedida}::${item.marcadorCor}`;
    if (chaves.has(chave)) continue;
    chaves.add(chave);
    itensFiltrados.push(item);
  }

  return itensFiltrados;
}

function extrairDigitosNumericos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatarNumeroEntradaPorLocale(valor: number, locale: string, casasDecimais: number): string {
  const numeroSeguro = Number.isFinite(valor) ? valor : 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(numeroSeguro);
}

export function aplicarMascaraNumeroPorLocale(entrada: string, locale: string, casasDecimais: number): string {
  const numero = Number(extrairDigitosNumericos(entrada) || '0') / 10 ** casasDecimais;
  return formatarNumeroEntradaPorLocale(numero, locale, casasDecimais);
}

export function converterTextoNumeroPorLocale(entrada: string, locale: string): number {
  const separadorDecimal = locale.startsWith('en') ? '.' : ',';
  const separadorMilhar = locale.startsWith('en') ? ',' : '.';
  const normalizado = entrada
    .split(separadorMilhar)
    .join('')
    .replace(separadorDecimal, '.')
    .replace(/[^\d.-]/g, '');
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}
