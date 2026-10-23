// Pedazos de la aplicación a tamaño real, con los mismos datos de la barbería de ejemplo.

const HORAS = [
  { h: "9:00", libre: true },
  { h: "9:30", libre: true },
  { h: "10:00", libre: false },
  { h: "10:30", libre: true, elegida: true },
  { h: "11:30", libre: true },
  { h: "2:00", libre: true },
  { h: "2:30", libre: false },
  { h: "4:00", libre: true },
  { h: "4:30", libre: true },
];

export function FragmentoReserva() {
  return (
    <div className="app app--reserva" data-ui>
      <div className="app__cabeza">
        <span className="app__avatar">EP</span>
        <div>
          <p className="app__titulo">Barbería El Parche</p>
          <p className="app__suave">Cra. 43 #74-12, Barranquilla</p>
        </div>
      </div>
      <p className="app__rotulo">Servicio</p>
      <ul className="app__servicios">
        <li>
          <span>Corte clásico</span>
          <span>30 min, $25.000</span>
        </li>
        <li className="is-elegido">
          <span>Corte y barba</span>
          <span>1 h, $38.000</span>
        </li>
        <li>
          <span>Barba</span>
          <span>30 min, $18.000</span>
        </li>
      </ul>
      <p className="app__rotulo">Sábado 24 de octubre</p>
      <div className="app__horas">
        {HORAS.slice(0, 6).map((x) => (
          <span key={x.h} className={x.elegida ? "is-elegida" : x.libre ? "" : "is-ocupada"}>
            {x.h}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FragmentoChoque() {
  return (
    <div className="app" data-ui>
      <p className="app__titulo">Sábado 24 de octubre</p>
      <p className="app__suave">Corte y barba, 1 hora</p>
      <div className="app__horas app__horas--grandes">
        {HORAS.map((x) => (
          <span key={x.h} className={x.elegida ? "is-elegida" : x.libre ? "" : "is-ocupada"}>
            {x.h}
            {!x.libre && <small>Ocupada</small>}
          </span>
        ))}
      </div>
      <div className="app__aviso" role="presentation">
        <p className="app__fuerte">Alguien apartó las 10:00 hace un momento.</p>
        <p>Te dejamos marcada la siguiente hora libre, las 10:30 a. m.</p>
      </div>
      <span className="app__boton">Reservar a las 10:30 a. m.</span>
    </div>
  );
}

export function FragmentoCorreo() {
  return (
    <div className="app app--correo" data-ui>
      <div className="correo__cabeza">
        <p>
          <span className="app__suave">De</span> Barbería El Parche
        </p>
        <p>
          <span className="app__suave">Para</span> andres.perez@correo.com
        </p>
        <p className="app__suave">Hoy, 6:00 p. m.</p>
      </div>
      <p className="app__titulo">Mañana tienes cita a las 11:00 a. m.</p>
      <p>Hola, Andrés. Te esperamos el viernes 23 de octubre para tu barba con toalla caliente.</p>
      <dl className="app__datos">
        <div>
          <dt>Dónde</dt>
          <dd>Cra. 43 #74-12</dd>
        </div>
        <div>
          <dt>Cuánto</dt>
          <dd>$18.000</dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd>K7Q4M2</dd>
        </div>
      </dl>
      <span className="app__boton app__boton--claro">No puedo ir, cancelar la cita</span>
    </div>
  );
}

export function FragmentoCancelar() {
  return (
    <div className="app" data-ui>
      <p className="app__suave">Tu reserva K7Q4M2</p>
      <p className="app__titulo">Barba con toalla caliente</p>
      <dl className="app__datos app__datos--lista">
        <div>
          <dt>Cuándo</dt>
          <dd>Viernes 23 de octubre, 11:00 a. m.</dd>
        </div>
        <div>
          <dt>Con</dt>
          <dd>Barbería El Parche</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span className="app__estado">Cancelada por ti</span>
          </dd>
        </div>
      </dl>
      <div className="app__aviso app__aviso--listo">
        <p className="app__fuerte">Listo, cancelaste tu cita.</p>
        <p>Las 11:00 a. m. vuelven a aparecer libres para otra persona.</p>
      </div>
      <span className="app__boton">Reservar otra hora</span>
    </div>
  );
}

const DIAS = [
  { d: "Lun", n: 5 },
  { d: "Mar", n: 7 },
  { d: "Mié", n: 6 },
  { d: "Jue", n: 8 },
  { d: "Vie", n: 9 },
  { d: "Sáb", n: 11 },
];

export function FragmentoSemana() {
  const max = 12;
  return (
    <div className="app" data-ui>
      <p className="app__titulo">Semana del 12 al 17 de octubre</p>
      <dl className="semana-cifras">
        <div>
          <dt>Citas</dt>
          <dd>46</dd>
        </div>
        <div>
          <dt>Cobrado</dt>
          <dd>$1.284.000</dd>
        </div>
        <div>
          <dt>Tiempo ocupado</dt>
          <dd>72 %</dd>
        </div>
        <div>
          <dt>No llegaron</dt>
          <dd>3</dd>
        </div>
      </dl>
      <div className="semana-barras" role="img" aria-label="Citas por día: lunes 5, martes 7, miércoles 6, jueves 8, viernes 9, sábado 11">
        {DIAS.map((x) => (
          <div key={x.d} className="semana-barra">
            <span className="semana-barra__n">{x.n}</span>
            <span className="semana-barra__relleno" style={{ height: `${(x.n / max) * 100}%` }} />
            <span className="semana-barra__d">{x.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
