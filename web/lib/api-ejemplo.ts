import * as casos from "@cupo/core";
import { DUENO_EJEMPLO, ErrorCupo, RepositorioEnMemoria, datosDeEjemplo, momentoEn, nuevoCodigo, nuevoId, type DatosMemoria } from "@cupo/core";
import { ErrorApi, type ApiCupo } from "./api";

// Modo de ejemplo: las mismas funciones que corren en Lambda, pero con los datos en el navegador.

const LLAVE = "cupo:ejemplo:v1";

interface Guardado {
  creado: string;
  datos: DatosMemoria;
}

function leer(): RepositorioEnMemoria {
  const { fecha: hoy } = momentoEn(new Date());
  try {
    const guardado = JSON.parse(localStorage.getItem(LLAVE) ?? "null") as Guardado | null;
    // El ejemplo se arma alrededor del día de hoy; si es de otro día, se vuelve a armar.
    if (guardado?.creado === hoy) return new RepositorioEnMemoria(guardado.datos);
  } catch {
    // Sin almacenamiento (modo privado) se trabaja solo en memoria.
  }
  return new RepositorioEnMemoria(datosDeEjemplo(hoy, momentoEn(new Date()).minutos));
}

let repo: RepositorioEnMemoria | null = null;

function entorno(): casos.Entorno {
  repo ??= leer();
  return { repo, ahora: () => momentoEn(new Date()), nuevoId, nuevoCodigo };
}

function guardar() {
  if (!repo) return;
  try {
    localStorage.setItem(LLAVE, JSON.stringify({ creado: momentoEn(new Date()).fecha, datos: repo.exportar() } satisfies Guardado));
  } catch {
    // Igual queda en memoria mientras la pestaña esté abierta.
  }
}

export function reiniciarEjemplo() {
  try {
    localStorage.removeItem(LLAVE);
  } catch {
    // nada que borrar
  }
  repo = null;
}

const pausa = () => new Promise((r) => setTimeout(r, 120));

async function ejecutar<T>(fn: (e: casos.Entorno) => Promise<T>, cambia = false): Promise<T> {
  await pausa();
  try {
    const resultado = await fn(entorno());
    if (cambia) guardar();
    return structuredClone(resultado);
  } catch (e) {
    if (e instanceof ErrorCupo) throw new ErrorApi(e.codigo, e.message);
    throw e;
  }
}

function comoDataUrl(archivo: File, lado = 900): Promise<string> {
  return new Promise((resolver, fallar) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, lado / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext("2d")?.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(img.src);
      resolver(lienzo.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => fallar(new ErrorApi("invalido", "No pudimos leer esa imagen."));
    img.src = URL.createObjectURL(archivo);
  });
}

export const apiEjemplo: ApiCupo = {
  modo: "ejemplo",
  verNegocio: (slug) => ejecutar((e) => casos.verNegocio(e, slug)),
  disponibilidad: (slug, servicioId, desde, dias) => ejecutar((e) => casos.disponibilidad(e, slug, servicioId, desde, dias)),
  reservar: (slug, entrada) => ejecutar((e) => casos.reservar(e, slug, entrada), true),
  verReserva: (id, codigo) => ejecutar((e) => casos.verReserva(e, id, codigo)),
  cancelarReserva: (id, codigo) => ejecutar((e) => casos.cancelarReserva(e, id, codigo), true),

  miNegocio: () => ejecutar((e) => casos.miNegocio(e, DUENO_EJEMPLO)),
  crearNegocio: (datos) => ejecutar((e) => casos.crearNegocio(e, DUENO_EJEMPLO, datos), true),
  actualizarNegocio: (datos) => ejecutar((e) => casos.actualizarNegocio(e, DUENO_EJEMPLO, datos), true),
  guardarServicio: (datos, id) => ejecutar((e) => casos.guardarServicio(e, DUENO_EJEMPLO, datos, id), true),
  borrarServicio: (id) => ejecutar((e) => casos.borrarServicio(e, DUENO_EJEMPLO, id), true),
  guardarHorario: (horario) => ejecutar((e) => casos.guardarHorario(e, DUENO_EJEMPLO, horario), true),
  agenda: (desde, hasta) => ejecutar((e) => casos.agenda(e, DUENO_EJEMPLO, desde, hasta)),
  marcarReserva: (id, estado) => ejecutar((e) => casos.marcarReserva(e, DUENO_EJEMPLO, id, estado), true),
  resumen: () => ejecutar((e) => casos.resumen(e, DUENO_EJEMPLO)),
  subirFoto: (archivo) => comoDataUrl(archivo),
};
