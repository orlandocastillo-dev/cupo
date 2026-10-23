import type { DiaDisponible, EntradaReserva, EstadoReserva, Horario, Negocio, Reserva, Resumen, Servicio } from "@cupo/core";

/** Lo que el frontend le pide al backend. Hay dos: la API de AWS y el modo de ejemplo en el navegador. */
export interface ApiCupo {
  modo: "aws" | "ejemplo";

  verNegocio(slug: string): Promise<{ negocio: Negocio; servicios: Servicio[] }>;
  disponibilidad(slug: string, servicioId: string, desde: string, dias: number): Promise<DiaDisponible[]>;
  reservar(slug: string, entrada: EntradaReserva): Promise<Reserva>;
  verReserva(id: string, codigo: string): Promise<{ reserva: Reserva; negocio: Negocio }>;
  cancelarReserva(id: string, codigo: string): Promise<Reserva>;

  miNegocio(): Promise<{ negocio: Negocio; servicios: Servicio[]; horario: Horario } | null>;
  crearNegocio(datos: Partial<Negocio>): Promise<Negocio>;
  actualizarNegocio(datos: Partial<Negocio>): Promise<Negocio>;
  guardarServicio(datos: Partial<Servicio>, id?: string): Promise<Servicio>;
  borrarServicio(id: string): Promise<void>;
  guardarHorario(horario: Horario): Promise<Horario>;
  agenda(desde: string, hasta: string): Promise<Reserva[]>;
  marcarReserva(id: string, estado: EstadoReserva): Promise<Reserva>;
  resumen(): Promise<Resumen>;
  /** Sube la foto del negocio y devuelve la dirección con la que quedó. */
  subirFoto(archivo: File): Promise<string>;
}

export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}
