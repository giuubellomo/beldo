/**
 * Reglas del nombre de un participante (RF-202) y cuantos juegan una partida
 * (RF-604, RF-605). TypeScript puro.
 *
 * La usan el alta del dueño (4.1) y el armado de la partida (6.1), donde los
 * jugadores se cargan para esa partida sola (registro, cambio 65).
 */

import { nombreDePartida } from './partidas';
import { PLANTILLA_TRUCO } from './truco';

export const LARGO_MAXIMO_NOMBRE = 20;

/** RF-604: con menos no hay a quien ganarle. */
export const MINIMO_JUGADORES = 2;
/** RF-605. */
export const MAXIMO_JUGADORES = 8;

/** El Truco se juega entre dos equipos, que se cargan como participantes (cambio 94). */
export const EQUIPOS_DEL_TRUCO = 2;

/** Cuantos pueden jugar con esa plantilla: 8 (RF-605), o 2 en el Truco. */
export function maximoDeJugadores(plantillaId: string | null): number {
  return plantillaId === PLANTILLA_TRUCO ? EQUIPOS_DEL_TRUCO : MAXIMO_JUGADORES;
}

/** Lo que le puede faltar al armado para empezar (cambio 95), en el orden del sheet. */
export type Faltante = 'nombre' | 'plantilla' | 'pocos' | 'demasiados';

/**
 * RF-604: para empezar hace falta un nombre, una plantilla elegida y entre 2 y
 * `maximo` jugadores. El nombre es obligatorio desde el paso 7.1 (registro,
 * cambio 71). Devuelve lo que falta: vacio, se puede empezar.
 */
export function faltantesParaEmpezar(
  nombre: string,
  hayPlantilla: boolean,
  jugadores: number,
  maximo: number = MAXIMO_JUGADORES,
): Faltante[] {
  const faltantes: Faltante[] = [];
  if (nombreDePartida(nombre) === null) faltantes.push('nombre');
  if (!hayPlantilla) faltantes.push('plantilla');
  if (jugadores < MINIMO_JUGADORES) faltantes.push('pocos');
  if (jugadores > maximo) faltantes.push('demasiados');
  return faltantes;
}

export function puedeEmpezar(
  nombre: string,
  hayPlantilla: boolean,
  jugadores: number,
  maximo: number = MAXIMO_JUGADORES,
): boolean {
  return faltantesParaEmpezar(nombre, hayPlantilla, jugadores, maximo).length === 0;
}

export type ErrorNombre = 'vacio' | 'largo' | 'repetido';

/**
 * null si el nombre sirve. Los espacios de los costados no cuentan, y «Ana» choca
 * con «ana»: en la mesa son la misma persona.
 *
 * @param ocupados los nombres con los que no puede chocar, sin el que se esta
 *   editando (si no, un participante chocaria consigo mismo). En el armado son
 *   los otros jugadores de la partida.
 */
export function validarNombre(nombre: string, ocupados: string[]): ErrorNombre | null {
  const limpio = normalizarNombre(nombre);
  if (limpio.length === 0) return 'vacio';
  // Array.from cuenta caracteres reales: un emoji o una «ñ» compuesta es uno solo.
  if (Array.from(limpio).length > LARGO_MAXIMO_NOMBRE) return 'largo';

  const clave = limpio.toLocaleLowerCase('es');
  if (ocupados.some((otro) => normalizarNombre(otro).toLocaleLowerCase('es') === clave)) return 'repetido';

  return null;
}

/** Lo que se guarda: sin espacios en los costados ni repetidos en el medio. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ');
}
