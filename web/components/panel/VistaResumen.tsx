"use client";

import type { Resumen } from "@cupo/core";
import { useEffect, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { diaCorto, numeroDia, plata } from "@/lib/formato";

function Barras({ dias }: { dias: Resumen["porDia"] }) {
  const max = Math.max(1, ...dias.map((d) => d.reservas));
  const alto = 160;
  const ancho = 44;
  const paso = 64;
  return (
    <svg className="barras" viewBox={`0 0 ${dias.length * paso} ${alto + 44}`} role="img" aria-label="Citas por día de la última semana">
      {[0.5, 1].map((k) => (
        <line key={k} x1="0" x2={dias.length * paso} y1={alto - alto * k + 18} y2={alto - alto * k + 18} className="barras__guia" />
      ))}
      {dias.map((d, i) => {
        const h = (d.reservas / max) * alto;
        const x = i * paso + (paso - ancho) / 2;
        return (
          <g key={d.fecha}>
            <rect x={x} y={alto - h + 18} width={ancho} height={Math.max(h, 2)} rx="3" className={i === dias.length - 1 ? "barras__hoy" : "barras__barra"} />
            <text x={x + ancho / 2} y={alto - h + 12} textAnchor="middle" className="barras__valor">
              {d.reservas}
            </text>
            <text x={x + ancho / 2} y={alto + 36} textAnchor="middle" className="barras__dia">
              {i === dias.length - 1 ? "Hoy" : `${diaCorto(d.fecha)} ${numeroDia(d.fecha)}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function VistaResumen() {
  const [r, setR] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.resumen().then(setR).catch((e) => setError(e instanceof ErrorApi ? e.message : "No pudimos cargar el resumen."));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!r) return <div className="cargando">Cargando…</div>;

  const asistencia = r.atendidas + r.noAsistio ? Math.round((r.atendidas / (r.atendidas + r.noAsistio)) * 100) : null;

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Resumen</h1>
          <p className="muted vista__sub">Últimos 7 días, hasta hoy</p>
        </div>
      </div>

      <dl className="cifras">
        <div className="tarjeta">
          <dt>Citas</dt>
          <dd>{r.reservas}</dd>
        </div>
        <div className="tarjeta">
          <dt>Cobrado</dt>
          <dd>{plata(r.ingresos)}</dd>
          <small>de las citas marcadas como atendidas</small>
        </div>
        <div className="tarjeta">
          <dt>Agenda ocupada</dt>
          <dd>{r.ocupacion} %</dd>
          <small>del tiempo que estuvo abierto</small>
        </div>
        <div className="tarjeta">
          <dt>Llegaron</dt>
          <dd>{asistencia === null ? "—" : `${asistencia} %`}</dd>
          <small>
            {r.noAsistio} no vinieron, {r.canceladas} cancelaron
          </small>
        </div>
      </dl>

      <div className="resumen__fila">
        <section className="tarjeta resumen__bloque">
          <h2>Citas por día</h2>
          <Barras dias={r.porDia} />
        </section>
        <section className="tarjeta resumen__bloque">
          <h2>Lo que más piden</h2>
          {r.servicios.length === 0 ? (
            <p className="muted">Todavía no hay citas esta semana.</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th className="num">Citas</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {r.servicios.map((s) => (
                  <tr key={s.nombre}>
                    <td>{s.nombre}</td>
                    <td className="num">{s.reservas}</td>
                    <td className="num">{plata(s.ingresos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
