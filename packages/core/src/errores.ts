export type CodigoError = "invalido" | "no_encontrado" | "ocupado" | "prohibido" | "no_autenticado";

const ESTADO_HTTP: Record<CodigoError, number> = {
  invalido: 400,
  no_autenticado: 401,
  prohibido: 403,
  no_encontrado: 404,
  ocupado: 409,
};

/** Error que se le puede mostrar al usuario tal cual. */
export class ErrorCupo extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorCupo";
  }

  get estadoHttp(): number {
    return ESTADO_HTTP[this.codigo];
  }
}

export const invalido = (mensaje: string) => new ErrorCupo("invalido", mensaje);
export const noEncontrado = (mensaje: string) => new ErrorCupo("no_encontrado", mensaje);
