import { useState } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { COLORS } from '../../../styles/variables';

interface CampoTextoProps {
  label?: string;
  valor?: string;
  value?: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string | boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad' | 'number-pad';
  estilo?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
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
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    fontSize: 14,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export function CampoTexto({
  label,
  valor,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = 'default',
  estilo,
  multiline,
  numberOfLines,
}: CampoTextoProps) {
  const valorFinal = value || valor;
  const [focado, setFocado] = useState(false);

  return (
    <View style={[estilos.container, estilo]}>
      {label && <Text style={estilos.label}>{label}</Text>}
      <TextInput
        value={valorFinal}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType as any}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        style={[
          estilos.input,
          error ? { borderColor: COLORS.accent } : focado ? { borderColor: COLORS.borderAccent } : null,
          Platform.OS === 'web'
            ? ({
                outlineStyle: 'none',
                outlineWidth: 0,
                boxShadow: error ? `0 0 0 1px ${COLORS.accent}` : focado ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
              } as any)
            : null,
          multiline && { minHeight: numberOfLines ? numberOfLines * 20 : 100 },
        ]}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {typeof error === 'string' && error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

