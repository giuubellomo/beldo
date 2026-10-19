import { llegaronAlObjetivo, nuevosEnElObjetivo } from '../objetivo';
import type { ModoPuntos, Partida } from '../types';

/** Dos rondas en Simple: la 1 cerrada con `primera`, la 2 en curso vacia. */
function partida(primera: Record<string, number>, puntajeObjetivo?: number, modoPuntos: ModoPuntos = 'suma'): Partida {
  const ids = Object.keys(primera);
  return {
    id: 'g1',
    nombre: 'Prueba',
    estado: 'en_curso',
    plantilla: {
      id: 'p1',
      nombre: 'Simple',
      icono: 'numeral',
      modoPuntos,
      criterioVictoria: 'mayor',
      rondasIlimitadas: true,
      ...(puntajeObjetivo !== undefined && { puntajeObjetivo }),
      reglas: [],
      rondas: [],
    },
    participantes: ids.map((id) => ({ id, nombre: id, avatarTipo: 'color', avatarValor: '#000000' })),
    rondas: [
      {
        numero: 1,
        estado: 'cerrada',
        entradas: ids.map((id) => ({ participanteId: id, puntosManuales: primera[id] as number, marcas: {} })),
      },
      { numero: 2, estado: 'en_curso', entradas: [] },
    ],
  };
}

describe('llegaronAlObjetivo', () => {
  it('sin objetivo no llega nadie', () => {
    expect(llegaronAlObjetivo(partida({ a: 900, b: 10 }))).toEqual([]);
  });

  it('llega quien alcanza o pasa el objetivo', () => {
    expect(llegaronAlObjetivo(partida({ a: 30, b: 29, c: 45 }, 30))).toEqual(['a', 'c']);
  });

  it('en una plantilla que resta, se llega bajando', () => {
    expect(llegaronAlObjetivo(partida({ a: 100, b: 40 }, 100, 'resta'))).toEqual(['a']);
  });
});

describe('nuevosEnElObjetivo', () => {
  it('avisa por quien llega con esta carga', () => {
    expect(nuevosEnElObjetivo(partida({ a: 25, b: 10 }, 30), 2, 'a', 5, [])).toEqual(['a']);
  });

  it('no avisa si no llega', () => {
    expect(nuevosEnElObjetivo(partida({ a: 25, b: 10 }, 30), 2, 'a', 4, [])).toEqual([]);
  });

  it('no vuelve a avisar por quien ya habia llegado', () => {
    expect(nuevosEnElObjetivo(partida({ a: 30, b: 10 }, 30), 2, 'a', 3, [])).toEqual([]);
  });

  it('sin objetivo no avisa nunca', () => {
    expect(nuevosEnElObjetivo(partida({ a: 25, b: 10 }), 2, 'a', 500, [])).toEqual([]);
  });
});
