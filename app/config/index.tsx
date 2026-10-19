import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { colores, espacios, tipografia } from '@/theme/tokens';

/**
 * Configuracion (paso 9.1, cambio 82). Sin perfil ni participantes que
 * administrar: «Cómo se usa», que abre el instructivo (cambio 96), y la version
 * y DeBello abajo. El selector de tema claro/oscuro va aca cuando llegue la fase 2.
 */
export default function PantallaDeConfiguracion() {
  const router = useRouter();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView edges={['bottom']} style={styles.pantalla}>
      <View style={styles.opciones}>
        <Card onPress={() => router.push('/instructivo')} etiqueta={es.config.comoSeUsa} style={styles.opcion}>
          <Text style={styles.textoOpcion}>{es.config.comoSeUsa}</Text>
          <Text style={styles.flecha}>{iconos.adelante}</Text>
        </Card>
      </View>
      <View style={styles.pie}>
        {version !== undefined && <Text style={styles.version}>{es.config.version(version)}</Text>}
        <Text style={styles.empresa}>{es.config.empresa}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, justifyContent: 'space-between' },
  opciones: { padding: espacios.xl },
  opcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoOpcion: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  flecha: { ...tipografia.subtitulo, color: colores.grisMedio },
  pie: { alignItems: 'center', gap: espacios.xxs, padding: espacios.xl },
  version: { ...tipografia.chico, color: colores.grisOscuro },
  empresa: { ...tipografia.cuerpoFuerte, color: colores.tinta },
});
