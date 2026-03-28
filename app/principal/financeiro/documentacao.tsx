import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { DocumentacaoModulo } from '../../../src/componentes/comuns/DocumentacaoModulo';

export default function DocumentacaoFinanceiro() {
  const { t } = usarTraducao();
  return <DocumentacaoModulo modulo="financeiro" titulo={t('menu.financeiro')} />;
}
