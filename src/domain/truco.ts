/**
 * El Truco (cambio 93). TypeScript puro.
 *
 * La partida de Truco no se juega por rondas: se anota de a palitos, como en
 * papel. Toda la partida es la ronda 1, que no se cierra, y cada toque de +1 a
 * +4 (o −1) cambia el puntaje de esa ronda. Asi totales, objetivo, podio y
 * TERMINAR siguen funcionando igual que en las otras plantillas.
 *
 * Se reconoce por el id fijo de la predefinida, como la «Cortó» de Carioca: una
 * copia del Truco tiene otro id y se anota con numeros.
 */
import type { Plantilla } from './types';

export const PLANTILLA_TRUCO = 'f93cf041-a158-4d42-9805-f9ae2856a7ab';

/** Lo que vale un cuadradito: cuatro lados y la diagonal. */
export const PUNTOS_POR_CUADRADO = 5;

/** La unica ronda de una partida de Truco. */
export const RONDA_DEL_TRUCO = 1;

export function esTruco(plantilla: Plantilla): boolean {
  return plantilla.id === PLANTILLA_TRUCO;
}

/**
 * Cuantos puntos son malas: la primera mitad del objetivo (15 de 30). Si el
 * objetivo es impar, las malas se llevan el de mas. Sin objetivo no hay division.
 */
export function puntosDeMalas(objetivo: number | undefined): number | null {
  return objetivo === undefined ? null : Math.ceil(objetivo / 2);
}

/**
 * El total partido en malas y buenas. Lo que pasa del objetivo sigue en buenas.
 * Sin objetivo, todo va en malas y buenas queda en 0.
 */
export function malasYBuenas(total: number, objetivo: number | undefined): { malas: number; buenas: number } {
  const puntos = Math.max(0, total);
  const tope = puntosDeMalas(objetivo);
  if (tope === null) return { malas: puntos, buenas: 0 };
  return { malas: Math.min(puntos, tope), buenas: Math.max(0, puntos - tope) };
}

/** Los cuadraditos de una cantidad de puntos: 13 da [5, 5, 3]. El ultimo puede estar a medias. */
export function cuadrados(puntos: number): number[] {
  const llenos = Math.floor(puntos / PUNTOS_POR_CUADRADO);
  const resto = puntos % PUNTOS_POR_CUADRADO;
  return [...Array<number>(llenos).fill(PUNTOS_POR_CUADRADO), ...(resto > 0 ? [resto] : [])];
}

/** El puntaje de la ronda despues de un toque: nunca baja de 0 (A-2). */
export function sumarAlPuntaje(actual: number | null, delta: number): number {
  return Math.max(0, (actual ?? 0) + delta);
}
