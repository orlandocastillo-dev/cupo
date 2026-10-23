export type TipoNegocio = "barberia" | "peluqueria" | "consultorio" | "cancha" | "spa" | "otro";

export interface Negocio {
  id: string;
  slug: string;
  nombre: string;
  tipo: TipoNegocio;
  descripcion: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  fotoUrl?: string;
  /** Cada cuántos minutos empieza un cupo (15 o 30). */
  intervaloMin: 15 | 30;
  /** Hasta cuántos días adelante se puede reservar. */
  diasAdelante: number;
  /** Minutos mínimos entre la reserva y la hora del cupo. */
  avisoMin: number;
}

export interface Servicio {
  id: string;
  negocioId: string;
  nombre: string;
  duracionMin: number;
  precio: number;
  activo: boolean;
}

/** Franja abierta dentro de un día, en hora local del negocio ("08:00" a "12:30"). */
export interface Franja {
  desde: string;
  hasta: string;
}

export interface Horario {
  /** 0 = domingo ... 6 = sábado. */
  semana: Record<number, Franja[]>;
  /** Días festivos o vacaciones en los que no se atiende ("2026-12-25"). */
  cerrado: string[];
}

export type EstadoReserva = "confirmada" | "cancelada" | "atendida" | "no_asistio";

export interface Cliente {
  nombre: string;
  telefono: string;
  correo?: string;
}

export interface Reserva {
  id: string;
  negocioId: string;
  servicioId: string;
  servicioNombre: string;
  precio: number;
  fecha: string;
  inicio: string;
  fin: string;
  cliente: Cliente;
  estado: EstadoReserva;
  /** Lo necesita el cliente para ver o cancelar su reserva sin cuenta. */
  codigo: string;
  creada: string;
}

/** Lo que puede ver cualquiera de una reserva: sin teléfono ni correo. */
export type ReservaPublica = Omit<Reserva, "cliente" | "codigo"> & { clienteNombre: string };
