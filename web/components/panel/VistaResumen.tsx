"use client";

import type { Resumen } from "@cupo/core";
import { useEffect, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { diaCorto, numeroDia, plata } from "@/lib/formato";

function Barras({ dias }: { dias: Resumen["porDia"] }) {
  const max = Math.max(4, ...dias.map((d) => d.reservas));
  const tope = Math.ceil(max / 4) * 4;
  const alto = 200;
  const izq = 28;
  const paso = 84;
  const ancho = 40;
  const y = (n: number) => 16 + alto - (n / tope) * alto;
  return (
    <svg className="barras" viewBox={`0 0 ${izq + dias.length * paso} ${alto + 52}`} role="img" aria-label="Citas por día de la última semana">
      {[0, 0.25, 0.5, 0.75, 1].map((k) => (
        <g key={k}>
          <line x1={izq} x2={izq + dias.length * paso} y1={y(tope * k)} y2={y(tope * k)} className={k === 0 ? "barras__base" : "barras__guia"} />
          <text x={izq - 8} y={y(tope * k) + 4} textAnchor="end" className="barras__eje">
            {tope * k}
          </text>
        </g>
      ))}
      {dias.map((d, i) => {
        const hoy = i === dias.length - 1;
        const x = izq + i * paso + (paso - ancho) / 2;
        const h = Math.max(alto - (y(d.reservas) - 16), 2);
        return (
          <g key={d.fecha}>
            <title>{`${d.reservas} citas, ${plata(d.ingresos)}`}</title>
            <rect x={x} y={y(d.reservas)} width={ancho} height={h} rx="6" className={hoy ? "barras__hoy" : "barras__barra"} />
            <text x={x + ancho / 2} y={y(d.reservas) - 8} textAnchor="middle" className="barras__valor">
              {d.reservas}
            </text>
            <text x={x + ancho / 2} y={alto + 42} textAnchor="middle" className={`barras__dia ${hoy ? "is-hoy" : ""}`}>
              {hoy ? "Hoy" : `${diaCorto(d.fecha)} ${numeroDia(d.fecha)}`}
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
  const masPedido = Math.max(1, ...r.servicios.map((s) => s.reservas));

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Resumen</h1>
          <p className="muted vista__sub">Últimos 7 días, hasta hoy</p>
        </div>
      </div>

      <dl className="kpis">
        <div className="tarjeta">
          <dt>Citas</dt>
          <dd>{r.reservas}</dd>
          <small>{r.atendidas} atendidas</small>
        </div>
        <div className="tarjeta">
          <dt>Cobrado</dt>
          <dd>{plata(r.ingresos)}</dd>
          <small>De las citas marcadas como atendidas</small>
        </div>
        <div className="tarjeta">
          <dt>Agenda ocupada</dt>
          <dd>{r.ocupacion} %</dd>
          <span className="medidor" aria-hidden="true">
            <i style={{ width: `${Math.min(r.ocupacion, 100)}%` }} />
          </span>
          <small>Del tiempo que estuvo abierto</small>
        </div>
        <div className="tarjeta">
          <dt>Llegaron</dt>
          <dd>{asistencia === null ? "Sin datos" : `${asistencia} %`}</dd>
          <small>
            {r.noAsistio} no vinieron, {r.canceladas} cancelaron
          </small>
        </div>
      </dl>

      <div className="resumen__fila">
        <section className="tarjeta resumen__bloque">
          <header className="resumen__cabeza">
            <h2>Citas por día</h2>
            <span className="leyenda">
              <i className="leyenda__hoy" /> Hoy
            </span>
          </header>
          <Barras dias={r.porDia} />
        </section>
        <section className="tarjeta resumen__bloque">
          <header className="resumen__cabeza">
            <h2>Lo que más piden</h2>
          </header>
          {r.servicios.length === 0 ? (
            <p className="muted">Todavía no hay citas esta semana.</p>
          ) : (
            <ol className="ranking">
              {r.servicios.map((s) => (
                <li key={s.nombre}>
                  <div className="ranking__fila">
                    <span>{s.nombre}</span>
                    <span className="muted">
                      {s.reservas} citas <b>{plata(s.ingresos)}</b>
                    </span>
                  </div>
                  <span className="medidor" aria-hidden="true">
                    <i style={{ width: `${(s.reservas / masPedido) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
