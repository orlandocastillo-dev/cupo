"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/cliente";
import { reiniciarEjemplo } from "@/lib/api-ejemplo";
import { cerrarSesion, correoDeSesion, iniciarSesion } from "@/lib/sesion";
import { Marca } from "../Marca";
import { usePanel } from "./Contexto";
import { CrearNegocio } from "./CrearNegocio";

const VISTAS = [
  { href: "/panel", nombre: "Agenda", icono: "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM3 10h18M8 3v4M16 3v4" },
  { href: "/panel/resumen", nombre: "Resumen", icono: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/panel/servicios", nombre: "Servicios", icono: "M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 4 8.1 15.9M14.5 14.5 20 20" },
  { href: "/panel/horario", nombre: "Horario", icono: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2" },
  { href: "/panel/negocio", nombre: "Negocio", icono: "M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6" },
];

export function Icono({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

function Entrar() {
  return (
    <div className="panel-entrar">
      <div className="tarjeta panel-entrar__tarjeta">
        <Marca />
        <h1>Panel de tu negocio</h1>
        <p className="muted">Entra con tu correo para ver la agenda, tus servicios y tus horarios.</p>
        <button type="button" className="btn btn--primario btn--bloque" onClick={() => iniciarSesion()}>
          Entrar
        </button>
        <button type="button" className="btn btn--bloque" onClick={() => iniciarSesion(true)}>
          Crear una cuenta
        </button>
      </div>
    </div>
  );
}

export function Marco({ children }: { children: React.ReactNode }) {
  const { estado, recargar } = usePanel();
  const ruta = usePathname();

  if (ruta === "/panel/entrar") return <>{children}</>;
  if (estado.tipo === "sin-sesion") return <Entrar />;
  if (estado.tipo === "cargando") return <div className="cargando">Cargando tu negocio…</div>;
  if (estado.tipo === "error") {
    return (
      <div className="panel-entrar">
        <div className="tarjeta panel-entrar__tarjeta">
          <p className="error">{estado.mensaje}</p>
          <button type="button" className="btn" onClick={recargar}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }
  if (estado.tipo === "sin-negocio") return <CrearNegocio />;

  const { negocio } = estado.datos;
  const correo = api.modo === "aws" ? correoDeSesion() : null;

  return (
    <div className="panel">
      <aside className="panel__lado">
        <div className="panel__arriba">
          <Marca href="/panel" />
          <Link className="btn btn--chico panel__ver-movil" href={`/n/${negocio.slug}`} target="_blank">
            Ver mi página
          </Link>
        </div>

        <div className="panel__negocio">
          <span className="avatar" aria-hidden="true">
            {iniciales(negocio.nombre)}
          </span>
          <div>
            <b>{negocio.nombre}</b>
            <Link href={`/n/${negocio.slug}`} target="_blank">
              Ver mi página
            </Link>
          </div>
        </div>

        <nav className="panel__nav" aria-label="Panel">
          {VISTAS.map((v) => (
            <Link key={v.href} href={v.href} aria-current={ruta === v.href ? "page" : undefined}>
              <Icono d={v.icono} />
              {v.nombre}
            </Link>
          ))}
        </nav>

        <div className="panel__pie">
          {api.modo === "ejemplo" && (
            <div className="panel__ejemplo">
              <p>Panel de ejemplo. Lo que cambies se guarda solo en este navegador.</p>
              <button
                type="button"
                className="btn btn--texto"
                onClick={() => {
                  reiniciarEjemplo();
                  location.reload();
                }}
              >
                Volver a empezar
              </button>
            </div>
          )}
          {correo && (
            <button type="button" className="btn btn--chico btn--bloque" onClick={cerrarSesion} title={correo}>
              Salir
            </button>
          )}
        </div>
      </aside>
      <main className="panel__contenido">{children}</main>
    </div>
  );
}
