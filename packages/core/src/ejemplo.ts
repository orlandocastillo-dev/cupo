import type { DatosMemoria } from "./memoria";
import { aHora, aMinutos, bloquesDe, diaSemana, sumarDias } from "./tiempo";
import type { Horario, Negocio, Reserva, Servicio } from "./tipos";

// Una barbería inventada con una semana de movimiento, para probar sin crear nada.

export const DUENO_EJEMPLO = "dueno-ejemplo";
export const SLUG_EJEMPLO = "barberia-el-parche";

const negocio: Negocio = {
  id: "neg-el-parche",
  slug: SLUG_EJEMPLO,
  nombre: "Barbería El Parche",
  tipo: "barberia",
  descripcion: "Cortes clásicos y modernos, barba con toalla caliente. Llega 5 minutos antes de tu hora.",
  direccion: "Cra. 43 # 70-15, local 2",
  ciudad: "Barranquilla",
  telefono: "300 555 0142",
  intervaloMin: 30,
  diasAdelante: 21,
  avisoMin: 60,
};

const servicios: Servicio[] = [
  { id: "srv-corte", negocioId: negocio.id, nombre: "Corte clásico", duracionMin: 30, precio: 25_000, activo: true },
  { id: "srv-combo", negocioId: negocio.id, nombre: "Corte y barba", duracionMin: 60, precio: 38_000, activo: true },
  { id: "srv-barba", negocioId: negocio.id, nombre: "Barba con toalla caliente", duracionMin: 30, precio: 18_000, activo: true },
  { id: "srv-nino", negocioId: negocio.id, nombre: "Corte para niño", duracionMin: 30, precio: 20_000, activo: true },
  { id: "srv-cejas", negocioId: negocio.id, nombre: "Cejas y perfilado", duracionMin: 15, precio: 8_000, activo: true },
];

const entreSemana = [
  { desde: "09:00", hasta: "12:30" },
  { desde: "14:00", hasta: "19:00" },
];

const horario: Horario = {
  semana: { 0: [], 1: entreSemana, 2: entreSemana, 3: entreSemana, 4: entreSemana, 5: entreSemana, 6: [{ desde: "08:00", hasta: "14:00" }] },
  cerrado: [],
};

const CLIENTES = [
  "Andrés Pérez", "Camilo Rojas", "Julián Ortega", "Santiago Barrios", "Kevin Mendoza", "Luis Fernando Díaz",
  "Mateo Castro", "Jhon Fredy Ruiz", "Sebastián Molina", "Daniel Charris", "Carlos Navarro", "Brayan Polo",
  "Óscar Herrera", "Felipe Vargas", "Juan David Torres", "Esteban Rico",
];

/** Número entre 0 y 1 que siempre da lo mismo para la misma semilla, así el ejemplo no cambia al recargar. */
function azar(semilla: number): number {
  const x = Math.sin(semilla * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** `ahora` son los minutos del día de hoy: las citas de hoy que ya pasaron salen atendidas. */
export function datosDeEjemplo(hoy: string, ahora = 0): DatosMemoria {
  const reservas: Reserva[] = [];
  const bloques: string[] = [];
  let n = 0;

  for (let d = -6; d <= 6; d++) {
    const fecha = sumarDias(hoy, d);
    const franjas = horario.semana[diaSemana(fecha)] ?? [];
    const ocupacion = d < 0 ? 0.62 : d === 0 ? 0.55 : 0.4 - d * 0.04;

    for (const franja of franjas) {
      let cursor = aMinutos(franja.desde);
      while (cursor < aMinutos(franja.hasta)) {
        n++;
        const servicio = servicios[Math.floor(azar(n * 3) * servicios.length)]!;
        const fin = cursor + servicio.duracionMin;
        if (fin > aMinutos(franja.hasta) || azar(n) > ocupacion) {
          cursor += 30;
          continue;
        }
        const suerte = azar(n * 7);
        const yaPaso = d < 0 || (d === 0 && fin <= ahora);
        const estado: Reserva["estado"] = !yaPaso ? "confirmada" : suerte < 0.08 ? "no_asistio" : suerte < 0.13 ? "cancelada" : "atendida";
        const nombre = CLIENTES[n % CLIENTES.length]!;
        const inicio = aHora(cursor);
        reservas.push({
          id: `res-${String(n).padStart(4, "0")}`,
          negocioId: negocio.id,
          servicioId: servicio.id,
          servicioNombre: servicio.nombre,
          precio: servicio.precio,
          fecha,
          inicio,
          fin: aHora(fin),
          cliente: { nombre, telefono: `3${String(Math.floor(azar(n * 11) * 1e9)).padStart(9, "0")}` },
          estado,
          codigo: `EJ${String(1000 + n).slice(-4)}`,
          creada: `${sumarDias(fecha, -2)}T15:00:00.000Z`,
        });
        if (estado !== "cancelada" && estado !== "no_asistio") {
          bloques.push(...bloquesDe(inicio, servicio.duracionMin).map((b) => `${negocio.id}|${fecha}|${b}`));
        }
        cursor = fin + (Math.ceil(servicio.duracionMin / 30) * 30 - servicio.duracionMin);
      }
    }
  }

  return {
    negocios: [negocio],
    duenos: { [DUENO_EJEMPLO]: negocio.id },
    servicios,
    horarios: { [negocio.id]: horario },
    reservas,
    bloques,
  };
}
