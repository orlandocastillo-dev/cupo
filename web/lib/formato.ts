const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export const plata = (n: number) => pesos.format(n).replace(/\s/g, " ");

export function hora12(hora: string) {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

const fecha = (f: string) => new Date(`${f}T12:00:00Z`);

export const diaCorto = (f: string) => new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" }).format(fecha(f)).replace(".", "");
export const numeroDia = (f: string) => fecha(f).getUTCDate();
export const mesCorto = (f: string) => new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(fecha(f)).replace(".", "");
export const fechaLarga = (f: string) =>
  new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(fecha(f));

export function duracion(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const ESTADOS = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  no_asistio: "No vino",
  cancelada: "Cancelada",
} as const;

export const TIPOS = {
  barberia: "Barbería",
  peluqueria: "Peluquería",
  consultorio: "Consultorio",
  cancha: "Cancha",
  spa: "Spa o uñas",
  otro: "Otro",
} as const;

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
