import { describe, expect, it } from "vitest";
import { cuposDelDia, motivoDia } from "../src/cupos";
import { bloquesDe, momentoEn } from "../src/tiempo";
import type { Horario, Negocio, Reserva, Servicio } from "../src/tipos";

const negocio: Negocio = {
  id: "n1", slug: "n1", nombre: "Prueba", tipo: "barberia", descripcion: "", direccion: "Calle 1", ciudad: "Barranquilla",
  telefono: "300", intervaloMin: 30, diasAdelante: 14, avisoMin: 60,
};
const horario: Horario = {
  semana: { 1: [{ desde: "09:00", hasta: "12:00" }, { desde: "14:00", hasta: "16:00" }] },
  cerrado: ["2026-11-02"],
};
const corte: Servicio = { id: "s1", negocioId: "n1", nombre: "Corte", duracionMin: 30, precio: 20000, activo: true };
const combo: Servicio = { ...corte, id: "s2", duracionMin: 60 };
// 2026-10-26 es lunes.
const LUNES = "2026-10-26";
const domingoAntes = { fecha: "2026-10-25", minutos: 10 * 60 };

function reserva(inicio: string, fin: string, estado: Reserva["estado"] = "confirmada"): Reserva {
  return {
    id: inicio, negocioId: "n1", servicioId: "s1", servicioNombre: "Corte", precio: 0, fecha: LUNES, inicio, fin,
    cliente: { nombre: "A", telefono: "3000000000" }, estado, codigo: "X", creada: "",
  };
}

describe("cuposDelDia", () => {
  it("ofrece cupos cada intervalo dentro de las franjas abiertas", () => {
    const cupos = cuposDelDia({ negocio, horario, servicio: corte, reservas: [], fecha: LUNES, ahora: domingoAntes });
    expect(cupos).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"]);
  });

  it("no ofrece una hora si el servicio no alcanza a terminar antes de cerrar la franja", () => {
    const cupos = cuposDelDia({ negocio, horario, servicio: combo, reservas: [], fecha: LUNES, ahora: domingoAntes });
    expect(cupos).not.toContain("11:30");
    expect(cupos).not.toContain("15:30");
    expect(cupos).toContain("15:00");
  });

  it("descarta las horas que se cruzan con otra reserva activa", () => {
    const reservas = [reserva("10:00", "11:00")];
    const cupos = cuposDelDia({ negocio, horario, servicio: combo, reservas, fecha: LUNES, ahora: domingoAntes });
    // Un servicio de 1 hora a las 9:30 terminaría 10:30 y choca; a las 9:00 termina justo a las 10:00.
    expect(cupos).toContain("09:00");
    expect(cupos).not.toContain("09:30");
    expect(cupos).not.toContain("10:00");
    expect(cupos).not.toContain("10:30");
    expect(cupos).toContain("11:00");
  });

  it("una reserva cancelada deja libre su hora", () => {
    const reservas = [reserva("10:00", "10:30", "cancelada")];
    const cupos = cuposDelDia({ negocio, horario, servicio: corte, reservas, fecha: LUNES, ahora: domingoAntes });
    expect(cupos).toContain("10:00");
  });

  it("hoy solo ofrece horas que respetan el aviso mínimo", () => {
    const ahora = { fecha: LUNES, minutos: 9 * 60 + 40 };
    const cupos = cuposDelDia({ negocio, horario, servicio: corte, reservas: [], fecha: LUNES, ahora });
    expect(cupos[0]).toBe("11:00");
  });

  it("no ofrece nada en días cerrados, pasados o muy lejanos", () => {
    expect(motivoDia(negocio, horario, "2026-11-02", domingoAntes)).toBe("cerrado");
    expect(motivoDia(negocio, horario, "2026-10-27", domingoAntes)).toBe("cerrado");
    expect(motivoDia(negocio, horario, "2026-10-20", domingoAntes)).toBe("pasado");
    expect(motivoDia(negocio, horario, "2026-11-16", domingoAntes)).toBe("muy_lejos");
    expect(motivoDia(negocio, horario, LUNES, domingoAntes)).toBeNull();
  });
});

describe("tiempo", () => {
  it("divide una cita en bloques de 15 minutos", () => {
    expect(bloquesDe("09:00", 45)).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("usa la hora de Colombia aunque el servidor esté en UTC", () => {
    expect(momentoEn(new Date("2026-10-27T03:30:00Z"))).toEqual({ fecha: "2026-10-26", minutos: 22 * 60 + 30 });
  });
});
