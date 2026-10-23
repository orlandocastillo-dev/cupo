import { momentoEn, sumarDias, type Negocio } from "@cupo/core";
import { enviadorSes, recordatorio, type Enviar } from "./correo";
import { repositorioAws, SITIO } from "./entorno";
import type { RepositorioDynamo } from "./dynamo";

// EventBridge la llama todos los días a las 6 p. m. de Colombia: avisa a quien tiene cita mañana.

export async function enviarRecordatorios(repo: Pick<RepositorioDynamo, "reservasDelDia" | "negocioPorId">, enviar: Enviar, hoy: string) {
  const manana = sumarDias(hoy, 1);
  const reservas = (await repo.reservasDelDia(manana)).filter((r) => r.estado === "confirmada" && r.cliente.correo);
  const negocios = new Map<string, Negocio | null>();
  let enviados = 0;
  for (const r of reservas) {
    if (!negocios.has(r.negocioId)) negocios.set(r.negocioId, await repo.negocioPorId(r.negocioId));
    const negocio = negocios.get(r.negocioId);
    if (!negocio) continue;
    try {
      await enviar(recordatorio(r, negocio, SITIO));
      enviados++;
    } catch (e) {
      console.error(JSON.stringify({ reserva: r.id, error: String(e) }));
    }
  }
  return { fecha: manana, reservas: reservas.length, enviados };
}

export async function handler() {
  const resultado = await enviarRecordatorios(repositorioAws(), enviadorSes(process.env.REMITENTE), momentoEn(new Date()).fecha);
  console.log(JSON.stringify(resultado));
  return resultado;
}
