"use client";

import { useState } from "react";

// El viernes de la barbería de ejemplo, como un tablero de salidas. Tocar una fila la abre.

type Estado = "Atendido" | "No vino" | "En la silla" | "Confirmada";

interface Fila {
  nombre: string;
  servicio: string;
  hora: string;
  precio: string;
  estado: Estado;
  detalle: string[];
}

const FILAS: Fila[] = [
  { nombre: "Sebastián Molina", servicio: "Corte clásico", hora: "8:30", precio: "$25.000", estado: "Atendido", detalle: ["Corte clásico, 30 min, pagó $25.000 en efectivo.", "Reservó el martes desde el enlace de Instagram."] },
  { nombre: "Kevin Mendoza", servicio: "Corte y barba", hora: "9:00", precio: "$38.000", estado: "Atendido", detalle: ["Corte y barba, 1 hora, pagó $38.000 por Nequi.", "Es su tercera cita del mes."] },
  { nombre: "Mateo Castro", servicio: "Cejas", hora: "10:00", precio: "$8.000", estado: "No vino", detalle: ["Cejas y perfilado, 15 min. No llegó y no canceló.", "El recordatorio le llegó ayer a las 6:00 p. m."] },
  { nombre: "Andrés Pérez", servicio: "Barba", hora: "11:00", precio: "$18.000", estado: "En la silla", detalle: ["Barba con toalla caliente, de 11:00 a 11:30 a. m.", "Reservó anoche a las 9:40 p. m. Celular 300 *** 0142."] },
  { nombre: "Juan David Torres", servicio: "Corte niño", hora: "11:30", precio: "$20.000", estado: "Confirmada", detalle: ["Corte para niño, 30 min. Viene con su papá.", "Reservó hoy a las 7:15 a. m."] },
  { nombre: "Camilo Rojas", servicio: "Corte y barba", hora: "2:00", precio: "$38.000", estado: "Confirmada", detalle: ["Corte y barba, de 2:00 a 3:00 p. m.", "Reservó el miércoles. Pidió degradado bajo."] },
  { nombre: "Luis Fernando Díaz", servicio: "Corte clásico", hora: "3:00", precio: "$25.000", estado: "Confirmada", detalle: ["Corte clásico, 30 min.", "Es su primera vez en El Parche."] },
  { nombre: "Brayan Polo", servicio: "Barba", hora: "3:30", precio: "$18.000", estado: "Confirmada", detalle: ["Barba con toalla caliente, 30 min.", "Reservó hace dos horas."] },
  { nombre: "Felipe Vargas", servicio: "Corte y barba", hora: "4:30", precio: "$38.000", estado: "Confirmada", detalle: ["Corte y barba, de 4:30 a 5:30 p. m.", "Reservó el lunes desde el estado de WhatsApp."] },
];

const TONO: Record<Estado, string> = {
  Atendido: "estado-listo",
  "No vino": "estado-falta",
  "En la silla": "estado-ahora",
  Confirmada: "estado-viene",
};

export function Tablero() {
  const [abierta, setAbierta] = useState(3);

  return (
    <div className="tablero" data-ui>
      <ol className="tablero__filas">
        {FILAS.map((f, i) => {
          const esta = i === abierta;
          return (
            <li key={f.nombre} className={`fila ${esta ? "is-abierta" : ""}`}>
              <button type="button" className="fila__boton" aria-expanded={esta} onClick={() => setAbierta(i)}>
                <span className="fila__nombre">{f.nombre}</span>
                <span className="fila__dato fila__servicio">{f.servicio}</span>
                <span className="fila__dato fila__hora">{f.hora}</span>
                <span className="fila__dato fila__precio">{f.precio}</span>
                <span className={`fila__estado ${TONO[f.estado]}`}>{f.estado}</span>
              </button>
              {esta && (
                <div className="fila__detalle">
                  <p className="fila__hechos">
                    {f.servicio}, {f.hora}, {f.precio}
                  </p>
                  {f.detalle.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  {f.estado === "En la silla" && <span className="fila__avance" aria-hidden="true" />}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
