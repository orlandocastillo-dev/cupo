import { momentoEn, nuevoCodigo, nuevoId, type Entorno } from "@cupo/core";
import { RepositorioDynamo } from "./dynamo";

export const SITIO = process.env.SITIO ?? "http://localhost:3000";

let repo: RepositorioDynamo | undefined;

/** Se crea una vez por contenedor de Lambda y se reutiliza entre invocaciones. */
export function repositorioAws(): RepositorioDynamo {
  repo ??= new RepositorioDynamo(process.env.TABLA ?? "cupo");
  return repo;
}

export function entornoAws(): Entorno {
  return { repo: repositorioAws(), ahora: () => momentoEn(new Date()), nuevoId, nuevoCodigo };
}
