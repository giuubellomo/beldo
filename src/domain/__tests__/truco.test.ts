import { cuadrados, malasYBuenas, puntosDeMalas, sumarAlPuntaje } from '../truco';

describe('puntosDeMalas', () => {
  it('es la mitad del objetivo', () => {
    expect(puntosDeMalas(30)).toBe(15);
    expect(puntosDeMalas(40)).toBe(20);
  });

  it('con objetivo impar, las malas se llevan el de mas', () => {
    expect(puntosDeMalas(25)).toBe(13);
  });

  it('sin objetivo no hay division', () => {
    expect(puntosDeMalas(undefined)).toBeNull();
  });
});

describe('malasYBuenas', () => {
  it('hasta la mitad todo es malas', () => {
    expect(malasYBuenas(12, 30)).toEqual({ malas: 12, buenas: 0 });
  });

  it('despues de la mitad sigue en buenas, aunque pase el objetivo', () => {
    expect(malasYBuenas(18, 30)).toEqual({ malas: 15, buenas: 3 });
    expect(malasYBuenas(33, 30)).toEqual({ malas: 15, buenas: 18 });
  });

  it('sin objetivo todo va en malas', () => {
    expect(malasYBuenas(40, undefined)).toEqual({ malas: 40, buenas: 0 });
  });
});

describe('cuadrados', () => {
  it('de a cinco, con el ultimo a medias', () => {
    expect(cuadrados(13)).toEqual([5, 5, 3]);
    expect(cuadrados(15)).toEqual([5, 5, 5]);
    expect(cuadrados(0)).toEqual([]);
  });
});

describe('sumarAlPuntaje', () => {
  it('suma y resta, sin bajar de 0', () => {
    expect(sumarAlPuntaje(null, 3)).toBe(3);
    expect(sumarAlPuntaje(4, -1)).toBe(3);
    expect(sumarAlPuntaje(0, -1)).toBe(0);
  });
});
