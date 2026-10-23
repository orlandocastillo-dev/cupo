import { beforeEach, describe, expect, it } from "vitest";
import * as casos from "../src/casos";
import { ErrorCupo } from "../src/errores";
import { DUENO_EJEMPLO, SLUG_EJEMPLO, datosDeEjemplo } from "../src/ejemplo";
import { RepositorioEnMemoria } from "../src/memoria";
import { sumarDias, diaSemana, type Momento } from "../src/tiempo";

const HOY = "2026-10-23"; // viernes
let ahora: Momento;
let entorno: casos.Entorno;
let n = 0;

function proximoLunes() {
  let f = sumarDias(HOY, 1);
  while (diaSemana(f) !== 1) f = sumarDias(f, 1);
  return f;
}

beforeEach(() => {
  ahora = { fecha: HOY, minutos: 8 * 60 };
  n = 0;
  entorno = {
    repo: new RepositorioEnMemoria(datosDeEjemplo(HOY)),
    ahora: () => ahora,
    nuevoId: () => `id-${++n}`,
    nuevoCodigo: () => `COD${n}`,
  };
});

const cliente = { nombre: "María José Pérez", telefono: "300 123 4567", correo: "MARIA@correo.com" };

async function primerCupo(fecha: string, servicioId = "srv-corte") {
  const dias = await casos.disponibilidad(entorno, SLUG_EJEMPLO, servicioId, fecha, 1);
  const hora = dias[0]?.cupos.at(-1);
  if (!hora) throw new Error("sin cupos");
  return hora;
}

describe("reservar", () => {
  it("crea la reserva, limpia los datos del cliente y quita la hora de los cupos", async () => {
    const fecha = proximoLunes();
    const inicio = await primerCupo(fecha);
    const r = await casos.reservar(entorno, SLUG_EJEMPLO, { servicioId: "srv-corte", fecha, inicio, cliente });
    expect(r).toMatchObject({ estado: "confirmada", fecha, inicio, precio: 25000, servicioNombre: "Corte clásico" });
    expect(r.cliente).toEqual({ nombre: "María José Pérez", telefono: "3001234567", correo: "maria@correo.com" });
    const [dia] = await casos.disponibilidad(entorno, SLUG_EJEMPLO, "srv-corte", fecha, 1);
    expect(dia?.cupos).not.toContain(inicio);
  });

  it("rechaza la segunda reserva de la misma hora aunque las dos hayan visto el cupo libre", async () => {
    const fecha = proximoLunes();
    const inicio = await primerCupo(fecha);
    const pedido = { servicioId: "srv-corte", fecha, inicio, cliente };
    const resultados = await Promise.allSettled([
      casos.reservar(entorno, SLUG_EJEMPLO, pedido),
      casos.reservar(entorno, SLUG_EJEMPLO, pedido),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const fallo = resultados.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(fallo.reason).toBeInstanceOf(ErrorCupo);
    expect((fallo.reason as ErrorCupo).codigo).toBe("ocupado");
  });

  it("no deja reservar el domingo, que está cerrado", async () => {
    let domingo = HOY;
    while (diaSemana(domingo) !== 0) domingo = sumarDias(domingo, 1);
    await expect(
      casos.reservar(entorno, SLUG_EJEMPLO, { servicioId: "srv-corte", fecha: domingo, inicio: "10:00", cliente }),
    ).rejects.toMatchObject({ codigo: "ocupado" });
  });

  it("valida el celular", async () => {
    const fecha = proximoLunes();
    await expect(
      casos.reservar(entorno, SLUG_EJEMPLO, { servicioId: "srv-corte", fecha, inicio: "09:00", cliente: { nombre: "Ana", telefono: "12" } }),
    ).rejects.toMatchObject({ codigo: "invalido" });
  });
});

describe("cancelar", () => {
  it("el cliente cancela con su código y la hora vuelve a quedar libre", async () => {
    const fecha = proximoLunes();
    const inicio = await primerCupo(fecha);
    const r = await casos.reservar(entorno, SLUG_EJEMPLO, { servicioId: "srv-corte", fecha, inicio, cliente });
    await expect(casos.cancelarReserva(entorno, r.id, "MALO")).rejects.toMatchObject({ codigo: "no_encontrado" });
    const cancelada = await casos.cancelarReserva(entorno, r.id, r.codigo.toLowerCase());
    expect(cancelada.estado).toBe("cancelada");
    const [dia] = await casos.disponibilidad(entorno, SLUG_EJEMPLO, "srv-corte", fecha, 1);
    expect(dia?.cupos).toContain(inicio);
  });

  it("no se puede cancelar después de la hora", async () => {
    const fecha = proximoLunes();
    const inicio = await primerCupo(fecha);
    const r = await casos.reservar(entorno, SLUG_EJEMPLO, { servicioId: "srv-corte", fecha, inicio, cliente });
    ahora = { fecha: sumarDias(fecha, 1), minutos: 0 };
    await expect(casos.cancelarReserva(entorno, r.id, r.codigo)).rejects.toMatchObject({ codigo: "invalido" });
  });
});

describe("panel del dueño", () => {
  it("solo ve y marca las reservas de su propio negocio", async () => {
    const otro = await casos.crearNegocio(entorno, "otro-dueno", {
      nombre: "Barbería El Parche", direccion: "Calle 10", ciudad: "Soledad", telefono: "301",
    });
    expect(otro.slug).toBe("barberia-el-parche-2");
    const [reserva] = await casos.agenda(entorno, DUENO_EJEMPLO, sumarDias(HOY, 1), sumarDias(HOY, 6));
    await expect(casos.marcarReserva(entorno, "otro-dueno", reserva!.id, "atendida")).rejects.toMatchObject({ codigo: "no_encontrado" });
    const marcada = await casos.marcarReserva(entorno, DUENO_EJEMPLO, reserva!.id, "atendida");
    expect(marcada.estado).toBe("atendida");
  });

  it("no deja pasar una reserva cancelada a atendida", async () => {
    const todas = await casos.agenda(entorno, DUENO_EJEMPLO, sumarDias(HOY, -6), HOY);
    const cancelada = todas.find((r) => r.estado === "cancelada");
    expect(cancelada).toBeDefined();
    await expect(casos.marcarReserva(entorno, DUENO_EJEMPLO, cancelada!.id, "atendida")).rejects.toMatchObject({ codigo: "invalido" });
  });

  it("rechaza franjas del horario que se cruzan", async () => {
    await expect(
      casos.guardarHorario(entorno, DUENO_EJEMPLO, {
        semana: { 1: [{ desde: "09:00", hasta: "12:00" }, { desde: "11:00", hasta: "13:00" }] },
      }),
    ).rejects.toMatchObject({ codigo: "invalido" });
  });

  it("el resumen cuenta solo lo atendido como ingresos", async () => {
    const r = await casos.resumen(entorno, DUENO_EJEMPLO);
    const todas = await casos.agenda(entorno, DUENO_EJEMPLO, r.desde, r.hasta);
    const atendidas = todas.filter((x) => x.estado === "atendida");
    expect(r.ingresos).toBe(atendidas.reduce((t, x) => t + x.precio, 0));
    expect(r.porDia).toHaveLength(7);
    expect(r.ocupacion).toBeGreaterThan(0);
    expect(r.ocupacion).toBeLessThanOrEqual(100);
  });
});
