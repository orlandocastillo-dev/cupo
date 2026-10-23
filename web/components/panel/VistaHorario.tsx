"use client";

import { momentoEn, type Franja, type Horario } from "@cupo/core";
import { useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { DIAS, fechaLarga } from "@/lib/formato";
import { useNegocio } from "./Contexto";

// La semana se muestra de lunes a domingo, que es como la piensa un negocio.
const ORDEN = [1, 2, 3, 4, 5, 6, 0];

export function VistaHorario() {
  const { horario, actualizar } = useNegocio();
  const [borrador, setBorrador] = useState<Horario>(() => structuredClone(horario));
  const [nuevoCierre, setNuevoCierre] = useState("");
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cambiado = JSON.stringify(borrador) !== JSON.stringify(horario);

  const franjas = (dia: number) => borrador.semana[dia] ?? [];
  const ponerFranjas = (dia: number, lista: Franja[]) => setBorrador({ ...borrador, semana: { ...borrador.semana, [dia]: lista } });

  async function guardar() {
    setGuardando(true);
    setEstado(null);
    try {
      const guardado = await api.guardarHorario(borrador);
      actualizar({ horario: guardado });
      setBorrador(structuredClone(guardado));
      setEstado({ tipo: "ok", texto: "Horario guardado. Tu página ya muestra los cupos nuevos." });
    } catch (e) {
      setEstado({ tipo: "error", texto: e instanceof ErrorApi ? e.message : "No se pudo guardar el horario." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Horario</h1>
          <p className="muted vista__sub">Las horas en las que se puede reservar. Si cierras a almorzar, pon dos franjas.</p>
        </div>
        <button type="button" className="btn btn--primario" onClick={guardar} disabled={!cambiado || guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      {estado && <p className={estado.tipo === "ok" ? "aviso aviso--ok" : "error"} role="status">{estado.texto}</p>}

      <div className="tarjeta semana-horario">
        {ORDEN.map((dia) => {
          const lista = franjas(dia);
          const abierto = lista.length > 0;
          return (
            <div key={dia} className="dia-horario">
              <label className="interruptor dia-horario__nombre">
                <input type="checkbox" checked={abierto} onChange={() => ponerFranjas(dia, abierto ? [] : [{ desde: "09:00", hasta: "18:00" }])} />
                <span>{DIAS[dia]}</span>
              </label>
              <div className="dia-horario__franjas">
                {!abierto && <span className="muted">Cerrado</span>}
                {lista.map((f, i) => (
                  <div key={i} className="franja">
                    <input type="time" step={900} aria-label={`${DIAS[dia]}, desde`} value={f.desde} onChange={(e) => ponerFranjas(dia, lista.map((x, j) => (j === i ? { ...x, desde: e.target.value } : x)))} />
                    <span className="muted">a</span>
                    <input type="time" step={900} aria-label={`${DIAS[dia]}, hasta`} value={f.hasta} onChange={(e) => ponerFranjas(dia, lista.map((x, j) => (j === i ? { ...x, hasta: e.target.value } : x)))} />
                    <button type="button" className="btn btn--chico" aria-label="Quitar franja" onClick={() => ponerFranjas(dia, lista.filter((_, j) => j !== i))}>
                      Quitar
                    </button>
                  </div>
                ))}
                {abierto && (
                  <button type="button" className="btn btn--texto pequeno" onClick={() => ponerFranjas(dia, [...lista, { desde: "14:00", hasta: "18:00" }])}>
                    Agregar franja
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="tarjeta cierres">
        <h2>Días que no abres</h2>
        <p className="muted pequeno">Festivos, vacaciones o un día que tengas que salir. Esos días no se puede reservar.</p>
        <div className="cierres__agregar">
          <input type="date" min={momentoEn(new Date()).fecha} value={nuevoCierre} onChange={(e) => setNuevoCierre(e.target.value)} aria-label="Fecha que no abres" />
          <button
            type="button"
            className="btn btn--chico"
            disabled={!nuevoCierre}
            onClick={() => {
              setBorrador({ ...borrador, cerrado: [...new Set([...borrador.cerrado, nuevoCierre])].sort() });
              setNuevoCierre("");
            }}
          >
            Agregar
          </button>
        </div>
        {borrador.cerrado.length > 0 && (
          <ul className="cierres__lista">
            {borrador.cerrado.map((f) => (
              <li key={f}>
                <span>{fechaLarga(f)}</span>
                <button type="button" className="btn btn--texto pequeno" onClick={() => setBorrador({ ...borrador, cerrado: borrador.cerrado.filter((x) => x !== f) })}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
