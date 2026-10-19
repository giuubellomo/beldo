import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { es } from '@/i18n/es';
import { colores, espacios, tipografia } from '@/theme/tokens';

import { Boton } from './Boton';

interface Props {
  /** Cierra el aviso y se sigue jugando: por si fue un error de carga. */
  onSeguir: () => void;
  /** Finaliza la partida y va al podio. Si falla, el aviso lo dice. */
  onTerminar: () => Promise<void>;
}

/**
 * El cuerpo del aviso cuando alguien llega al objetivo (cambio 92). Va adentro
 * de un Popup: el del popup de carga, o el del tablero del Truco (cambio 93).
 */
export function AvisoDeObjetivo({ onSeguir, onTerminar }: Props) {
  const [terminando, setTerminando] = useState(false);
  const [errorAlTerminar, setErrorAlTerminar] = useState(false);

  async function terminar() {
    setTerminando(true);
    setErrorAlTerminar(false);
    try {
      // Si sale bien la pantalla se va al podio: no hace falta volver `terminando` a false.
      await onTerminar();
    } catch {
      setErrorAlTerminar(true);
      setTerminando(false);
    }
  }

  return (
    <>
      <Text style={styles.texto}>{es.carga.terminarOSeguir}</Text>
      {errorAlTerminar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
      <View style={styles.botones}>
        <View style={styles.boton}>
          <Boton titulo={es.carga.seguir} variante="secundario" onPress={onSeguir} />
        </View>
        <View style={styles.boton}>
          <Boton titulo={es.comun.terminar} onPress={() => void terminar()} deshabilitado={terminando} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  texto: { ...tipografia.cuerpo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
  botones: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
});
