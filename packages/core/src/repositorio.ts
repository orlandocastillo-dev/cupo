import type { EstadoReserva, Horario, Negocio, Reserva, Servicio } from "./tipos";

/**
 * Dónde se guardan los datos. En AWS es DynamoDB; en el modo de ejemplo y en las pruebas,
 * memoria. Las dos implementaciones tienen que rechazar una reserva cuyos bloques ya están
 * tomados, aunque lleguen dos al mismo tiempo.
 */
export interface Repositorio {
  negocioPorSlug(slug: string): Promise<Negocio | null>;
  negocioPorId(id: string): Promise<Negocio | null>;
  negocioDeDueno(dueno: string): Promise<Negocio | null>;
  guardarNegocio(negocio: Negocio, dueno: string): Promise<void>;

  servicios(negocioId: string): Promise<Servicio[]>;
  guardarServicio(servicio: Servicio): Promise<void>;
  borrarServicio(negocioId: string, id: string): Promise<void>;

  horario(negocioId: string): Promise<Horario | null>;
  guardarHorario(negocioId: string, horario: Horario): Promise<void>;

  reservasEntre(negocioId: string, desde: string, hasta: string): Promise<Reserva[]>;
  reserva(id: string): Promise<Reserva | null>;
  /** Guarda la reserva y toma sus bloques; lanza ErrorCupo("ocupado") si alguno ya estaba tomado. */
  crearReserva(reserva: Reserva, bloques: string[]): Promise<void>;
  /** Cambia el estado; si la reserva deja de estar activa, suelta sus bloques. */
  cambiarEstado(reserva: Reserva, estado: EstadoReserva, bloques: string[]): Promise<Reserva>;
}
