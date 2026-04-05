import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { COLORS } from '../../../styles/variables';
import { Modal } from '../Modal';
import { Botao } from '../Botao';

export interface CampoSelectOpcao {
  value: string;
  label: string;
}

interface CampoSelectProps {
  label: string;
  placeholder?: string;
  options: CampoSelectOpcao[];
  value?: string;
  values?: string[];
  multiple?: boolean;
  error?: string | boolean;
  onChange?: (value: string) => void;
  onChangeMultiple?: (values: string[]) => void;
  obrigatorio?: boolean;
}

function formatarLabelObrigatorio(label: string, obrigatorio: boolean): string {
  if (!obrigatorio) return label;
  return /\*\s*$/.test(label) ? label : `${label} *`;
}

export function CampoSelect(props: CampoSelectProps) {
  const {
    label,
    placeholder = 'Selecionar',
    options,
    value,
    values = [],
    multiple = false,
    error,
    onChange,
    onChangeMultiple,
    obrigatorio,
  } = props;
  const [aberto, setAberto] = useState(false);
  const { t } = usarTraducao();
  const obrigatorioFinal = obrigatorio ?? Object.prototype.hasOwnProperty.call(props, 'error');
  const labelFormatada = formatarLabelObrigatorio(label, obrigatorioFinal);

  const textoSelecionado = useMemo(() => {
    if (multiple) {
      if (values.length === 0) return placeholder;
      return options
        .filter((option) => values.includes(option.value))
        .map((option) => option.label)
        .join(', ');
    }

    const encontrado = options.find((option) => option.value === value);
    return encontrado?.label || placeholder;
  }, [multiple, options, placeholder, value, values]);

  const alternarValorMultiplo = (selectedValue: string) => {
    const proximo = values.includes(selectedValue)
      ? values.filter((item) => item !== selectedValue)
      : [...values, selectedValue];
    onChangeMultiple?.(proximo);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{labelFormatada}</Text>

      <TouchableOpacity
        onPress={() => setAberto(true)}
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
        <Text style={{ color: COLORS.textPrimary, fontSize: 14, flex: 1 }}>{textoSelecionado}</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 8 }}>{'\u25BE'}</Text>
      </TouchableOpacity>
      {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      {aberto ? (
        <Modal visivel onFechar={() => setAberto(false)} titulo={labelFormatada}>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((option) => {
              const ativo = multiple ? values.includes(option.value) : value === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    if (multiple) {
                      alternarValorMultiplo(option.value);
                      return;
                    }

                    onChange?.(option.value);
                    setAberto(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: ativo ? COLORS.borderAccent : COLORS.borderColor,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: ativo ? COLORS.accentSubtle : COLORS.bgTertiary,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: ativo ? COLORS.accent : COLORS.textPrimary, fontSize: 14 }}>{option.label}</Text>
                  {ativo ? <Text style={{ color: COLORS.accent, fontSize: 14 }}>{'\u2713'}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {multiple ? <Botao titulo={t('comum.acoes.confirmar')} onPress={() => setAberto(false)} tipo="primario" /> : null}
        </Modal>
      ) : null}
    </View>
  );
}
