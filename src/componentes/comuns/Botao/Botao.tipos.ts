import { GestureResponderEvent } from 'react-native';

export interface BotaoProps {
  label?: string;
  titulo?: string;
  testID?: string;
  onPress: (event: GestureResponderEvent) => void;
  tipo?: 'primario' | 'secundario' | 'perigo';
  desabilitado?: boolean;
  disabled?: boolean;
  estilo?: any;
}
