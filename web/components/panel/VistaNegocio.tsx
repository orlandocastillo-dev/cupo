"use client";

import { useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { TIPOS } from "@/lib/formato";
import { useNegocio } from "./Contexto";

export function VistaNegocio() {
  const { negocio, actualizar } = useNegocio();
  const [datos, setDatos] = useState(negocio);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const enlace = typeof window === "undefined" ? `/n/${negocio.slug}` : `${location.origin}/n/${negocio.slug}`;

  const campo = (nombre: keyof typeof datos) => ({
    value: String(datos[nombre] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDatos({ ...datos, [nombre]: e.target.value }),
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setEstado(null);
    try {
      const guardado = await api.actualizarNegocio({ ...datos, intervaloMin: Number(datos.intervaloMin) as 15 | 30, diasAdelante: Number(datos.diasAdelante), avisoMin: Number(datos.avisoMin) });
      actualizar({ negocio: guardado });
      setDatos(guardado);
      setEstado({ tipo: "ok", texto: "Cambios guardados." });
    } catch (err) {
      setEstado({ tipo: "error", texto: err instanceof ErrorApi ? err.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 5 * 1024 * 1024) return setEstado({ tipo: "error", texto: "La foto pesa más de 5 MB." });
    setSubiendo(true);
    setEstado(null);
    try {
      const fotoUrl = await api.subirFoto(archivo);
      const guardado = await api.actualizarNegocio({ ...negocio, fotoUrl });
      actualizar({ negocio: guardado });
      setDatos({ ...datos, fotoUrl });
    } catch (err) {
      setEstado({ tipo: "error", texto: err instanceof ErrorApi ? err.message : "No se pudo subir la foto." });
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  return (
    <div className="vista">
      <div className="vista__cabeza">
        <div>
          <h1 className="vista__titulo">Negocio</h1>
          <p className="muted vista__sub">Lo que ven tus clientes en tu página de reservas.</p>
        </div>
      </div>

      <section className="tarjeta enlace">
        <div>
          <h2>Tu página de reservas</h2>
          <p className="enlace__url">{enlace}</p>
          <p className="muted pequeno">Ponla en tu Instagram, en el estado de WhatsApp o en un código QR en el local.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            await navigator.clipboard?.writeText(enlace);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
        >
          {copiado ? "Copiado" : "Copiar enlace"}
        </button>
      </section>

      <form className="tarjeta editor" onSubmit={guardar}>
        <div className="foto">
          {datos.fotoUrl ? <img src={datos.fotoUrl} alt="Foto del negocio" width={96} height={96} /> : <div className="foto__vacia">Sin foto</div>}
          <label className="btn btn--chico">
            {subiendo ? "Subiendo…" : datos.fotoUrl ? "Cambiar foto" : "Subir foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={subirFoto} disabled={subiendo} />
          </label>
        </div>

        <div className="fila-2">
          <label className="campo">
            <span>Nombre</span>
            <input required {...campo("nombre")} />
          </label>
          <label className="campo">
            <span>Tipo</span>
            <select {...campo("tipo")}>
              {Object.entries(TIPOS).map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="campo">
          <span>Descripción</span>
          <textarea maxLength={300} {...campo("descripcion")} />
          <small>Algo corto que tus clientes deban saber. Máximo 300 letras.</small>
        </label>
        <div className="fila-2">
          <label className="campo">
            <span>Dirección</span>
            <input required {...campo("direccion")} />
          </label>
          <label className="campo">
            <span>Ciudad</span>
            <input required {...campo("ciudad")} />
          </label>
        </div>
        <label className="campo">
          <span>Teléfono o WhatsApp</span>
          <input required type="tel" {...campo("telefono")} />
        </label>

        <h2 className="editor__subtitulo">Reglas de la agenda</h2>
        <div className="editor__campos">
          <label className="campo">
            <span>Los cupos empiezan cada</span>
            <select {...campo("intervaloMin")}>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
            </select>
          </label>
          <label className="campo">
            <span>Se puede reservar hasta</span>
            <select {...campo("diasAdelante")}>
              {[7, 14, 21, 30, 60].map((d) => (
                <option key={d} value={d}>
                  {d} días antes
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Aviso mínimo</span>
            <select {...campo("avisoMin")}>
              <option value="0">Sin aviso</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="120">2 horas antes</option>
              <option value="1440">Un día antes</option>
            </select>
          </label>
        </div>

        {estado && <p className={estado.tipo === "ok" ? "aviso aviso--ok" : "error"} role="status">{estado.texto}</p>}
        <div className="editor__acciones">
          <button className="btn btn--primario" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
