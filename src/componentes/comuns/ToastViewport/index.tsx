import { useEffect } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { usarNotificacaoStore } from '../../../store/usarNotificacaoStore';
import { COLORS } from '../../../styles/variables';

export function ToastViewport() {
  const { toasts, removerToast } = usarNotificacaoStore();

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        removerToast(toast.id);
      }, toast.duracao ?? 4000),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, removerToast]);

  if (toasts.length === 0) return null;

  const corBorda = (tipo: string) => {
    if (tipo === 'sucesso') return COLORS.success;
    if (tipo === 'erro') return COLORS.error;
    if (tipo === 'aviso') return COLORS.warning;
    return COLORS.info;
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        left: Platform.OS === 'web' ? undefined : 12,
        zIndex: 99999,
        elevation: 999,
        gap: 8,
        width: Platform.OS === 'web' ? 320 : undefined,
        maxWidth: Platform.OS === 'web' ? 320 : undefined,
      }}
    >
      {toasts.slice(-3).map((toast) => (
        <TouchableOpacity
          key={toast.id}
          onPress={() => removerToast(toast.id)}
          activeOpacity={0.9}
          style={{
            backgroundColor: COLORS.bgSecondary,
            borderWidth: 1,
            borderColor: corBorda(toast.tipo),
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ color: corBorda(toast.tipo), fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
            {toast.tipo.toUpperCase()}
          </Text>
          <Text style={{ color: COLORS.textPrimary, fontSize: 12 }} numberOfLines={3}>
            {toast.mensagem}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
