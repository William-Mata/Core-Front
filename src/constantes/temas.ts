import { COLORS, LAYOUT } from '../styles/variables';

export const TEMA_ESCURO = {
  cores: {
    fundo: COLORS.bgPrimary,
    superficie: COLORS.bgSecondary,
    cartao: COLORS.bgTertiary,
    bordaSutil: COLORS.borderColor,
    primaria: COLORS.accent,
    primariaVivo: COLORS.accentSoft,
    primariaEscuro: COLORS.accentMuted,
    texto: COLORS.textPrimary,
    textoSuave: COLORS.textSecondary,
    textoDesabilitado: COLORS.textSecondary,
    sucesso: COLORS.success,
    aviso: COLORS.warning,
    erro: COLORS.error,
    info: COLORS.info,
    overlay: COLORS.overlayStrong,
  },
  efeitos: {
    brilhoRosa: '0 0 12px rgba(255, 0, 110, 0.55)',
    brilhoSuave: '0 0 6px rgba(255, 0, 110, 0.25)',
    brilhoIntenso: '0 0 20px rgba(255, 0, 110, 0.8)',
    vidro: 'rgba(13, 13, 18, 0.85)',
    backdropBlur: '12px',
  },
  tipografia: {
    familia: 'Inter, system-ui, sans-serif',
    tituloGrande: { tamanho: 28, peso: '700' },
    titulo: { tamanho: 20, peso: '600' },
    subtitulo: { tamanho: 16, peso: '600' },
    corpo: { tamanho: 14, peso: '400' },
    legenda: { tamanho: 12, peso: '400' },
    codigo: { familia: 'JetBrains Mono, monospace', tamanho: 13 },
  },
  raios: {
    pequeno: LAYOUT.radiusSm,
    medio: LAYOUT.radiusMd,
    grande: LAYOUT.radiusLg,
    circular: 9999,
  },
  espacamentos: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  transicoes: {
    rapida: '150ms ease',
    normal: '250ms ease',
    lenta: '400ms ease',
  },
} as const;


