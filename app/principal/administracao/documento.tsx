import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { usarTraducao } from '../../../src/hooks/usarTraducao';
import { CampoTexto } from '../../../src/componentes/comuns/CampoTexto';
import { Botao } from '../../../src/componentes/comuns/Botao';
import { COLORS } from '../../../src/styles/variables';
import { solicitarConfirmacao } from '../../../src/utils/confirmacao';
import { notificarErro, notificarSucesso } from '../../../src/utils/notificacao';
import { DocumentoModulo, ModuloDocumentacao, usarDocumentacaoStore } from '../../../src/store/usarDocumentacaoStore';

interface DocumentoForm {
  id?: number;
  modulo: ModuloDocumentacao;
  titulo: string;
  descricao: string;
  conteudo: string;
  status: 'RASCUNHO' | 'PUBLICADO';
}

const modulos: ModuloDocumentacao[] = ['dashboard', 'financeiro', 'compras', 'amigos', 'admin'];

export default function CriarEditarDocumento() {
  const router = useRouter();
  const { t } = usarTraducao();
  const params = useLocalSearchParams();
  const documentoId = params.id ? Number(params.id) : null;
  const obterPorId = usarDocumentacaoStore((state) => state.obterPorId);
  const salvarDocumento = usarDocumentacaoStore((state) => state.salvar);
  const publicarDocumento = usarDocumentacaoStore((state) => state.publicar);
  const removerDocumento = usarDocumentacaoStore((state) => state.remover);

  const [documento, setDocumento] = useState<DocumentoForm>({
    modulo: 'dashboard',
    titulo: '',
    descricao: '',
    conteudo: '',
    status: 'RASCUNHO',
  });
  const [camposInvalidos, setCamposInvalidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!documentoId) return;
    const encontrado = obterPorId(documentoId);
    if (!encontrado) return;
    setDocumento({
      id: encontrado.id,
      modulo: encontrado.modulo,
      titulo: encontrado.titulo,
      descricao: encontrado.descricao,
      conteudo: encontrado.conteudo,
      status: encontrado.status,
    });
  }, [documentoId, obterPorId]);

  const handleSalvar = () => {
    if (!documento.titulo.trim() || !documento.descricao.trim() || !documento.conteudo.trim()) {
      setCamposInvalidos((atual) => ({ ...atual, titulo: !documento.titulo.trim(), descricao: !documento.descricao.trim(), conteudo: !documento.conteudo.trim() }));
      notificarErro( t('admin.documentacao.erros.camposObrigatorios'));
      return;
    }

    salvarDocumento({
      id: documento.id,
      modulo: documento.modulo,
      titulo: documento.titulo,
      descricao: documento.descricao,
      conteudo: documento.conteudo,
      status: documento.status,
      criadoPor: 'Admin',
    } as Omit<DocumentoModulo, 'id' | 'atualizadoEm'> & { id?: number });

    notificarSucesso(t('admin.documentacao.salvoSucesso'));
    router.back();
  };

  const handleDeletar = async () => {
    if (!documento.id) return;
    const confirmar = await solicitarConfirmacao(t('admin.documento.confirmarDelete'), {
      titulo: t('comum.confirmacoes.tituloExclusao'),
      textoConfirmar: t('comum.acoes.excluir'),
      textoCancelar: t('comum.acoes.cancelar'),
      mensagemImpacto: t('comum.confirmacoes.alertaAcaoIrreversivel'),
      tipoConfirmar: 'perigo',
    });
    if (!confirmar) return;

    removerDocumento(documento.id);
    notificarSucesso(t('admin.documentacao.deletadoSucesso'));
    router.back();
  };

  const handlePublicar = () => {
    if (!documento.id) {
      const salvo = salvarDocumento({
        modulo: documento.modulo,
        titulo: documento.titulo,
        descricao: documento.descricao,
        conteudo: documento.conteudo,
        status: 'PUBLICADO',
        criadoPor: 'Admin',
      });
      setDocumento((atual) => ({ ...atual, id: salvo.id, status: 'PUBLICADO' }));
    } else {
      publicarDocumento(documento.id);
      setDocumento((atual) => ({ ...atual, status: 'PUBLICADO' }));
    }

    notificarSucesso(t('admin.documentacao.publicadoSucesso'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{documentoId ? t('admin.documentacao.editar') : t('admin.documentacao.novo')}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: COLORS.accent, fontSize: 20 }}>{'\u2715'}</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('admin.documentacao.modulo')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {modulos.map((modulo) => (
              <TouchableOpacity
                key={modulo}
                onPress={() => setDocumento((atual) => ({ ...atual, modulo }))}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor,
                  backgroundColor: documento.modulo === modulo ? COLORS.accent : COLORS.bgTertiary,
                }}
              >
                <Text style={{ color: documento.modulo === modulo ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 12 }}>
                  {t(`documentacao.modulos.${modulo}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CampoTexto label={t('admin.documentacao.titulo')} placeholder={t('admin.documentacao.placeholderTitulo')} value={documento.titulo} onChangeText={(titulo) => { setCamposInvalidos((atual) => ({ ...atual, titulo: false })); setDocumento((atual) => ({ ...atual, titulo })); }} error={camposInvalidos.titulo} />
        <CampoTexto label={t('admin.documentacao.resumo')} placeholder={t('admin.documentacao.placeholderResumo')} value={documento.descricao} onChangeText={(descricao) => { setCamposInvalidos((atual) => ({ ...atual, descricao: false })); setDocumento((atual) => ({ ...atual, descricao })); }} error={camposInvalidos.descricao} multiline numberOfLines={3} />
        <CampoTexto label={t('admin.documentacao.conteudo')} placeholder={t('admin.documentacao.placeholderConteudo')} value={documento.conteudo} onChangeText={(conteudo) => { setCamposInvalidos((atual) => ({ ...atual, conteudo: false })); setDocumento((atual) => ({ ...atual, conteudo })); }} error={camposInvalidos.conteudo} multiline numberOfLines={8} />
      </ScrollView>

      <View style={{ backgroundColor: COLORS.bgTertiary, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.borderColor, gap: 10 }}>
        {documento.status === 'RASCUNHO' ? <Botao titulo={t('admin.documentacao.publicar')} tipo="primario" onPress={handlePublicar} /> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Botao titulo={t('comum.acoes.cancelar')} tipo="secundario" onPress={() => router.back()} estilo={{ flex: 1 }} />
          {documentoId ? <Botao titulo={t('admin.usuario.deletar')} tipo="perigo" onPress={() => void handleDeletar()} estilo={{ flex: 0.6 }} /> : null}
          <Botao titulo={t('comum.acoes.salvar')} tipo="primario" onPress={handleSalvar} estilo={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}





