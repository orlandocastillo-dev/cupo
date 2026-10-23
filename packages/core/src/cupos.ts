import { aHora, aMinutos, diaSemana, diasEntre, type Momento } from "./tiempo";
import type { Horario, Negocio, Reserva, Servicio } from "./tipos";

export const ACTIVAS: ReadonlySet<Reserva["estado"]> = new Set(["confirmada", "atendida"]);

export interface ConsultaCupos {
  negocio: Negocio;
  horario: Horario;
  servicio: Servicio;
  reservas: Reserva[];
  fecha: string;
  ahora: Momento;
}

export type MotivoSinCupos = "cerrado" | "pasado" | "muy_lejos" | null;

/** Por qué un día no tiene cupos, antes de mirar la agenda. */
export function motivoDia(negocio: Negocio, horario: Horario, fecha: string, ahora: Momento): MotivoSinCupos {
  const dias = diasEntre(ahora.fecha, fecha);
  if (dias < 0) return "pasado";
  if (dias > negocio.diasAdelante) return "muy_lejos";
  if (horario.cerrado.includes(fecha) || !(horario.semana[diaSemana(fecha)]?.length)) return "cerrado";
  return null;
}

/**
 * Horas en las que puede empezar el servicio ese día. Un cupo sirve si la cita entera cabe
 * dentro de una franja abierta, no se cruza con otra reserva y respeta el aviso mínimo.
 */
export function cuposDelDia({ negocio, horario, servicio, reservas, fecha, ahora }: ConsultaCupos): string[] {
  if (motivoDia(negocio, horario, fecha, ahora)) return [];

  const ocupado = reservas
    .filter((r) => r.fecha === fecha && ACTIVAS.has(r.estado))
    .map((r) => [aMinutos(r.inicio), aMinutos(r.fin)] as const);
  const minimo = fecha === ahora.fecha ? ahora.minutos + negocio.avisoMin : -1;

  const cupos: string[] = [];
  for (const franja of horario.semana[diaSemana(fecha)] ?? []) {
    const cierre = aMinutos(franja.hasta);
    for (let inicio = aMinutos(franja.desde); inicio + servicio.duracionMin <= cierre; inicio += negocio.intervaloMin) {
      const fin = inicio + servicio.duracionMin;
      if (inicio < minimo) continue;
      if (ocupado.some(([a, b]) => inicio < b && a < fin)) continue;
      cupos.push(aHora(inicio));
    }
  }
  return cupos;
}

/** Minutos que el negocio tiene abiertos en un día, para calcular la ocupación. */
export function minutosAbiertos(horario: Horario, fecha: string): number {
  if (horario.cerrado.includes(fecha)) return 0;
  return (horario.semana[diaSemana(fecha)] ?? []).reduce((t, f) => t + aMinutos(f.hasta) - aMinutos(f.desde), 0);
}
