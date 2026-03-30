import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { createPortal } from 'react-dom';
import DateTimePicker from '@amjed-bouhouch/react-native-ui-datepicker';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { COLORS } from '../../../styles/variables';
import { converterDateParaIso, converterIsoParaDate, formatarDataPorIdioma, obterLocaleAtivo } from '../../../utils/formatacaoLocale';

interface CampoDataProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  estilo?: ViewStyle;
  error?: string | boolean;
}

interface CampoDataIntervaloProps {
  label: string;
  dataInicio: string;
  dataFim: string;
  onChange: (valor: { dataInicio: string; dataFim: string }) => void;
  placeholder?: string;
  estilo?: ViewStyle;
  error?: string | boolean;
}

function obterLocaleDatePicker(): string {
  const locale = obterLocaleAtivo();
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('es')) return 'es';
  return 'pt-br';
}

function formatarIntervaloData(dataInicio: string, dataFim: string, placeholder: string): string {
  if (dataInicio && dataFim) return `${formatarDataPorIdioma(dataInicio)} - ${formatarDataPorIdioma(dataFim)}`;
  if (dataInicio) return `${formatarDataPorIdioma(dataInicio)} - ...`;
  if (dataFim) return `... - ${formatarDataPorIdioma(dataFim)}`;
  return placeholder;
}

function usePopoverData(aberto: boolean, aoFechar: () => void) {
  const [focadoWeb, setFocadoWeb] = useState(false);
  const [posicaoPopover, setPosicaoPopover] = useState({ top: 0, left: 0, width: 286 });
  const containerRef = useRef<any>(null);
  const portalRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !aberto) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clicouNoCampo = containerRef.current?.contains(target);
      const clicouNoCalendario = portalRef.current?.contains(target);

      if (!clicouNoCampo && !clicouNoCalendario) {
        aoFechar();
        setFocadoWeb(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [aberto]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !aberto) return;

    const atualizarPosicao = () => {
      const rect = containerRef.current?.getBoundingClientRect?.();
      if (!rect) return;

      const largura = Math.min(Math.max(rect.width, 286), 286);
      const alturaPicker = 310;
      const espacoInferior = window.innerHeight - rect.bottom;
      const abrirAcima = espacoInferior < alturaPicker && rect.top > alturaPicker;

      setPosicaoPopover({
        top: abrirAcima ? rect.top - alturaPicker - 8 : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - largura - 16),
        width: largura,
      });
    };

    atualizarPosicao();
    window.addEventListener('resize', atualizarPosicao);
    window.addEventListener('scroll', atualizarPosicao, true);

    return () => {
      window.removeEventListener('resize', atualizarPosicao);
      window.removeEventListener('scroll', atualizarPosicao, true);
    };
  }, [aberto]);

  return { focadoWeb, setFocadoWeb, posicaoPopover, setPosicaoPopover, containerRef, portalRef };
}

