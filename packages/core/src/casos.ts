import { ACTIVAS, cuposDelDia, minutosAbiertos, motivoDia, type MotivoSinCupos } from "./cupos";
import { ErrorCupo, invalido, noEncontrado } from "./errores";
import type { Repositorio } from "./repositorio";
import { aHora, aMinutos, bloquesDe, sumarDias, type Momento } from "./tiempo";
import type { EstadoReserva, Horario, Negocio, Reserva, ReservaPublica, Servicio } from "./tipos";
import { slugDe, validarCliente, validarFecha, validarHora, validarHorario, validarNegocio, validarServicio } from "./validar";

// Todo lo que se puede hacer en Cupo. Las Lambdas y el modo de ejemplo llaman estas mismas funciones.

export interface Entorno {
  repo: Repositorio;
  ahora: () => Momento;
  nuevoId: () => string;
  nuevoCodigo: () => string;
}

const HORARIO_VACIO: Horario = { semana: {}, cerrado: [] };

async function negocioPublico(repo: Repositorio, slug: string): Promise<Negocio> {
  const negocio = await repo.negocioPorSlug(slug);
  if (!negocio) throw noEncontrado("No encontramos ese negocio.");
  return negocio;
}

async function servicioActivo(repo: Repositorio, negocioId: string, servicioId: unknown): Promise<Servicio> {
  const servicio = (await repo.servicios(negocioId)).find((s) => s.id === servicioId && s.activo);
  if (!servicio) throw noEncontrado("Ese servicio no existe o ya no se ofrece.");
  return servicio;
}

export function publica(r: Reserva): ReservaPublica {
  const { cliente, codigo: _codigo, ...resto } = r;
  return { ...resto, clienteNombre: cliente.nombre.split(" ")[0] ?? "" };
}

// ---- Lo que ve el cliente, sin cuenta ----

export async function verNegocio({ repo }: Entorno, slug: string) {
  const negocio = await negocioPublico(repo, slug);
  const servicios = (await repo.servicios(negocio.id)).filter((s) => s.activo);
  return { negocio, servicios };
}

export interface DiaDisponible {
  fecha: string;
  cupos: string[];
  motivo: MotivoSinCupos;
}

/** Cupos de varios días seguidos, para pintar el calendario de una sola vez. */
export async function disponibilidad(
  { repo, ahora }: Entorno,
  slug: string,
  servicioId: string,
  desde: unknown,
  dias = 14,
): Promise<DiaDisponible[]> {
  const inicio = validarFecha(desde);
  if (!Number.isInteger(dias) || dias < 1 || dias > 31) throw invalido("Se pueden consultar entre 1 y 31 días.");
  const negocio = await negocioPublico(repo, slug);
  const servicio = await servicioActivo(repo, negocio.id, servicioId);
  const horario = (await repo.horario(negocio.id)) ?? HORARIO_VACIO;
  const fin = sumarDias(inicio, dias - 1);
  const reservas = await repo.reservasEntre(negocio.id, inicio, fin);
  const momento = ahora();

  return Array.from({ length: dias }, (_, i) => {
    const fecha = sumarDias(inicio, i);
    return {
      fecha,
      motivo: motivoDia(negocio, horario, fecha, momento),
      cupos: cuposDelDia({ negocio, horario, servicio, reservas, fecha, ahora: momento }),
    };
  });
}

export interface EntradaReserva {
  servicioId: string;
  fecha: string;
  inicio: string;
  cliente: unknown;
}

export async function reservar(entorno: Entorno, slug: string, entrada: EntradaReserva): Promise<Reserva> {
  const { repo, ahora } = entorno;
  const fecha = validarFecha(entrada.fecha);
  const inicio = validarHora(entrada.inicio);
  const cliente = validarCliente(entrada.cliente);
  const negocio = await negocioPublico(repo, slug);
  const servicio = await servicioActivo(repo, negocio.id, entrada.servicioId);
  const horario = (await repo.horario(negocio.id)) ?? HORARIO_VACIO;
  const reservas = await repo.reservasEntre(negocio.id, fecha, fecha);

  const libres = cuposDelDia({ negocio, horario, servicio, reservas, fecha, ahora: ahora() });
  if (!libres.includes(inicio)) throw new ErrorCupo("ocupado", "Esa hora ya no está disponible. Elige otra.");

  const reserva: Reserva = {
    id: entorno.nuevoId(),
    negocioId: negocio.id,
    servicioId: servicio.id,
    servicioNombre: servicio.nombre,
    precio: servicio.precio,
    fecha,
    inicio,
    fin: aHora(aMinutos(inicio) + servicio.duracionMin),
    cliente,
    estado: "confirmada",
    codigo: entorno.nuevoCodigo(),
    creada: new Date().toISOString(),
  };
  // Entre la consulta y este punto pudo entrar otra reserva: el repositorio es quien decide.
  await repo.crearReserva(reserva, bloquesDe(inicio, servicio.duracionMin));
  return reserva;
}

