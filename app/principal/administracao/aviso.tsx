import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { CampoSelect } from '../../../src/componentes/comuns/CampoSelect';
import { COLORS } from '../../../src/styles/variables';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';

interface Aviso {
  id?: number;
  titulo: string;
  conteudo: string;
  tipo: string;
  status: string;
  requerCiencia: boolean;
  destinatarios: string;
}

export default function CriarEditarAviso() {
  const router = useRouter();
  const { t } = usarTraducao();
  const params = useLocalSearchParams();
  const avisoId = params.id as string;

  const [aviso, setAviso] = useState<Aviso>({ titulo: '', conteudo: '', tipo: 'INFO', status: 'RASCUNHO', requerCiencia: false, destinatarios: 'TODOS' });
  const [carregando, setCarregando] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (avisoId) {
      setTimeout(() => {
        setAviso({ id: parseInt(avisoId), titulo: t('admin.avisos.mock.recurso'), conteudo: t('admin.aviso.conteudoExemplo'), tipo: 'INFO', status: 'RASCUNHO', requerCiencia: true, destinatarios: 'TODOS' });
      }, 300);
    }
  }, [avisoId, t]);

  const handlePublicar = async () => {
    if (!aviso.titulo.trim() || !aviso.conteudo.trim()) {
      setCamposInvalidos((atual) => ({ ...atual, titulo: !aviso.titulo.trim(), conteudo: !aviso.conteudo.trim() }));
      notificarErro( t('admin.aviso.erros.preenchaTituloConteudo'));
      return;
    }

    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      setAviso((prev) => ({ ...prev, status: 'PUBLICADO' }));
      notificarSucesso(t('admin.aviso.publicadoSucesso'));
    }, 500);
  };

  const handleSalvar = async () => {
    if (!aviso.titulo.trim()) {
      setCamposInvalidos((atual) => ({ ...atual, titulo: true }));
      notificarErro( t('admin.aviso.erros.tituloObrigatorio'));
      return;
    }

    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      notificarSucesso(t('admin.aviso.salvoSucesso'));
      router.back();
    }, 500);
  };

  const handleDeletar = async () => {
    const confirmar = await solicitarConfirmacao(t('admin.aviso.confirmarDelete'), {
      titulo: t('comum.confirmacoes.tituloExclusao'),
      textoConfirmar: t('comum.acoes.excluir'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
      tipoConfirmar: 'perigo',
    });
    if (!confirmar) return;

    setTimeout(() => {
      notificarSucesso(t('admin.aviso.deletadoSucesso'));
      router.back();
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{avisoId ? t('admin.aviso.editar') : t('admin.aviso.novo')}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.accent, fontSize: 20 }}>{'\u2715'}</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <CampoTexto label={t('admin.aviso.titulo')} placeholder={t('admin.aviso.placeholderTitulo')} valor={aviso.titulo} onChangeText={(texto) => { setCamposInvalidos((atual) => ({ ...atual, titulo: false })); setAviso((prev) => ({ ...prev, titulo: texto })); }} error={camposInvalidos.titulo} />
        <CampoTexto label={t('admin.aviso.conteudo')} placeholder={t('admin.aviso.placeholderConteudo')} valor={aviso.conteudo} onChangeText={(texto) => { setCamposInvalidos((atual) => ({ ...atual, conteudo: false })); setAviso((prev) => ({ ...prev, conteudo: texto })); }} error={camposInvalidos.conteudo} multiline numberOfLines={6} />

        <CampoSelect
          label={t('admin.aviso.tipo')}
          placeholder={t('comum.acoes.selecionar')}
          options={['INFO', 'AVISO', 'CRITICO'].map((tipo) => ({ value: tipo, label: t(`admin.avisos.tipos.${tipo}`) }))}
          value={aviso.tipo}
          onChange={(tipo) => setAviso((prev) => ({ ...prev, tipo }))}
        />

        <CampoSelect
          label={t('admin.aviso.destinatarios')}
          placeholder={t('comum.acoes.selecionar')}
          options={['TODOS', 'MODULO', 'USUARIO'].map((dest) => ({ value: dest, label: t(`admin.aviso.destino.${dest}`) }))}
          value={aviso.destinatarios}
          onChange={(destinatarios) => setAviso((prev) => ({ ...prev, destinatarios }))}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: COLORS.bgTertiary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderColor }}>
          <View>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>{t('admin.aviso.requerCiencia')}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>{t('admin.aviso.requerCienciaTexto')}</Text>
          </View>
          <Switch value={aviso.requerCiencia} onValueChange={(val) => setAviso((prev) => ({ ...prev, requerCiencia: val }))} trackColor={{ false: COLORS.borderColor, true: COLORS.accent }} thumbColor={aviso.requerCiencia ? COLORS.accent : COLORS.textSecondary} />
        </View>
      </ScrollView>

      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, gap: 10 }}>
        {aviso.status === 'RASCUNHO' && aviso.titulo.trim() && aviso.conteudo.trim() && <Botao titulo={t('admin.aviso.publicar')} tipo="primario" onPress={handlePublicar} disabled={carregando} />}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => router.back()} estilo={{ flex: 1 }} />
          {avisoId && <Botao titulo={t('admin.usuario.deletar')} tipo="perigo" onPress={() => void handleDeletar()} estilo={{ flex: 0.5 }} />}
          <Botao titulo={t('comum.acoes.salvar')} tipo="primario" onPress={handleSalvar} estilo={{ flex: 1 }} disabled={carregando} />
        </View>
      </View>
    </View>
  );
}









