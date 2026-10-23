import * as casos from "@cupo/core";
import { confirmacion, enviadorSes, type Enviar } from "./correo";
import { entornoAws, SITIO } from "./entorno";
import { consulta, cuerpo, enrutador, parametro } from "./http";

// Rutas que usa cualquier persona para reservar, sin cuenta.

export function rutasPublicas(entorno: casos.Entorno, enviar: Enviar, sitio: string) {
  return enrutador({
    "GET /negocios/{slug}": (e) => casos.verNegocio(entorno, parametro(e, "slug")),

    "GET /negocios/{slug}/disponibilidad": (e) =>
      casos.disponibilidad(
        entorno,
        parametro(e, "slug"),
        consulta(e, "servicio") ?? "",
        consulta(e, "desde") ?? entorno.ahora().fecha,
        Number(consulta(e, "dias") ?? 14),
      ),

    "POST /negocios/{slug}/reservas": async (e) => {
      const datos = cuerpo(e);
      const reserva = await casos.reservar(entorno, parametro(e, "slug"), {
        servicioId: String(datos.servicioId ?? ""),
        fecha: String(datos.fecha ?? ""),
        inicio: String(datos.inicio ?? ""),
        cliente: datos.cliente,
      });
      if (reserva.cliente.correo) {
        // El correo es un extra: si SES falla, la reserva ya quedó y no se le muestra error al cliente.
        const negocio = await entorno.repo.negocioPorId(reserva.negocioId);
        if (negocio) await enviar(confirmacion(reserva, negocio, sitio)).catch((err) => console.error("correo", String(err)));
      }
      return reserva;
    },

    "GET /reservas/{id}": (e) => casos.verReserva(entorno, parametro(e, "id"), consulta(e, "codigo")),

    "POST /reservas/{id}/cancelar": (e) => casos.cancelarReserva(entorno, parametro(e, "id"), cuerpo(e).codigo),
  });
}

export const handler = rutasPublicas(entornoAws(), enviadorSes(process.env.REMITENTE), SITIO);
