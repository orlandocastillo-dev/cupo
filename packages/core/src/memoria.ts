import { ACTIVAS } from "./cupos";
import { ErrorCupo } from "./errores";
import type { Repositorio } from "./repositorio";
import type { EstadoReserva, Horario, Negocio, Reserva, Servicio } from "./tipos";

export interface DatosMemoria {
  negocios: Negocio[];
  duenos: Record<string, string>;
  servicios: Servicio[];
  horarios: Record<string, Horario>;
  reservas: Reserva[];
  bloques: string[];
}

const copia = <T>(v: T): T => structuredClone(v);

/** Repositorio para el modo de ejemplo (se guarda en el navegador) y para las pruebas. */
export class RepositorioEnMemoria implements Repositorio {
  private datos: DatosMemoria;
  private tomados: Set<string>;

  constructor(datos?: Partial<DatosMemoria>) {
    this.datos = { negocios: [], duenos: {}, servicios: [], horarios: {}, reservas: [], bloques: [], ...copia(datos ?? {}) };
    this.tomados = new Set(this.datos.bloques);
  }

  exportar(): DatosMemoria {
    return copia({ ...this.datos, bloques: [...this.tomados] });
  }

  private static llave(negocioId: string, fecha: string, bloque: string) {
    return `${negocioId}|${fecha}|${bloque}`;
  }

  async negocioPorSlug(slug: string) {
    return copia(this.datos.negocios.find((n) => n.slug === slug) ?? null);
  }

  async negocioPorId(id: string) {
    return copia(this.datos.negocios.find((n) => n.id === id) ?? null);
  }

  async negocioDeDueno(dueno: string) {
    const id = this.datos.duenos[dueno];
    return id ? this.negocioPorId(id) : null;
  }

  async guardarNegocio(negocio: Negocio, dueno: string) {
    this.datos.negocios = [...this.datos.negocios.filter((n) => n.id !== negocio.id), copia(negocio)];
    this.datos.duenos[dueno] = negocio.id;
  }

  async servicios(negocioId: string) {
    return copia(this.datos.servicios.filter((s) => s.negocioId === negocioId));
  }

  async guardarServicio(servicio: Servicio) {
    const otros = this.datos.servicios.filter((s) => !(s.id === servicio.id && s.negocioId === servicio.negocioId));
    this.datos.servicios = [...otros, copia(servicio)];
  }

  async borrarServicio(negocioId: string, id: string) {
    this.datos.servicios = this.datos.servicios.filter((s) => !(s.id === id && s.negocioId === negocioId));
  }

  async horario(negocioId: string) {
    return copia(this.datos.horarios[negocioId] ?? null);
  }

  async guardarHorario(negocioId: string, horario: Horario) {
    this.datos.horarios[negocioId] = copia(horario);
  }

  async reservasEntre(negocioId: string, desde: string, hasta: string) {
    return copia(this.datos.reservas.filter((r) => r.negocioId === negocioId && r.fecha >= desde && r.fecha <= hasta));
  }

  async reserva(id: string) {
    return copia(this.datos.reservas.find((r) => r.id === id) ?? null);
  }

  async crearReserva(reserva: Reserva, bloques: string[]) {
    const llaves = bloques.map((b) => RepositorioEnMemoria.llave(reserva.negocioId, reserva.fecha, b));
    if (llaves.some((l) => this.tomados.has(l))) throw new ErrorCupo("ocupado", "Esa hora ya no está disponible. Elige otra.");
    llaves.forEach((l) => this.tomados.add(l));
    this.datos.reservas.push(copia(reserva));
  }

  async cambiarEstado(reserva: Reserva, estado: EstadoReserva, bloques: string[]) {
    const guardada = this.datos.reservas.find((r) => r.id === reserva.id);
    if (!guardada) throw new ErrorCupo("no_encontrado", "Esa reserva no existe.");
    const llaves = bloques.map((b) => RepositorioEnMemoria.llave(reserva.negocioId, reserva.fecha, b));
    const estabaActiva = ACTIVAS.has(guardada.estado);
    const quedaActiva = ACTIVAS.has(estado);
    if (!estabaActiva && quedaActiva) {
      if (llaves.some((l) => this.tomados.has(l))) throw new ErrorCupo("ocupado", "Esa hora ya la tomó otra reserva.");
      llaves.forEach((l) => this.tomados.add(l));
    }
    if (estabaActiva && !quedaActiva) llaves.forEach((l) => this.tomados.delete(l));
    guardada.estado = estado;
    return copia(guardada);
  }
}
