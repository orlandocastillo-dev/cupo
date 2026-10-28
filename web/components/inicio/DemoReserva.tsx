"use client";

import { useState } from "react";

// Una reserva de mentiras para probar sin salir de la portada.
// Las 10:00 están "en disputa": si la escoges, otra persona gana por un instante, igual que en la app de verdad.

const SERVICIOS = [
  { id: "corte", nombre: "Corte clásico", dura: "30 min", precio: "$25.000" },
  { id: "barba", nombre: "Corte y barba", dura: "1 h", precio: "$38.000" },
  { id: "cejas", nombre: "Cejas y perfilado", dura: "15 min", precio: "$8.000" },
];

const HORAS = ["9:00", "9:30", "10:00", "10:30", "11:30", "2:00", "2:30", "3:30", "4:00"];
const OCUPADAS_INICIO = ["9:30", "2:30"];
const DISPUTADA = "10:00";

function codigo() {
  const letras = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

function aviso(h: string) {
  const hh = Number(h.split(":")[0]);
  return `${h} ${hh >= 8 && hh <= 11 ? "a. m." : "p. m."}`;
}

export function DemoReserva() {
  const [servicio, setServicio] = useState("barba");
  const [hora, setHora] = useState<string | null>(null);
  const [ocupadas, setOcupadas] = useState<string[]>(OCUPADAS_INICIO);
  const [choque, setChoque] = useState(false);
  const [hecha, setHecha] = useState<{ codigo: string; hora: string } | null>(null);

  const s = SERVICIOS.find((x) => x.id === servicio)!;

  function reservar() {
    if (!hora) return;
    if (hora === DISPUTADA && !ocupadas.includes(DISPUTADA)) {
      setOcupadas((o) => [...o, DISPUTADA]);
      setChoque(true);
      setHora("10:30");
      return;
    }
    setOcupadas((o) => [...o, hora]);
    setHecha({ codigo: codigo(), hora });
    setChoque(false);
  }

  function otra() {
    setHecha(null);
    setHora(null);
  }

  if (hecha) {
    return (
      <div className="demo demo--lista" aria-live="polite">
        <div className="demo__visto" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="demo__titulo">Listo, quedó tu cita</p>
        <p className="demo__suave">
          {s.nombre} el sábado 24 de octubre a las {aviso(hecha.hora)} en Barbería El Parche.
        </p>
        <p className="demo__codigo">
          Código <b>{hecha.codigo}</b>
        </p>
        <p className="demo__suave">Con ese código puedes ver o cancelar la cita. El viernes a las 6:00 p. m. te llega el recordatorio.</p>
        <button type="button" className="demo__boton demo__boton--vidrio" onClick={otra}>
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <div className="demo">
      <div className="demo__cabeza">
        <span className="demo__avatar">EP</span>
        <div>
          <p className="demo__titulo">Barbería El Parche</p>
          <p className="demo__suave">Cra. 43 #70-15, Barranquilla</p>
        </div>
      </div>

      <fieldset className="demo__grupo">
        <legend>Servicio</legend>
        {SERVICIOS.map((x) => (
          <label key={x.id} className={`demo__servicio ${x.id === servicio ? "is-on" : ""}`}>
            <input type="radio" name="demo-servicio" value={x.id} checked={x.id === servicio} onChange={() => setServicio(x.id)} />
            <span>{x.nombre}</span>
            <span className="demo__suave">
              {x.dura}, {x.precio}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="demo__grupo">
        <legend>Sábado 24 de octubre</legend>
        <div className="demo__horas">
          {HORAS.map((h) => {
            const ocupada = ocupadas.includes(h);
            return (
              <button
                key={h}
                type="button"
                className={`demo__hora ${hora === h ? "is-on" : ""}`}
                disabled={ocupada}
                aria-pressed={hora === h}
                onClick={() => {
                  setHora(h);
                  setChoque(false);
                }}
              >
                {h}
                {ocupada && <small>Ocupada</small>}
                {h === DISPUTADA && !ocupada && <small>2 viéndola</small>}
              </button>
            );
          })}
        </div>
      </fieldset>

      {choque && (
        <p className="demo__aviso" role="status">
          Alguien apartó las 10:00 un instante antes que tú. Te dejamos marcada la siguiente libre, las 10:30 a. m.
        </p>
      )}

      <button type="button" className="demo__boton" disabled={!hora} onClick={reservar}>
        {hora ? `Reservar a las ${aviso(hora)}` : "Escoge una hora"}
      </button>
    </div>
  );
}
