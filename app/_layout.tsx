import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { esBaseAbiertaEnOtraPestana } from '@/db/client';
import { sembrar } from '@/db/seed';
import { es } from '@/i18n/es';
import { PALETA_POR_DEFECTO } from '@/theme/paletas';
import {
  crearEstilos,
  leerPreferenciasDeTema,
  ProveedorDeTema,
  useTema,
  type PreferenciasDeTema,
} from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

/**
 * El Home queda siempre debajo en la pila, aunque se entre directo a otra ruta.
 * En web pasa al recargar una pantalla interna: sin esto no habria a donde
 * volver, y con la app agregada a inicio no hay boton atras del navegador
 * (fase 10, cambio 87).
 */
export const unstable_settings = { anchor: 'index' };

/** Si la base no abre, el aviso se ve con la paleta de siempre. */
const PREFERENCIAS_DE_RESPALDO: PreferenciasDeTema = { paleta: PALETA_POR_DEFECTO, modo: 'automatico' };

/**
 * Antes de montar cualquier pantalla se siembran las plantillas predefinidas
 * (paso 2.4). Asi ninguna pantalla lee la base antes de que esten. Tambien se
 * leen la paleta y el modo elegidos (cambio 109): la app arranca ya con ellos.
 */
export default function RootLayout() {
  const [preferencias, setPreferencias] = useState<PreferenciasDeTema | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    sembrar()
      .then(leerPreferenciasDeTema)
      .then(setPreferencias)
      .catch((e: unknown) => setError(e ?? 'Error'));
  }, []);

  // En web, la app ya abierta en otra pestaña: un aviso para la usuaria, no un error.
  if (error !== null && esBaseAbiertaEnOtraPestana(error)) {
    return (
      <ProveedorDeTema inicial={PREFERENCIAS_DE_RESPALDO}>
        <PantallaError mensaje={es.comun.abiertaEnOtraPestana} />
      </ProveedorDeTema>
    );
  }
  // Diagnostico de desarrollo: si la semilla falla, la app no sirve y hay que verlo.
  if (error !== null) {
    return (
      <ProveedorDeTema inicial={PREFERENCIAS_DE_RESPALDO}>
        <PantallaError mensaje={String(error)} />
      </ProveedorDeTema>
    );
  }

  // Es un instante: unas lecturas y, solo la primera vez, unas inserciones.
  if (preferencias === null) return null;

  return (
    <ProveedorDeTema inicial={preferencias}>
      <Navegacion />
    </ProveedorDeTema>
  );
}

/**
 * Sin bienvenida desde el paso 9.1 (cambio 82): la app abre directo en el Home.
 * La primera vez, el Home abre encima el instructivo (cambio 96).
 */
function Navegacion() {
  const { colores, modo } = useTema();
  return (
    <>
      {/* La barra de arriba del telefono, legible sobre el fondo de la paleta (cambio 109). */}
      <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.fondo },
          headerTintColor: colores.tinta,
          headerTitleStyle: { color: colores.tinta },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="plantillas/index" options={{ title: es.plantillas.titulo, headerBackTitle: es.comun.volver }} />
        {/* El editor dibuja su propio encabezado (mockup 3) y confirma antes de salir
            con cambios sin guardar: sin gesto de arrastrar, la ‹ es la unica salida. */}
        <Stack.Screen name="plantillas/[id]" options={{ headerShown: false, gestureEnabled: false }} />
        {/* La partida dibuja su propio encabezado (mockup 4). */}
        <Stack.Screen name="partida/[id]/index" options={{ headerShown: false }} />
        {/* El podio (8.2): se llega con replace desde la partida, asi que atras es el Home. */}
        <Stack.Screen name="partida/[id]/final" options={{ headerShown: false }} />
        <Stack.Screen name="config/index" options={{ title: es.home.configuracion, headerBackTitle: es.comun.volver }} />
        {/* Sin gesto de arrastrar: se sale con SALTEAR o EMPEZAR, que lo marcan como visto. */}
        <Stack.Screen
          name="instructivo"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}

function PantallaError({ mensaje }: { mensaje: string }) {
  const styles = useEstilos();
  return (
    <View style={styles.error}>
      <Text style={styles.mensaje}>{mensaje}</Text>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacios.xl, backgroundColor: colores.fondo },
  mensaje: { ...tipografia.cuerpo, color: colores.tinta, textAlign: 'center' },
}));
