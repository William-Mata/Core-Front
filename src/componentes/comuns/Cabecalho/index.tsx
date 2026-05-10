import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sininho, type Notificacao } from '../Sininho';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { usarLayoutStore } from '../../../store/usarLayoutStore';
import { usarNotificacaoStore } from '../../../store/usarNotificacaoStore';
import { COLORS } from '../../../styles/variables';

export interface CabecalhoProps {
  titulo: string;
  notificacoes?: Notificacao[];
  aoClicarNotificacoes?: () => void;
  aoRemoverNotificacao?: (id: number) => void;
  aoClicarSair?: () => void;
  mostrarSair?: boolean;
}

export function Cabecalho({
  titulo,
  notificacoes = [],
  aoClicarNotificacoes,
  aoRemoverNotificacao,
  aoClicarSair,
  mostrarSair = false,
}: CabecalhoProps) {
  const { t } = usarTraducao();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const abrirMenuMovel = usarLayoutStore((estado) => estado.abrirMenuMovel);
  const { toasts, removerToast } = usarNotificacaoStore();
  const exibirAcionadorMenu = width <= 768;
  const paddingTopSeguro = Platform.OS === 'web' ? 12 : Math.max(insets.top, 0) + 8;

  const notificacoesMapeadas: Notificacao[] =
    notificacoes.length > 0
      ? notificacoes
      : toasts.map((toast) => ({
          id: toast.id,
          titulo: toast.tipo.toUpperCase(),
          mensagem: toast.mensagem,
          tipo: toast.tipo === 'info' ? 'info' : toast.tipo,
          data: new Date().toISOString(),
          lida: toast.lida ?? false,
        }));

  const handleRemoverNotificacao = (id: string | number) => {
    if (aoRemoverNotificacao) {
      aoRemoverNotificacao(Number(id));
      return;
    }
    removerToast(String(id));
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 8000,
        elevation: 70,
        backgroundColor: COLORS.bgSecondary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bgTertiary,
        paddingHorizontal: 16,
        paddingTop: paddingTopSeguro,
        paddingBottom: 12,
      }}
    >
      {/* Logo e titulo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {exibirAcionadorMenu ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('menu.abrir')}
            onPress={abrirMenuMovel}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: COLORS.bgTertiary,
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="menu" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <Text numberOfLines={1} style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold', flexShrink: 1 }}>
          {titulo}
        </Text>
      </View>

      {/* Acoes direita */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', zIndex: 8100, elevation: 75 }}>
        {/* Sininho de notificacoes */}
        <Sininho
          notificacoes={notificacoesMapeadas}
          aoClicar={aoClicarNotificacoes}
          aoRemover={handleRemoverNotificacao}
        />

        {/* Sair */}
        {mostrarSair && (
          <TouchableOpacity
            onPress={aoClicarSair}
            style={{
              backgroundColor: COLORS.borderColor,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: COLORS.error, fontSize: 12, fontWeight: '600' }}>
              {t('comum.sair')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
