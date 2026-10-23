"use client";

import type { Servicio } from "@cupo/core";
import { useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { duracion, plata } from "@/lib/formato";
import { useNegocio } from "./Contexto";

const DURACIONES = [15, 30, 45, 60, 75, 90, 120, 180];
type Borrador = { id?: string; nombre: string; duracionMin: number; precio: string; activo: boolean };

export function Servicios() {
  const { servicios, actualizar } = useNegocio();
  const [editando, setEditando] = useState<Borrador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState<string | null>(null);

  const lista = [...servicios].sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setGuardando(true);
    setError(null);
    try {
      const datos = { nombre: editando.nombre, duracionMin: editando.duracionMin, precio: Number(editando.precio.replace(/\D/g, "")), activo: editando.activo };
      const guardado = await api.guardarServicio(datos, editando.id);
      actualizar({ servicios: [...servicios.filter((s) => s.id !== guardado.id), guardado] });
      setEditando(null);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActivo(s: Servicio) {
    const guardado = await api.guardarServicio({ ...s, activo: !s.activo }, s.id);
    actualizar({ servicios: servicios.map((x) => (x.id === s.id ? guardado : x)) });
  }

  async function borrar(id: string) {
    await api.borrarServicio(id);
    actualizar({ servicios: servicios.filter((s) => s.id !== id) });
    setABorrar(null);
  }

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Servicios</h1>
          <p className="muted vista__sub">Lo que tus clientes pueden reservar, con su duración y precio.</p>
        </div>
        {!editando && (
          <button type="button" className="btn btn--primario" onClick={() => setEditando({ nombre: "", duracionMin: 30, precio: "", activo: true })}>
            Nuevo servicio
          </button>
        )}
      </div>

      {editando && (
        <form className="tarjeta editor" onSubmit={guardar}>
          <h2>{editando.id ? "Editar servicio" : "Nuevo servicio"}</h2>
          <div className="editor__campos">
            <label className="campo">
              <span>Nombre</span>
              <input required autoFocus value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </label>
            <label className="campo">
              <span>Duración</span>
              <select value={editando.duracionMin} onChange={(e) => setEditando({ ...editando, duracionMin: Number(e.target.value) })}>
                {DURACIONES.map((d) => (
                  <option key={d} value={d}>
                    {duracion(d)}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Precio</span>
              <input required inputMode="numeric" value={editando.precio} onChange={(e) => setEditando({ ...editando, precio: e.target.value })} placeholder="25000" />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="editor__acciones">
            <button className="btn btn--primario" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn" onClick={() => { setEditando(null); setError(null); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Duración</th>
              <th className="num">Precio</th>
              <th>Se puede reservar</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.id} className={s.activo ? "" : "is-apagado"}>
                <td>{s.nombre}</td>
                <td>{duracion(s.duracionMin)}</td>
                <td className="num">{plata(s.precio)}</td>
                <td>
                  <label className="interruptor">
                    <input type="checkbox" checked={s.activo} onChange={() => cambiarActivo(s)} />
                    <span>{s.activo ? "Sí" : "No"}</span>
                  </label>
                </td>
                <td className="tabla__acciones">
                  {aBorrar === s.id ? (
                    <>
                      <button type="button" className="btn btn--chico btn--peligro" onClick={() => borrar(s.id)}>
                        Borrar
                      </button>
                      <button type="button" className="btn btn--chico" onClick={() => setABorrar(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn--chico" onClick={() => setEditando({ ...s, precio: String(s.precio) })}>
                        Editar
                      </button>
                      <button type="button" className="btn btn--chico btn--peligro" onClick={() => setABorrar(s.id)}>
                        Borrar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pequeno muted">Las citas ya reservadas no cambian si editas o borras un servicio.</p>
    </div>
  );
}
