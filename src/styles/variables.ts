export const COLORS = {
  bgPrimary: '#050508',
  bgSecondary: '#0d0d12',
  bgTertiary: '#12121a',
  bgHover: 'rgba(255, 0, 110, 0.08)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(255, 0, 110, 0.3)',
  overlaySoft: 'rgba(0, 0, 0, 0.2)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',
  textPrimary: '#f0f0f5',
  textSecondary: '#9ca3af',
  accent: '#ff006e',
  accentSoft: '#e91e8c',
  accentMuted: '#b91c7c',
  accentSubtle: 'rgba(255, 0, 110, 0.06)',
  accentRgba: 'rgba(255, 0, 110, 0.18)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#f59e0b',
  warningSoft: 'rgba(245, 158, 11, 0.18)',
  error: '#ef4444',
  errorSoft: 'rgba(239, 68, 68, 0.18)',
  info: '#3b82f6',
} as const;

export const LAYOUT = {
  sidebarWidth: 280,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
} as const;

export const EFFECTS = {
  shadowGlow: '0 0 40px rgba(255, 0, 110, 0.12)',
  shadowCard: '0 4px 24px rgba(0, 0, 0, 0.4)',
} as const;
