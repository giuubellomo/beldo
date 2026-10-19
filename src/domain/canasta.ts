/**
 * La Canasta (cambio 101). TypeScript puro.
 *
 * Cada mano se carga con una calculadora: cierre, canastas limpias y sucias,
 * treses rojos y negros, puntos de las cartas bajadas y de las que quedaron en
 * la mano.
 * Se guarda como marcas de reglas fijas de la plantilla, cada una con los puntos
 * de ese concepto (C-4 deja guardar cualquier valor), y el puntaje manual en 0.
 * Asi el total de la mano sale del calculo de siempre, puede dar negativo, y la
 * calculadora se vuelve a armar desde las marcas para corregir.
 *
 * Se reconoce por el id fijo de la predefinida, como el Truco: una copia se
 * anota con el popup comun.
 */
import type { Partida, RondaJugada } from './types';

export const PLANTILLA_CANASTA = '03fac88a-ed58-47bb-95d8-0b758825d952';

/** Las reglas de la predefinida, una por concepto de la mano. Ids fijos. */
export const REGLA_LIMPIAS = '3c6f8f41-86ee-4055-8c03-7e53a4008363';
export const REGLA_SUCIAS = '02934b9a-6818-4598-9018-a8f534c7cfb1';
export const REGLA_TRESES = '62a7359c-72c5-41ff-a84c-4a3c2fde4644';
/** Cambio 102. La migracion 7 la suma a la Canasta que ya estaba guardada. */
export const REGLA_NEGROS = 'fe4ea74f-29e8-4c87-bfe9-7528a9f4c732';
export const REGLA_CIERRE = '9c6153a6-d07f-489d-b670-84319c2e8d3e';
export const REGLA_BAJADAS = 'f3c7e894-0378-4df4-b477-5499f1958931';
export const REGLA_EN_MANO = '2a5c33ce-66a5-4286-8ee5-7207a987bd61';

export const PUNTOS_LIMPIA = 500;
export const PUNTOS_SUCIA = 300;
export const PUNTOS_TRES_ROJO = 100;
/** Los cuatro treses rojos valen el doble: 800 y no 400. */
export const PUNTOS_CUATRO_TRESES = 800;
export const MAXIMO_TRESES = 4;
/** Cada tres negro resta (cambio 102). */
export const PUNTOS_TRES_NEGRO = -100;
export const PUNTOS_CIERRE = 100;

/** Cerro o no: sin cierre de mano (cambio 103). */
export type Cierre = 'no' | 'si';

/** Lo que carga la calculadora para un participante en una mano. Todo positivo. */
export interface ManoDeCanasta {
  cierre: Cierre;
  limpias: number;
  sucias: number;
  /** Treses rojos. */
  treses: number;
  /** Treses negros: restan. */
  negros: number;
  /** Lo que suman las cartas bajadas, sin las canastas. */
  bajadas: number;
  /** Lo que suman las cartas que quedaron en la mano: se resta. */
  enMano: number;
}

export const MANO_VACIA: ManoDeCanasta = {
  cierre: 'no',
  limpias: 0,
  sucias: 0,
  treses: 0,
  negros: 0,
  bajadas: 0,
  enMano: 0,
};

export function esCanasta(plantilla: { id: string }): boolean {
  return plantilla.id === PLANTILLA_CANASTA;
}

/**
 * Los treses rojos. Sin ninguna canasta, limpia o sucia, restan lo mismo que
 * habrian sumado (cambio 102).
 */
export function puntosDeTreses(treses: number, hizoCanasta: boolean): number {
  const valor = treses >= MAXIMO_TRESES ? PUNTOS_CUATRO_TRESES : treses * PUNTOS_TRES_ROJO;
  return hizoCanasta ? valor : -valor;
}

export function hizoCanasta(mano: ManoDeCanasta): boolean {
  return mano.limpias + mano.sucias > 0;
}

export function puntosDeCierre(cierre: Cierre): number {
  return cierre === 'si' ? PUNTOS_CIERRE : 0;
}

