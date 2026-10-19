import {
  aplicarManoDeCanasta,
  MANO_VACIA,
  manoDesdeMarcas,
  marcasDeMano,
  minimoParaBajar,
  REGLA_BAJADAS,
  REGLA_CIERRE,
  totalDeMano,
  type ManoDeCanasta,
} from '../canasta';
import type { RondaJugada } from '../types';

const mano = (cambios: Partial<ManoDeCanasta>): ManoDeCanasta => ({ ...MANO_VACIA, ...cambios });

describe('totalDeMano', () => {
  it('suma canastas, treses, cierre y cartas, y resta las de la mano', () => {
    expect(totalDeMano(mano({ limpias: 2, sucias: 1, treses: 1, cierre: 'si', bajadas: 185, enMano: 20 }))).toBe(1665);
  });

  it('los cuatro treses rojos valen 800', () => {
    expect(totalDeMano(mano({ limpias: 1, treses: 4 }))).toBe(1300);
  });

  it('cerrar vale 100', () => {
    expect(totalDeMano(mano({ cierre: 'si' }))).toBe(100);
  });

  it('los treses negros restan 100 cada uno', () => {
    expect(totalDeMano(mano({ limpias: 1, negros: 2 }))).toBe(300);
  });

  it('sin canastas, los treses rojos restan', () => {
    expect(totalDeMano(mano({ treses: 2 }))).toBe(-200);
    expect(totalDeMano(mano({ treses: 4 }))).toBe(-800);
    expect(totalDeMano(mano({ treses: 2, sucias: 1 }))).toBe(500);
  });

  it('puede dar negativo', () => {
    expect(totalDeMano(mano({ bajadas: 30, enMano: 75 }))).toBe(-45);
  });
});

describe('marcasDeMano y manoDesdeMarcas', () => {
  it('los conceptos en 0 no son marca', () => {
    expect(marcasDeMano(MANO_VACIA)).toEqual({});
  });

  it('la calculadora se vuelve a armar igual desde las marcas', () => {
    for (const original of [
      mano({ limpias: 2, sucias: 1, treses: 1, cierre: 'si', bajadas: 185, enMano: 20 }),
      mano({ treses: 4, cierre: 'si' }),
      mano({ treses: 3, negros: 2, sucias: 1 }),
      mano({ treses: 2 }),
      MANO_VACIA,
    ]) {
      expect(manoDesdeMarcas(marcasDeMano(original))).toEqual(original);
    }
  });
});

describe('aplicarManoDeCanasta', () => {
  const ronda: RondaJugada = {
    numero: 1,
    estado: 'en_curso',
    entradas: [
      { participanteId: 'a', puntosManuales: 0, marcas: { [REGLA_CIERRE]: 100 } },
      { participanteId: 'b', puntosManuales: null, marcas: {} },
    ],
  };

  it('deja el manual en 0, asi cuenta como cargado', () => {
    const nueva = aplicarManoDeCanasta(ronda, 'b', mano({ bajadas: 50 }));
    expect(nueva.entradas[1]).toEqual({ participanteId: 'b', puntosManuales: 0, marcas: { [REGLA_BAJADAS]: 50 } });
  });

  it('cierra uno solo: al que tenia el cierre se le saca', () => {
    const nueva = aplicarManoDeCanasta(ronda, 'b', mano({ cierre: 'si' }));
    expect(REGLA_CIERRE in nueva.entradas[0]!.marcas).toBe(false);
    expect(nueva.entradas[1]!.marcas[REGLA_CIERRE]).toBe(100);
  });

  it('sin cerrar, el cierre del otro queda', () => {
    const nueva = aplicarManoDeCanasta(ronda, 'b', mano({ bajadas: 10 }));
    expect(nueva.entradas[0]!.marcas[REGLA_CIERRE]).toBe(100);
  });
});

describe('minimoParaBajar', () => {
  it('sube con el puntaje', () => {
    expect(minimoParaBajar(-20)).toBe(15);
    expect(minimoParaBajar(0)).toBe(50);
    expect(minimoParaBajar(1495)).toBe(50);
    expect(minimoParaBajar(1500)).toBe(90);
    expect(minimoParaBajar(3000)).toBe(120);
  });
});
