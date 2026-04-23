import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { usarTraducao } from '../../../hooks/usarTraducao';
import { SeletorIdioma } from '../SeletorIdioma';
import { usarIdiomaStore } from '../../../store/usarIdiomaStore';
import { usarAutenticacaoStore } from '../../../store/usarAutenticacaoStore';
import { InterfaceModuloUsuario } from '../../../tipos/usuario.tipos';
import { COLORS } from '../../../styles/variables';

export interface MenuLateralProps {
  modulosAtivos?: InterfaceModuloUsuario[];
  rotaAtual?: string;
  aoFechar?: () => void;
  mostrarIdioma?: boolean;
}

interface ItemFilho {
  id: string;
  label: string;
  rota: string;
  requerTelaId?: string | null;
  comparacao?: 'exata' | 'prefixo';
}

interface ItemMenu {
  id: string;
  label: string;
  icone: string;
  rota: string;
  requerModuloId: string | null;
  requerTelaId?: string | null;
  filhos?: ItemFilho[];
}

export function MenuLateral({ modulosAtivos = [], rotaAtual = 'dashboard', aoFechar, mostrarIdioma = true }: MenuLateralProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = usarTraducao();
  const { idiomaSelecionado, definirIdioma } = usarIdiomaStore();
  const { deslogar, usuario } = usarAutenticacaoStore();

  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({
    financeiro: true,
    compras: false,
    amigos: false,
    admin: false,
  });
  const [recolhido, setRecolhido] = useState(false);

  const itensMenu: ItemMenu[] = [
    {
      id: 'dashboard',
      label: t('menu.dashboard'),
      icone: '\uD83C\uDFE0',
      rota: '/',
      requerModuloId: '1',
      requerTelaId: '1',
    },
    {
      id: 'usuario',
      label: t('menu.painelUsuario'),
      icone: '\uD83D\uDC64',
      rota: '/principal/usuario',
      requerModuloId: '1',
      requerTelaId: '2',
    },
    {
      id: 'financeiro',
      label: t('menu.financeiro'),
      icone: '\uD83D\uDCB0',
      rota: '/principal/financeiro/despesa',
      requerModuloId: '3',
      filhos: [
        { id: 'financeiro-despesa', label: t('menu.despesas'), rota: '/principal/financeiro/despesa', requerTelaId: '100' },
        { id: 'financeiro-receita', label: t('menu.receitas'), rota: '/principal/financeiro/receita', requerTelaId: '101' },
        { id: 'financeiro-reembolso', label: t('menu.reembolsos'), rota: '/principal/financeiro/reembolso', requerTelaId: '102' },
        { id: 'financeiro-conta-bancaria', label: t('menu.contasBancarias'), rota: '/principal/financeiro/conta-bancaria', requerTelaId: '103' },
        { id: 'financeiro-cartao', label: t('menu.cartoesCredito'), rota: '/principal/financeiro/cartao', requerTelaId: '104' },
        { id: 'financeiro-documentacao', label: t('documentacao.acao'), rota: '/principal/financeiro/documentacao', requerTelaId: '105' },
      ],
    },
    {
      id: 'compras',
      label: t('menu.compras'),
      icone: '\uD83D\uDED2',
      rota: '/principal/compras',
      requerModuloId: 'compras',
      filhos: [
        { id: 'compras-listas', label: t('compras.menu.listas'), rota: '/principal/compras', comparacao: 'exata' },
        { id: 'compras-desejos', label: t('compras.menu.desejos'), rota: '/principal/compras/desejos' },
        { id: 'compras-historico', label: t('compras.menu.historicoItens'), rota: '/principal/compras/historico-itens' },
      ],
    },
    {
      id: 'amigos',
      label: t('menu.amigos'),
      icone: '\uD83D\uDC65',
      rota: '/principal/amigos',
      requerModuloId: '1',
      filhos: [
        { id: 'amigos-lista', label: t('menu.listaAmigos'), rota: '/principal/amigos', requerTelaId: '3', comparacao: 'exata' },
        { id: 'amigos-convite', label: t('menu.convites'), rota: '/principal/amigos/amigo', requerTelaId: '4' },
        { id: 'amigos-documentacao', label: t('documentacao.acao'), rota: '/principal/documentacao', requerTelaId: '5' },
      ],
    },
    {
      id: 'admin',
      label: t('menu.administracao'),
      icone: '\u2699\uFE0F',
      rota: '/principal/administracao',
      requerModuloId: '2',
      filhos: [
        { id: 'admin-visao-geral', label: t('menu.administracao'), rota: '/principal/administracao', requerTelaId: '30', comparacao: 'exata' },
        { id: 'admin-usuarios', label: t('menu.usuarios'), rota: '/principal/administracao/usuario', requerTelaId: '31' },
        { id: 'admin-documentos', label: t('menu.documentos'), rota: '/principal/administracao/documentos', requerTelaId: '33' },
        { id: 'admin-avisos', label: t('menu.avisos'), rota: '/principal/administracao/avisos', requerTelaId: '34' },
        { id: 'admin-documentacao', label: t('documentacao.acao'), rota: '/principal/administracao/documentacao', requerTelaId: '35' },
      ],
    },
  ];

  const handleNavegar = (rota: string) => {
    aoFechar?.();
    router.push(rota as any);
  };

  const handleSair = async () => {
    await deslogar();
    router.replace('/auth/entrar');
  };

  const obterModulo = (moduloId: string | null) => {
    if (!moduloId) return null;
    const normalizar = (valor: string) =>
      valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    const moduloIdNormalizado = normalizar(String(moduloId));

    return (
      modulosAtivos.find((modulo) => String(modulo.id) === String(moduloId)) ??
      modulosAtivos.find((modulo) => normalizar(String(modulo.nome ?? '')) === moduloIdNormalizado) ??
      modulosAtivos.find((modulo) => {
        const nomeModuloNormalizado = normalizar(String(modulo.nome ?? ''));
        return nomeModuloNormalizado.includes(moduloIdNormalizado) || moduloIdNormalizado.includes(nomeModuloNormalizado);
      }) ??
      null
    );
  };
  
  const ehAdmin = Boolean(usuario && (usuario.perfil?.id === 1 || String(usuario.perfil?.nome || '').toUpperCase().includes('ADMIN')));

  const temAcesso = (item: ItemMenu) => {
    if (item.id === 'admin' && !ehAdmin) return false;
    const modulo = obterModulo(item.requerModuloId);
    if (!modulo?.status) return false;
    if (!item.requerTelaId) return true;
    return Boolean(modulo.telas?.some((tela) => String(tela.id) === String(item.requerTelaId) && tela.status));
  };

  const temAcessoFilho = (item: ItemMenu, filho: ItemFilho) => {
    const modulo = obterModulo(item.requerModuloId);
    if (!modulo) return false;
    if (!modulo.status) return false;
    if (!filho.requerTelaId) return true;
    return modulo.telas?.some((tela) => String(tela.id) === String(filho.requerTelaId) && tela.status);
  };

  const toggleGrupo = (id: string) => {
    setGruposAbertos((anterior) => ({ ...anterior, [id]: !anterior[id] }));
  };

  const rotaEstaAtiva = (rota: string, comparacao: ItemFilho['comparacao'] = 'prefixo') => {
    if (comparacao === 'exata') return pathname === rota || pathname === `${rota}/`;
    if (pathname === rota) return true;
    return pathname.startsWith(`${rota}/`) || pathname.startsWith(`${rota}?`);
  };

  return (
    <View
      style={{
        height: '100%',
        width: recolhido ? 24 : 260,
        backgroundColor: COLORS.bgSecondary,
        borderRightWidth: 1,
        borderRightColor: COLORS.borderColor,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 4, height: 0 },
      }}
    >
      <View style={{ flex: 1, display: recolhido ? 'none' : 'flex', overflow: 'visible' }}>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: '800', letterSpacing: 0.6 }}>Core</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>{t('menu.navegacao')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setRecolhido(true)}
            style={{
              backgroundColor: COLORS.bgTertiary,
              borderRadius: 8,
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{'<'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 6, flexGrow: 1 }}>
          {itensMenu.map((item) => {
            if (!temAcesso(item)) return null;

            const temFilhos = !!item.filhos?.length;
            const ativo = temFilhos
              ? Boolean(item.filhos?.some((filho) => rotaEstaAtiva(filho.rota, filho.comparacao)))
              : rotaAtual === item.id || rotaEstaAtiva(item.rota);

            return (
              <View key={item.id}>
                <TouchableOpacity
                  onPress={() => (temFilhos ? toggleGrupo(item.id) : handleNavegar(item.rota))}
                  style={{
                    marginHorizontal: 4,
                    marginVertical: 3,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: ativo ? COLORS.accentRgba : 'transparent',
                    borderWidth: 1,
                    borderColor: ativo ? COLORS.borderAccent : 'transparent',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14 }}>{item.icone}</Text>
                    <Text style={{ color: ativo ? COLORS.accent : COLORS.textSecondary, fontSize: 13, fontWeight: ativo ? '700' : '500' }}>{item.label}</Text>
                  </View>
                  {temFilhos ? <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{gruposAbertos[item.id] ? '\u25BC' : '\u25B6'}</Text> : null}
                </TouchableOpacity>

                {temFilhos && gruposAbertos[item.id] ? (
                  <View style={{ marginLeft: 18, marginRight: 8, marginBottom: 4 }}>
                    {item.filhos!.map((filho) => {
                      if (!temAcessoFilho(item, filho)) return null;
                      const filhoAtivo = rotaEstaAtiva(filho.rota, filho.comparacao);

                      return (
                        <TouchableOpacity
                          key={filho.id}
                          onPress={() => handleNavegar(filho.rota)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: filhoAtivo ? COLORS.borderAccent : 'transparent',
                            backgroundColor: filhoAtivo ? COLORS.accentSubtle : 'transparent',
                          }}
                        >
                          <Text style={{ color: filhoAtivo ? COLORS.accent : COLORS.textSecondary, fontSize: 12, fontWeight: filhoAtivo ? '700' : '500' }}>{filho.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.borderColor,
            backgroundColor: COLORS.overlaySoft,
            padding: 10,
            gap: 10,
            overflow: 'visible',
            zIndex: 2000,
          }}
        >
          {mostrarIdioma ? (
            <View style={{ zIndex: 3000, elevation: 30 }}>
              <SeletorIdioma idiomaSelecionado={idiomaSelecionado} aoMudarIdioma={definirIdioma} />
            </View>
          ) : null}
          <TouchableOpacity
            onPress={handleSair}
            style={{
              backgroundColor: COLORS.accentSubtle,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
              zIndex: 1,
            }}
          >
            <Text style={{ color: COLORS.error, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{t('comum.sair')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {recolhido ? (
        <TouchableOpacity
          onPress={() => setRecolhido(false)}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 16 }}
        >
          <View
            style={{
              backgroundColor: COLORS.bgTertiary,
              borderRadius: 8,
              width: 20,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}




