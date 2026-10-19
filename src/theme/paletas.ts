/**
 * Las paletas de color (cambio 109). Se eligen en Configuracion, cada una en
 * claro y oscuro.
 *
 * Todas tienen los mismos seis colores, con los mismos usos que la paleta
 * monocroma original (los nombres vienen de ella y son roles, no tonos: en
 * Violetas, `grisOscuro` es un violeta):
 *   tinta: textos, botones, el 1º del podio
 *   grisOscuro: textos secundarios (subtitulos, totales)
 *   grisMedio: textos apagados, placeholders, etiquetas
 *   linea: bordes y separadores
 *   superficie: fondos suaves
 *   fondo: la pantalla
 *
 * Los participantes: en las paletas de un tono usan tinta, grisOscuro, grisMedio
 * y linea, como siempre. En las de varios colores (Pasteles, Basicos, Neon)
 * tienen colores propios, que no se usan para puntos, textos ni lineas.
 *
 * Se eligieron con la usuaria en una pagina de muestra.
 */

export interface Colores {
  tinta: string;
  grisOscuro: string;
  grisMedio: string;
  linea: string;
  superficie: string;
  fondo: string;
  /** Lo que oscurece la pantalla detras de un popup o un bottom sheet. */
  velo: string;
}

export type IdPaleta =
  | 'monocromo'
  | 'pasteles'
  | 'basicos'
  | 'neon'
  | 'beige'
  | 'violetas'
  | 'azules'
  | 'verdes'
  | 'rosados';

export type Modo = 'claro' | 'oscuro';

export interface Paleta {
  id: IdPaleta;
  claro: Colores;
  oscuro: Colores;
  /** Los colores para elegir de los participantes, en cada modo. */
  participantes: Record<Modo, readonly string[]>;
}

type Seis = readonly [string, string, string, string, string, string];

const VELO_CLARO = 'rgba(28, 28, 30, 0.45)';
const VELO_OSCURO = 'rgba(0, 0, 0, 0.6)';

function colores([tinta, grisOscuro, grisMedio, linea, superficie, fondo]: Seis, velo: string): Colores {
  return { tinta, grisOscuro, grisMedio, linea, superficie, fondo, velo };
}

/** Una paleta de un solo tono: los participantes usan sus colores 1 a 4. */
function deUnTono(id: IdPaleta, claro: Seis, oscuro: Seis): Paleta {
  return {
    id,
    claro: colores(claro, VELO_CLARO),
    oscuro: colores(oscuro, VELO_OSCURO),
    participantes: { claro: claro.slice(0, 4), oscuro: oscuro.slice(0, 4) },
  };
}

/** Una paleta de varios colores: los participantes tienen los suyos. */
function deVariosColores(
  id: IdPaleta,
  claro: Seis,
  oscuro: Seis,
  participantes: Record<Modo, readonly string[]>,
): Paleta {
  return { id, claro: colores(claro, VELO_CLARO), oscuro: colores(oscuro, VELO_OSCURO), participantes };
}

const PASTELES = ['#F9E08B', '#F4A6A6', '#CDB4F0', '#A8DCB5', '#A7C7F2'];

