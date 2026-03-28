import { View, Text, TouchableOpacity } from 'react-native';
import { Sininho, type Notificacao } from '../Sininho';
import { usarTraducao } from '../../../hooks/usarTraducao';
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
  const { toasts, removerToast } = usarNotificacaoStore();

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
        paddingVertical: 12,
        paddingTop: 12,
      }}
    >
      {/* Logo e titulo */}
      <View>
        <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: 'bold' }}>
          Core
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
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
