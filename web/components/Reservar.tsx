"use client";

import { momentoEn, sumarDias, type DiaDisponible, type Negocio, type Reserva, type Servicio } from "@cupo/core";
import { useEffect, useMemo, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { diaCorto, duracion, fechaLarga, hora12, mesCorto, numeroDia, plata, TIPOS } from "@/lib/formato";
import { Confirmacion } from "./Confirmacion";

const DIAS_POR_VISTA = 14;

function grupos(cupos: string[]) {
  const g = [
    { nombre: "Mañana", horas: cupos.filter((h) => h < "12:00") },
    { nombre: "Tarde", horas: cupos.filter((h) => h >= "12:00" && h < "18:00") },
    { nombre: "Noche", horas: cupos.filter((h) => h >= "18:00") },
  ];
  return g.filter((x) => x.horas.length);
}

export function Reservar({ slug }: { slug: string }) {
  const [datos, setDatos] = useState<{ negocio: Negocio; servicios: Servicio[] } | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [desde, setDesde] = useState(() => momentoEn(new Date()).fecha);
  const [dias, setDias] = useState<DiaDisponible[] | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", correo: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const hoy = useMemo(() => momentoEn(new Date()).fecha, []);

  useEffect(() => {
    api
      .verNegocio(slug)
      .then((d) => {
        setDatos(d);
        setServicioId(d.servicios[0]?.id ?? null);
      })
      .catch((e) => setErrorCarga(e instanceof ErrorApi ? e.message : "No pudimos cargar el negocio."));
  }, [slug]);

  useEffect(() => {
    if (!servicioId) return;
    let vigente = true;
    setDias(null);
    api.disponibilidad(slug, servicioId, desde, DIAS_POR_VISTA).then((d) => {
      if (!vigente) return;
      setDias(d);
      // Se queda en el día elegido si sigue teniendo cupos; si no, salta al primero con cupos.
      setFecha((actual) => (actual && d.find((x) => x.fecha === actual)?.cupos.length ? actual : (d.find((x) => x.cupos.length)?.fecha ?? null)));
    });
    return () => {
      vigente = false;
    };
  }, [slug, servicioId, desde]);

  useEffect(() => setHora(null), [servicioId, fecha]);

  if (errorCarga) {
    return (
      <div className="contenedor reservar__vacio">
        <h1>No encontramos este negocio</h1>
        <p className="muted">{errorCarga}</p>
      </div>
    );
  }
  if (!datos) return <div className="cargando">Cargando…</div>;

  const { negocio, servicios } = datos;
  const servicio = servicios.find((s) => s.id === servicioId);
  const dia = dias?.find((d) => d.fecha === fecha);

  if (reserva) return <Confirmacion reserva={reserva} negocio={negocio} onOtra={() => { setReserva(null); setHora(null); setDesde(hoy); }} />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!servicio || !fecha || !hora) return;
    setEnviando(true);
    setError(null);
    try {
      setReserva(await api.reservar(slug, { servicioId: servicio.id, fecha, inicio: hora, cliente }));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : "No se pudo reservar. Intenta de nuevo.");
      if (err instanceof ErrorApi && err.codigo === "ocupado") {
        // Alguien tomó la hora: se recargan los cupos para que la persona elija otra.
        setHora(null);
        api.disponibilidad(slug, servicio.id, desde, DIAS_POR_VISTA).then(setDias);
      }
    } finally {
      setEnviando(false);
    }
  }

  const telefonoWa = negocio.telefono.replace(/\D/g, "");

  return (
    <div className="reservar">
      <header className="negocio">
        <div className="contenedor negocio__dentro">
          {negocio.fotoUrl ? (
            <img className="negocio__foto" src={negocio.fotoUrl} alt="" width={88} height={88} />
          ) : (
            <div className="negocio__foto negocio__foto--iniciales" aria-hidden="true">
              {negocio.nombre.split(" ").filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join("")}
            </div>
          )}
          <div>
            <p className="negocio__tipo">{TIPOS[negocio.tipo]}</p>
            <h1>{negocio.nombre}</h1>
            <p className="muted">
              {negocio.direccion}, {negocio.ciudad}
            </p>
            {negocio.descripcion && <p className="negocio__descripcion">{negocio.descripcion}</p>}
          </div>
          <a className="btn negocio__llamar" href={`https://wa.me/57${telefonoWa.slice(-10)}`} target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp
          </a>
        </div>
      </header>

      <div className="contenedor reservar__cuerpo">
        <div className="reservar__pasos">
          <section aria-labelledby="paso-servicio">
            <h2 id="paso-servicio" className="paso__titulo">
              <span>1</span> Elige el servicio
            </h2>
            {servicios.length === 0 ? (
              <p className="muted">Este negocio todavía no tiene servicios para reservar.</p>
            ) : (
              <div className="servicios" role="radiogroup" aria-labelledby="paso-servicio">
                {servicios.map((s) => (
                  <label key={s.id} className={`servicio ${s.id === servicioId ? "is-elegido" : ""}`}>
                    <input type="radio" name="servicio" value={s.id} checked={s.id === servicioId} onChange={() => setServicioId(s.id)} />
                    <span className="servicio__nombre">{s.nombre}</span>
                    <span className="servicio__meta">{duracion(s.duracionMin)}</span>
                    <span className="servicio__precio">{plata(s.precio)}</span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {servicio && (
            <section aria-labelledby="paso-hora">
              <div className="paso__cabeza">
                <h2 id="paso-hora" className="paso__titulo">
                  <span>2</span> Elige día y hora
                </h2>
                <div className="paso__flechas">
                  <button type="button" className="btn btn--chico" disabled={desde <= hoy} onClick={() => setDesde((d) => (sumarDias(d, -DIAS_POR_VISTA) < hoy ? hoy : sumarDias(d, -DIAS_POR_VISTA)))} aria-label="Días anteriores">
                    ‹
                  </button>
                  <button type="button" className="btn btn--chico" disabled={sumarDias(desde, DIAS_POR_VISTA) > sumarDias(hoy, negocio.diasAdelante)} onClick={() => setDesde((d) => sumarDias(d, DIAS_POR_VISTA))} aria-label="Días siguientes">
                    ›
                  </button>
                </div>
              </div>

              <div className="dias" role="listbox" aria-label="Días">
                {(dias ?? Array.from({ length: DIAS_POR_VISTA }, (_, i) => ({ fecha: sumarDias(desde, i), cupos: [], motivo: null }))).map((d) => {
                  const libres = d.cupos.length;
                  return (
                    <button
                      key={d.fecha}
                      type="button"
                      role="option"
                      aria-selected={d.fecha === fecha}
                      disabled={!dias || !libres}
                      className={`dia ${d.fecha === fecha ? "is-elegido" : ""} ${!dias ? "esqueleto" : ""}`}
                      onClick={() => setFecha(d.fecha)}
                    >
                      <span className="dia__semana">{d.fecha === hoy ? "Hoy" : diaCorto(d.fecha)}</span>
                      <span className="dia__numero">{numeroDia(d.fecha)}</span>
                      <span className="dia__mes">{mesCorto(d.fecha)}</span>
                      <span className="dia__libres">{!dias ? " " : d.motivo === "cerrado" ? "Cerrado" : libres ? `${libres} libres` : "Lleno"}</span>
                    </button>
                  );
                })}
              </div>

              {dias && !fecha && <p className="muted horas__vacio">No hay cupos en estos días. Mira los siguientes con la flecha.</p>}
              {dia && (
                <div className="horas" aria-live="polite">
                  <p className="horas__fecha">{fechaLarga(dia.fecha)}</p>
                  {grupos(dia.cupos).map((g) => (
                    <div key={g.nombre} className="horas__grupo">
                      <p className="horas__nombre">{g.nombre}</p>
                      <div className="horas__lista">
                        {g.horas.map((h) => (
                          <button key={h} type="button" className={`hora ${h === hora ? "is-elegida" : ""}`} aria-pressed={h === hora} onClick={() => setHora(h)}>
                            {hora12(h)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="resumen-reserva tarjeta" aria-label="Tu reserva">
          <h2>Tu reserva</h2>
          <dl className="resumen-reserva__datos">
            <div>
              <dt>Servicio</dt>
              <dd>{servicio ? `${servicio.nombre}, ${duracion(servicio.duracionMin)}` : "Sin elegir"}</dd>
            </div>
            <div>
              <dt>Cuándo</dt>
              <dd>{fecha && hora ? `${fechaLarga(fecha)}, ${hora12(hora)}` : "Elige día y hora"}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{servicio ? plata(servicio.precio) : "—"}</dd>
            </div>
          </dl>

          <form className="formulario" onSubmit={enviar}>
            <label className="campo">
              <span>Tu nombre</span>
              <input required minLength={2} autoComplete="name" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            </label>
            <label className="campo">
              <span>Celular</span>
              <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            </label>
            <label className="campo">
              <span>Correo (opcional)</span>
              <input type="email" autoComplete="email" value={cliente.correo} onChange={(e) => setCliente({ ...cliente, correo: e.target.value })} />
              <small>Para mandarte la confirmación y el recordatorio del día antes.</small>
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn btn--primario btn--bloque" disabled={!servicio || !fecha || !hora || enviando}>
              {enviando ? "Reservando…" : hora ? `Reservar a las ${hora12(hora)}` : "Reservar"}
            </button>
            <p className="pequeno muted">Pagas en el negocio. Puedes cancelar hasta antes de tu hora.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}
