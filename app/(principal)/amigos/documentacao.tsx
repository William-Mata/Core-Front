import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { DocumentacaoModulo } from '../../../src/componentes/comuns/DocumentacaoModulo';

export default function DocumentacaoAmigos() {
  const { t } = usarTraducao();
  return <DocumentacaoModulo modulo="amigos" titulo={t('menu.amigos')} />;
}
