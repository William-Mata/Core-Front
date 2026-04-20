import {
  ehTransacaoVinculadaAFatura,
  podeAlterarTransacaoVinculadaAFatura,
  resolverStatusOperacionalTransacaoFatura,
  statusTransacaoEfetivada,
  statusFaturaPermiteAlteracao,
  todasTransacoesFaturaEfetivadas,
} from '../../src/utils/acoesFaturaCartao';

describe('utils/acoesFaturaCartao', () => {
  it('deve permitir alteracao para status de fatura aberta, fechada, vencida e estornada', () => {
    expect(statusFaturaPermiteAlteracao('aberta')).toBe(true);
    expect(statusFaturaPermiteAlteracao('fechada')).toBe(true);
    expect(statusFaturaPermiteAlteracao('vencida')).toBe(true);
    expect(statusFaturaPermiteAlteracao('estornada')).toBe(true);
  });

  it('deve bloquear alteracao para status de fatura efetivada', () => {
    expect(statusFaturaPermiteAlteracao('efetivada')).toBe(false);
  });

  it('deve identificar transacao vinculada a fatura apenas com ids validos', () => {
    expect(ehTransacaoVinculadaAFatura(10, 20)).toBe(true);
    expect(ehTransacaoVinculadaAFatura(undefined, 20)).toBe(false);
    expect(ehTransacaoVinculadaAFatura(10, -1)).toBe(false);
  });

  it('deve manter transacao fora de fatura sem restricao adicional', () => {
    expect(podeAlterarTransacaoVinculadaAFatura(undefined, 20, 'efetivada')).toBe(true);
  });

  it('deve aplicar bloqueio de alteracao apenas para transacao vinculada com status nao permitido', () => {
    expect(podeAlterarTransacaoVinculadaAFatura(10, 20, 'efetivada')).toBe(false);
    expect(podeAlterarTransacaoVinculadaAFatura(10, 20, 'aberta')).toBe(true);
  });

  it('deve resolver status operacional quando status da transacao repete status da fatura', () => {
    expect(
      resolverStatusOperacionalTransacaoFatura(
        { status: 'estornada', dataEfetivacao: '2026-04-10' },
        'estornada',
      ),
    ).toBe('efetivada');
  });

  it('deve identificar status de transacao efetivada', () => {
    expect(statusTransacaoEfetivada('efetivada')).toBe(true);
    expect(statusTransacaoEfetivada('pendente')).toBe(false);
    expect(statusTransacaoEfetivada(undefined)).toBe(false);
  });

  it('deve permitir efetivar fatura apenas quando todas as transacoes estiverem efetivadas', () => {
    expect(
      todasTransacoesFaturaEfetivadas([
        { status: 'efetivada' },
        { status: 'Efetivada' },
      ]),
    ).toBe(true);

    expect(
      todasTransacoesFaturaEfetivadas([
        { status: 'efetivada' },
        { status: 'pendente' },
      ]),
    ).toBe(false);
  });
});
