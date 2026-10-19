import { Text } from 'react-native';

import { crearEstilos } from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

/** La linea que explica una lista vacia (RNF-6): «Todavía no tenés partidas guardadas». */
export function Vacio({ texto }: { texto: string }) {
  const styles = useEstilos();
  return <Text style={styles.texto}>{texto}</Text>;
}

const useEstilos = crearEstilos((colores) => ({
  texto: { ...tipografia.secundario, color: colores.grisMedio, textAlign: 'center', paddingVertical: espacios.xs },
}));