async function reservaDelCliente(repo: Repositorio, id: string, codigo: unknown): Promise<Reserva> {
  const reserva = await repo.reserva(id);
  if (!reserva || typeof codigo !== "string" || reserva.codigo !== codigo.trim().toUpperCase()) {
    throw noEncontrado("No encontramos una reserva con ese código.");
  }
  return reserva;
}

export async function verReserva({ repo }: Entorno, id: string, codigo: unknown) {
  const reserva = await reservaDelCliente(repo, id, codigo);
  const negocio = await repo.negocioPorId(reserva.negocioId);
  if (!negocio) throw noEncontrado("El negocio de esta reserva ya no existe.");
  return { reserva, negocio };
}

export async function cancelarReserva({ repo, ahora }: Entorno, id: string, codigo: unknown): Promise<Reserva> {
  const reserva = await reservaDelCliente(repo, id, codigo);
  if (reserva.estado !== "confirmada") throw invalido("Esta reserva ya no se puede cancelar.");
  const momento = ahora();
  const yaPaso = reserva.fecha < momento.fecha || (reserva.fecha === momento.fecha && aMinutos(reserva.inicio) <= momento.minutos);
  if (yaPaso) throw invalido("La hora de esta reserva ya pasó.");
  return repo.cambiarEstado(reserva, "cancelada", bloquesDe(reserva.inicio, aMinutos(reserva.fin) - aMinutos(reserva.inicio)));
}

// ---- Lo que hace el dueño, con sesión ----

async function negocioDe(repo: Repositorio, dueno: string): Promise<Negocio> {
  const negocio = await repo.negocioDeDueno(dueno);
  if (!negocio) throw noEncontrado("Todavía no has creado tu negocio.");
  return negocio;
}

export async function miNegocio({ repo }: Entorno, dueno: string) {
  const negocio = await repo.negocioDeDueno(dueno);
  if (!negocio) return null;
  const [servicios, horario] = await Promise.all([repo.servicios(negocio.id), repo.horario(negocio.id)]);
  return { negocio, servicios, horario: horario ?? HORARIO_VACIO };
}

export async function crearNegocio(entorno: Entorno, dueno: string, datos: unknown): Promise<Negocio> {
  const { repo } = entorno;
  if (await repo.negocioDeDueno(dueno)) throw invalido("Ya tienes un negocio creado.");
  const nombre = String((datos as Record<string, unknown> | null)?.nombre ?? "");
  let slug = slugDe(nombre);
  for (let i = 2; await repo.negocioPorSlug(slug); i++) slug = `${slugDe(nombre)}-${i}`;
  const negocio = validarNegocio(datos, { id: entorno.nuevoId(), slug });
  await repo.guardarNegocio(negocio, dueno);
  return negocio;
}

export async function actualizarNegocio({ repo }: Entorno, dueno: string, cambios: unknown): Promise<Negocio> {
  const actual = await negocioDe(repo, dueno);
  const negocio = validarNegocio(cambios, actual);
  await repo.guardarNegocio(negocio, dueno);
  return negocio;
}

export async function guardarServicio(entorno: Entorno, dueno: string, datos: unknown, id?: string): Promise<Servicio> {
  const negocio = await negocioDe(entorno.repo, dueno);
  if (id && !(await entorno.repo.servicios(negocio.id)).some((s) => s.id === id)) throw noEncontrado("Ese servicio no existe.");
  const servicio = validarServicio(datos, negocio.id, id ?? entorno.nuevoId());
  await entorno.repo.guardarServicio(servicio);
  return servicio;
}

