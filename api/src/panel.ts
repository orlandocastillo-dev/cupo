import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as casos from "@cupo/core";
import { entornoAws } from "./entorno";
import { consulta, cuerpo, enrutador, parametro, usuario } from "./http";

// Rutas del dueño. API Gateway exige un token de Cognito válido antes de llamar esta Lambda.

const TIPOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export interface Fotos {
  /** Devuelve a dónde subir la foto con PUT y la dirección pública con la que queda. */
  urlSubida(negocioId: string, tipo: string): Promise<{ subida: string; publica: string }>;
}

export function fotosS3(bucket: string, cdn: string, s3 = new S3Client({})): Fotos {
  return {
    async urlSubida(negocioId, tipo) {
      const llave = `negocios/${negocioId}/${casos.nuevoId()}.${TIPOS_FOTO[tipo]}`;
      const subida = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: llave, ContentType: tipo }), { expiresIn: 300 });
      return { subida, publica: `https://${cdn}/${llave}` };
    },
  };
}

export function rutasPanel(entorno: casos.Entorno, fotos: Fotos) {
  return enrutador({
    "GET /panel": (e) => casos.miNegocio(entorno, usuario(e)),
    "POST /panel/negocio": (e) => casos.crearNegocio(entorno, usuario(e), cuerpo(e)),
    "PUT /panel/negocio": (e) => casos.actualizarNegocio(entorno, usuario(e), cuerpo(e)),

    "POST /panel/servicios": (e) => casos.guardarServicio(entorno, usuario(e), cuerpo(e)),
    "PUT /panel/servicios/{id}": (e) => casos.guardarServicio(entorno, usuario(e), cuerpo(e), parametro(e, "id")),
    "DELETE /panel/servicios/{id}": (e) => casos.borrarServicio(entorno, usuario(e), parametro(e, "id")),

    "PUT /panel/horario": (e) => casos.guardarHorario(entorno, usuario(e), cuerpo(e)),

    "GET /panel/agenda": (e) => casos.agenda(entorno, usuario(e), consulta(e, "desde"), consulta(e, "hasta")),
    "POST /panel/reservas/{id}/estado": (e) => casos.marcarReserva(entorno, usuario(e), parametro(e, "id"), cuerpo(e).estado),
    "GET /panel/resumen": (e) => casos.resumen(entorno, usuario(e)),

    "POST /panel/foto": async (e) => {
      const tipo = String(cuerpo(e).tipo ?? "");
      if (!TIPOS_FOTO[tipo]) throw casos.invalido("La foto debe ser JPG, PNG o WebP.");
      const mio = await entorno.repo.negocioDeDueno(usuario(e));
      if (!mio) throw casos.noEncontrado("Primero crea tu negocio.");
      return fotos.urlSubida(mio.id, tipo);
    },
  });
}

export const handler = rutasPanel(entornoAws(), fotosS3(process.env.BUCKET_FOTOS ?? "", process.env.CDN ?? ""));
