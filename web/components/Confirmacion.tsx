"use client";

import { aMinutos, type Negocio, type Reserva } from "@cupo/core";
import Link from "next/link";
import { fechaLarga, hora12, plata } from "@/lib/formato";

/** Archivo .ics para que el cliente la guarde en el calendario del celular. */
function enlaceCalendario(r: Reserva, n: Negocio) {
  const sello = (fecha: string, hora: string) => {
    // Colombia es UTC-5 todo el año.
    const d = new Date(`${fecha}T${hora}:00-05:00`);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cupo//Reservas//ES",
    "BEGIN:VEVENT",
    `UID:${r.id}@cupo`,
    `DTSTAMP:${sello(r.fecha, r.inicio)}`,
    `DTSTART:${sello(r.fecha, r.inicio)}`,
    `DTEND:${sello(r.fecha, r.fin)}`,
    `SUMMARY:${r.servicioNombre} en ${n.nombre}`,
    `LOCATION:${n.direccion}\\, ${n.ciudad}`,
    `DESCRIPTION:Código de tu reserva: ${r.codigo}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu cita es en una hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export function Confirmacion({ reserva, negocio, onOtra }: { reserva: Reserva; negocio: Negocio; onOtra: () => void }) {
  const enlace = `/reserva/${reserva.id}?codigo=${reserva.codigo}`;
  return (
    <div className="contenedor confirmacion">
      <div className="tarjeta confirmacion__tarjeta">
        <div className="confirmacion__icono" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1>Quedó tu reserva</h1>
        <p className="muted">
          {negocio.nombre} te espera el {fechaLarga(reserva.fecha)} a las {hora12(reserva.inicio)}.
        </p>

        <dl className="confirmacion__datos">
          <div>
            <dt>Servicio</dt>
            <dd>{reserva.servicioNombre}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>
              {hora12(reserva.inicio)} a {hora12(reserva.fin)} ({aMinutos(reserva.fin) - aMinutos(reserva.inicio)} min)
            </dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{plata(reserva.precio)}, se paga en el negocio</dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>
              {negocio.direccion}, {negocio.ciudad}
            </dd>
          </div>
        </dl>

        <div className="confirmacion__codigo">
          <span>Tu código</span>
          <strong>{reserva.codigo}</strong>
        </div>
        <p className="pequeno muted">Guárdalo: con él puedes ver o cancelar tu reserva sin crear cuenta.</p>

        <div className="confirmacion__acciones">
          <a className="btn btn--primario" href={enlaceCalendario(reserva, negocio)} download={`cita-${reserva.codigo}.ics`}>
            Agregar a mi calendario
          </a>
          <Link className="btn" href={enlace}>
            Ver o cancelar mi reserva
          </Link>
        </div>
        <button type="button" className="btn btn--texto" onClick={onOtra}>
          Hacer otra reserva
        </button>
      </div>
    </div>
  );
}
