import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { SugestaoAutoCompletarBase, usarAutoCompletar } from '../../../hooks/usarAutoCompletar';
import { COLORS } from '../../../styles/variables';

interface CampoAutoCompletarProps<TSugestao extends SugestaoAutoCompletarBase> {
  label?: string;
  value: string;
  onChange: (texto: string) => void;
  placeholder?: string;
  error?: string | boolean;
  obrigatorio?: boolean;
  editavel?: boolean;
  estilo?: ViewStyle;
  sugestoes?: TSugestao[];
  buscarSugestoes?: (termo: string) => Promise<TSugestao[]>;
  onSelecionarSugestao?: (sugestao: TSugestao) => void;
  aguardarBuscaMs?: number;
  minimoCaracteresBusca?: number;
  mensagemSemSugestoes?: string;
  carregando?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
}

function formatarLabelObrigatorio(label: string, obrigatorio: boolean): string {
  if (!obrigatorio) return label;
  return /\*\s*$/.test(label) ? label : `${label} *`;
}

export function CampoAutoCompletar<TSugestao extends SugestaoAutoCompletarBase>(
  props: CampoAutoCompletarProps<TSugestao>,
) {
  const {
    label,
    value,
    onChange,
    placeholder,
    error,
    obrigatorio,
    editavel = true,
    estilo,
    sugestoes = [],
    buscarSugestoes,
    onSelecionarSugestao,
    aguardarBuscaMs = 300,
    minimoCaracteresBusca = 1,
    mensagemSemSugestoes,
    carregando = false,
    keyboardType = 'default',
  } = props;
  const { t } = usarTraducao();
  const [focado, setFocado] = useState(false);
  const obrigatorioFinal = obrigatorio ?? Object.prototype.hasOwnProperty.call(props, 'error');
  const labelFormatada = label ? formatarLabelObrigatorio(label, obrigatorioFinal) : '';
  const temporizadorFecharRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    sugestoesExibidas,
    carregando: carregandoBusca,
    semResultados,
  } = usarAutoCompletar({
    textoBusca: value,
    sugestoes,
    buscarSugestoes,
    aguardarBuscaMs,
    minimoCaracteresBusca,
    habilitado: editavel,
  });

  const carregandoFinal = carregando || carregandoBusca;
  const estiloEntradaWeb: TextStyle | null = Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        outlineWidth: 0,
        boxShadow: error ? `0 0 0 1px ${COLORS.accent}` : 'none',
      } as unknown as TextStyle)
    : null;

  const deveExibirLista = useMemo(() => {
    if (!focado || !editavel) return false;
    if (value.trim().length < minimoCaracteresBusca) return false;
    return carregandoFinal || semResultados || sugestoesExibidas.length > 0;
  }, [carregandoFinal, editavel, focado, minimoCaracteresBusca, semResultados, sugestoesExibidas.length, value]);

  useEffect(() => () => {
    if (temporizadorFecharRef.current) {
      clearTimeout(temporizadorFecharRef.current);
    }
  }, []);

  return (
    <View style={[estilos.container, estilo]}>
      {label ? <Text style={estilos.label}>{labelFormatada}</Text> : null}
      <TextInput
        value={value}
        onChangeText={(texto) => {
          onChange(texto);
          if (!focado) setFocado(true);
        }}
        onFocus={() => {
          if (temporizadorFecharRef.current) {
            clearTimeout(temporizadorFecharRef.current);
            temporizadorFecharRef.current = null;
          }
          setFocado(true);
        }}
        onBlur={() => {
          temporizadorFecharRef.current = setTimeout(() => {
            setFocado(false);
          }, 120);
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
        editable={editavel}
        style={[
          estilos.input,
          !editavel ? estilos.inputDesabilitado : null,
          error ? { borderColor: COLORS.accent } : null,
          estiloEntradaWeb,
        ]}
      />
      {typeof error === 'string' && error ? <Text style={estilos.erro}>{error}</Text> : null}

      {deveExibirLista ? (
        <View style={estilos.listaContainer}>
          {carregandoFinal ? <Text style={estilos.textoEstado}>{t('comum.carregando')}</Text> : null}

          {!carregandoFinal && semResultados ? (
            <Text style={estilos.textoEstado}>{mensagemSemSugestoes || t('comum.autocomplete.semSugestoes')}</Text>
          ) : null}

          {!carregandoFinal && sugestoesExibidas.length > 0 ? (
            <ScrollView nestedScrollEnabled style={estilos.lista}>
              {sugestoesExibidas.map((sugestao, indice) => {
                const selecionada = sugestao.valor.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase();
                return (
                  <TouchableOpacity
                    key={sugestao.id}
                    onPress={() => {
                      onChange(sugestao.valor);
                      onSelecionarSugestao?.(sugestao);
                      setFocado(false);
                    }}
                    style={[
                      estilos.itemSugestao,
                      indice > 0 ? estilos.itemSugestaoSeparador : null,
                      selecionada ? estilos.itemSugestaoSelecionada : null,
                    ]}
                  >
                    <Text style={[estilos.itemSugestaoTexto, selecionada ? estilos.itemSugestaoTextoSelecionada : null]}>
                      {sugestao.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgTertiary,
    color: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    fontSize: 14,
  },
  inputDesabilitado: {
    opacity: 0.7,
  },
  erro: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  listaContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 8,
    backgroundColor: COLORS.bgSecondary,
    overflow: 'hidden',
  },
  lista: {
    maxHeight: 180,
  },
  textoEstado: {
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  itemSugestao: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.bgSecondary,
  },
  itemSugestaoSeparador: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
  itemSugestaoSelecionada: {
    backgroundColor: COLORS.accentSubtle,
  },
  itemSugestaoTexto: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  itemSugestaoTextoSelecionada: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