export async function borrarServicio({ repo }: Entorno, dueno: string, id: string): Promise<void> {
  const negocio = await negocioDe(repo, dueno);
  await repo.borrarServicio(negocio.id, id);
}

export async function guardarHorario({ repo }: Entorno, dueno: string, datos: unknown): Promise<Horario> {
  const negocio = await negocioDe(repo, dueno);
  const horario = validarHorario(datos);
  await repo.guardarHorario(negocio.id, horario);
  return horario;
}

export async function agenda({ repo }: Entorno, dueno: string, desde: unknown, hasta: unknown): Promise<Reserva[]> {
  const negocio = await negocioDe(repo, dueno);
  const inicio = validarFecha(desde);
  const fin = validarFecha(hasta);
  if (fin < inicio || sumarDias(inicio, 62) < fin) throw invalido("El rango de fechas no es válido.");
  const reservas = await repo.reservasEntre(negocio.id, inicio, fin);
  return reservas.sort((a, b) => (a.fecha + a.inicio).localeCompare(b.fecha + b.inicio));
}

const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  confirmada: ["atendida", "no_asistio", "cancelada"],
  atendida: ["confirmada"],
  no_asistio: ["confirmada"],
  cancelada: [],
};

export async function marcarReserva({ repo }: Entorno, dueno: string, id: string, estado: unknown): Promise<Reserva> {
  const negocio = await negocioDe(repo, dueno);
  const reserva = await repo.reserva(id);
  if (!reserva || reserva.negocioId !== negocio.id) throw noEncontrado("Esa reserva no existe.");
  if (!TRANSICIONES[reserva.estado].includes(estado as EstadoReserva)) throw invalido("No se puede pasar la reserva a ese estado.");
  const bloques = bloquesDe(reserva.inicio, aMinutos(reserva.fin) - aMinutos(reserva.inicio));
  return repo.cambiarEstado(reserva, estado as EstadoReserva, bloques);
}

export interface Resumen {
  desde: string;
  hasta: string;
  reservas: number;
  atendidas: number;
  noAsistio: number;
  canceladas: number;
  ingresos: number;
  /** Porcentaje del tiempo abierto que quedó reservado. */
  ocupacion: number;
  porDia: { fecha: string; reservas: number; ingresos: number }[];
  servicios: { nombre: string; reservas: number; ingresos: number }[];
}

/** Los últimos 7 días hasta hoy. */
export async function resumen({ repo, ahora }: Entorno, dueno: string): Promise<Resumen> {
  const negocio = await negocioDe(repo, dueno);
  const hasta = ahora().fecha;
  const desde = sumarDias(hasta, -6);
  const [reservas, horario] = await Promise.all([repo.reservasEntre(negocio.id, desde, hasta), repo.horario(negocio.id)]);
  const activas = reservas.filter((r) => ACTIVAS.has(r.estado));
  const cobradas = reservas.filter((r) => r.estado === "atendida");

  let abiertos = 0;
  const porDia = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(desde, i);
    abiertos += minutosAbiertos(horario ?? HORARIO_VACIO, fecha);
    const delDia = activas.filter((r) => r.fecha === fecha);
    return { fecha, reservas: delDia.length, ingresos: delDia.reduce((t, r) => t + r.precio, 0) };
  });
  const reservados = activas.reduce((t, r) => t + aMinutos(r.fin) - aMinutos(r.inicio), 0);

  const servicios = new Map<string, { nombre: string; reservas: number; ingresos: number }>();
  for (const r of activas) {
    const s = servicios.get(r.servicioId) ?? { nombre: r.servicioNombre, reservas: 0, ingresos: 0 };
    s.reservas += 1;
    s.ingresos += r.precio;
    servicios.set(r.servicioId, s);
  }

  return {
    desde,
    hasta,
    reservas: activas.length,
    atendidas: cobradas.length,
    noAsistio: reservas.filter((r) => r.estado === "no_asistio").length,
    canceladas: reservas.filter((r) => r.estado === "cancelada").length,
    ingresos: cobradas.reduce((t, r) => t + r.precio, 0),
    ocupacion: abiertos ? Math.round((reservados / abiertos) * 100) : 0,
    porDia,
    servicios: [...servicios.values()].sort((a, b) => b.reservas - a.reservas),
  };
}
