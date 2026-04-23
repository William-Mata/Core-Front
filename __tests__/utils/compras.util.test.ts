import {
  aplicarMascaraNumeroPorLocale,
  calcularResumoListaCompra,
  calcularValorTotalItemCompra,
  converterTextoNumeroPorLocale,
  filtrarItensCompra,
  formatarNumeroEntradaPorLocale,
  ordenarItensCompra,
  removerItensRepetidosCompra,
} from '../../src/utils/compras.util';
import { ItemListaCompra } from '../../src/tipos/compras.tipos';

const itensBase: ItemListaCompra[] = [
  {
    id: 1,
    listaId: 10,
    descricao: 'Arroz',
    observacao: '',
    unidadeMedida: 'kg',
    quantidade: 2,
    marcadorCor: '#22c55e',
    valorUnitario: 8,
    valorTotal: 16,
    comprado: true,
    versao: 1,
    atualizadoEm: '2026-04-21',
  },
  {
    id: 2,
    listaId: 10,
    descricao: 'Feijao',
    observacao: '',
    unidadeMedida: 'kg',
    quantidade: 1,
    marcadorCor: '#22c55e',
    valorUnitario: 10,
    valorTotal: 10,
    comprado: false,
    versao: 1,
    atualizadoEm: '2026-04-21',
  },
  {
    id: 3,
    listaId: 10,
    descricao: 'Arroz',
    observacao: '',
    unidadeMedida: 'kg',
    quantidade: 5,
    marcadorCor: '#22c55e',
    valorUnitario: 7,
    valorTotal: 35,
    comprado: false,
    versao: 1,
    atualizadoEm: '2026-04-21',
  },
];

describe('utils compras', () => {
  it('deve calcular valor total do item com duas casas decimais', () => {
    expect(calcularValorTotalItemCompra(2.5, 4.333)).toBe(10.83);
  });

  it('deve calcular resumo da lista com total e percentual comprado', () => {
    const resumo = calcularResumoListaCompra(itensBase);
    expect(resumo.totalLista).toBe(61);
    expect(resumo.totalComprado).toBe(16);
    expect(resumo.percentualComprado).toBeCloseTo(33.33, 2);
    expect(resumo.quantidadeItens).toBe(3);
    expect(resumo.quantidadeItensComprados).toBe(1);
  });

  it('deve filtrar por itens comprados e nao comprados', () => {
    expect(filtrarItensCompra(itensBase, 'comprados')).toHaveLength(1);
    expect(filtrarItensCompra(itensBase, 'naoComprados')).toHaveLength(2);
    expect(filtrarItensCompra(itensBase, 'todos')).toHaveLength(3);
  });

  it('deve ordenar por preco descrescente', () => {
    const ordenado = ordenarItensCompra(itensBase, 'preco', 'desc');
    expect(ordenado[0].valorUnitario).toBe(10);
    expect(ordenado[2].valorUnitario).toBe(7);
  });

  it('deve remover itens repetidos por descricao, unidade e cor', () => {
    const semRepetidos = removerItensRepetidosCompra(itensBase);
    expect(semRepetidos).toHaveLength(2);
  });

  it('deve aplicar mascara numerica conforme locale pt-BR e converter corretamente', () => {
    const valorMascara = aplicarMascaraNumeroPorLocale('12345', 'pt-BR', 2);
    expect(valorMascara).toBe('123,45');
    expect(converterTextoNumeroPorLocale(valorMascara, 'pt-BR')).toBeCloseTo(123.45, 2);
  });

  it('deve formatar numero conforme locale en-US', () => {
    expect(formatarNumeroEntradaPorLocale(1234.5, 'en-US', 2)).toBe('1,234.50');
  });
});