/** En el orden en que aparecen en Configuracion. La primera es la de siempre. */
export const PALETAS: readonly Paleta[] = [
  deUnTono(
    'monocromo',
    ['#1C1C1E', '#636366', '#9A9AA0', '#D8D8DC', '#F2F2F4', '#FFFFFF'],
    ['#F2F2F4', '#AEAEB2', '#7C7C82', '#3A3A3C', '#232325', '#111112'],
  ),
  deVariosColores(
    'pasteles',
    ['#4E3542', '#7F6170', '#B79DAA', '#F3D9E3', '#FDEEF3', '#FFF8FA'],
    ['#FBEAF1', '#D7B5C5', '#9E7F8E', '#4A3440', '#2E2028', '#1E151B'],
    { claro: PASTELES, oscuro: PASTELES },
  ),
  deVariosColores(
    'basicos',
    ['#0B2A7A', '#4B5563', '#9AA1AC', '#D9DDE3', '#F3F5F8', '#FFFFFF'],
    ['#E8EEFF', '#AAB3C2', '#77808F', '#2C3442', '#1A202A', '#10141B'],
    { claro: ['#D62828', '#F2B705', '#2A9D4B', '#1F6FEB'], oscuro: ['#FF5A5A', '#FFC93C', '#3DDC84', '#4D9BFF'] },
  ),
  deVariosColores(
    'neon',
    ['#14102A', '#4E4A66', '#8A8AA0', '#DDDCEB', '#F4F3FA', '#FFFFFF'],
    ['#FFFFFF', '#B9B6D9', '#6E6E91', '#2A2A45', '#15152A', '#0A0A12'],
    { claro: ['#FF2BD6', '#00D99A', '#FFB800', '#00B3FF'], oscuro: ['#FF3CDB', '#00F5A8', '#00C8FF', '#FF8A00'] },
  ),
  deUnTono(
    'beige',
    ['#3E3226', '#7A6650', '#A8977E', '#DCCDB6', '#F1E8DA', '#FBF7F0'],
    ['#F1E6D3', '#C9B79C', '#8F806B', '#4A4034', '#2A241D', '#1D1915'],
  ),
  deUnTono(
    'violetas',
    ['#2E1A5E', '#6D4BB8', '#A08CC9', '#DCCFF8', '#F4EFFE', '#FFFFFF'],
    ['#EDE5FF', '#C2AEF0', '#8C7BB8', '#3A2C5C', '#201833', '#140F22'],
  ),
  deUnTono(
    'azules',
    ['#0F2A4A', '#3F5F87', '#8A9CB4', '#CFDDEE', '#EEF4FB', '#FFFFFF'],
    ['#E6F0FB', '#A9C2E0', '#7189A8', '#26384F', '#142133', '#0B1420'],
  ),
  deUnTono(
    'verdes',
    ['#12352A', '#3E6B57', '#8BAA9B', '#CFE3D8', '#EEF6F1', '#FFFFFF'],
    ['#E4F4EB', '#A5CDB8', '#6F9782', '#24402F', '#13261C', '#0A1610'],
  ),
  deUnTono(
    'rosados',
    ['#5A1A3A', '#9A4A72', '#C9A0B5', '#F2D3E1', '#FDF0F5', '#FFFFFF'],
    ['#FCE4EF', '#E8AECB', '#A87892', '#4A2236', '#2A1320', '#1A0B13'],
  ),
];

export const PALETA_POR_DEFECTO: IdPaleta = 'monocromo';

export function paletaPorId(id: string): Paleta {
  return PALETAS.find((paleta) => paleta.id === id) ?? PALETAS[0]!;
}

/**
 * Como se guarda el color de un avatar desde el cambio 109: el numero de color
 * («avatar:2»), asi sigue a la paleta activa. Antes se guardaba el hex de la
 * paleta monocroma: esos se reconocen por su lugar en la lista vieja.
 */
const PREFIJO_AVATAR = 'avatar:';
const AVATAR_VIEJO = ['#1C1C1E', '#636366', '#9A9AA0', '#D8D8DC'];

export function valorDeAvatar(indice: number): string {
  return `${PREFIJO_AVATAR}${indice}`;
}

/** El numero de color de un avatar guardado, o null si es un color suelto. */
export function indiceDeAvatar(valor: string): number | null {
  if (valor.startsWith(PREFIJO_AVATAR)) {
    const indice = Number(valor.slice(PREFIJO_AVATAR.length));
    return Number.isInteger(indice) && indice >= 0 ? indice : null;
  }
  const viejo = AVATAR_VIEJO.indexOf(valor.toUpperCase());
  return viejo === -1 ? null : viejo;
}

/** La inicial de un avatar de color va clara u oscura segun lo oscuro del circulo, en cualquier paleta. */
export const INICIAL_SOBRE_OSCURO = '#FFFFFF';
export const INICIAL_SOBRE_CLARO = '#1C1C1E';

/** El color con que se pinta un avatar con la paleta activa. Si sobra el numero, da la vuelta. */
export function colorDeAvatar(valor: string, participantes: readonly string[]): string {
  const indice = indiceDeAvatar(valor);
  if (indice === null) return valor;
  return participantes[indice % participantes.length]!;
}
