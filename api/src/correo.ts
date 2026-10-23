import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import type { Negocio, Reserva } from "@cupo/core";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function fechaLarga(fecha: string) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${fecha}T12:00:00Z`),
  );
}

function hora12(hora: string) {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

export interface Mensaje {
  para: string;
  asunto: string;
  texto: string;
}

export function confirmacion(r: Reserva, negocio: Negocio, sitio: string): Mensaje {
  const enlace = `${sitio}/reserva/${r.id}?codigo=${r.codigo}`;
  return {
    para: r.cliente.correo!,
    asunto: `Tu cita en ${negocio.nombre} quedó reservada`,
    texto: [
      `Hola, ${r.cliente.nombre.split(" ")[0]}.`,
      "",
      `Te esperamos el ${fechaLarga(r.fecha)} a las ${hora12(r.inicio)} para ${r.servicioNombre} (${pesos.format(r.precio)}).`,
      `${negocio.nombre}, ${negocio.direccion}, ${negocio.ciudad}.`,
      "",
      `Tu código es ${r.codigo}. Si no puedes ir, cancela aquí para que otra persona tome la hora:`,
      enlace,
    ].join("\n"),
  };
}

export function recordatorio(r: Reserva, negocio: Negocio, sitio: string): Mensaje {
  return {
    para: r.cliente.correo!,
    asunto: `Mañana tienes cita en ${negocio.nombre}`,
    texto: [
      `Hola, ${r.cliente.nombre.split(" ")[0]}.`,
      "",
      `Te recordamos tu cita de mañana a las ${hora12(r.inicio)}: ${r.servicioNombre}.`,
      `${negocio.direccion}, ${negocio.ciudad}.`,
      "",
      `Si ya no puedes ir, cancela aquí: ${sitio}/reserva/${r.id}?codigo=${r.codigo}`,
    ].join("\n"),
  };
}

export type Enviar = (m: Mensaje) => Promise<void>;

/** Envía con SES si hay remitente configurado. Sin remitente (o en pruebas) no hace nada. */
export function enviadorSes(remitente: string | undefined, cliente = new SESv2Client({})): Enviar {
  return async (m) => {
    if (!remitente) return;
    await cliente.send(
      new SendEmailCommand({
        FromEmailAddress: remitente,
        Destination: { ToAddresses: [m.para] },
        Content: { Simple: { Subject: { Data: m.asunto, Charset: "UTF-8" }, Body: { Text: { Data: m.texto, Charset: "UTF-8" } } } },
      }),
    );
  };
}
