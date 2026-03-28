import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usarAutenticacaoStore } from '../../../store/usarAutenticacaoStore';
import { COLORS, LAYOUT } from '../../../styles/variables';

interface ItemMenu {
  id: string;
  titulo: string;
  icone?: string;
  rota?: string;
  filhos?: ItemMenu[];
}

export function MenuLateral() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('comum');
  const { usuario, deslogar } = usarAutenticacaoStore();
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set(['dashboard']));

  const itensMenu: ItemMenu[] = [
    {
      id: 'dashboard',
      titulo: t('menu.dashboard'),
      icone: '\uD83D\uDCCA',
      rota: '/principal',
    },
    {
      id: 'financeiro',
      titulo: t('menu.financeiro'),
      icone: '\uD83D\uDCB0',
      filhos: [
        { id: 'despesas', titulo: t('menu.despesas'), rota: '/principal/financeiro/despesa' },
        { id: 'receitas', titulo: t('menu.receitas'), rota: '/principal/financeiro/receita' },
        { id: 'reembolsos', titulo: t('menu.reembolsos'), rota: '/principal/financeiro/reembolso' },
        { id: 'contas-bancarias', titulo: t('menu.contasBancarias'), rota: '/principal/financeiro/conta-bancaria' },
        { id: 'cartoes-credito', titulo: t('menu.cartoesCredito'), rota: '/principal/financeiro/cartao-credito' },
        { id: 'centros-custo', titulo: t('menu.centrosCusto'), rota: '/principal/financeiro/centro-custo' },
      ],
    },
    {
      id: 'amigos',
      titulo: t('menu.amigos'),
      icone: '\uD83D\uDC65',
      filhos: [
        { id: 'lista-amigos', titulo: t('menu.listaAmigos'), rota: '/principal/amigos' },
        { id: 'convites', titulo: t('menu.convites'), rota: '/principal/amigos/convite' },
      ],
    },
    ...(usuario && (usuario.perfil?.id === 1 || String(usuario.perfil?.nome || '').toUpperCase().includes('ADMIN'))
      ? [
          {
            id: 'administracao',
            titulo: t('menu.administracao'),
            icone: '\u2699\uFE0F',
            filhos: [
              { id: 'usuarios', titulo: t('menu.usuarios'), rota: '/administracao/usuarios' },
              { id: 'permissoes', titulo: t('menu.permissoes'), rota: '/administracao/permissoes' },
              { id: 'documentos', titulo: t('menu.documentos'), rota: '/administracao/documentos' },
              { id: 'avisos', titulo: t('menu.avisos'), rota: '/administracao/avisos' },
            ],
          },
        ]
      : []),
  ];

  const alternarGrupo = (id: string) => {
    const novoExpandidos = new Set(gruposExpandidos);
    if (novoExpandidos.has(id)) {
      novoExpandidos.delete(id);
    } else {
      novoExpandidos.add(id);
    }
    setGruposExpandidos(novoExpandidos);
  };

  const navegarPara = (rota: string) => {
    router.push(rota as any);
  };

  const renderizarItem = (item: ItemMenu, nivel = 0) => {
    const temFilhos = item.filhos && item.filhos.length > 0;
    const estaExpandido = gruposExpandidos.has(item.id);
    const estaAtivo = pathname === item.rota || !!item.filhos?.some((filho) => pathname.startsWith(filho.rota || ''));

    return (
      <View key={item.id}>
        <TouchableOpacity
          onPress={() => (temFilhos ? alternarGrupo(item.id) : item.rota && navegarPara(item.rota))}
          style={[estilos.item, estaAtivo ? estilos.itemAtivo : null, { marginLeft: nivel * 16 }]}
        >
          <Text style={estilos.icone}>{item.icone}</Text>
          <Text style={[estilos.itemTexto, estaAtivo ? estilos.itemTextoAtivo : null]}>{item.titulo}</Text>
          {temFilhos ? <Text style={estilos.seta}>{estaExpandido ? '\u25BC' : '\u25B6'}</Text> : null}
        </TouchableOpacity>
        {temFilhos && estaExpandido ? <View>{item.filhos?.map((filho) => renderizarItem(filho, nivel + 1))}</View> : null}
      </View>
    );
  };

  return (
    <View style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.brandArea}>
          <Text style={estilos.brand}>Core</Text>
          <Text style={estilos.brandSub}>{t('menu.sistemaGestao')}</Text>
        </View>

        <View>{itensMenu.map((item) => renderizarItem(item))}</View>

        <View style={estilos.footer}>
          <TouchableOpacity onPress={() => deslogar().then(() => router.replace('/auth/entrar'))} style={estilos.item}>
            <Text style={estilos.icone}>{'\uD83D\uDEAA'}</Text>
            <Text style={estilos.itemTexto}>{t('menu.sair')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    width: LAYOUT.sidebarWidth,
    backgroundColor: COLORS.bgSecondary,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderColor,
  },
  scroll: {
    padding: 16,
  },
  brandArea: {
    marginBottom: 24,
  },
  brand: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '700',
  },
  brandSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LAYOUT.radiusSm,
    marginBottom: 4,
  },
  itemAtivo: {
    backgroundColor: COLORS.accentRgba,
  },
  icone: {
    fontSize: 18,
    marginRight: 12,
  },
  itemTexto: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  itemTextoAtivo: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  seta: {
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
  },
});

