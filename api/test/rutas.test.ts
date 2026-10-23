import { beforeEach, describe, expect, it, vi } from "vitest";
import { DUENO_EJEMPLO, RepositorioEnMemoria, SLUG_EJEMPLO, datosDeEjemplo, diaSemana, sumarDias, type Entorno } from "@cupo/core";
import type { Evento, Respuesta } from "../src/http";
import { rutasPanel } from "../src/panel";
import { rutasPublicas } from "../src/publico";

const HOY = "2026-10-23";
let entorno: Entorno;
let enviados: { para: string; asunto: string }[];
let publico: (e: Evento) => Promise<Respuesta>;
let panel: (e: Evento) => Promise<Respuesta>;

function evento(routeKey: string, opciones: { path?: Record<string, string>; query?: Record<string, string>; body?: unknown; sub?: string } = {}): Evento {
  const [method] = routeKey.split(" ");
  return {
    routeKey,
    pathParameters: opciones.path,
    queryStringParameters: opciones.query,
    body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    isBase64Encoded: false,
    requestContext: {
      http: { method },
      ...(opciones.sub ? { authorizer: { jwt: { claims: { sub: opciones.sub }, scopes: [] } } } : {}),
    },
  } as unknown as Evento;
}

async function leer(r: Promise<Respuesta>) {
  const res = (await r) as { statusCode: number; body: string };
  return { status: res.statusCode, datos: res.body ? JSON.parse(res.body) : undefined };
}

function lunes() {
  let f = sumarDias(HOY, 1);
  while (diaSemana(f) !== 1) f = sumarDias(f, 1);
  return f;
}

beforeEach(() => {
  let n = 0;
  enviados = [];
  entorno = {
    repo: new RepositorioEnMemoria(datosDeEjemplo(HOY)),
    ahora: () => ({ fecha: HOY, minutos: 8 * 60 }),
    nuevoId: () => `id-${++n}`,
    nuevoCodigo: () => "ABC234",
  };
  publico = rutasPublicas(entorno, async (m) => void enviados.push(m), "https://cupo.test");
  panel = rutasPanel(entorno, { urlSubida: async (id, tipo) => ({ subida: `https://s3/${id}?${tipo}`, publica: `https://cdn/${id}` }) });
});

describe("rutas públicas", () => {
  it("muestra el negocio y sus servicios activos", async () => {
    const { status, datos } = await leer(publico(evento("GET /negocios/{slug}", { path: { slug: SLUG_EJEMPLO } })));
    expect(status).toBe(200);
    expect(datos.negocio.nombre).toBe("Barbería El Parche");
    expect(datos.servicios.length).toBeGreaterThan(0);
  });

  it("responde 404 con un mensaje si el negocio no existe", async () => {
    const { status, datos } = await leer(publico(evento("GET /negocios/{slug}", { path: { slug: "nada" } })));
    expect(status).toBe(404);
    expect(datos).toEqual({ error: "no_encontrado", mensaje: "No encontramos ese negocio." });
  });

  it("reserva, manda el correo y devuelve 409 si otra persona pide la misma hora", async () => {
    const fecha = lunes();
    const disp = await leer(
      publico(evento("GET /negocios/{slug}/disponibilidad", { path: { slug: SLUG_EJEMPLO }, query: { servicio: "srv-corte", desde: fecha, dias: "1" } })),
    );
    const inicio = disp.datos[0].cupos.at(-1);
    const pedido = { servicioId: "srv-corte", fecha, inicio, cliente: { nombre: "Laura Gómez", telefono: "3015550000", correo: "laura@correo.com" } };

    const primera = await leer(publico(evento("POST /negocios/{slug}/reservas", { path: { slug: SLUG_EJEMPLO }, body: pedido })));
    expect(primera.status).toBe(200);
    expect(enviados).toHaveLength(1);
    expect(enviados[0]?.para).toBe("laura@correo.com");

    const segunda = await leer(publico(evento("POST /negocios/{slug}/reservas", { path: { slug: SLUG_EJEMPLO }, body: pedido })));
    expect(segunda.status).toBe(409);
  });

  it("la reserva queda aunque el correo falle", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    publico = rutasPublicas(entorno, async () => { throw new Error("SES caído"); }, "https://cupo.test");
    const fecha = lunes();
    const disp = await leer(
      publico(evento("GET /negocios/{slug}/disponibilidad", { path: { slug: SLUG_EJEMPLO }, query: { servicio: "srv-corte", desde: fecha, dias: "1" } })),
    );
    const pedido = { servicioId: "srv-corte", fecha, inicio: disp.datos[0].cupos[0], cliente: { nombre: "Laura", telefono: "3015550000", correo: "l@c.co" } };
    const r = await leer(publico(evento("POST /negocios/{slug}/reservas", { path: { slug: SLUG_EJEMPLO }, body: pedido })));
    expect(r.status).toBe(200);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const e = { ...evento("POST /negocios/{slug}/reservas", { path: { slug: SLUG_EJEMPLO } }), body: "hola" } as Evento;
    expect((await leer(publico(e))).status).toBe(400);
  });
});

describe("rutas del panel", () => {
  it("sin usuario de Cognito responde 401", async () => {
    expect((await leer(panel(evento("GET /panel")))).status).toBe(401);
  });

  it("el dueño ve su negocio y la agenda", async () => {
    const mio = await leer(panel(evento("GET /panel", { sub: DUENO_EJEMPLO })));
    expect(mio.datos.negocio.slug).toBe(SLUG_EJEMPLO);
    const agenda = await leer(panel(evento("GET /panel/agenda", { sub: DUENO_EJEMPLO, query: { desde: HOY, hasta: sumarDias(HOY, 6) } })));
    expect(agenda.status).toBe(200);
    expect(agenda.datos.every((r: { fecha: string }) => r.fecha >= HOY)).toBe(true);
  });

  it("un usuario nuevo crea su negocio y no puede crear otro", async () => {
    const datos = { nombre: "Consultorio Dra. Ríos", tipo: "consultorio", direccion: "Calle 84 # 50-20", ciudad: "Barranquilla", telefono: "3200000000" };
    const creado = await leer(panel(evento("POST /panel/negocio", { sub: "nuevo", body: datos })));
    expect(creado.datos.slug).toBe("consultorio-dra-rios");
    expect((await leer(panel(evento("POST /panel/negocio", { sub: "nuevo", body: datos })))).status).toBe(400);
  });

  it("solo acepta fotos JPG, PNG o WebP", async () => {
    expect((await leer(panel(evento("POST /panel/foto", { sub: DUENO_EJEMPLO, body: { tipo: "application/pdf" } })))).status).toBe(400);
    const ok = await leer(panel(evento("POST /panel/foto", { sub: DUENO_EJEMPLO, body: { tipo: "image/webp" } })));
    expect(ok.datos.publica).toBe("https://cdn/neg-el-parche");
  });
});
