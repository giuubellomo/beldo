/**
 * Ajustes sueltos de la app (cambio 96): una tabla de clave y valor, para lo
 * que no es de ninguna partida ni plantilla.
 */
import { escribir, leer } from '@/db/client';

const INSTRUCTIVO_VISTO = 'instructivo_visto';

/** false en una base nueva: el Home abre el instructivo. */
export function instructivoVisto(): Promise<boolean> {
  return leer(async (db) => {
    const fila = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajuste WHERE clave = ?', [
      INSTRUCTIVO_VISTO,
    ]);
    return fila?.valor === '1';
  });
}

/** Al saltearlo o terminarlo. Repetirlo no cambia nada. */
export function marcarInstructivoVisto(): Promise<void> {
  return escribir(async (db) => {
    await db.runAsync(
      'INSERT INTO ajuste (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor',
      [INSTRUCTIVO_VISTO, '1'],
    );
  });
}
