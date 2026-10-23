import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { ErrorCupo, invalido } from "@cupo/core";

export type Evento = APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer;
export type Respuesta = APIGatewayProxyResultV2;
export type Ruta = (evento: Evento) => Promise<unknown>;

export function json(status: number, cuerpo: unknown): Respuesta {
  return {
    statusCode: status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    body: cuerpo === undefined ? "" : JSON.stringify(cuerpo),
  };
}

export function cuerpo(evento: Evento): Record<string, unknown> {
  if (!evento.body) return {};
  try {
    const texto = evento.isBase64Encoded ? Buffer.from(evento.body, "base64").toString("utf8") : evento.body;
    const valor = JSON.parse(texto);
    if (valor && typeof valor === "object" && !Array.isArray(valor)) return valor;
  } catch {
    // cae abajo
  }
  throw invalido("El cuerpo de la petición debe ser un JSON.");
}

export function parametro(evento: Evento, nombre: string): string {
  const valor = evento.pathParameters?.[nombre];
  if (!valor) throw invalido(`Falta ${nombre} en la dirección.`);
  return decodeURIComponent(valor);
}

export function consulta(evento: Evento, nombre: string): string | undefined {
  return evento.queryStringParameters?.[nombre];
}

/** El usuario de Cognito que hace la petición. API Gateway ya validó el token antes de llegar aquí. */
export function usuario(evento: Evento): string {
  const claims = "authorizer" in evento.requestContext ? evento.requestContext.authorizer?.jwt?.claims : undefined;
  const sub = claims?.sub;
  if (typeof sub !== "string") throw new ErrorCupo("no_autenticado", "Inicia sesión para continuar.");
  return sub;
}

/** Busca la ruta por su routeKey ("GET /negocios/{slug}") y convierte los errores en respuestas. */
export function enrutador(rutas: Record<string, Ruta>) {
  return async (evento: Evento): Promise<Respuesta> => {
    const ruta = rutas[evento.routeKey];
    if (!ruta) return json(404, { error: "no_encontrado", mensaje: "Esa ruta no existe." });
    try {
      const resultado = await ruta(evento);
      return resultado === undefined ? json(204, undefined) : json(200, resultado);
    } catch (e) {
      if (e instanceof ErrorCupo) return json(e.estadoHttp, { error: e.codigo, mensaje: e.message });
      console.error(JSON.stringify({ ruta: evento.routeKey, error: String(e), pila: (e as Error)?.stack }));
      return json(500, { error: "interno", mensaje: "Algo falló de nuestro lado. Intenta de nuevo." });
    }
  };
}