export function CampoData({ label, value, onChange, placeholder, estilo, error }: CampoDataProps) {
  const [aberto, setAberto] = useState(false);
  const { t } = usarTraducao();
  const { focadoWeb, setFocadoWeb, posicaoPopover, containerRef, portalRef } = usePopoverData(aberto, () => setAberto(false));
  const localeDatePicker = useMemo(() => obterLocaleDatePicker(), []);
  const dataSelecionada = value ? converterIsoParaDate(value) : new Date();

  const renderPicker = () => (
    <View
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: 12,
        padding: 10,
      }}
    >
      <DateTimePicker
        mode="single"
        locale={localeDatePicker}
        date={dataSelecionada}
        displayFullDays
        firstDayOfWeek={1}
        height={290}
        onChange={(params) => {
          if (!params.date) return;
          onChange(converterDateParaIso(new Date(params.date as any)));
          setAberto(false);
          setFocadoWeb(false);
        }}
        selectedItemColor={COLORS.accent}
        headerButtonsPosition="around"
        headerButtonColor={COLORS.accent}
        headerButtonSize={16}
        headerContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 8,
          marginBottom: 4,
        }}
        headerTextContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        headerTextStyle={{
          color: COLORS.textPrimary,
          fontSize: 12,
          fontWeight: '600',
        }}
        headerButtonStyle={{
          width: 18,
          height: 18,
          minWidth: 18,
          minHeight: 18,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: COLORS.borderColor,
          backgroundColor: COLORS.bgTertiary,
        }}
        weekDaysContainerStyle={{
          marginBottom: 4,
        }}
        weekDaysTextStyle={{
          color: COLORS.textSecondary,
          fontSize: 11,
          fontWeight: '600',
        }}
        dayContainerStyle={{
          borderRadius: 8,
          width: 34,
          height: 34,
        }}
        todayContainerStyle={{
          borderWidth: 1,
          borderColor: COLORS.borderAccent,
          borderRadius: 8,
        }}
        todayTextStyle={{
          color: COLORS.accent,
        }}
        calendarTextStyle={{
          color: COLORS.textPrimary,
          fontSize: 12,
        }}
        selectedTextStyle={{
          color: COLORS.textPrimary,
          fontWeight: '700',
        }}
      />
    </View>
  );

  if (Platform.OS === 'web') {
    const estiloWebBase = (estilo as Record<string, string | number | undefined>) || {};

    return (
      <div
        ref={containerRef}
        style={{
          ...estiloWebBase,
          position: 'relative',
          zIndex: focadoWeb ? 2 : 1,
          width: typeof estiloWebBase.width !== 'undefined' ? estiloWebBase.width : '100%',
          maxWidth: '100%',
        }}
      >
        <div style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{label}</div>
        <button
          type="button"
          onClick={() => {
            setAberto((estadoAtual) => !estadoAtual);
            setFocadoWeb(true);
          }}
          style={{
            width: '100%',
            maxWidth: '100%',
            backgroundColor: COLORS.bgTertiary,
            borderRadius: '8px',
            border: `1px solid ${error ? COLORS.accent : focadoWeb ? COLORS.borderAccent : COLORS.borderColor}`,
            boxShadow: error ? `0 0 0 1px ${COLORS.accent}` : focadoWeb ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '12px',
            paddingRight: '12px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            minHeight: '46px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              minWidth: 0,
              flex: '1 1 auto',
              color: value ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: '14px',
              padding: '12px 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value ? formatarDataPorIdioma(value) : placeholder || t('comum.acoes.selecionar')}
          </span>
          <span
            style={{
              color: value ? COLORS.accent : COLORS.textSecondary,
              fontSize: '14px',
              marginLeft: '8px',
              flex: '0 0 auto',
            }}
          >
            {'\uD83D\uDCC5'}
          </span>
        </button>

        {typeof error === 'string' && error ? <div style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</div> : null}
        {aberto && typeof document !== 'undefined'
          ? createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
                <div
                  ref={portalRef}
                  style={{
                    position: 'fixed',
                    top: `${Math.max(16, posicaoPopover.top)}px`,
                    left: `${Math.max(16, posicaoPopover.left)}px`,
                    width: `${posicaoPopover.width}px`,
                    maxWidth: 'calc(100vw - 32px)',
                    pointerEvents: 'auto',
                  }}
                >
                  {renderPicker()}
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <View style={estilo}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => setAberto((estadoAtual) => !estadoAtual)}
        style={{
          backgroundColor: COLORS.bgTertiary,
          borderWidth: 1,
          borderColor: error ? COLORS.accent : aberto ? COLORS.borderAccent : COLORS.borderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: value ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 14, flex: 1 }}>
          {value ? formatarDataPorIdioma(value) : placeholder || t('comum.acoes.selecionar')}
        </Text>
        <Text style={{ color: value ? COLORS.accent : COLORS.textSecondary, fontSize: 16, marginLeft: 8 }}>{'\uD83D\uDCC5'}</Text>
      </TouchableOpacity>

      {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      {aberto ? <View style={{ marginTop: 8 }}>{renderPicker()}</View> : null}
    </View>
  );
}

export function CampoDataIntervalo({ label, dataInicio, dataFim, onChange, placeholder, estilo, error }: CampoDataIntervaloProps) {
  const [aberto, setAberto] = useState(false);
  const { t } = usarTraducao();
  const { focadoWeb, setFocadoWeb, posicaoPopover, containerRef, portalRef } = usePopoverData(aberto, () => setAberto(false));
  const localeDatePicker = useMemo(() => obterLocaleDatePicker(), []);
  const textoPlaceholder = placeholder || t('comum.acoes.selecionar');
  const possuiIntervaloSelecionado = Boolean(dataInicio || dataFim);

  const limparIntervalo = () => {
    onChange({ dataInicio: '', dataFim: '' });
    setAberto(false);
    if (Platform.OS === 'web') {
      setFocadoWeb(false);
    }
  };

  const renderPicker = () => (
    <View
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: 12,
        padding: 10,
      }}
    >
      <DateTimePicker
        mode="range"
        locale={localeDatePicker}
        startDate={dataInicio ? converterIsoParaDate(dataInicio) : undefined}
        endDate={dataFim ? converterIsoParaDate(dataFim) : undefined}
        displayFullDays
        firstDayOfWeek={1}
        height={290}
        onChange={(params) => {
          onChange({
            dataInicio: params.startDate ? converterDateParaIso(new Date(params.startDate as any)) : '',
            dataFim: params.endDate ? converterDateParaIso(new Date(params.endDate as any)) : '',
          });
        }}
        selectedItemColor={COLORS.accent}
        selectedRangeBackgroundColor={COLORS.accentRgba}
        headerButtonsPosition="around"
        headerButtonColor={COLORS.accent}
        headerButtonSize={16}
        headerContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 8,
          marginBottom: 4,
        }}
        headerTextContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        headerTextStyle={{
          color: COLORS.textPrimary,
          fontSize: 12,
          fontWeight: '600',
        }}
        headerButtonStyle={{
          width: 18,
          height: 18,
          minWidth: 18,
          minHeight: 18,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: COLORS.borderColor,
          backgroundColor: COLORS.bgTertiary,
        }}
        weekDaysContainerStyle={{
          marginBottom: 4,
        }}
        weekDaysTextStyle={{
          color: COLORS.textSecondary,
          fontSize: 11,
          fontWeight: '600',
        }}
        dayContainerStyle={{
          borderRadius: 8,
          width: 34,
          height: 34,
        }}
        todayContainerStyle={{
          borderWidth: 1,
          borderColor: COLORS.borderAccent,
          borderRadius: 8,
        }}
        todayTextStyle={{
          color: COLORS.accent,
        }}
        calendarTextStyle={{
          color: COLORS.textPrimary,
          fontSize: 12,
        }}
        selectedTextStyle={{
          color: COLORS.textPrimary,
          fontWeight: '700',
        }}
      />
      {possuiIntervaloSelecionado ? (
        <TouchableOpacity
          onPress={limparIntervalo}
          style={{
            alignSelf: 'flex-end',
            marginTop: 8,
            borderWidth: 1,
            borderColor: COLORS.borderColor,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: COLORS.bgTertiary,
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '600' }}>{'\u2715'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (Platform.OS === 'web') {
    const estiloWebBase = (estilo as Record<string, string | number | undefined>) || {};

    return (
      <div
        ref={containerRef}
        style={{
          ...estiloWebBase,
          position: 'relative',
          zIndex: focadoWeb ? 2 : 1,
          width: typeof estiloWebBase.width !== 'undefined' ? estiloWebBase.width : '100%',
          maxWidth: '100%',
        }}
      >
        <div style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{label}</div>
        <button
          type="button"
          onClick={() => {
            setAberto((estadoAtual) => !estadoAtual);
            setFocadoWeb(true);
          }}
          style={{
            width: '100%',
            maxWidth: '100%',
            backgroundColor: COLORS.bgTertiary,
            borderRadius: '8px',
            border: `1px solid ${error ? COLORS.accent : focadoWeb ? COLORS.borderAccent : COLORS.borderColor}`,
            boxShadow: error ? `0 0 0 1px ${COLORS.accent}` : focadoWeb ? `0 0 0 1px ${COLORS.borderAccent}` : 'none',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '12px',
            paddingRight: '12px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            minHeight: '46px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              minWidth: 0,
              flex: '1 1 auto',
              color: dataInicio || dataFim ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: '14px',
              padding: '12px 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatarIntervaloData(dataInicio, dataFim, textoPlaceholder)}
          </span>
          <span style={{ color: dataInicio || dataFim ? COLORS.accent : COLORS.textSecondary, fontSize: '14px', marginLeft: '8px', flex: '0 0 auto' }}>
            {'\uD83D\uDCC5'}
          </span>
        </button>

        {typeof error === 'string' && error ? <div style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</div> : null}
        {aberto && typeof document !== 'undefined'
          ? createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
                <div
                  ref={portalRef}
                  style={{
                    position: 'fixed',
                    top: `${Math.max(16, posicaoPopover.top)}px`,
                    left: `${Math.max(16, posicaoPopover.left)}px`,
                    width: `${posicaoPopover.width}px`,
                    maxWidth: 'calc(100vw - 32px)',
                    pointerEvents: 'auto',
                  }}
                >
                  {renderPicker()}
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <View style={estilo}>
      <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => setAberto((estadoAtual) => !estadoAtual)}
        style={{
          backgroundColor: COLORS.bgTertiary,
          borderWidth: 1,
          borderColor: error ? COLORS.accent : aberto ? COLORS.borderAccent : COLORS.borderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: dataInicio || dataFim ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 14, flex: 1 }}>
          {formatarIntervaloData(dataInicio, dataFim, textoPlaceholder)}
        </Text>
        <Text style={{ color: dataInicio || dataFim ? COLORS.accent : COLORS.textSecondary, fontSize: 16, marginLeft: 8 }}>{'\uD83D\uDCC5'}</Text>
      </TouchableOpacity>

      {typeof error === 'string' && error ? <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      {aberto ? <View style={{ marginTop: 8 }}>{renderPicker()}</View> : null}
    </View>
  );
}
