import { ReactNode } from 'react';
import { Modal as RNModal, ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, LAYOUT } from '../../../styles/variables';

interface ModalProps {
  visivel: boolean;
  onFechar: () => void;
  titulo?: string;
  children: ReactNode;
}

export function Modal({ visivel, onFechar, titulo, children }: ModalProps) {
  return (
    <RNModal animationType="fade" transparent visible={visivel} onRequestClose={onFechar}>
      <View style={estilos.overlay}>
        <View style={estilos.card}>
          {titulo ? (
            <View style={estilos.header}>
              <Text style={estilos.titulo}>{titulo}</Text>
              <TouchableOpacity onPress={onFechar} style={estilos.botaoFechar}>
                <Text style={estilos.textoFechar}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ScrollView style={estilos.conteudo} contentContainerStyle={estilos.conteudoContainer} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '88%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: LAYOUT.radiusLg,
    padding: 24,
  },
  conteudo: {
    flexGrow: 0,
  },
  conteudoContainer: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  botaoFechar: {
    padding: 8,
  },
  textoFechar: {
    color: COLORS.accent,
  },
});

