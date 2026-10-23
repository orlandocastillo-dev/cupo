"use client";

import type { TipoNegocio } from "@cupo/core";
import { useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { TIPOS } from "@/lib/formato";
import { Marca } from "../Marca";
import { usePanel } from "./Contexto";

export function CrearNegocio() {
  const { recargar } = usePanel();
  const [datos, setDatos] = useState({ nombre: "", tipo: "barberia", direccion: "", ciudad: "Barranquilla", telefono: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const negocio = await api.crearNegocio({ ...datos, tipo: datos.tipo as TipoNegocio });
      // Un negocio recién creado arranca con un horario y un servicio para que pueda probar su página de una vez.
      const franjas = [{ desde: "09:00", hasta: "18:00" }];
      await api.guardarHorario({ semana: { 1: franjas, 2: franjas, 3: franjas, 4: franjas, 5: franjas, 6: [{ desde: "09:00", hasta: "13:00" }] }, cerrado: [] });
      await api.guardarServicio({ nombre: "Servicio general", duracionMin: 30, precio: 30000, activo: true });
      if (negocio) await recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo crear el negocio.");
      setEnviando(false);
    }
  }

  return (
    <div className="panel-entrar">
      <div className="tarjeta panel-entrar__tarjeta panel-entrar__tarjeta--ancha">
        <Marca />
        <h1>Crea tu negocio</h1>
        <p className="muted">Con esto armamos tu página de reservas. Después puedes cambiar todo.</p>
        <form className="formulario" onSubmit={enviar}>
          <label className="campo">
            <span>Nombre del negocio</span>
            <input required minLength={2} value={datos.nombre} onChange={cambiar("nombre")} placeholder="Barbería El Parche" />
          </label>
          <label className="campo">
            <span>Tipo</span>
            <select value={datos.tipo} onChange={cambiar("tipo")}>
              {Object.entries(TIPOS).map(([valor, nombre]) => (
                <option key={valor} value={valor}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="fila-2">
            <label className="campo">
              <span>Dirección</span>
              <input required value={datos.direccion} onChange={cambiar("direccion")} />
            </label>
            <label className="campo">
              <span>Ciudad</span>
              <input required value={datos.ciudad} onChange={cambiar("ciudad")} />
            </label>
          </div>
          <label className="campo">
            <span>Teléfono o WhatsApp</span>
            <input required type="tel" value={datos.telefono} onChange={cambiar("telefono")} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn--primario" disabled={enviando}>
            {enviando ? "Creando…" : "Crear mi negocio"}
          </button>
        </form>
      </div>
    </div>
  );
}
