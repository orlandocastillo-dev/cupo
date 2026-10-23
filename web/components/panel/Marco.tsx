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
  { href: "/panel", nombre: "Agenda" },
  { href: "/panel/resumen", nombre: "Resumen" },
  { href: "/panel/servicios", nombre: "Servicios" },
  { href: "/panel/horario", nombre: "Horario" },
  { href: "/panel/negocio", nombre: "Negocio" },
];

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
      {api.modo === "ejemplo" && (
        <div className="panel__ejemplo">
          <p>
            Estás en el panel de ejemplo. Lo que cambies se guarda solo en este navegador.
          </p>
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
      <header className="panel__barra">
        <div className="panel__marca">
          <Marca href="/panel" />
          <span className="panel__negocio">{negocio.nombre}</span>
        </div>
        <nav className="panel__nav" aria-label="Panel">
          {VISTAS.map((v) => (
            <Link key={v.href} href={v.href} aria-current={ruta === v.href ? "page" : undefined}>
              {v.nombre}
            </Link>
          ))}
        </nav>
        <div className="panel__cuenta">
          <Link className="btn btn--chico" href={`/n/${negocio.slug}`} target="_blank">
            Ver mi página
          </Link>
          {correo && (
            <button type="button" className="btn btn--chico" onClick={cerrarSesion} title={correo}>
              Salir
            </button>
          )}
        </div>
      </header>
      <main className="panel__contenido">{children}</main>
    </div>
  );
}
