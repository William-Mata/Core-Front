import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { COLORS } from '../../../styles/variables';
import { Modal } from '../Modal';
import { Botao } from '../Botao';

export interface CampoSelectOpcao {
  value: string;
  label: string;
  icone?: string;
  imagem?: ImageSourcePropType;
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
  const [filtroTexto, setFiltroTexto] = useState('');
  const { t } = usarTraducao();
  const obrigatorioFinal = obrigatorio ?? Object.prototype.hasOwnProperty.call(props, 'error');
  const labelFormatada = formatarLabelObrigatorio(label, obrigatorioFinal);
  const opcoesUnicas = useMemo(() => {
    const opcoesSemDuplicidade = new Map<string, CampoSelectOpcao>();

    options.forEach((option) => {
      const chave = `${option.value.trim().toLocaleLowerCase()}::${option.label.trim().toLocaleLowerCase()}`;
      if (!opcoesSemDuplicidade.has(chave)) {
        opcoesSemDuplicidade.set(chave, option);
      }
    });

    return Array.from(opcoesSemDuplicidade.values());
  }, [options]);

  const textoSelecionado = useMemo(() => {
    if (multiple) {
      if (values.length === 0) return placeholder;
      return opcoesUnicas
        .filter((option) => values.includes(option.value))
        .map((option) => option.label)
        .join(', ');
    }

    const encontrado = opcoesUnicas.find((option) => option.value === value);
    return encontrado?.label || placeholder;
  }, [multiple, opcoesUnicas, placeholder, value, values]);
  const opcaoSelecionada = useMemo(
    () => opcoesUnicas.find((option) => option.value === value),
    [opcoesUnicas, value],
  );
  const opcoesFiltradas = useMemo(() => {
    const termo = filtroTexto.trim().toLocaleLowerCase();
    if (!termo) return opcoesUnicas;
    return opcoesUnicas.filter((option) => option.label.toLocaleLowerCase().includes(termo));
  }, [filtroTexto, opcoesUnicas]);

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
        onPress={() => {
          setFiltroTexto('');
          setAberto(true);
        }}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {opcaoSelecionada?.imagem ? <Image source={opcaoSelecionada.imagem} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" /> : null}
          {!opcaoSelecionada?.imagem && opcaoSelecionada?.icone ? <Text style={{ fontSize: 14, marginRight: 6 }}>{opcaoSelecionada.icone}</Text> : null}
          <Text style={{ color: COLORS.textPrimary, fontSize: 14, flex: 1 }}>{textoSelecionado}</Text>
        </View>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 8 }}>{'\u25BE'}</Text>
      </TouchableOpacity>
      {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      {aberto ? (
        <Modal visivel onFechar={() => setAberto(false)} titulo={labelFormatada}>
          <TextInput
            value={filtroTexto}
            onChangeText={setFiltroTexto}
            placeholder={t('comum.filtros.descricao')}
            placeholderTextColor={COLORS.textSecondary}
            style={{
              backgroundColor: COLORS.bgTertiary,
              borderWidth: 1,
              borderColor: COLORS.borderColor,
              borderRadius: 8,
              color: COLORS.textPrimary,
              fontSize: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 10,
            }}
          />
          <ScrollView style={{ maxHeight: 320 }}>
            {opcoesFiltradas.map((option) => {
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                    {option.imagem ? <Image source={option.imagem} style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6 }} resizeMode="contain" /> : null}
                    {!option.imagem && option.icone ? <Text style={{ fontSize: 14, marginRight: 6 }}>{option.icone}</Text> : null}
                    <Text style={{ color: ativo ? COLORS.accent : COLORS.textPrimary, fontSize: 14, flexShrink: 1 }}>{option.label}</Text>
                  </View>
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
