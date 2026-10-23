"use client";

import { aMinutos, diaSemana, momentoEn, sumarDias, type EstadoReserva, type Reserva } from "@cupo/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { diaCorto, ESTADOS, fechaLarga, hora12, numeroDia, plata } from "@/lib/formato";
import { useNegocio } from "./Contexto";

/** Lunes de la semana de una fecha. */
const lunesDe = (fecha: string) => sumarDias(fecha, -((diaSemana(fecha) + 6) % 7));

export function Agenda() {
  const { horario } = useNegocio();
  const hoy = useMemo(() => momentoEn(new Date()).fecha, []);
  const [fecha, setFecha] = useState(hoy);
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [aCancelar, setACancelar] = useState<string | null>(null);
  const lunes = lunesDe(fecha);

  const cargar = useCallback(async () => {
    setReservas(null);
    try {
      setReservas(await api.agenda(lunes, sumarDias(lunes, 6)));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos cargar la agenda.");
    }
  }, [lunes]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcar(r: Reserva, estado: EstadoReserva) {
    setOcupada(r.id);
    setError(null);
    try {
      const nueva = await api.marcarReserva(r.id, estado);
      setReservas((lista) => lista?.map((x) => (x.id === r.id ? nueva : x)) ?? null);
      setACancelar(null);
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No se pudo cambiar la reserva.");
    } finally {
      setOcupada(null);
    }
  }

  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const delDia = (reservas ?? []).filter((r) => r.fecha === fecha);
  const activas = delDia.filter((r) => r.estado !== "cancelada");
  const abierto = !horario.cerrado.includes(fecha) && (horario.semana[diaSemana(fecha)]?.length ?? 0) > 0;
  const ahora = momentoEn(new Date());

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Agenda</h1>
          <p className="muted vista__sub">{fechaLarga(fecha)}</p>
        </div>
        <div className="agenda__nav">
          <button type="button" className="btn btn--chico" onClick={() => setFecha(sumarDias(fecha, -7))} aria-label="Semana anterior">
            ‹
          </button>
          <button type="button" className="btn btn--chico" onClick={() => setFecha(hoy)} disabled={fecha === hoy}>
            Hoy
          </button>
          <button type="button" className="btn btn--chico" onClick={() => setFecha(sumarDias(fecha, 7))} aria-label="Semana siguiente">
            ›
          </button>
        </div>
      </div>

      <div className="semana" role="tablist" aria-label="Días de la semana">
        {semana.map((f) => {
          const n = (reservas ?? []).filter((r) => r.fecha === f && r.estado !== "cancelada").length;
          return (
            <button key={f} type="button" role="tab" aria-selected={f === fecha} className={`semana__dia ${f === fecha ? "is-elegido" : ""} ${f === hoy ? "is-hoy" : ""}`} onClick={() => setFecha(f)}>
              <span className="semana__nombre">{diaCorto(f)}</span>
              <span className="semana__numero">{numeroDia(f)}</span>
              <span className="semana__cuenta">{reservas ? (n ? `${n} citas` : "Libre") : " "}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="agenda__resumen">
        <span>
          <strong>{activas.length}</strong> citas
        </span>
        <span>
          <strong>{plata(activas.reduce((t, r) => t + r.precio, 0))}</strong> por cobrar o cobrado
        </span>
        {!abierto && <span className="muted">El negocio no abre este día</span>}
      </div>

      {!reservas ? (
        <div className="lista-citas">
          {[0, 1, 2].map((i) => (
            <div key={i} className="esqueleto" style={{ height: 76 }} />
          ))}
        </div>
      ) : delDia.length === 0 ? (
        <div className="tarjeta vacio">
          <p>No hay citas este día.</p>
          <p className="muted pequeno">Comparte el enlace de tu página para que tus clientes reserven.</p>
        </div>
      ) : (
        <ol className="lista-citas">
          {delDia.map((r) => {
            const paso = r.fecha < ahora.fecha || (r.fecha === ahora.fecha && aMinutos(r.inicio) <= ahora.minutos);
            const tel = r.cliente.telefono.replace(/\D/g, "").slice(-10);
            return (
              <li key={r.id} className={`cita cita--${r.estado}`}>
                <div className="cita__hora">
                  <strong>{hora12(r.inicio)}</strong>
                  <span>{hora12(r.fin)}</span>
                </div>
                <div className="cita__cuerpo">
                  <p className="cita__cliente">
                    {r.cliente.nombre}
                    {r.estado !== "confirmada" && <span className={`estado estado--${r.estado}`}>{ESTADOS[r.estado]}</span>}
                  </p>
                  <p className="muted">
                    {r.servicioNombre}, {plata(r.precio)}
                  </p>
                  <p className="pequeno">
                    <a href={`https://wa.me/57${tel}`} target="_blank" rel="noopener noreferrer">
                      {r.cliente.telefono}
                    </a>
                  </p>
                </div>
                <div className="cita__acciones">
                  {r.estado === "confirmada" && aCancelar !== r.id && (
                    <>
                      <button type="button" className="btn btn--chico btn--primario" disabled={ocupada === r.id} onClick={() => marcar(r, "atendida")}>
                        Atendida
                      </button>
                      {paso && (
                        <button type="button" className="btn btn--chico" disabled={ocupada === r.id} onClick={() => marcar(r, "no_asistio")}>
                          No vino
                        </button>
                      )}
                      <button type="button" className="btn btn--chico btn--peligro" disabled={ocupada === r.id} onClick={() => setACancelar(r.id)}>
                        Cancelar
                      </button>
                    </>
                  )}
                  {aCancelar === r.id && (
                    <>
                      <span className="pequeno">¿Cancelar esta cita?</span>
                      <button type="button" className="btn btn--chico btn--peligro" disabled={ocupada === r.id} onClick={() => marcar(r, "cancelada")}>
                        Sí, cancelar
                      </button>
                      <button type="button" className="btn btn--chico" onClick={() => setACancelar(null)}>
                        No
                      </button>
                    </>
                  )}
                  {(r.estado === "atendida" || r.estado === "no_asistio") && (
                    <button type="button" className="btn btn--chico" disabled={ocupada === r.id} onClick={() => marcar(r, "confirmada")}>
                      Deshacer
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
