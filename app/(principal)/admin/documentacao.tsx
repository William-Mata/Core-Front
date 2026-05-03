import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { DocumentacaoModulo } from '../../../src/componentes/comuns/DocumentacaoModulo';

export default function DocumentacaoAdmin() {
  const { t } = usarTraducao();
  return <DocumentacaoModulo modulo="admin" titulo={t('menu.administracao')} />;
}
