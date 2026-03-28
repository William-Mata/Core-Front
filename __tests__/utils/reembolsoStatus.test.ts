import {
  parseStatusReembolso,
  podeEditarReembolso,
  podeEfetivarReembolso,
  podeEstornarReembolso,
  serializarStatusReembolso,
} from '../../src/utils/reembolsoStatus';

describe('utils/reembolsoStatus', () => {
  it('deve normalizar status de API para pendente/efetivada/cancelada', () => {
    expect(parseStatusReembolso('AGUARDANDO')).toBe('pendente');
    expect(parseStatusReembolso('aprovado')).toBe('efetivada');
    expect(parseStatusReembolso('EFETIVADA')).toBe('efetivada');
    expect(parseStatusReembolso('cancelada')).toBe('cancelada');
  });

  it('deve serializar status para API', () => {
    expect(serializarStatusReembolso('pendente')).toBe('PENDENTE');
    expect(serializarStatusReembolso('efetivada')).toBe('EFETIVADA');
    expect(serializarStatusReembolso('cancelada')).toBe('CANCELADA');
  });

  it('deve controlar regras de acoes por status', () => {
    expect(podeEditarReembolso('pendente')).toBe(true);
    expect(podeEditarReembolso('efetivada')).toBe(false);

    expect(podeEfetivarReembolso('pendente')).toBe(true);
    expect(podeEfetivarReembolso('cancelada')).toBe(false);

    expect(podeEstornarReembolso('efetivada')).toBe(true);
    expect(podeEstornarReembolso('pendente')).toBe(false);
  });
});
