/**
 * Ranking y empates (C-3, RF-801, RF-804).
 */

import { totalesDePartida, totalHastaRonda } from './scoring';
import type { CriterioVictoria, Participante, Partida } from './types';

export interface Puesto {
  posicion: number;          // 1, 1, 3 en caso de empate
  participanteId: string;
  total: number;
}

/**
 * Ordena a los participantes segun el criterio de victoria de la plantilla
 * congelada y les asigna posicion.
 *
 * Los empates comparten posicion y saltean las siguientes (RF-804): dos
 * primeros dan `1, 1, 3`, no `1, 1, 2`.
 *
 * El orden entre empatados es el de `partida.participantes`, porque `sort` es
 * estable: dos podios de la misma partida se ven siempre igual.
 */
export function rankear(partida: Partida): Puesto[] {
  const { criterioVictoria } = partida.plantilla;

  const ordenados = [...totalesDePartida(partida)].sort(
    (a, b) => compararTotales(criterioVictoria, a.total, b.total),
  );

  const puestos: Puesto[] = [];
  for (const [indice, { participanteId, total }] of ordenados.entries()) {
    const anterior = puestos[indice - 1];
    const empataConElAnterior = anterior !== undefined && anterior.total === total;

    puestos.push({
      posicion: empataConElAnterior ? anterior.posicion : indice + 1,
      participanteId,
      total,
    });
  }

  return puestos;
}

/**
 * Los participantes de la ronda en juego, de quien va ganando a quien va
 * perdiendo segun el acumulado hasta esa ronda (cambio 91). Como en `rankear`,
 * los empatados quedan en el orden de `partida.participantes`.
 */
export function ordenarPorTotalHastaRonda(partida: Partida, numeroRonda: number): Participante[] {
  const { criterioVictoria } = partida.plantilla;
  return partida.participantes
    .map((participante) => ({ participante, total: totalHastaRonda(partida, participante.id, numeroRonda) }))
    .sort((a, b) => compararTotales(criterioVictoria, a.total, b.total))
    .map(({ participante }) => participante);
}

/** Negativo si `a` va adelante de `b`. */
function compararTotales(criterio: CriterioVictoria, a: number, b: number): number {
  return criterio === 'menor' ? a - b : b - a;
}
