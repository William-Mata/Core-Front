import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ModalConfirmacao } from '../ModalConfirmacao';
import {
  OpcoesConfirmacao,
  registrarSolicitadorConfirmacao,
} from '../../../utils/confirmacao';

interface ProvedorConfirmacaoCriticaProps {
  children: ReactNode;
}

interface EstadoConfirmacao {
  visivel: boolean;
  mensagem: string;
  opcoes: OpcoesConfirmacao;
}

const estadoInicial: EstadoConfirmacao = {
  visivel: false,
  mensagem: '',
  opcoes: {
    titulo: '',
    textoConfirmar: '',
    textoCancelar: '',
  },
};

export function ProvedorConfirmacaoCritica({
  children,
}: ProvedorConfirmacaoCriticaProps) {
  const [estadoConfirmacao, setEstadoConfirmacao] =
    useState<EstadoConfirmacao>(estadoInicial);
  const resolveRef = useRef<((confirmado: boolean) => void) | null>(null);

  const fecharConfirmacao = useCallback((confirmado: boolean) => {
    const resolverAtual = resolveRef.current;
    resolveRef.current = null;
    setEstadoConfirmacao(estadoInicial);
    resolverAtual?.(confirmado);
  }, []);

  const solicitarConfirmacaoModal = useCallback(
    (mensagem: string, opcoes: OpcoesConfirmacao) =>
      new Promise<boolean>((resolver) => {
        resolveRef.current = resolver;
        setEstadoConfirmacao({
          visivel: true,
          mensagem,
          opcoes,
        });
      }),
    [],
  );

  useEffect(() => {
    registrarSolicitadorConfirmacao(solicitarConfirmacaoModal);
    return () => {
      registrarSolicitadorConfirmacao(null);
      if (resolveRef.current) {
        resolveRef.current(false);
        resolveRef.current = null;
      }
    };
  }, [solicitarConfirmacaoModal]);

  return (
    <>
      {children}
      <ModalConfirmacao
        visivel={estadoConfirmacao.visivel}
        titulo={estadoConfirmacao.opcoes.titulo}
        mensagem={estadoConfirmacao.mensagem}
        mensagemImpacto={estadoConfirmacao.opcoes.mensagemImpacto}
        textoCancelar={estadoConfirmacao.opcoes.textoCancelar}
        textoConfirmar={estadoConfirmacao.opcoes.textoConfirmar}
        tipoConfirmar={estadoConfirmacao.opcoes.tipoConfirmar}
        onConfirmar={() => fecharConfirmacao(true)}
        onCancelar={() => fecharConfirmacao(false)}
      />
    </>
  );
}
