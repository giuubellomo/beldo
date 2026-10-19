import { colorDeAvatar, indiceDeAvatar, PALETAS, paletaPorId, valorDeAvatar } from '@/theme/paletas';

describe('paletas (cambio 109)', () => {
  it('todas tienen los seis colores en claro y oscuro, y al menos cuatro para participantes', () => {
    for (const paleta of PALETAS) {
      for (const modo of ['claro', 'oscuro'] as const) {
        expect(Object.values(paleta[modo]).every((color) => color.length > 0)).toBe(true);
        expect(paleta.participantes[modo].length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('en las de varios colores, los participantes no usan los colores de textos y lineas', () => {
    for (const id of ['pasteles', 'basicos', 'neon']) {
      const paleta = paletaPorId(id);
      for (const modo of ['claro', 'oscuro'] as const) {
        const deLaPantalla = Object.values(paleta[modo]);
        expect(paleta.participantes[modo].some((color) => deLaPantalla.includes(color))).toBe(false);
      }
    }
  });

  it('un id desconocido cae en la monocroma', () => {
    expect(paletaPorId('no-existe').id).toBe('monocromo');
  });
});

describe('color de un avatar', () => {
  const cuatro = ['#A', '#B', '#C', '#D'];

  it('se guarda el numero y se pinta con la paleta activa', () => {
    expect(colorDeAvatar(valorDeAvatar(2), cuatro)).toBe('#C');
  });

  it('los guardados antes con el hex de la monocroma se reconocen por su lugar', () => {
    expect(indiceDeAvatar('#636366')).toBe(1);
    expect(colorDeAvatar('#636366', cuatro)).toBe('#B');
  });

  it('si la paleta tiene menos colores, da la vuelta', () => {
    expect(colorDeAvatar(valorDeAvatar(4), cuatro)).toBe('#A');
  });

  it('un color suelto se pinta tal cual', () => {
    expect(colorDeAvatar('#123456', cuatro)).toBe('#123456');
  });
});