/** Los puntos de cada concepto, por id de regla. Los que dan 0 no van: no son marca. */
export function marcasDeMano(mano: ManoDeCanasta): Record<string, number> {
  const puntos: Array<[string, number]> = [
    [REGLA_LIMPIAS, mano.limpias * PUNTOS_LIMPIA],
    [REGLA_SUCIAS, mano.sucias * PUNTOS_SUCIA],
    [REGLA_TRESES, puntosDeTreses(mano.treses, hizoCanasta(mano))],
    [REGLA_NEGROS, mano.negros * PUNTOS_TRES_NEGRO],
    [REGLA_CIERRE, puntosDeCierre(mano.cierre)],
    [REGLA_BAJADAS, mano.bajadas],
    [REGLA_EN_MANO, -mano.enMano],
  ];
  return Object.fromEntries(puntos.filter(([, valor]) => valor !== 0));
}

export function totalDeMano(mano: ManoDeCanasta): number {
  return Object.values(marcasDeMano(mano)).reduce((total, valor) => total + valor, 0);
}

/** La calculadora como quedo guardada, para corregir una mano. */
export function manoDesdeMarcas(marcas: Record<string, number>): ManoDeCanasta {
  // Sin canastas los treses rojos restan: la cantidad sale del valor sin signo.
  const treses = Math.abs(marcas[REGLA_TRESES] ?? 0);
  const cierre = marcas[REGLA_CIERRE] ?? 0;
  return {
    cierre: cierre > 0 ? 'si' : 'no',
    limpias: Math.round((marcas[REGLA_LIMPIAS] ?? 0) / PUNTOS_LIMPIA),
    sucias: Math.round((marcas[REGLA_SUCIAS] ?? 0) / PUNTOS_SUCIA),
    treses: treses === PUNTOS_CUATRO_TRESES ? MAXIMO_TRESES : Math.round(treses / PUNTOS_TRES_ROJO),
    // Sin signo: dividir 0 por un negativo daria -0.
    negros: Math.round(Math.abs(marcas[REGLA_NEGROS] ?? 0) / Math.abs(PUNTOS_TRES_NEGRO)),
    bajadas: marcas[REGLA_BAJADAS] ?? 0,
    // 0 - x y no -x: sin cartas en la mano da 0 y no -0.
    enMano: 0 - (marcas[REGLA_EN_MANO] ?? 0),
  };
}

/**
 * La ronda con la mano de un participante: puntaje manual en 0 (asi cuenta como
 * cargado) y sus marcas reemplazadas por las de la mano. Cierra uno solo por
 * mano: si este cerro, al que tenia el cierre se le saca.
 */
export function aplicarManoDeCanasta(ronda: RondaJugada, participanteId: string, mano: ManoDeCanasta): RondaJugada {
  const marcas = marcasDeMano(mano);
  const entradas = ronda.entradas.map((entrada) => {
    if (entrada.participanteId === participanteId) return { ...entrada, puntosManuales: 0, marcas };
    if (mano.cierre === 'no' || !(REGLA_CIERRE in entrada.marcas)) return entrada;
    const { [REGLA_CIERRE]: _sacado, ...resto } = entrada.marcas;
    return { ...entrada, marcas: resto };
  });
  const yaEstaba = ronda.entradas.some((entrada) => entrada.participanteId === participanteId);
  return { ...ronda, entradas: yaEstaba ? entradas : [...entradas, { participanteId, puntosManuales: 0, marcas }] };
}

/** Quienes mas cerraron en esa ronda, para avisar que se les saca. */
export function otrosQueCerraron(ronda: RondaJugada, partida: Partida, participanteId: string): string[] {
  return ronda.entradas
    .filter((entrada) => entrada.participanteId !== participanteId && REGLA_CIERRE in entrada.marcas)
    .map((entrada) => partida.participantes.find((p) => p.id === entrada.participanteId)?.nombre ?? '');
}

/** Lo minimo que tiene que sumar la primera bajada, segun el total que se lleva. */
export function minimoParaBajar(total: number): number {
  if (total < 0) return 15;
  if (total < 1500) return 50;
  if (total < 3000) return 90;
  return 120;
}
