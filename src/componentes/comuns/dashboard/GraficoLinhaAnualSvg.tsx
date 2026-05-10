import { type ReactElement, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as TextoSvg,
} from 'react-native-svg';
import { COLORS } from '../../../styles/variables';

interface LinhaTooltip {
  rotulo: string;
  valor: string;
  cor?: string;
}

interface ConteudoTooltip {
  titulo: string;
  linhas: LinhaTooltip[];
}

export interface SerieGraficoLinhaAnual {
  chave: string;
  rotulo: string;
  cor: string;
  valores: number[];
  visivel?: boolean;
  preencherArea?: boolean;
  espessuraLinha?: number;
  opacidadeInicioArea?: number;
  opacidadeFimArea?: number;
}

interface GraficoLinhaAnualSvgProps {
  largura: number;
  altura: number;
  rotulosEixoX: string[];
  series: SerieGraficoLinhaAnual[];
  secoesEixoY?: number;
  corGrade?: string;
  corTextoEixo?: string;
  corEixoX?: string;
  indiceDestaque?: number;
  corIndiceDestaque?: string;
  formatarValorEixoY?: (valor: number) => string;
  obterConteudoTooltip?: (indice: number) => ConteudoTooltip;
  testID?: string;
}

interface PontoGrafico {
  x: number;
  y: number;
}

function normalizarNumero(valor: number): number {
  return Number.isFinite(valor) ? valor : 0;
}

function limitarIndice(valor: number, maximo: number): number {
  if (maximo <= 0) return 0;
  if (valor < 0) return 0;
  if (valor > maximo) return maximo;
  return valor;
}

function gerarPathCurvaSuave(pontos: PontoGrafico[]): string {
  if (!pontos.length) return '';
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;

  let path = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let indice = 0; indice < pontos.length - 1; indice += 1) {
    const pontoAnterior = pontos[indice - 1] ?? pontos[indice];
    const pontoAtual = pontos[indice];
    const proximoPonto = pontos[indice + 1];
    const pontoDepois = pontos[indice + 2] ?? proximoPonto;

    const controle1X = pontoAtual.x + (proximoPonto.x - pontoAnterior.x) / 6;
    const controle1Y = pontoAtual.y + (proximoPonto.y - pontoAnterior.y) / 6;
    const controle2X = proximoPonto.x - (pontoDepois.x - pontoAtual.x) / 6;
    const controle2Y = proximoPonto.y - (pontoDepois.y - pontoAtual.y) / 6;

    path += ` C ${controle1X} ${controle1Y}, ${controle2X} ${controle2Y}, ${proximoPonto.x} ${proximoPonto.y}`;
  }

  return path;
}

function gerarPathArea(pathLinha: string, pontos: PontoGrafico[], yBase: number): string {
  if (!pathLinha || !pontos.length) return '';
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  return `${pathLinha} L ${ultimo.x} ${yBase} L ${primeiro.x} ${yBase} Z`;
}

function formatarRotuloTooltip(linha: LinhaTooltip): string {
  if (!linha.valor) return linha.rotulo;
  return `${linha.rotulo}: ${linha.valor}`;
}

