/**
 * El puntaje objetivo de una partida (cambio 92). TypeScript puro.
 *
 * Llegar es que el total, sin mirar el signo, alcance el objetivo: en una
 * plantilla que resta, los totales bajan y se llega igual. Llegar no dice quien
 * gana: eso lo decide `criterioVictoria` en el podio (`rankear`). Con «menor»,
 * el que llega corta la partida y gana el mas bajo, como en Corazones.
 */
import { aplicarCarga } from './rondas';
import { totalDeParticipante } from './scoring';
import type { Partida } from './types';

/** Con lo que arranca el objetivo al activarlo en el editor. */
export const OBJETIVO_POR_DEFECTO = 100;
export const MAXIMO_OBJETIVO = 9999;
/** De a cuanto van los botones del stepper; el numero ademas se escribe. */
export const PASO_OBJETIVO = 10;

/** Los ids de quienes ya llegaron, en el orden de la partida. Sin objetivo, ninguno. */
export function llegaronAlObjetivo(partida: Partida): string[] {
  const objetivo = partida.plantilla.puntajeObjetivo;
  if (objetivo === undefined) return [];
  return partida.participantes
    .filter((participante) => Math.abs(totalDeParticipante(partida, participante.id)) >= objetivo)
    .map((participante) => participante.id);
}

/**
 * Quienes llegarian recien con esa carga del popup: los que llegan despues y
 * no habian llegado antes. Es lo que dispara el aviso al guardar. Si ya habia
 * llegado y se siguio jugando, no se vuelve a avisar por el mismo.
 */
export function nuevosEnElObjetivo(
  partida: Partida,
  numeroRonda: number,
  participanteId: string,
  puntosManuales: number,
  reglasMarcadas: string[],
): string[] {
  const antes = new Set(llegaronAlObjetivo(partida));
  const despues: Partida = {
    ...partida,
    rondas: partida.rondas.map((ronda) =>
      ronda.numero === numeroRonda
        ? aplicarCarga(ronda, partida.plantilla, participanteId, puntosManuales, reglasMarcadas)
        : ronda,
    ),
  };
  return llegaronAlObjetivo(despues).filter((id) => !antes.has(id));
}
