import type { ApiCupo } from "./api";
import { ErrorApi } from "./api";
import { token } from "./sesion";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown, conSesion = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers["content-type"] = "application/json";
  if (conSesion) {
    const t = await token();
    if (!t) throw new ErrorApi("no_autenticado", "Tu sesión se cerró. Vuelve a entrar.");
    headers.authorization = `Bearer ${t}`;
  }
  let r: Response;
  try {
    r = await fetch(`${BASE}${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch {
    throw new ErrorApi("red", "No hay conexión. Revisa tu internet e intenta de nuevo.");
  }
  if (r.status === 204) return undefined as T;
  const datos = await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401) throw new ErrorApi("no_autenticado", "Tu sesión se cerró. Vuelve a entrar.");
    throw new ErrorApi(datos?.error ?? "interno", datos?.mensaje ?? "Algo falló. Intenta de nuevo.");
  }
  return datos as T;
}

const q = (params: Record<string, string | number>) => new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
const s = encodeURIComponent;

export const apiAws: ApiCupo = {
  modo: "aws",
  verNegocio: (slug) => pedir("GET", `/negocios/${s(slug)}`),
  disponibilidad: (slug, servicio, desde, dias) => pedir("GET", `/negocios/${s(slug)}/disponibilidad?${q({ servicio, desde, dias })}`),
  reservar: (slug, entrada) => pedir("POST", `/negocios/${s(slug)}/reservas`, entrada),
  verReserva: (id, codigo) => pedir("GET", `/reservas/${s(id)}?${q({ codigo })}`),
  cancelarReserva: (id, codigo) => pedir("POST", `/reservas/${s(id)}/cancelar`, { codigo }),

  miNegocio: () => pedir("GET", "/panel", undefined, true),
  crearNegocio: (datos) => pedir("POST", "/panel/negocio", datos, true),
  actualizarNegocio: (datos) => pedir("PUT", "/panel/negocio", datos, true),
  guardarServicio: (datos, id) => (id ? pedir("PUT", `/panel/servicios/${s(id)}`, datos, true) : pedir("POST", "/panel/servicios", datos, true)),
  borrarServicio: (id) => pedir("DELETE", `/panel/servicios/${s(id)}`, undefined, true),
  guardarHorario: (horario) => pedir("PUT", "/panel/horario", horario, true),
  agenda: (desde, hasta) => pedir("GET", `/panel/agenda?${q({ desde, hasta })}`, undefined, true),
  marcarReserva: (id, estado) => pedir("POST", `/panel/reservas/${s(id)}/estado`, { estado }, true),
  resumen: () => pedir("GET", "/panel/resumen", undefined, true),

  async subirFoto(archivo) {
    const { subida, publica } = await pedir<{ subida: string; publica: string }>("POST", "/panel/foto", { tipo: archivo.type }, true);
    const r = await fetch(subida, { method: "PUT", headers: { "content-type": archivo.type }, body: archivo });
    if (!r.ok) throw new ErrorApi("interno", "No se pudo subir la foto.");
    return publica;
  },
};