export function GraficoLinhaAnualSvg({
  largura,
  altura,
  rotulosEixoX,
  series,
  secoesEixoY = 4,
  corGrade = COLORS.borderColor,
  corTextoEixo = COLORS.textSecondary,
  corEixoX = COLORS.borderColor,
  indiceDestaque,
  corIndiceDestaque = COLORS.warning,
  formatarValorEixoY,
  obterConteudoTooltip,
  testID,
}: GraficoLinhaAnualSvgProps): ReactElement {
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);

  const larguraGrafico = Math.max(Math.floor(largura), 0);
  const alturaGrafico = Math.max(Math.floor(altura), 140);
  const margens = useMemo(
    () => ({
      topo: 10,
      direita: larguraGrafico < 480 ? 8 : 14,
      inferior: larguraGrafico < 480 ? 30 : 26,
      esquerda: larguraGrafico < 480 ? 34 : 40,
    }),
    [larguraGrafico],
  );

  if (larguraGrafico <= margens.esquerda + margens.direita + 8) {
    return <View testID={testID} style={{ width: '100%', height: alturaGrafico }} />;
  }

  const rotulos = rotulosEixoX.length ? rotulosEixoX : ['-'];
  const quantidadePontos = rotulos.length;
  const larguraPlot = Math.max(larguraGrafico - margens.esquerda - margens.direita, 1);
  const alturaPlot = Math.max(alturaGrafico - margens.topo - margens.inferior, 56);
  const yBase = margens.topo + alturaPlot;
  const passoX = quantidadePontos > 1 ? larguraPlot / (quantidadePontos - 1) : 0;

  const obterX = (indice: number): number => margens.esquerda + passoX * indice;

  const seriesNormalizadas = series.map((serie) => ({
    ...serie,
    valores: Array.from({ length: quantidadePontos }, (_, indice) =>
      normalizarNumero(serie.valores[indice] ?? 0)),
  }));
  const seriesVisiveis = seriesNormalizadas.filter((serie) => serie.visivel !== false);

  const maximoSerie = Math.max(
    1,
    ...seriesVisiveis.flatMap((serie) => serie.valores.map((valor) => normalizarNumero(valor))),
  );
  const maximoEscala = maximoSerie > 0 ? Math.ceil((maximoSerie * 1.12) / 10) * 10 : 10;
  const obterY = (valor: number): number =>
    margens.topo + alturaPlot - (normalizarNumero(valor) / maximoEscala) * alturaPlot;

  const seriesComPontos = seriesVisiveis.map((serie, indiceSerie) => {
    const pontos = serie.valores.map((valor, indiceValor) => ({
      x: obterX(indiceValor),
      y: obterY(valor),
    }));
    const pathLinha = gerarPathCurvaSuave(pontos);
    return {
      ...serie,
      idGradiente: `gradiente-${indiceSerie}-${serie.chave}`,
      pontos,
      pathLinha,
    };
  });

  const indiceDestaqueSeguro = typeof indiceDestaque === 'number'
    ? limitarIndice(indiceDestaque, quantidadePontos - 1)
    : null;

  const conteudoTooltip = indiceAtivo !== null
    ? (obterConteudoTooltip?.(indiceAtivo) ?? {
      titulo: rotulos[indiceAtivo] ?? '',
      linhas: seriesVisiveis.map((serie) => ({
        rotulo: serie.rotulo,
        valor: String(serie.valores[indiceAtivo] ?? 0),
        cor: serie.cor,
      })),
    })
    : null;

  const posicaoTooltipX = indiceAtivo !== null ? obterX(indiceAtivo) : 0;
  const larguraTooltip = larguraGrafico < 460 ? 158 : 186;
  const esquerdaTooltip = Math.min(
    Math.max(posicaoTooltipX - larguraTooltip / 2, 6),
    Math.max(larguraGrafico - larguraTooltip - 6, 6),
  );

  const atualizarIndiceAtivoPorPosicao = (localX: number) => {
    if (quantidadePontos <= 1 || passoX <= 0) {
      setIndiceAtivo(0);
      return;
    }
    const x = Math.min(Math.max(localX, margens.esquerda), margens.esquerda + larguraPlot);
    const indice = Math.round((x - margens.esquerda) / passoX);
    setIndiceAtivo(limitarIndice(indice, quantidadePontos - 1));
  };

  return (
    <View style={{ width: '100%' }} testID={testID}>
      <View style={{ width: '100%', height: alturaGrafico, position: 'relative' }}>
        <Svg width={larguraGrafico} height={alturaGrafico}>
          <Defs>
            {seriesComPontos
              .filter((serie) => serie.preencherArea)
              .map((serie) => (
                <LinearGradient key={serie.idGradiente} id={serie.idGradiente} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={serie.cor} stopOpacity={serie.opacidadeInicioArea ?? 0.18} />
                  <Stop offset="100%" stopColor={serie.cor} stopOpacity={serie.opacidadeFimArea ?? 0.02} />
                </LinearGradient>
              ))}
          </Defs>

          {Array.from({ length: secoesEixoY + 1 }).map((_, indiceSecao) => {
            const y = margens.topo + (alturaPlot / secoesEixoY) * indiceSecao;
            const valorSecao = maximoEscala - (maximoEscala / secoesEixoY) * indiceSecao;
            return (
              <G key={`secao-${indiceSecao}`}>
                <Line
                  x1={margens.esquerda}
                  y1={y}
                  x2={margens.esquerda + larguraPlot}
                  y2={y}
                  stroke={corGrade}
                  strokeWidth={1}
                  strokeDasharray="3 6"
                />
                <TextoSvg
                  x={margens.esquerda - 6}
                  y={y + 4}
                  fill={corTextoEixo}
                  fontSize="10"
                  textAnchor="end"
                >
                  {formatarValorEixoY ? formatarValorEixoY(valorSecao) : String(Math.round(valorSecao))}
                </TextoSvg>
              </G>
            );
          })}

          {indiceDestaqueSeguro !== null ? (
            <Line
              x1={obterX(indiceDestaqueSeguro)}
              y1={margens.topo}
              x2={obterX(indiceDestaqueSeguro)}
              y2={yBase}
              stroke={corIndiceDestaque}
              strokeWidth={1}
              strokeDasharray="4 6"
              opacity={0.4}
            />
          ) : null}

          <Line
            x1={margens.esquerda}
            y1={yBase}
            x2={margens.esquerda + larguraPlot}
            y2={yBase}
            stroke={corEixoX}
            strokeWidth={1}
          />

          {rotulos.map((rotulo, indice) => (
            <TextoSvg
              key={`rotulo-${indice}-${rotulo}`}
              x={obterX(indice)}
              y={yBase + 14}
              fill={corTextoEixo}
              fontSize="10"
              textAnchor="middle"
            >
              {rotulo}
            </TextoSvg>
          ))}

          {seriesComPontos.map((serie) => {
            const indiceRealce = indiceDestaqueSeguro ?? -1;
            return (
              <G key={`serie-${serie.chave}`}>
                {serie.preencherArea ? (
                  <Path d={gerarPathArea(serie.pathLinha, serie.pontos, yBase)} fill={`url(#${serie.idGradiente})`} />
                ) : null}
                <Path
                  d={serie.pathLinha}
                  fill="none"
                  stroke={serie.cor}
                  strokeWidth={serie.espessuraLinha ?? 2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {serie.pontos.map((ponto, indicePonto) => (
                  <Circle
                    key={`ponto-${serie.chave}-${indicePonto}`}
                    cx={ponto.x}
                    cy={ponto.y}
                    r={indicePonto === indiceRealce ? 3.8 : 2.4}
                    fill={indicePonto === indiceRealce ? corIndiceDestaque : serie.cor}
                  />
                ))}
              </G>
            );
          })}

          {indiceAtivo !== null ? (
            <Line
              x1={obterX(indiceAtivo)}
              y1={margens.topo}
              x2={obterX(indiceAtivo)}
              y2={yBase}
              stroke={COLORS.borderAccent}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          ) : null}
        </Svg>

        <Pressable
          onPressIn={(evento) => atualizarIndiceAtivoPorPosicao(evento.nativeEvent.locationX ?? 0)}
          onPressOut={() => setIndiceAtivo(null)}
          onHoverIn={Platform.OS === 'web'
            ? (evento) => atualizarIndiceAtivoPorPosicao(evento.nativeEvent.locationX ?? 0)
            : undefined}
          onHoverOut={Platform.OS === 'web' ? () => setIndiceAtivo(null) : undefined}
          style={{ position: 'absolute', inset: 0 }}
        />

        {conteudoTooltip ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 8,
              left: esquerdaTooltip,
              width: larguraTooltip,
              backgroundColor: COLORS.bgPrimary,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.borderAccent,
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' }}>
              {conteudoTooltip.titulo}
            </Text>
            {conteudoTooltip.linhas.map((linha, indice) => (
              <Text
                key={`tooltip-linha-${indice}`}
                style={{ color: linha.cor ?? COLORS.textSecondary, fontSize: 10, marginTop: 3 }}
              >
                {formatarRotuloTooltip(linha)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
