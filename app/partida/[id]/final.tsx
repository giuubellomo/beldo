import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Boton } from '@/components/Boton';
import { Confeti } from '@/components/Confeti';
import { rankear, type Puesto } from '@/domain/ranking';
import type { Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import { crearEstilos, useTema } from '@/theme/tema';
import { espacios, numerales, radios, tipografia } from '@/theme/tokens';
import { usePartida } from '@/hooks/usePartida';

/** Alto del escalon segun la posicion: con empate, los que comparten puesto quedan a la misma altura. */
const ALTO_ESCALON: Record<number, number> = { 1: 150, 2: 105, 3: 75 };

/**
 * La entrada del podio (cambio 105): la pantalla arranca tapada por un circulo
 * oscuro (cambio 108: desde el primer cuadro) que se va cerrando sobre el 1
 * mientras suben los escalones. Cuando queda chiquito aparece el ganador y
 * explota el confeti. Mientras cae, aparecen los demas de a uno, en orden de
 * puesto, y al final el boton.
 */
const SUBIDA_ESCALON = 450;
const ENTRE_ESCALONES = 120;
/** Lo que se queda tapada la pantalla antes de que el circulo empiece a cerrarse. */
const PAUSA_TAPADA = 300;
/** Cuando empiezan a subir los escalones, ya cerrandose el circulo. */
const ESPERA_ESCALONES = 250;
const CIERRE_REFLECTOR = 1600;
const APAGADO_REFLECTOR = 250;
const PAUSA_ANTES_DEL_RESTO = 600;
const ENTRE_APARICIONES = 450;
const APARICION = 400;

/**
 * Podio (paso 8.2, RF-801 a RF-804, mockup 6). Sale de `rankear()`: los tres
 * primeros del ranking en orden visual 2º–1º–3º y el resto en lista. Con dos
 * participantes no hay escalon vacio (RF-803). Los empatados comparten numero y
 * altura de escalon (RF-804). Sin historial, se ve una sola vez (8.1). Entra
 * animado: escalones, el ganador con confeti, y el resto (cambio 105).
 */
export default function PantallaDePodio() {
  const styles = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida } = usePartida(id);
  const puestos = partida === null ? [] : rankear(partida);
  // Los que aparecen despues del ganador, de a uno y en orden de puesto.
  const siguientes = puestos.filter((puesto) => puesto.posicion !== 1).map((puesto) => puesto.participanteId);
  const animacion = useEntradaDelPodio(partida !== null, siguientes.length);
  const aparicionDe = (participanteId: string) => animacion.apariciones[siguientes.indexOf(participanteId)]!;

  if (partida === null) return null;

  const [primero, segundo, tercero] = puestos;
  // 2º–1º–3º; con dos jugadores, solo 2º–1º.
  const podio = [segundo, primero, tercero].filter((puesto): puesto is Puesto => puesto !== undefined);
  const resto = puestos.slice(3);
  const participante = (puesto: Puesto) => partida.participantes.find((p) => p.id === puesto.participanteId)!;

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>{es.finalizar.partidaTerminada}</Text>
          <Text accessibilityRole="header" style={styles.titulo}>
            {partida.nombre}
          </Text>
        </View>

        <View style={styles.podio}>
          {podio.map((puesto, i) => (
            <Escalon
              key={puesto.participanteId}
              puesto={puesto}
              participante={participante(puesto)}
              escalon={animacion.escalones[i]!}
              persona={puesto.posicion === 1 ? animacion.ganador : aparicionDe(puesto.participanteId)}
              confeti={animacion.confeti && puesto.posicion === 1}
              reflector={puesto.posicion === 1 ? animacion.reflector : undefined}
            />
          ))}
        </View>

        {resto.length > 0 && (
          <Animated.View style={{ opacity: aparicionDe(resto[0]!.participanteId) }}>
            {/* Solo una linea, sin titulo (cambio 106). */}
            <View style={styles.separador} />
            {resto.map((puesto) => (
              <FilaDelResto
                key={puesto.participanteId}
                puesto={puesto}
                participante={participante(puesto)}
                aparicion={aparicionDe(puesto.participanteId)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View style={[styles.pie, { opacity: animacion.pie }]}>
        {/* Se llego con replace desde la partida: atras es el Home. */}
        <Boton titulo={es.finalizar.volverAlInicio} variante="secundario" onPress={() => router.back()} />
      </Animated.View>
    </SafeAreaView>
  );
}

/**
 * Los tiempos de la entrada del podio, cada uno de 0 a 1. Con «Reducir
 * movimiento» activado en el telefono, todo arranca en 1: se ve directo.
 *
 * @param siguientes cuantos aparecen despues del ganador (2º, 3º y el resto)
 */
function useEntradaDelPodio(lista: boolean, siguientes: number) {
  const escalones = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const ganador = useRef(new Animated.Value(0)).current;
  const pie = useRef(new Animated.Value(0)).current;
  // Reflector: `luz` lo prende y lo apaga, `cierre` lo achica de 0 (abierto) a 1 (chiquito).
  // Arranca prendido: la pantalla no se ve ni un cuadro antes que el circulo.
  const luz = useRef(new Animated.Value(1)).current;
  const cierre = useRef(new Animated.Value(0)).current;
  // Uno por cada participante que aparece despues del ganador. Se crean al saber cuantos son.
  const apariciones = useRef<Animated.Value[]>([]).current;
  while (apariciones.length < siguientes) apariciones.push(new Animated.Value(0));
  const [confeti, setConfeti] = useState(false);
  const empezo = useRef(false);

  useEffect(() => {
    if (!lista || empezo.current) return;
    empezo.current = true;
    const nativo = Platform.OS !== 'web';
    let vigente = true;
    const hasta = (valor: Animated.Value, duracion: number, curva = Easing.out(Easing.cubic), destino = 1) =>
      Animated.timing(valor, { toValue: destino, duration: duracion, easing: curva, useNativeDriver: nativo });

    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reducir) => {
        if (!vigente) return;
        if (reducir) {
          [...escalones, ganador, pie, ...apariciones].forEach((valor) => valor.setValue(1));
          luz.setValue(0);
          return;
        }
        Animated.sequence([
          Animated.delay(PAUSA_TAPADA),
          Animated.parallel([
            hasta(cierre, CIERRE_REFLECTOR, Easing.inOut(Easing.cubic)),
            Animated.sequence([
              Animated.delay(ESPERA_ESCALONES),
              Animated.stagger(ENTRE_ESCALONES, escalones.map((valor) => hasta(valor, SUBIDA_ESCALON))),
            ]),
          ]),
        ]).start(() => {
          if (!vigente) return;
          setConfeti(true);
          Animated.parallel([
            hasta(luz, APAGADO_REFLECTOR, Easing.out(Easing.quad), 0),
            Animated.spring(ganador, { toValue: 1, friction: 5, tension: 80, useNativeDriver: nativo }),
          ]).start();
          // Mientras cae el confeti, los demas de a uno, y al final el boton.
          Animated.sequence([
            Animated.delay(PAUSA_ANTES_DEL_RESTO),
            Animated.stagger(ENTRE_APARICIONES, [...apariciones, pie].map((valor) => hasta(valor, APARICION))),
          ]).start();
        });
      });

    return () => {
      vigente = false;
    };
  }, [lista, escalones, ganador, pie, luz, cierre, apariciones]);

  return { escalones, ganador, pie, apariciones, reflector: { luz, cierre }, confeti };
}

interface PropsPuesto {
  puesto: Puesto;
  participante: Participante;
}

interface PropsEscalon extends PropsPuesto {
  /** De 0 a 1: el escalon sube desde abajo. */
  escalon: Animated.Value;
  /** De 0 a 1: aparece quien esta arriba (con rebote si es el ganador). */
  persona: Animated.Value;
  /** El ganador, cuando le toca: explota el confeti desde su nombre. */
  confeti: boolean;
  /** Solo el ganador: el reflector que lo apunta antes de aparecer. */
  reflector?: { luz: Animated.Value; cierre: Animated.Value };
}

/** Avatar, nombre y puntos arriba; el escalon con la posicion abajo. */
function Escalon({ puesto, participante, escalon, persona, confeti, reflector }: PropsEscalon) {
  const estilosEscalon = useEstilosEscalon();
  // En modo oscuro el 1º no va en la tinta, que ahi es casi blanca, sino en el tono
  // oscuro predominante de la paleta (cambio 110).
  const { modo } = useTema();
  const oscuro = modo === 'oscuro';
  const styles = useEstilos();
  const { posicion, total } = puesto;
  const esPrimero = posicion === 1;
  const alto = ALTO_ESCALON[posicion] ?? ALTO_ESCALON[3]!;
  const subida = escalon.interpolate({ inputRange: [0, 1], outputRange: [alto, 0] });
  const aparicion = esPrimero
    ? { opacity: persona, transform: [{ scale: persona.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }
    : { opacity: persona, transform: [{ translateY: persona.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };
  return (
    <View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(posicion)}: ${participante.nombre}, ${es.comun.puntos(total)}`}
      style={[styles.columna, esPrimero && styles.columnaPrimero]}
    >
      {/* El confeti va al lado y no adentro: si no, se achicaria y desvaneceria con el rebote. */}
      <View style={styles.lugarDeLaPersona}>
        {reflector !== undefined && <Reflector {...reflector} />}
        <Animated.View style={[styles.persona, aparicion]}>
          <Avatar
            tipo={participante.avatarTipo}
            valor={participante.avatarValor}
            nombre={participante.nombre}
            tamano={esPrimero ? 60 : 40}
          />
          <Text style={styles.nombre} numberOfLines={1}>
            {participante.nombre}
          </Text>
          <Text style={[styles.puntos, numerales]}>{es.comun.puntos(total)}</Text>
        </Animated.View>
        {esPrimero && <Confeti activo={confeti} />}
      </View>
      <View style={[styles.escalonRecorte, { height: alto }]}>
        <Animated.View
          style={[
            styles.escalon,
            posicion === 1
              ? oscuro
                ? estilosEscalon.primeroOscuro
                : estilosEscalon.primero
              : posicion === 2
                ? oscuro
                  ? estilosEscalon.segundoOscuro
                  : estilosEscalon.segundo
                : oscuro
                  ? estilosEscalon.terceroOscuro
                  : estilosEscalon.tercero,
            { height: alto, opacity: escalon, transform: [{ translateY: subida }] },
          ]}
        >
          <Text style={[styles.numero, esPrimero && !oscuro && styles.numeroPrimero]}>{posicion}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** El circulo del reflector a escala 1, y lo que queda al final: el lugar del ganador. */
const LADO_LUZ = 100;


/**
 * Un circulo centrado en el lugar del ganador (cambio 105, solo el circulo
 * desde el 106, oscuro desde el 107). Arranca tan grande que tapa toda la
 * pantalla, sin dejar ver lo de abajo, y se va cerrando hasta el primer puesto.
 * `luz` lo prende y lo apaga.
 */
function Reflector({ luz, cierre }: { luz: Animated.Value; cierre: Animated.Value }) {
  const { modo } = useTema();
  const styles = useEstilos();
  const { width, height } = useWindowDimensions();
  // Desde el ganador hasta la esquina mas lejana entra con la diagonal entera.
  const enorme = (2 * Math.hypot(width, height)) / LADO_LUZ;
  const escala = cierre.interpolate({ inputRange: [0, 1], outputRange: [enorme, 1] });
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.reflector}>
      <Animated.View
        style={[styles.luz, modo === 'oscuro' && styles.luzOscura, { opacity: luz, transform: [{ scale: escala }] }]}
      />
    </View>
  );
}

interface PropsFila extends PropsPuesto {
  /** De 0 a 1: aparece en su turno, despues del ganador. */
  aparicion: Animated.Value;
}

/** Mockup 6: la posicion en un circulo, avatar, nombre y los puntos a la derecha. */
function FilaDelResto({ puesto, participante, aparicion }: PropsFila) {
  const styles = useEstilos();
  return (
    <Animated.View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(puesto.posicion)}: ${participante.nombre}, ${es.comun.puntos(puesto.total)}`}
      style={[
        styles.fila,
        {
          opacity: aparicion,
          transform: [{ translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <View style={styles.circulo}>
        <Text style={[styles.posicionChica, numerales]}>{puesto.posicion}</Text>
      </View>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <Text style={styles.nombreFila}>{participante.nombre}</Text>
      <Text style={[styles.puntosFila, numerales]}>{es.comun.puntos(puesto.total)}</Text>
    </Animated.View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacios.xl, gap: espacios.xl },
  encabezado: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.md },
  etiqueta: { ...tipografia.etiqueta, color: colores.grisMedio },
  titulo: { ...tipografia.subtitulo, color: colores.tinta, textAlign: 'center' },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: espacios.sm },
  columna: { flex: 1, maxWidth: 110, alignItems: 'center', gap: espacios.xxs },
  // El confeti sale del ganador y tiene que pasar por encima de las otras columnas.
  columnaPrimero: { zIndex: 1 },
  // Por encima del escalon de su columna: el circulo oscuro tiene que tapar tambien el «1» (cambio 108).
  lugarDeLaPersona: { alignSelf: 'stretch', zIndex: 2 },
  // Un punto en el centro del lugar del ganador: el circulo de luz se centra ahi.
  reflector: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, overflow: 'visible' },
  luz: {
    position: 'absolute',
    top: -LADO_LUZ / 2,
    left: -LADO_LUZ / 2,
    width: LADO_LUZ,
    height: LADO_LUZ,
    borderRadius: LADO_LUZ / 2,
    // Tapa del todo lo de abajo hasta que se cierra (cambio 107).
    backgroundColor: colores.tinta,
  },
  // En modo oscuro, el tono oscuro predominante de la paleta y no la tinta casi blanca (cambio 110).
  luzOscura: { backgroundColor: colores.linea },
  persona: { alignItems: 'center', gap: espacios.xxs },
  // El escalon sube desde abajo de la base del podio, sin verse por debajo.
  escalonRecorte: { alignSelf: 'stretch', overflow: 'hidden', justifyContent: 'flex-end' },
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta, marginTop: espacios.xxs },
  puntos: { ...tipografia.chico, color: colores.grisOscuro, marginBottom: espacios.xs },
  escalon: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: espacios.sm,
    borderTopLeftRadius: radios.sm,
    borderTopRightRadius: radios.sm,
  },
  numero: { ...tipografia.subtitulo, color: colores.tinta },
  numeroPrimero: { color: colores.fondo },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: colores.linea, marginBottom: espacios.xs },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicionChica: { ...tipografia.chico, color: colores.grisOscuro },
  nombreFila: { ...tipografia.cuerpoFuerte, color: colores.tinta, flex: 1 },
  puntosFila: { ...tipografia.cuerpoFuerte, color: colores.grisOscuro },
  pie: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
  },
}));

/** 1º en tinta, 2º gris, 3º claro con borde, como el mockup. */
const useEstilosEscalon = crearEstilos((colores) => ({
  primero: { backgroundColor: colores.tinta },
  // Modo oscuro (cambio 110): del tono predominante de la paleta hacia el fondo.
  primeroOscuro: { backgroundColor: colores.linea },
  segundoOscuro: { backgroundColor: colores.superficie },
  terceroOscuro: { backgroundColor: colores.fondo, borderWidth: 1.5, borderBottomWidth: 0, borderColor: colores.linea },
  segundo: { backgroundColor: colores.linea },
  tercero: { backgroundColor: colores.superficie, borderWidth: 1.5, borderBottomWidth: 0, borderColor: colores.linea },
}));
