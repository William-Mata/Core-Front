import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { DocumentacaoModulo } from '../../../src/componentes/comuns/DocumentacaoModulo';

export default function DocumentacaoCompras() {
  const { t } = usarTraducao();
  return <DocumentacaoModulo modulo="compras" titulo={t('menu.compras')} />;
}
