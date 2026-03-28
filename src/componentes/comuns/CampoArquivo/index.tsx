import { useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../../../styles/variables';
import { usarTraducao } from '../../../hooks/usarTraducao';

interface CampoArquivoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  estilo?: ViewStyle;
  error?: string | boolean;
}

export function CampoArquivo({ label, value, onChange, placeholder, estilo, error }: CampoArquivoProps) {
  const { t } = usarTraducao();
  const [focadoWeb, setFocadoWeb] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selecionarArquivoNativo = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
      multiple: false,
    });

    if (resultado.canceled || !resultado.assets?.length) return;
    onChange(resultado.assets[0].name || '');
  };

  if (Platform.OS === 'web') {
    return (
      <View style={estilo}>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(event) => {
            const arquivo = event.target.files?.[0];
            onChange(arquivo?.name || '');
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onFocus={() => setFocadoWeb(true)}
          onBlur={() => setFocadoWeb(false)}
          style={{
            width: '100%',
            backgroundColor: COLORS.bgTertiary,
            borderRadius: '8px',
            border: `1px solid ${error ? COLORS.accent : focadoWeb ? COLORS.borderAccent : COLORS.borderColor}`,
            boxShadow: error ? `0 0 0 1px ${COLORS.accent}` : focadoWeb ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            minHeight: '46px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              color: value ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: '12px',
              flex: '1 1 auto',
            }}
          >
            {value || placeholder || t('comum.acoes.selecionar')}
          </span>
          <span style={{ color: COLORS.accent, fontSize: '12px', fontWeight: 700, flex: '0 0 auto' }}>
            {t('comum.acoes.selecionar')}
          </span>
        </button>
        {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={estilo}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <TouchableOpacity
        onPress={selecionarArquivoNativo}
        style={{
          backgroundColor: COLORS.bgTertiary,
          borderWidth: 1,
          borderColor: error ? COLORS.accent : COLORS.borderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: value ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {value || placeholder || t('comum.acoes.selecionar')}
        </Text>
        <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginLeft: 8 }}>{t('comum.acoes.selecionar')}</Text>
      </TouchableOpacity>
      {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
