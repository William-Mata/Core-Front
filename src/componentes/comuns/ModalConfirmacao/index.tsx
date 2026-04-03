import { Text, TouchableOpacity, View } from 'react-native';
import { Botao } from '../Botao';
import { Modal } from '../Modal';
import { COLORS } from '../../../styles/variables';

interface ModalConfirmacaoOpcao {
  valor: string;
  rotulo: string;
}

interface ModalConfirmacaoProps {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
  opcoes?: ModalConfirmacaoOpcao[];
  valorSelecionado?: string;
  onSelecionarOpcao?: (valor: string) => void;
  observacao?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacao({
  visivel,
  titulo,
  mensagem,
  textoConfirmar,
  textoCancelar,
  opcoes,
  valorSelecionado,
  onSelecionarOpcao,
  observacao,
  carregando,
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  const exibirOpcoes = Array.isArray(opcoes) && opcoes.length > 0 && Boolean(onSelecionarOpcao);

  return (
    <Modal visivel={visivel} onFechar={onCancelar} titulo={titulo}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 16 }}>{mensagem}</Text>
      {exibirOpcoes ? (
        <View style={{ gap: 8, marginBottom: 16 }}>
          {opcoes.map((opcao) => {
            const selecionada = valorSelecionado === opcao.valor;
            return (
              <TouchableOpacity
                key={opcao.valor}
                onPress={() => onSelecionarOpcao?.(opcao.valor)}
                activeOpacity={0.85}
                style={{
                  borderWidth: 1,
                  borderColor: selecionada ? COLORS.accent : COLORS.borderColor,
                  backgroundColor: selecionada ? COLORS.accentSubtle : COLORS.bgSecondary,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: selecionada ? COLORS.accent : COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  {opcao.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      {observacao ? <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 16 }}>{observacao}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Botao titulo={textoCancelar} tipo="secundario" onPress={onCancelar} estilo={{ flex: 1 }} disabled={carregando} />
        <Botao titulo={textoConfirmar} tipo="primario" onPress={onConfirmar} estilo={{ flex: 1 }} carregando={carregando} />
      </View>
    </Modal>
  );
}
