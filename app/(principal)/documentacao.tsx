import { usarTraducao } from '../../src/hooks/usarTraducao';
import { DocumentacaoModulo } from '../../src/componentes/comuns/DocumentacaoModulo';

export default function DocumentacaoDashboard() {
  const { t } = usarTraducao();
  return <DocumentacaoModulo modulo="dashboard" titulo={t('menu.dashboard')} />;
}
