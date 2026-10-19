import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Etiqueta } from '@/components/Etiqueta';
import { Segmented } from '@/components/Segmented';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { PALETAS, type Paleta } from '@/theme/paletas';
import { crearEstilos, useTema, type ModoElegido } from '@/theme/tema';
import { espacios, radios, tipografia } from '@/theme/tokens';

/**
 * Configuracion (paso 9.1, cambio 82). «Cómo se usa», que abre el instructivo
 * (cambio 96); la apariencia, con el modo y la paleta (cambio 109), que cambian
 * en vivo; y la version y DeBello abajo.
 */
export default function PantallaDeConfiguracion() {
  const styles = useEstilos();
  const router = useRouter();
  const { paleta, modoElegido, cambiarPaleta, cambiarModo } = useTema();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView edges={['bottom']} style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Card onPress={() => router.push('/instructivo')} etiqueta={es.config.comoSeUsa} style={styles.opcion}>
          <Text style={styles.textoOpcion}>{es.config.comoSeUsa}</Text>
          <Text style={styles.flecha}>{iconos.adelante}</Text>
        </Card>

        <View style={styles.seccion}>
          <Text accessibilityRole="header" style={styles.titulo}>
            {es.config.apariencia}
          </Text>

          <View style={styles.grupo}>
            <Etiqueta texto={es.config.modo} />
            <Segmented<ModoElegido>
              opciones={[
                { valor: 'claro', etiqueta: es.config.claro },
                { valor: 'oscuro', etiqueta: es.config.oscuro },
                { valor: 'automatico', etiqueta: es.config.automatico },
              ]}
              seleccionado={modoElegido}
              onCambiar={cambiarModo}
            />
            <Text style={styles.ayuda}>{es.config.ayudaAutomatico}</Text>
          </View>

          <View style={styles.grupo}>
            <Etiqueta texto={es.config.paleta} />
            <View accessibilityRole="radiogroup" style={styles.paletas}>
              {PALETAS.map((otra) => (
                <View key={otra.id} style={styles.celda}>
                  <Card
                    estado={otra.id === paleta ? 'seleccionada' : 'normal'}
                    onPress={() => cambiarPaleta(otra.id)}
                    etiqueta={es.config.paletas[otra.id]}
                    style={styles.tarjetaPaleta}
                  >
                    <MuestraDePaleta paleta={otra} />
                    <Text style={styles.nombrePaleta}>{es.config.paletas[otra.id]}</Text>
                  </Card>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.pie}>
          {version !== undefined && <Text style={styles.version}>{es.config.version(version)}</Text>}
          <Text style={styles.empresa}>{es.config.empresa}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Un pedacito de pantalla con los colores de la paleta, en el modo que se ve:
 * el fondo, un renglon de texto, una linea y los colores de los participantes.
 * Se pinta con los colores de esa paleta y no con los del tema.
 */
function MuestraDePaleta({ paleta }: { paleta: Paleta }) {
  const styles = useEstilos();
  const { modo } = useTema();
  const c = paleta[modo];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.muestra, { backgroundColor: c.fondo, borderColor: c.linea }]}
    >
      <View style={[styles.renglon, { backgroundColor: c.tinta }]} />
      <View style={[styles.renglonCorto, { backgroundColor: c.grisMedio }]} />
      <View style={[styles.lineaMuestra, { backgroundColor: c.linea }]} />
      <View style={styles.puntos}>
        {paleta.participantes[modo].map((color, i) => (
          <View key={`${i}-${color}`} style={[styles.punto, { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacios.xl, gap: espacios.xl },
  opcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoOpcion: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  flecha: { ...tipografia.subtitulo, color: colores.grisMedio },
  seccion: { gap: espacios.lg },
  titulo: { ...tipografia.tituloChico, color: colores.tinta },
  grupo: { gap: espacios.xs },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  paletas: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -espacios.xs / 2 },
  // De a tres por fila: el ancho lo reparten las celdas.
  celda: { width: '33.33%', padding: espacios.xs / 2 },
  tarjetaPaleta: { gap: espacios.xs, padding: espacios.sm, alignItems: 'center' },
  nombrePaleta: { ...tipografia.chico, color: colores.tinta, textAlign: 'center' },
  muestra: {
    alignSelf: 'stretch',
    height: 64,
    borderRadius: radios.xs,
    borderWidth: 1,
    padding: espacios.xs,
    gap: 5,
  },
  renglon: { height: 6, width: '70%', borderRadius: 3 },
  renglonCorto: { height: 6, width: '45%', borderRadius: 3 },
  lineaMuestra: { height: 1.5, alignSelf: 'stretch' },
  puntos: { flexDirection: 'row', gap: 3, marginTop: 'auto' },
  punto: { width: 10, height: 10, borderRadius: 5 },
  pie: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.lg },
  version: { ...tipografia.chico, color: colores.grisOscuro },
  empresa: { ...tipografia.cuerpoFuerte, color: colores.tinta },
}));
