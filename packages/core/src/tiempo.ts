// Fechas como "2026-10-23" y horas como "14:30", siempre en la hora local del negocio.
// Colombia no cambia de hora en el año, pero se calcula con Intl para no depender de eso.

export const ZONA = "America/Bogota";

/** Tamaño del bloque con el que se ocupa la agenda. Las duraciones son múltiplos de esto. */
export const BLOQUE_MIN = 15;

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface Momento {
  fecha: string;
  minutos: number;
}

export function momentoEn(fecha: Date, zona = ZONA): Momento {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(fecha)
      .map((p) => [p.type, p.value]),
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

/** Día de la semana de una fecha: 0 = domingo. */
export function diaSemana(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000);
}

export function esFecha(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(`${valor}T12:00:00Z`));
}

export function esHora(valor: unknown): valor is string {
  return typeof valor === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

/** Bloques de 15 minutos que ocupa una cita: 09:00 de 45 min → 09:00, 09:15, 09:30. */
export function bloquesDe(inicio: string, duracionMin: number): string[] {
  const desde = aMinutos(inicio);
  const bloques: string[] = [];
  for (let m = desde; m < desde + duracionMin; m += BLOQUE_MIN) bloques.push(aHora(m));
  return bloques;
}
