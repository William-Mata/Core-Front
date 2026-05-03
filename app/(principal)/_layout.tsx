import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal as RNModal, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { usarAutenticacaoStore } from '../../src/store/usarAutenticacaoStore';
import { usarLayoutStore } from '../../src/store/usarLayoutStore';
import { Modal } from '../../src/componentes/comuns/Modal';
import { MenuLateral } from '../../src/componentes/comuns/MenuLateral';
import { COLORS } from '../../src/styles/variables';

export default function PrincipalLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { estaAutenticado, usuario } = usarAutenticacaoStore();
  const possuiSessaoValida = Boolean(estaAutenticado && usuario);
  const [mostrarAvisoGeral, setMostrarAvisoGeral] = useState(false);
  const mostrarMenuMovel = usarLayoutStore((estado) => estado.mostrarMenuMovel);
  const fecharMenuMovel = usarLayoutStore((estado) => estado.fecharMenuMovel);

  const exibirMenu = width > 768;

  const rotaAtual = (() => {
    if (pathname.includes('/financeiro')) return 'financeiro';
    if (pathname.includes('/compras')) return 'compras';
    if (pathname.includes('/amigos')) return 'amigos';
    if (pathname.includes('/admin')) return 'admin';
    if (pathname.includes('/usuario')) return 'usuario';
    return 'dashboard';
  })();

  const rotaPermitida = useMemo(() => {
    if (!usuario) return false;

    const obterModulo = (id: string) =>
      usuario.modulosAtivos.find((m) => String(m.id) === id) ?? null;
    const moduloAtivo = (id: string) => Boolean(obterModulo(id)?.status);
    const moduloComprasAtivo = () => {
      const compras = usuario.modulosAtivos.find((m) => String(m.nome ?? '').toLowerCase().includes('compra'));
      return Boolean(compras?.status);
    };
    const telaAtiva = (moduloId: string, telaId: string) => {
      const modulo = obterModulo(moduloId);
      if (!modulo?.status) return false;
      return modulo.telas?.some((t) => String(t.id) === telaId && t.status);
    };

    if (pathname === '/dashboard' || pathname.startsWith('/dashboard?')) return telaAtiva('1', '1');
    if (pathname.startsWith('/usuario')) return telaAtiva('1', '2');
    if (pathname.startsWith('/documentacao')) return telaAtiva('1', '5');
    if (pathname.startsWith('/amigos/convite')) return telaAtiva('1', '4');
    if (pathname.startsWith('/amigos/documentacao')) return telaAtiva('1', '5');
    if (pathname.startsWith('/amigos')) return telaAtiva('1', '3');

    if (pathname.startsWith('/financeiro/despesas')) return telaAtiva('3', '100');
    if (pathname.startsWith('/financeiro/receitas')) return telaAtiva('3', '101');
    if (pathname.startsWith('/financeiro/reembolsos')) return telaAtiva('3', '102');
    if (pathname.startsWith('/financeiro/conta-bancaria')) return telaAtiva('3', '103');
    if (pathname.startsWith('/financeiro/cartoes')) return telaAtiva('3', '104');
    if (pathname.startsWith('/financeiro/documentacao')) return telaAtiva('3', '105');
    if (pathname.startsWith('/financeiro')) return moduloAtivo('3');
    if (pathname.startsWith('/compras')) return moduloComprasAtivo();

    if (pathname.startsWith('/admin/usuarios')) return telaAtiva('2', '31');
    if (pathname.startsWith('/admin/documentos') || pathname.startsWith('/admin/documento')) {
      return telaAtiva('2', '33');
    }
    if (pathname.startsWith('/admin/avisos') || pathname.startsWith('/admin/aviso')) {
      return telaAtiva('2', '34');
    }
    if (pathname.startsWith('/admin/documentacao')) return telaAtiva('2', '35');
    if (pathname.startsWith('/admin')) return telaAtiva('2', '30');

    return true;
  }, [pathname, usuario]);

  const primeiraRotaPermitida = useMemo(() => {
    if (!usuario) return '/auth/entrar';

    const obterModulo = (id: string) =>
      usuario.modulosAtivos.find((m) => String(m.id) === id) ?? null;
    const telaAtiva = (moduloId: string, telaId: string) => {
      const modulo = obterModulo(moduloId);
      if (!modulo?.status) return false;
      return modulo.telas?.some((t) => String(t.id) === telaId && t.status);
    };
    const moduloComprasAtivo = () => {
      const compras = usuario.modulosAtivos.find((m) => String(m.nome ?? '').toLowerCase().includes('compra'));
      return Boolean(compras?.status);
    };

    if (telaAtiva('1', '1')) return '/dashboard';
    if (telaAtiva('1', '2')) return '/usuario';
    if (telaAtiva('1', '3')) return '/amigos';
    if (telaAtiva('1', '4')) return '/amigos/convite';
    if (telaAtiva('1', '5')) return '/documentacao';

    if (telaAtiva('3', '100')) return '/financeiro/despesas';
    if (telaAtiva('3', '101')) return '/financeiro/receitas';
    if (telaAtiva('3', '102')) return '/financeiro/reembolsos';
    if (telaAtiva('3', '103')) return '/financeiro/conta-bancaria';
    if (telaAtiva('3', '104')) return '/financeiro/cartoes';
    if (telaAtiva('3', '105')) return '/financeiro/documentacao';
    if (moduloComprasAtivo()) return '/compras/planejamentos';

    if (telaAtiva('2', '30')) return '/admin';
    if (telaAtiva('2', '31')) return '/admin/usuarios';
    if (telaAtiva('2', '33')) return '/admin/documentos';
    if (telaAtiva('2', '34')) return '/admin/avisos';
    if (telaAtiva('2', '35')) return '/admin/documentacao';

    return '/auth/entrar';
  }, [usuario]);

  useEffect(() => {
    if (!possuiSessaoValida) {
      router.replace('/auth/entrar');
    }
  }, [possuiSessaoValida, router]);

  useEffect(() => {
    if (possuiSessaoValida && !rotaPermitida) {
      if (pathname !== primeiraRotaPermitida) {
        router.replace(primeiraRotaPermitida as any);
      }
    }
  }, [possuiSessaoValida, rotaPermitida, pathname, primeiraRotaPermitida, router]);

  useEffect(() => {
    try {
      const chaveCiencia = 'core_modal_ciencia_v1';
      const jaDeuCiencia = typeof window !== 'undefined' ? localStorage.getItem(chaveCiencia) === 'true' : false;
      setMostrarAvisoGeral(!jaDeuCiencia);
    } catch {
      setMostrarAvisoGeral(true);
    }
  }, []);

  useEffect(() => {
    if (exibirMenu && mostrarMenuMovel) {
      fecharMenuMovel();
    }
  }, [exibirMenu, fecharMenuMovel, mostrarMenuMovel]);

  const confirmarCiencia = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('core_modal_ciencia_v1', 'true');
      }
    } catch {
      // Ignorar erro de armazenamento
    }
    setMostrarAvisoGeral(false);
  };

  if (!possuiSessaoValida || !rotaPermitida) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }} />;
  }

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: COLORS.bgPrimary }}>
        {exibirMenu ? <MenuLateral modulosAtivos={usuario?.modulosAtivos} rotaAtual={rotaAtual} /> : null}

        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>

      {!exibirMenu ? (
        <RNModal visible={mostrarMenuMovel} animationType="fade" transparent onRequestClose={fecharMenuMovel}>
          <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <View style={{ width: 280, maxWidth: '82%', height: '100%', backgroundColor: COLORS.bgSecondary }}>
              <MenuLateral
                modulosAtivos={usuario?.modulosAtivos}
                rotaAtual={rotaAtual}
                aoFechar={fecharMenuMovel}
                mostrarIdioma
              />
            </View>
            <Pressable style={{ flex: 1 }} onPress={fecharMenuMovel} />
          </View>
        </RNModal>
      ) : null}

      <Modal visivel={mostrarAvisoGeral} onFechar={confirmarCiencia} titulo="Aviso Geral do Sistema">
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
          Este aviso e exibido ate voce confirmar ciencia. Consulte tambem o sininho de notificacoes no cabecalho para atualizacoes e comunicados.
        </Text>
        <TouchableOpacity
          onPress={confirmarCiencia}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignSelf: 'flex-end',
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Dar Ciencia</Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
