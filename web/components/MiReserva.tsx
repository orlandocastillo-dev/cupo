"use client";

import type { Negocio, Reserva } from "@cupo/core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { ESTADOS, fechaLarga, hora12, plata } from "@/lib/formato";

export function MiReserva({ id }: { id: string }) {
  const codigoUrl = useSearchParams().get("codigo") ?? "";
  const [codigo, setCodigo] = useState(codigoUrl);
  const [datos, setDatos] = useState<{ reserva: Reserva; negocio: Negocio } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(Boolean(codigoUrl));
  const [confirmar, setConfirmar] = useState(false);

  async function buscar(c: string) {
    setCargando(true);
    setError(null);
    try {
      setDatos(await api.verReserva(id, c));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos cargar la reserva.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (codigoUrl) buscar(codigoUrl);
  }, [codigoUrl]);

  async function cancelar() {
    setCargando(true);
    setError(null);
    try {
      const reserva = await api.cancelarReserva(id, codigo);
      setDatos((d) => (d ? { ...d, reserva } : d));
      setConfirmar(false);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo cancelar.");
    } finally {
      setCargando(false);
    }
  }

  if (!datos) {
    return (
      <div className="tarjeta confirmacion__tarjeta">
        <h1>Tu reserva</h1>
        <p className="muted">Escribe el código de 6 letras que te dimos al reservar.</p>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(codigo);
          }}
        >
          <label className="campo">
            <span>Código</span>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={8} autoCapitalize="characters" required />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn--primario" disabled={cargando}>
            {cargando ? "Buscando…" : "Ver mi reserva"}
          </button>
        </form>
      </div>
    );
  }

  const { reserva, negocio } = datos;
  const cancelada = reserva.estado === "cancelada";

  return (
    <div className="tarjeta confirmacion__tarjeta">
      <p className={`estado estado--${reserva.estado}`}>{ESTADOS[reserva.estado]}</p>
      <h1>{reserva.servicioNombre}</h1>
      <p className="muted">
        {negocio.nombre}, {negocio.direccion}, {negocio.ciudad}
      </p>
      <dl className="confirmacion__datos">
        <div>
          <dt>Cuándo</dt>
          <dd>
            {fechaLarga(reserva.fecha)}, {hora12(reserva.inicio)}
          </dd>
        </div>
        <div>
          <dt>A nombre de</dt>
          <dd>{reserva.cliente.nombre}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{plata(reserva.precio)}</dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd>{reserva.codigo}</dd>
        </div>
      </dl>

      {error && <p className="error" role="alert">{error}</p>}

      {cancelada ? (
        <div className="confirmacion__acciones">
          <Link className="btn btn--primario" href={`/n/${negocio.slug}`}>
            Reservar otra hora
          </Link>
        </div>
      ) : reserva.estado === "confirmada" && !confirmar ? (
        <div className="confirmacion__acciones">
          <button type="button" className="btn btn--peligro" onClick={() => setConfirmar(true)}>
            Cancelar mi reserva
          </button>
          <Link className="btn" href={`/n/${negocio.slug}`}>
            Ir a {negocio.nombre}
          </Link>
        </div>
      ) : confirmar ? (
        <div className="aviso">
          <p>¿Seguro? La hora quedará libre para otra persona.</p>
          <div className="confirmacion__acciones">
            <button type="button" className="btn btn--peligro" onClick={cancelar} disabled={cargando}>
              {cargando ? "Cancelando…" : "Sí, cancelar"}
            </button>
            <button type="button" className="btn" onClick={() => setConfirmar(false)}>
              No, la mantengo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
