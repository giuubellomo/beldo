import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { PaginasDeRondas } from '@/components/PaginasDeRondas';
import { Popup } from '@/components/Popup';
import { PopupDeCanasta } from '@/components/PopupDeCanasta';
import { PopupDeCarga } from '@/components/PopupDeCarga';
import { TableroDeTruco } from '@/components/TableroDeTruco';
import { esCanasta } from '@/domain/canasta';
import { rondaEnCursoIncompleta } from '@/domain/rondas';
import { esTruco } from '@/domain/truco';
import type { Partida, RondaJugada } from '@/domain/types';
import { usePartida } from '@/hooks/usePartida';
import { es } from '@/i18n/es';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

/**
 * Partida en curso (paso 7.1, RF-701, RF-702, RF-712): encabezado con el nombre,
 * que se elige al armarla y aca no se edita (registro, cambio 71), las rondas y
 * TERMINAR PARTIDA fijo abajo. Todo sale de la base via `usePartida`: salir y
 * volver deja todo igual. Tocar a un participante abre el popup de carga (7.4)
 * y SIGUIENTE cierra la ronda en juego (7.5). Las rondas van una por pantalla
 * (cambio 100): una cerrada se corrige con el mismo popup (7.6). TERMINAR pide
 * confirmacion y finaliza la partida (8.1).
 */
export default function PantallaDePartida() {
  const styles = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida, mutar } = usePartida(id);
  // A quien se le esta cargando. Se guarda aparte de `abierta` para que el popup
  // no se vacie mientras se desvanece al cerrarse.
  const [carga, setCarga] = useState<{ numeroRonda: number; participanteId: string } | null>(null);
  const [cargaAbierta, setCargaAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [errorAlTerminar, setErrorAlTerminar] = useState(false);

  // RF-713: en la mesa nadie toca el telefono por un rato y la pantalla no se apaga.
  useKeepAwake();

  if (partida === null) return null;

  // RF-711: la partida ya no aparece en el Home. Replace: desde el podio, atras
  // es el Home y no una partida finalizada.
  const irAlPodio = () => router.replace({ pathname: '/partida/[id]/final', params: { id: partida.id } });

  const terminar = async () => {
    try {
      await mutar(() => partidas.finalizar(partida.id));
    } catch {
      setErrorAlTerminar(true);
      return;
    }
    setConfirmando(false);
    irAlPodio();
  };

  // El aviso de objetivo (cambio 92), sin la confirmacion de TERMINAR: ya es una.
  const terminarDesdeElAviso = async () => {
    await mutar(() => partidas.finalizar(partida.id));
    setCargaAbierta(false);
    irAlPodio();
  };

  const objetivo = partida.plantilla.puntajeObjetivo;

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.encabezado}>
        <BotonIcono icono={iconos.atras} etiqueta={es.comun.volver} tamano={36} onPress={() => router.back()} />
        <View style={styles.textosEncabezado}>
          <Text accessibilityRole="header" style={styles.titulo}>
            {partida.nombre}
          </Text>
          {objetivo !== undefined && <Text style={styles.hasta}>{es.partida.hasta(objetivo)}</Text>}
        </View>
      </View>

      {/* Cambio 93: el Truco se anota de a palitos, sin rondas. */}
      {esTruco(partida.plantilla) ? (
        <TableroDeTruco
          partida={partida}
          onSumar={(participanteId, delta) => mutar(() => partidas.sumarPalitos(partida.id, participanteId, delta))}
          onFinalizar={() => mutar(() => partidas.finalizar(partida.id))}
          onIrAlPodio={irAlPodio}
        />
      ) : (
        // Cambio 100: una ronda por pantalla, y SIGUIENTE desliza a la nueva.
        <PaginasDeRondas
          partida={partida}
          rondas={rondasAMostrar(partida)}
          onTocarParticipante={(numeroRonda, participanteId) => {
            setCarga({ numeroRonda, participanteId });
            setCargaAbierta(true);
          }}
          onSiguiente={(numeroRonda) => mutar(() => partidas.cerrarRonda(partida.id, numeroRonda))}
        />
      )}

      <View style={styles.pie}>
        <Boton
          titulo={es.partida.terminarPartida}
          variante="secundario"
          onPress={() => {
            setErrorAlTerminar(false);
            setConfirmando(true);
          }}
        />
      </View>

      {/* RF-710: confirmacion, con aviso si la ronda en curso no se podia cerrar. */}
      <Popup
        visible={confirmando}
        onCerrar={() => setConfirmando(false)}
        etiquetaCerrar={es.comun.cerrar}
        titulo={es.finalizar.confirmarTitulo}
      >
        {!esTruco(partida.plantilla) && rondaEnCursoIncompleta(partida) && <Text style={styles.textoPopup}>{es.finalizar.rondaIncompleta}</Text>}
        {errorAlTerminar && <Text style={styles.textoPopup}>{es.comun.errorGuardar}</Text>}
        <View style={styles.botonesPopup}>
          <View style={styles.boton}>
            <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmando(false)} />
          </View>
          <View style={styles.boton}>
            <Boton titulo={es.comun.terminar} onPress={() => void terminar()} />
          </View>
        </View>
      </Popup>

      {/* Cambio 101: la Canasta carga cada mano con su calculadora. */}
      {esCanasta(partida.plantilla) ? (
        <PopupDeCanasta
          visible={cargaAbierta}
          partida={partida}
          numeroRonda={carga?.numeroRonda ?? 0}
          participanteId={carga?.participanteId ?? null}
          onCerrar={() => setCargaAbierta(false)}
          onGuardar={(mano) =>
            mutar(() => partidas.guardarManoDeCanasta(partida.id, carga!.numeroRonda, carga!.participanteId, mano))
          }
          onTerminar={terminarDesdeElAviso}
        />
      ) : (
        <PopupDeCarga
          visible={cargaAbierta}
          partida={partida}
          numeroRonda={carga?.numeroRonda ?? 0}
          participanteId={carga?.participanteId ?? null}
          onCerrar={() => setCargaAbierta(false)}
          onGuardar={(puntos, reglas) =>
            mutar(() => partidas.guardarCarga(partida.id, carga!.numeroRonda, carga!.participanteId, puntos, reglas))
          }
          onTerminar={terminarDesdeElAviso}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Las rondas de la base, y con rondas ilimitadas una mas bloqueada al final, como
 * dibuja el mockup 5: la siguiente recien se crea al cerrar la actual (7.5).
 */
function rondasAMostrar(partida: Partida): RondaJugada[] {
  const { rondas } = partida;
  const hayEnCurso = rondas.some((ronda) => ronda.estado === 'en_curso');
  if (!partida.plantilla.rondasIlimitadas || !hayEnCurso) return rondas;
  return [...rondas, { numero: rondas.length + 1, estado: 'bloqueada', entradas: [] }];
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.xs,
    paddingBottom: espacios.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  textosEncabezado: { flexShrink: 1 },
  titulo: { ...tipografia.subtitulo, color: colores.tinta },
  hasta: { ...tipografia.secundario, color: colores.grisOscuro },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
  pie: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
}));
