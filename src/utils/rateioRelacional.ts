export const SEPARADOR_AREA_SUBAREA = '||';

export function montarChaveAreaSubarea(area: string, subarea: string) {
  return `${area}${SEPARADOR_AREA_SUBAREA}${subarea}`;
}

export function separarAreaSubarea(chave: string) {
  if (chave.includes(SEPARADOR_AREA_SUBAREA)) {
    const [area = '', subarea = ''] = chave.split(SEPARADOR_AREA_SUBAREA);
    return { area, subarea };
  }

  if (chave.includes(' / ')) {
    const [area = '', subarea = ''] = chave.split(' / ');
    return { area, subarea: subarea || area };
  }

  return { area: chave, subarea: chave };
}
