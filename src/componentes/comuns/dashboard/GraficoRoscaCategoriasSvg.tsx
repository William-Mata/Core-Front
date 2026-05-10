import { type ReactElement, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../../styles/variables';

interface SegmentoRoscaCategoria {
  valor: number;
  cor: string;
}

interface SegmentoRenderizado {
  indice: number;
  valor: number;
  cor: string;
  proporcao: number;
  inicioGraus: number;
  fimGraus: number;
}

interface GraficoRoscaCategoriasSvgProps {
  largura: number;
  altura: number;
  segmentos: SegmentoRoscaCategoria[];
  indiceAtivo?: number;
  espessuraAnel?: number;
  espacamentoGraus?: number;
  corTrilha?: string;
  onSelecionarIndice?: (indice: number) => void;
  testID?: string;
}

function obterCoordenadaEvento(evento: unknown, chaveNativa: 'locationX' | 'locationY', chaveWeb: 'offsetX' | 'offsetY'): number {
  if (!evento || typeof evento !== 'object') return 0;
  const eventoComNative = evento as { nativeEvent?: unknown };
  const nativeEvent = eventoComNative.nativeEvent;
  if (!nativeEvent || typeof nativeEvent !== 'object') return 0;
  const registroNative = nativeEvent as Record<string, unknown>;
  const valor = registroNative[chaveNativa] ?? registroNative[chaveWeb];
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

function paraCoordenadaPolar(
  centroX: number,
  centroY: number,
  raio: number,
  anguloGraus: number,
): { x: number; y: number } {
  const anguloRadianos = (anguloGraus * Math.PI) / 180;
  return {
    x: centroX + raio * Math.cos(anguloRadianos),
    y: centroY + raio * Math.sin(anguloRadianos),
  };
}

function montarPathArco(
  centroX: number,
  centroY: number,
  raio: number,
  anguloInicio: number,
  anguloFim: number,
): string {
  const inicio = paraCoordenadaPolar(centroX, centroY, raio, anguloInicio);
  const fim = paraCoordenadaPolar(centroX, centroY, raio, anguloFim);
  const arcoMaior = anguloFim - anguloInicio > 180 ? 1 : 0;
  return `M ${inicio.x} ${inicio.y} A ${raio} ${raio} 0 ${arcoMaior} 1 ${fim.x} ${fim.y}`;
}

function normalizarIndice(indice: number, quantidade: number): number {
  if (quantidade <= 0) return 0;
  if (!Number.isFinite(indice)) return 0;
  if (indice < 0) return 0;
  if (indice > quantidade - 1) return quantidade - 1;
  return indice;
}

export function GraficoRoscaCategoriasSvg({
  largura,
  altura,
  segmentos,
  indiceAtivo = -1,
  espessuraAnel = 22,
  espacamentoGraus = 2.2,
  corTrilha = COLORS.bgSecondary,
  onSelecionarIndice,
  testID,
}: GraficoRoscaCategoriasSvgProps): ReactElement {
  const larguraNormalizada = Math.max(Math.floor(largura), 10);
  const alturaNormalizada = Math.max(Math.floor(altura), 10);
  const tamanhoBase = Math.min(larguraNormalizada, alturaNormalizada);
  const centroX = tamanhoBase / 2;
  const centroY = tamanhoBase / 2;
  const espessuraBase = Math.max(Math.min(espessuraAnel, tamanhoBase * 0.28), 8);
  const espessuraDestaque = espessuraBase + 3;
  const raio = Math.max(tamanhoBase / 2 - espessuraDestaque / 2 - 2, 8);
  const raioInterno = Math.max(raio - espessuraDestaque / 2, 0);
  const raioExterno = raio + espessuraDestaque / 2;

  const segmentosRenderizados = useMemo(() => {
    const valoresPositivos = segmentos.map((segmento) => ({
      valor: Number.isFinite(segmento.valor) ? Math.max(0, segmento.valor) : 0,
      cor: segmento.cor,
    }));
    const total = valoresPositivos.reduce((soma, segmento) => soma + segmento.valor, 0);
    if (total <= 0) return [] as SegmentoRenderizado[];

    let acumuladoGraus = 0;
    return valoresPositivos.map((segmento, indice) => {
      const proporcao = segmento.valor / total;
      const graus = proporcao * 360;
      const inicioGraus = acumuladoGraus;
      const fimGraus = inicioGraus + graus;
      acumuladoGraus = fimGraus;
      return {
        indice,
        valor: segmento.valor,
        cor: segmento.cor,
        proporcao,
        inicioGraus,
        fimGraus,
      };
    });
  }, [segmentos]);

  const indiceAtivoSeguro = normalizarIndice(indiceAtivo, segmentosRenderizados.length);

  const selecionarPorToque = (posicaoX: number, posicaoY: number) => {
    if (!onSelecionarIndice || !segmentosRenderizados.length) return;
    const deltaX = posicaoX - centroX;
    const deltaY = posicaoY - centroY;
    const distancia = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    if (distancia < raioInterno || distancia > raioExterno + 8) return;

    const angulo = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const anguloNormalizado = (angulo + 90 + 360) % 360;
    const indiceEncontrado = segmentosRenderizados.findIndex((segmento) =>
      anguloNormalizado >= segmento.inicioGraus && anguloNormalizado < segmento.fimGraus);

    if (indiceEncontrado >= 0) {
      onSelecionarIndice(indiceEncontrado);
    }
  };

  return (
    <View style={{ width: larguraNormalizada, height: alturaNormalizada }} testID={testID}>
      <View
        style={{
          width: tamanhoBase,
          height: tamanhoBase,
          alignSelf: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg width={tamanhoBase} height={tamanhoBase}>
          <Circle
            cx={centroX}
            cy={centroY}
            r={raio}
            fill="none"
            stroke={corTrilha}
            strokeWidth={espessuraBase}
            opacity={0.32}
          />

          {segmentosRenderizados.length === 1 ? (
            <Circle
              cx={centroX}
              cy={centroY}
              r={raio}
              fill="none"
              stroke={segmentosRenderizados[0].cor}
              strokeWidth={indiceAtivoSeguro === 0 ? espessuraDestaque : espessuraBase}
              strokeLinecap="round"
              transform={`rotate(-90 ${centroX} ${centroY})`}
            />
          ) : (
            segmentosRenderizados.map((segmento) => {
              const grausSegmento = segmento.fimGraus - segmento.inicioGraus;
              const ajusteLacuna = Math.min(
                espacamentoGraus,
                Math.max(grausSegmento - 0.4, 0),
              );
              const inicio = -90 + segmento.inicioGraus + ajusteLacuna / 2;
              const fim = -90 + segmento.fimGraus - ajusteLacuna / 2;
              if (fim <= inicio) return null;

              const selecionado = segmento.indice === indiceAtivoSeguro;
              return (
                <Path
                  key={`segmento-${segmento.indice}-${segmento.cor}`}
                  d={montarPathArco(centroX, centroY, raio, inicio, fim)}
                  fill="none"
                  stroke={segmento.cor}
                  strokeWidth={selecionado ? espessuraDestaque : espessuraBase}
                  strokeLinecap="round"
                  opacity={selecionado ? 1 : 0.92}
                />
              );
            })
          )}
        </Svg>

        <Pressable
          onPressIn={(evento) =>
            selecionarPorToque(
              obterCoordenadaEvento(evento, 'locationX', 'offsetX'),
              obterCoordenadaEvento(evento, 'locationY', 'offsetY'),
            )}
          onHoverIn={(evento) =>
            selecionarPorToque(
              obterCoordenadaEvento(evento, 'locationX', 'offsetX'),
              obterCoordenadaEvento(evento, 'locationY', 'offsetY'),
            )}
          style={{ position: 'absolute', inset: 0 }}
        />
      </View>
    </View>
  );
}
