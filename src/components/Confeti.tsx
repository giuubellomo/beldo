import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { crearEstilos, useTema } from '@/theme/tema';

const CANTIDAD = 150;
/** Larga: el confeti cae lento mientras aparecen los demas (cambio 105). */
const DURACION = 5000;
/** La parte de la duracion en que sale disparado; el resto es la caida. */
const EXPLOSION = 0.08;

interface Particula {
  /** Hacia donde sale y cuanto sube antes de caer. */
  dx: number;
  subida: number;
  caida: number;
  giro: number;
  ancho: number;
  alto: number;
  /** Cual de los colores de los participantes: el confeti es de la paleta activa. */
  tono: number;
  /** Algunas salen un poco despues: la explosion no es un solo golpe. */
  demora: number;
}

interface Props {
  /** Cuando pasa a true, explota una vez. */
  activo: boolean;
}

/**
 * Una explosion de papelitos desde el centro de donde se pone (cambio 105): el
 * nombre del ganador en el podio. Cada papelito sale hacia arriba y a un costado,
 * gira y cae lento mientras se desvanece. Todo con transform y opacidad, en el driver
 * nativo: no lo calcula JavaScript cuadro por cuadro.
 *
 * Es decoracion: el lector de pantalla no lo ve y no se puede tocar.
 */
export function Confeti({ activo }: Props) {
  const styles = useEstilos();
  // Los colores de los participantes: en las paletas de un tono son la tinta y los
  // grises, y en las de varios colores, el confeti sale de colores (cambio 109).
  const { coloresDeParticipantes: tonos } = useTema();
  const progreso = useRef(new Animated.Value(0)).current;
  const particulas = useMemo<Particula[]>(
    () =>
      Array.from({ length: CANTIDAD }, (_, i) => {
        const angulo = (i / CANTIDAD) * Math.PI * 2;
        const fuerza = 70 + Math.random() * 110;
        return {
          dx: Math.cos(angulo) * fuerza,
          subida: -(60 + Math.random() * 140),
          caida: 300 + Math.random() * 350,
          giro: (Math.random() - 0.5) * 1440,
          ancho: 5 + Math.random() * 4,
          alto: 8 + Math.random() * 6,
          tono: i,
          demora: Math.random() * 0.05,
        };
      }),
    [],
  );

  useEffect(() => {
    if (!activo) return;
    progreso.setValue(0);
    Animated.timing(progreso, {
      toValue: 1,
      duration: DURACION,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activo, progreso]);

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.origen}>
      {particulas.map((p, i) => {
        const inicio = p.demora;
        // Sale disparado, frena arriba y cae lento: tres tramos en vez de una sola curva.
        const translateY = progreso.interpolate({
          inputRange: [0, inicio, inicio + EXPLOSION, 1],
          outputRange: [0, 0, p.subida, p.caida],
          extrapolate: 'clamp',
        });
        // Hacia el costado sigue de a poco mientras cae, sin cambios de direccion
        // (cambio 108: un vaiven igual para todos se veia como un sacudon).
        const translateX = progreso.interpolate({
          inputRange: [0, inicio, inicio + EXPLOSION, 1],
          outputRange: [0, 0, p.dx, p.dx * 1.35],
          extrapolate: 'clamp',
        });
        const rotate = progreso.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giro}deg`] });
        const opacity = progreso.interpolate({
          inputRange: [0, inicio, inicio + 0.01, 0.8, 1],
          outputRange: [0, 0, 1, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.papelito,
              { width: p.ancho, height: p.alto, backgroundColor: tonos[p.tono % tonos.length], opacity },
              { transform: [{ translateX }, { translateY }, { rotate }] },
            ]}
          />
        );
      })}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  // Un punto sin tamaño: los papelitos salen de ahi.
  origen: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, overflow: 'visible' },
  papelito: { position: 'absolute', borderRadius: 1.5 },
}));
