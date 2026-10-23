import { invalido } from "./errores";
import { aMinutos, BLOQUE_MIN, esFecha, esHora } from "./tiempo";
import type { Cliente, Franja, Horario, Negocio, Servicio, TipoNegocio } from "./tipos";

const TIPOS: TipoNegocio[] = ["barberia", "peluqueria", "consultorio", "cancha", "spa", "otro"];

function texto(valor: unknown, campo: string, max = 120, min = 1): string {
  if (typeof valor !== "string" || valor.trim().length < min) throw invalido(`Falta ${campo}.`);
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (limpio.length > max) throw invalido(`${campo[0]?.toUpperCase()}${campo.slice(1)} es muy largo (máximo ${max}).`);
  return limpio;
}

function entero(valor: unknown, campo: string, min: number, max: number): number {
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw invalido(`${campo} debe estar entre ${min} y ${max}.`);
  }
  return n;
}

export function validarCliente(entrada: unknown): Cliente {
  const c = (entrada ?? {}) as Record<string, unknown>;
  const telefono = texto(c.telefono, "el celular", 20).replace(/[^\d+]/g, "");
  if (!/^\+?\d{7,15}$/.test(telefono)) throw invalido("El celular no parece válido.");
  const cliente: Cliente = { nombre: texto(c.nombre, "el nombre", 80, 2), telefono };
  if (typeof c.correo === "string" && c.correo.trim()) {
    const correo = c.correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw invalido("El correo no parece válido.");
    cliente.correo = correo;
  }
  return cliente;
}

export function validarFecha(valor: unknown): string {
  if (!esFecha(valor)) throw invalido("La fecha no es válida.");
  return valor;
}

export function validarHora(valor: unknown): string {
  if (!esHora(valor)) throw invalido("La hora no es válida.");
  return valor;
}

export function validarServicio(entrada: unknown, negocioId: string, id: string): Servicio {
  const s = (entrada ?? {}) as Record<string, unknown>;
  const duracionMin = entero(s.duracionMin, "La duración", BLOQUE_MIN, 8 * 60);
  if (duracionMin % BLOQUE_MIN) throw invalido(`La duración debe ser múltiplo de ${BLOQUE_MIN} minutos.`);
  return {
    id,
    negocioId,
    nombre: texto(s.nombre, "el nombre del servicio", 60),
    duracionMin,
    precio: entero(s.precio, "El precio", 0, 10_000_000),
    activo: s.activo !== false,
  };
}

function validarFranjas(valor: unknown): Franja[] {
  if (!Array.isArray(valor)) return [];
  const franjas = valor.map((f) => {
    const { desde, hasta } = (f ?? {}) as Record<string, unknown>;
    const franja = { desde: validarHora(desde), hasta: validarHora(hasta) };
    if (aMinutos(franja.desde) >= aMinutos(franja.hasta)) throw invalido("Cada franja debe terminar después de empezar.");
    return franja;
  });
  franjas.sort((a, b) => aMinutos(a.desde) - aMinutos(b.desde));
  for (let i = 1; i < franjas.length; i++) {
    if (aMinutos(franjas[i]!.desde) < aMinutos(franjas[i - 1]!.hasta)) throw invalido("Hay franjas que se cruzan en el mismo día.");
  }
  return franjas;
}

export function validarHorario(entrada: unknown): Horario {
  const h = (entrada ?? {}) as Record<string, unknown>;
  const semana: Horario["semana"] = {};
  const dias = (h.semana ?? {}) as Record<string, unknown>;
  for (let dia = 0; dia < 7; dia++) semana[dia] = validarFranjas(dias[dia]);
  const cerrado = Array.isArray(h.cerrado) ? [...new Set(h.cerrado.map(validarFecha))].sort() : [];
  return { semana, cerrado };
}

export function slugDe(nombre: string): string {
  return (
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "negocio"
  );
}

export function validarNegocio(entrada: unknown, base: Pick<Negocio, "id" | "slug"> & Partial<Negocio>): Negocio {
  const n = { ...base, ...((entrada ?? {}) as Record<string, unknown>) } as Record<string, unknown>;
  const tipo = TIPOS.includes(n.tipo as TipoNegocio) ? (n.tipo as TipoNegocio) : "otro";
  const intervalo = Number(n.intervaloMin) === 15 ? 15 : 30;
  const negocio: Negocio = {
    id: base.id,
    slug: base.slug,
    nombre: texto(n.nombre, "el nombre del negocio", 60, 2),
    tipo,
    descripcion: typeof n.descripcion === "string" ? n.descripcion.trim().slice(0, 300) : "",
    direccion: texto(n.direccion, "la dirección", 120),
    ciudad: texto(n.ciudad, "la ciudad", 60),
    telefono: texto(n.telefono, "el teléfono", 20),
    intervaloMin: intervalo,
    diasAdelante: entero(n.diasAdelante ?? 21, "Los días para reservar", 1, 90),
    avisoMin: entero(n.avisoMin ?? 60, "El aviso mínimo", 0, 48 * 60),
  };
  if (typeof n.fotoUrl === "string" && n.fotoUrl) negocio.fotoUrl = n.fotoUrl;
  return negocio;
}
