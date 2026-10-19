import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import * as ajustes from '@/repositories/ajustes';

import { paletaPorId, PALETA_POR_DEFECTO, type Colores, type IdPaleta, type Modo } from './paletas';

/** Lo que se elige en Configuracion: automatico sigue al telefono. */
export type ModoElegido = Modo | 'automatico';

const CLAVE_PALETA = 'paleta';
const CLAVE_MODO = 'modo';
const MODOS: readonly ModoElegido[] = ['claro', 'oscuro', 'automatico'];

export interface Tema {
  colores: Colores;
  /** Los colores para elegir de los participantes, con la paleta y el modo activos. */
  coloresDeParticipantes: readonly string[];
  /** El modo que se ve: el elegido, o el del telefono si es automatico. */
  modo: Modo;
  paleta: IdPaleta;
  modoElegido: ModoElegido;
  /** Cambia en vivo y lo guarda. Si no se puede guardar, igual se ve mientras dure la app. */
  cambiarPaleta: (paleta: IdPaleta) => void;
  cambiarModo: (modo: ModoElegido) => void;
}

const ContextoDeTema = createContext<Tema | null>(null);

export interface PreferenciasDeTema {
  paleta: IdPaleta;
  modo: ModoElegido;
}

/** Lo guardado, para arrancar ya con la paleta elegida y sin un parpadeo de la de siempre. */
export async function leerPreferenciasDeTema(): Promise<PreferenciasDeTema> {
  const [paleta, modo] = await Promise.all([ajustes.leerAjuste(CLAVE_PALETA), ajustes.leerAjuste(CLAVE_MODO)]);
  return {
    paleta: paletaPorId(paleta ?? PALETA_POR_DEFECTO).id,
    modo: MODOS.includes(modo as ModoElegido) ? (modo as ModoElegido) : 'automatico',
  };
}

/**
 * Los colores de la app (cambio 109): la paleta y el modo elegidos en
 * Configuracion. Cambiarlos repinta todo en vivo, sin reiniciar.
 */
export function ProveedorDeTema({ inicial, children }: { inicial: PreferenciasDeTema; children: ReactNode }) {
  const [paleta, setPaleta] = useState<IdPaleta>(inicial.paleta);
  const [modoElegido, setModoElegido] = useState<ModoElegido>(inicial.modo);
  const delTelefono = useColorScheme();
  const modo: Modo = modoElegido === 'automatico' ? (delTelefono === 'dark' ? 'oscuro' : 'claro') : modoElegido;

  const tema = useMemo<Tema>(() => {
    const elegida = paletaPorId(paleta);
    return {
      colores: elegida[modo],
      coloresDeParticipantes: elegida.participantes[modo],
      modo,
      paleta,
      modoElegido,
      cambiarPaleta: (nueva) => {
        setPaleta(nueva);
        void ajustes.guardarAjuste(CLAVE_PALETA, nueva).catch(() => undefined);
      },
      cambiarModo: (nuevo) => {
        setModoElegido(nuevo);
        void ajustes.guardarAjuste(CLAVE_MODO, nuevo).catch(() => undefined);
      },
    };
  }, [paleta, modo, modoElegido]);

  return <ContextoDeTema.Provider value={tema}>{children}</ContextoDeTema.Provider>;
}

export function useTema(): Tema {
  const tema = useContext(ContextoDeTema);
  if (tema === null) throw new Error('useTema va adentro de ProveedorDeTema');
  return tema;
}

/**
 * Los estilos de un componente en funcion de los colores del tema. Reemplaza al
 * `StyleSheet.create` suelto: se arman una vez por juego de colores y se
 * reusan, asi cambiar de paleta no los recrea en cada dibujo.
 *
 *   const useEstilos = crearEstilos((colores) => ({ texto: { color: colores.tinta } }));
 *   function Componente() { const styles = useEstilos(); ... }
 */
export function crearEstilos<T extends StyleSheet.NamedStyles<T>>(fabrica: (colores: Colores) => T): () => T {
  const armados = new WeakMap<Colores, T>();
  return function useEstilos(): T {
    const { colores } = useTema();
    let estilos = armados.get(colores);
    if (estilos === undefined) {
      estilos = StyleSheet.create(fabrica(colores));
      armados.set(colores, estilos);
    }
    return estilos;
  };
}
