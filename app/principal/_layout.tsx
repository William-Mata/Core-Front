import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal as RNModal, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { usarAutenticacaoStore } from '../../src/store/usarAutenticacaoStore';
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
  const [mostrarMenuMovel, setMostrarMenuMovel] = useState(false);

  const exibirMenu = width > 768;

  const rotaAtual = (() => {
    if (pathname.includes('/financeiro')) return 'financeiro';
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
    const telaAtiva = (moduloId: string, telaId: string) => {
      const modulo = obterModulo(moduloId);
      if (!modulo?.status) return false;
      return modulo.telas?.some((t) => String(t.id) === telaId && t.status);
    };

    if (pathname === '/principal' || pathname.startsWith('/principal?')) return telaAtiva('1', '1');
    if (pathname.startsWith('/principal/usuario')) return telaAtiva('1', '2');
    if (pathname.startsWith('/principal/documentacao')) return telaAtiva('1', '5');
    if (pathname.startsWith('/principal/amigos/amigo')) return telaAtiva('1', '4');
    if (pathname.startsWith('/principal/amigos/documentacao')) return telaAtiva('1', '5');
    if (pathname.startsWith('/principal/amigos')) return telaAtiva('1', '3');

    if (pathname.startsWith('/principal/financeiro/despesa')) return telaAtiva('3', '100');
    if (pathname.startsWith('/principal/financeiro/receita')) return telaAtiva('3', '101');
    if (pathname.startsWith('/principal/financeiro/reembolso')) return telaAtiva('3', '102');
    if (pathname.startsWith('/principal/financeiro/conta-bancaria')) return telaAtiva('3', '103');
    if (pathname.startsWith('/principal/financeiro/cartao')) return telaAtiva('3', '104');
    if (pathname.startsWith('/principal/financeiro/documentacao')) return telaAtiva('3', '105');
    if (pathname.startsWith('/principal/financeiro')) return moduloAtivo('3');

    if (pathname.startsWith('/principal/admin/usuario')) return telaAtiva('2', '31');
    if (pathname.startsWith('/principal/admin/documentos') || pathname.startsWith('/principal/admin/documento')) {
      return telaAtiva('2', '33');
    }
    if (pathname.startsWith('/principal/admin/avisos') || pathname.startsWith('/principal/admin/aviso')) {
      return telaAtiva('2', '34');
    }
    if (pathname.startsWith('/principal/admin/documentacao')) return telaAtiva('2', '35');
    if (pathname.startsWith('/principal/admin')) return telaAtiva('2', '30');

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

    if (telaAtiva('1', '1')) return '/principal';
    if (telaAtiva('1', '2')) return '/principal/usuario';
    if (telaAtiva('1', '3')) return '/principal/amigos';
    if (telaAtiva('1', '4')) return '/principal/amigos/amigo';
    if (telaAtiva('1', '5')) return '/principal/documentacao';

    if (telaAtiva('3', '100')) return '/principal/financeiro/despesa';
    if (telaAtiva('3', '101')) return '/principal/financeiro/receita';
    if (telaAtiva('3', '102')) return '/principal/financeiro/reembolso';
    if (telaAtiva('3', '103')) return '/principal/financeiro/conta-bancaria';
    if (telaAtiva('3', '104')) return '/principal/financeiro/cartao';
    if (telaAtiva('3', '105')) return '/principal/financeiro/documentacao';

    if (telaAtiva('2', '30')) return '/principal/admin';
    if (telaAtiva('2', '31')) return '/principal/admin/usuario';
    if (telaAtiva('2', '33')) return '/principal/admin/documentos';
    if (telaAtiva('2', '34')) return '/principal/admin/avisos';
    if (telaAtiva('2', '35')) return '/principal/admin/documentacao';

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
      setMostrarMenuMovel(false);
    }
  }, [exibirMenu, mostrarMenuMovel]);

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
          {!exibirMenu ? (
            <TouchableOpacity
              onPress={() => setMostrarMenuMovel(true)}
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 9000,
                elevation: 50,
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: COLORS.bgSecondary,
                borderWidth: 1,
                borderColor: COLORS.borderAccent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: '700' }}>{'\u2630'}</Text>
            </TouchableOpacity>
          ) : null}

          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>

      {!exibirMenu ? (
        <RNModal visible={mostrarMenuMovel} animationType="fade" transparent onRequestClose={() => setMostrarMenuMovel(false)}>
          <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <View style={{ width: 280, maxWidth: '82%', height: '100%', backgroundColor: COLORS.bgSecondary }}>
              <MenuLateral
                modulosAtivos={usuario?.modulosAtivos}
                rotaAtual={rotaAtual}
                aoFechar={() => setMostrarMenuMovel(false)}
                mostrarIdioma
              />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => setMostrarMenuMovel(false)} />
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
