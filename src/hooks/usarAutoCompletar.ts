import { useEffect, useMemo, useRef, useState } from 'react';

export interface SugestaoAutoCompletarBase {
  id: string;
  rotulo: string;
  valor: string;
}

interface UsarAutoCompletarParams<TSugestao extends SugestaoAutoCompletarBase> {
  textoBusca: string;
  sugestoes: TSugestao[];
  buscarSugestoes?: (termo: string) => Promise<TSugestao[]>;
  aguardarBuscaMs: number;
  minimoCaracteresBusca: number;
  habilitado?: boolean;
}

interface UsarAutoCompletarRetorno<TSugestao extends SugestaoAutoCompletarBase> {
  sugestoesExibidas: TSugestao[];
  carregando: boolean;
  semResultados: boolean;
}

function normalizarTextoBusca(valor: string): string {
  return valor.trim().toLocaleLowerCase();
}

export function usarAutoCompletar<TSugestao extends SugestaoAutoCompletarBase>(
  params: UsarAutoCompletarParams<TSugestao>,
): UsarAutoCompletarRetorno<TSugestao> {
  const {
    textoBusca,
    sugestoes,
    buscarSugestoes,
    aguardarBuscaMs,
    minimoCaracteresBusca,
    habilitado = true,
  } = params;

  const [sugestoesBuscaAssincrona, setSugestoesBuscaAssincrona] = useState<TSugestao[]>([]);
  const [carregandoBuscaAssincrona, setCarregandoBuscaAssincrona] = useState(false);
  const [consultaConcluida, setConsultaConcluida] = useState(false);

  const termoBuscaNormalizado = useMemo(
    () => normalizarTextoBusca(textoBusca),
    [textoBusca],
  );
  const temporizadorBuscaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identificadorConsultaRef = useRef(0);
  const ultimoTermoConsultadoRef = useRef('');

  useEffect(() => () => {
    if (temporizadorBuscaRef.current) {
      clearTimeout(temporizadorBuscaRef.current);
    }
  }, []);

  useEffect(() => {
    if (!buscarSugestoes || !habilitado) {
      setCarregandoBuscaAssincrona(false);
      setConsultaConcluida(false);
      setSugestoesBuscaAssincrona([]);
      return;
    }

    if (temporizadorBuscaRef.current) {
      clearTimeout(temporizadorBuscaRef.current);
      temporizadorBuscaRef.current = null;
    }

    if (termoBuscaNormalizado.length < minimoCaracteresBusca) {
      setCarregandoBuscaAssincrona(false);
      setConsultaConcluida(false);
      setSugestoesBuscaAssincrona([]);
      return;
    }

    if (
      consultaConcluida
      && ultimoTermoConsultadoRef.current === termoBuscaNormalizado
    ) {
      return;
    }

    setCarregandoBuscaAssincrona(true);
    const identificadorConsulta = identificadorConsultaRef.current + 1;
    identificadorConsultaRef.current = identificadorConsulta;

    temporizadorBuscaRef.current = setTimeout(() => {
      void buscarSugestoes(termoBuscaNormalizado)
        .then((resultado) => {
          if (identificadorConsultaRef.current !== identificadorConsulta) return;
          ultimoTermoConsultadoRef.current = termoBuscaNormalizado;
          setSugestoesBuscaAssincrona(resultado);
          setConsultaConcluida(true);
        })
        .catch(() => {
          if (identificadorConsultaRef.current !== identificadorConsulta) return;
          setSugestoesBuscaAssincrona([]);
          setConsultaConcluida(true);
        })
        .finally(() => {
          if (identificadorConsultaRef.current !== identificadorConsulta) return;
          setCarregandoBuscaAssincrona(false);
        });
    }, aguardarBuscaMs);

    return () => {
      if (temporizadorBuscaRef.current) {
        clearTimeout(temporizadorBuscaRef.current);
        temporizadorBuscaRef.current = null;
      }
    };
  }, [
    aguardarBuscaMs,
    buscarSugestoes,
    consultaConcluida,
    habilitado,
    minimoCaracteresBusca,
    termoBuscaNormalizado,
  ]);

  const sugestoesExibidas = useMemo(() => {
    if (!habilitado || termoBuscaNormalizado.length < minimoCaracteresBusca) {
      return [];
    }

    if (buscarSugestoes) {
      return sugestoesBuscaAssincrona;
    }

    return sugestoes.filter((sugestao) => {
      const valorNormalizado = normalizarTextoBusca(sugestao.valor);
      const rotuloNormalizado = normalizarTextoBusca(sugestao.rotulo);
      return (
        valorNormalizado.includes(termoBuscaNormalizado)
        || rotuloNormalizado.includes(termoBuscaNormalizado)
      );
    });
  }, [
    buscarSugestoes,
    habilitado,
    minimoCaracteresBusca,
    sugestoes,
    sugestoesBuscaAssincrona,
    termoBuscaNormalizado,
  ]);

  const semResultados = useMemo(() => {
    if (!habilitado || termoBuscaNormalizado.length < minimoCaracteresBusca) {
      return false;
    }

    if (buscarSugestoes) {
      return consultaConcluida && !carregandoBuscaAssincrona && sugestoesExibidas.length === 0;
    }

    return sugestoesExibidas.length === 0;
  }, [
    buscarSugestoes,
    carregandoBuscaAssincrona,
    consultaConcluida,
    habilitado,
    minimoCaracteresBusca,
    sugestoesExibidas.length,
    termoBuscaNormalizado.length,
  ]);

  return {
    sugestoesExibidas,
    carregando: carregandoBuscaAssincrona,
    semResultados,
  };
}
