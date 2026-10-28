import Link from "next/link";
import { Movimiento } from "@/components/inicio/Movimiento";
import { DemoReserva } from "@/components/inicio/DemoReserva";

const EJEMPLO = "/n/barberia-el-parche";
const GITHUB = "https://github.com/orlandocastillo-dev/cupo";

// La hoja de la libreta: renglones de 15 minutos de 9:00 a 12:30.
const RENGLONES = ["9:00", "9:15", "9:30", "9:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15"];

const ENTRADAS = [
  { fila: 1, largo: 2, quien: "Sebastián Molina", que: "Corte clásico", tono: "lista", sello: "Atendido" },
  { fila: 3, largo: 4, quien: "Kevin Mendoza", que: "Corte y barba", tono: "lista", sello: "Atendido" },
  { fila: 7, largo: 2, quien: "Libre", que: "Se puede reservar desde la página", tono: "libre", sello: "" },
  { fila: 9, largo: 2, quien: "Andrés Pérez", que: "Barba con toalla caliente", tono: "ahora", sello: "En la silla" },
  { fila: 11, largo: 2, quien: "Juan David Torres", que: "Corte para niño", tono: "viene", sello: "" },
  { fila: 13, largo: 2, quien: "Almuerzo", que: "Cerrado de 12:00 a 2:00", tono: "cerrado", sello: "" },
];

const PASOS = [
  { t: "Pones tus servicios y tu horario", d: "Cuánto dura cada cosa, cuánto vale y a qué horas abres. Si cierras a almorzar, son dos franjas." },
  { t: "Compartes tu enlace", d: "En la biografía de Instagram, en el estado de WhatsApp o en un código QR pegado en el espejo." },
  { t: "Tus clientes reservan solos", d: "Ven solo las horas que de verdad están libres. No tienen que crear cuenta ni escribirte." },
];

const CIFRAS = [
  { n: "15 min", d: "Bloques en que se parte la agenda" },
  { n: "0", d: "Reservas dobles, lo impide la base de datos" },
  { n: "6:00 p. m.", d: "Sale el recordatorio del día siguiente" },
  { n: "< 1 min", d: "Lo que tarda un cliente en reservar" },
];

const PREGUNTAS = [
  { p: "¿Cuánto cuesta?", r: "Nada. Cupo es un proyecto de portafolio: la barbería del ejemplo es inventada y lo que hagas en ella se guarda solo en tu navegador." },
  { p: "¿Mis clientes tienen que crear una cuenta?", r: "No. Escogen servicio, día y hora, dejan su nombre y su celular, y reciben un código para ver o cancelar la cita." },
  { p: "¿Qué pasa si dos personas escogen la misma hora?", r: "Solo una se queda con ella. Cada cita aparta sus bloques de 15 minutos en una sola transacción; si otro tomó uno de esos bloques un instante antes, la segunda no entra y se le muestran las horas que siguen libres." },
  { p: "¿Puedo cerrar a la hora del almuerzo o en festivos?", r: "Sí. Cada día puede tener varias franjas, y los días que marques como cerrados desaparecen de la página de reservas." },
  { p: "¿Se puede usar desde el celular?", r: "Toda la aplicación está pensada primero para el celular, que es donde la usan el cliente y el dueño entre un corte y otro." },
  { p: "¿Dónde quedan guardados los datos?", r: "En la versión desplegada, en DynamoDB dentro de AWS, con las fotos en S3. El panel solo lo abre el dueño, que entra con su cuenta de Cognito." },
];

export default function Inicio() {
  return (
    <div className="cine">
      <Movimiento />

      <header className="barra">
        <Link className="marca" href="/">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2.5" y="4" width="19" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m8 12.6 2.8 2.8L16.4 9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cupo
        </Link>
        <nav aria-label="Principal">
          <a href="#probar">Cómo funciona</a>
          <a href="#funciones">Lo que hace</a>
          <a href="#tecnica">Cómo está hecho</a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer">
            Código
          </a>
        </nav>
        <Link className="boton boton--tinta" href="/panel">
          Entrar
        </Link>
      </header>

      <div className="escena">
        <section className="portada">
          <div className="portada__texto">
            <p className="ceja" data-reveal>
              Reservas en línea para barberías, spas y consultorios
            </p>
            <h1 data-reveal>
              Tu agenda llena, <em>sin contestar mensajes.</em>
            </h1>
            <p className="lead" data-reveal>
              Tus clientes ven tus horas libres y reservan solos, a cualquier hora. Tú abres la libreta y ya sabes quién viene hoy.
            </p>
            <div className="acciones" data-reveal>
              <Link className="boton boton--tinta" href={EJEMPLO}>
                Probar con una barbería de ejemplo
              </Link>
              <Link className="boton boton--linea" href="/panel">
                Ver el panel del dueño
              </Link>
            </div>
            <p className="portada__nota" data-reveal>
              Tus clientes no crean cuenta. Tú no contestas un solo mensaje.
            </p>
          </div>

          <figure className="libreta" aria-label="Así se ve la agenda del día en Cupo">
            <div className="hoja">
              <header className="hoja__cabeza">
                <div>
                  <p className="hoja__dia">Viernes 23 de octubre</p>
                  <p className="hoja__lugar">Barbería El Parche</p>
                </div>
                <p className="hoja__cuenta">
                  <b>5</b> citas
                </p>
              </header>
              <div className="hoja__cuerpo">
                {RENGLONES.map((r, i) => (
                  <span key={r} className="hoja__hora" style={{ gridRow: i + 1 }}>
                    {r.endsWith(":00") || r.endsWith(":30") ? r : ""}
                  </span>
                ))}
                {ENTRADAS.map((e) => (
                  <div key={e.quien} className={`entrada entrada--${e.tono}`} style={{ gridRow: `${e.fila} / span ${e.largo}` }}>
                    <p className="entrada__quien">{e.quien}</p>
                    <p className="entrada__que">{e.que}</p>
                    {e.sello && <span className="sello">{e.sello}</span>}
                  </div>
                ))}
              </div>
            </div>
            <figcaption className="papelito">
              <span>Nueva reserva</span>
              Laura Gómez, sábado a las 10:00 a. m.
            </figcaption>
          </figure>
        </section>
      </div>

      <main>
        <section className="cifras-banda" aria-label="Cupo en cifras">
          <dl>
            {CIFRAS.map((c) => (
              <div key={c.d} data-reveal>
                <dt>{c.d}</dt>
                <dd>{c.n}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="seccion probar" id="probar" aria-labelledby="t-probar">
          <div className="probar__texto">
            <p className="ceja ceja--num" data-reveal>
              <span>01</span> Cómo funciona
            </p>
            <h2 id="t-probar" className="titulo" data-reveal>
              Pruébalo aquí mismo, <em>como lo haría tu cliente.</em>
            </h2>
            <ol className="pasos">
              {PASOS.map((p, i) => (
                <li key={p.t} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <span className="pasos__n">{i + 1}</span>
                  <div>
                    <h3>{p.t}</h3>
                    <p>{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="probar__nota" data-reveal>
              Toca las 10:00: hay dos personas viéndolas y vas a ver qué pasa cuando la otra gana.
            </p>
          </div>
          <div className="probar__demo" data-reveal>
            <div className="halo" aria-hidden="true" />
            <DemoReserva />
          </div>
        </section>

        <section className="seccion funciones" id="funciones" aria-labelledby="t-funciones">
          <p className="ceja ceja--num ceja--centro" data-reveal>
            <span>02</span> Lo que hace
          </p>
          <h2 id="t-funciones" className="titulo titulo--centro" data-reveal>
            Lo que se encarga solo, <em>mientras tú atiendes.</em>
          </h2>
          <div className="bento">
            <article className="tarjeta brillo tarjeta--ancha" data-reveal>
              <div className="carrera" aria-hidden="true">
                <div className="carrera__fila carrera__fila--gana">
                  <span className="carrera__quien">Laura</span>
                  <span className="carrera__linea" />
                  <span className="carrera__hora">10:00</span>
                  <span className="carrera__res">Quedó para Laura</span>
                </div>
                <div className="carrera__fila carrera__fila--pierde">
                  <span className="carrera__quien">Mateo</span>
                  <span className="carrera__linea" />
                  <span className="carrera__hora">10:00</span>
                  <span className="carrera__res">Le ofrecemos 10:30</span>
                </div>
              </div>
              <h3>Nadie te pisa la hora</h3>
              <p>Si dos clientes tocan las 10:00 al mismo tiempo, solo uno se la queda. Al otro se le avisa y se le ofrece la siguiente libre.</p>
            </article>

            <article className="tarjeta brillo" data-reveal>
              <div className="noti" aria-hidden="true">
                <span className="noti__app">EP</span>
                <div>
                  <p className="noti__de">Barbería El Parche</p>
                  <p>Mañana tienes cita a las 11:00 a. m.</p>
                </div>
                <span className="noti__cuando">6:00 p. m.</span>
              </div>
              <h3>El recordatorio sale solo</h3>
              <p>El día antes, a las 6 de la tarde, le llega un correo a cada persona con cita.</p>
            </article>

            <article className="tarjeta brillo" data-reveal>
              <div className="cancelar" aria-hidden="true">
                <span className="cancelar__codigo">K7Q4M2</span>
                <span className="cancelar__boton">Cancelar mi cita</span>
              </div>
              <h3>Cancelan sin llamarte</h3>
              <p>Con el código de su reserva, desde el celular. La hora vuelve a quedar libre para otro.</p>
            </article>

            <article className="tarjeta brillo" data-reveal>
              <div className="semana" aria-hidden="true">
                {[
                  ["L", "abre"],
                  ["M", "abre"],
                  ["M", "abre"],
                  ["J", "abre"],
                  ["V", "abre"],
                  ["S", "abre"],
                  ["D", "cierra"],
                ].map(([d, e], i) => (
                  <span key={i} className={`semana__dia semana__dia--${e}`}>
                    {d}
                  </span>
                ))}
              </div>
              <h3>Almuerzo y festivos</h3>
              <p>Varias franjas por día y días cerrados que desaparecen de la página de reservas.</p>
            </article>

            <article className="tarjeta brillo" data-reveal>
              <div className="barras" aria-hidden="true">
                {[5, 7, 6, 8, 9, 11].map((n, i) => (
                  <span key={i} style={{ height: `${(n / 11) * 100}%` }} />
                ))}
              </div>
              <h3>La semana en un vistazo</h3>
              <p>Citas, lo que entró, cuánto estuvo ocupada la silla y cuánta gente no llegó.</p>
            </article>
          </div>
        </section>

        <section className="seccion tecnica" id="tecnica" aria-labelledby="t-tecnica">
          <div className="horizonte" aria-hidden="true" />
          <p className="ceja ceja--num ceja--centro" data-reveal>
            <span>03</span> Cómo está hecho
          </p>
          <h2 id="t-tecnica" className="titulo titulo--centro" data-reveal>
            Hecho como se hace <em>en producción.</em>
          </h2>
          <p className="tecnica__lead" data-reveal>
            El frontend es Next.js. El backend corre en AWS sin servidores que mantener, y toda la infraestructura está escrita en código con CDK.
          </p>

          <div className="flujo" data-reveal>
            <div className="nodo">
              <b>Next.js</b>
              <span>Página de reservas y panel</span>
            </div>
            <span className="flujo__linea" aria-hidden="true" />
            <div className="nodo">
              <b>API Gateway</b>
              <span>Con autorizador JWT y límite de peticiones</span>
            </div>
            <span className="flujo__linea" aria-hidden="true" />
            <div className="nodo nodo--fuerte">
              <b>Lambda</b>
              <span>Una función por grupo de rutas</span>
            </div>
            <span className="flujo__linea" aria-hidden="true" />
            <div className="nodo">
              <b>DynamoDB</b>
              <span>Una sola tabla con dos índices</span>
            </div>
          </div>
          <div className="flujo flujo--abajo" data-reveal>
            <div className="nodo nodo--chico">
              <b>Cognito</b>
              <span>Cuentas de los dueños</span>
            </div>
            <div className="nodo nodo--chico">
              <b>EventBridge + SES</b>
              <span>Recordatorios de cada día</span>
            </div>
            <div className="nodo nodo--chico">
              <b>S3 + CloudFront</b>
              <span>Fotos del negocio</span>
            </div>
            <div className="nodo nodo--chico">
              <b>GitHub Actions</b>
              <span>Pruebas y despliegue</span>
            </div>
          </div>

          <div className="codigo" data-reveal>
            <div className="codigo__texto">
              <h3>Cero reservas dobles, garantizado por la base</h3>
              <p>
                Cada cita aparta sus bloques de 15 minutos en la misma transacción que la guarda. Si otro cliente tomó cualquiera de esos bloques un
                instante antes, DynamoDB cancela todo y el segundo ve las horas que siguen libres.
              </p>
              <a className="boton boton--linea" href={GITHUB} target="_blank" rel="noopener noreferrer">
                Ver el código en GitHub
              </a>
            </div>
            <pre className="codigo__bloque" aria-label="Fragmento del código que guarda una reserva">
              <code>
                <span className="c-k">await</span> doc.<span className="c-f">send</span>(<span className="c-k">new</span>{" "}
                <span className="c-t">TransactWriteCommand</span>({"{"}
                {"\n"}  TransactItems: [
                {"\n"}    {"{"} Put: {"{"} TableName, Item: reserva,
                {"\n"}            ConditionExpression: <span className="c-s">&quot;attribute_not_exists(PK)&quot;</span> {"}"} {"}"},
                {"\n"}    ...bloques.<span className="c-f">map</span>((b) =&gt; ({"{"}
                {"\n"}      Put: {"{"} TableName,
                {"\n"}             Item: {"{"} PK, SK: <span className="c-s">`OCUPA#${"{"}fecha{"}"}#${"{"}b{"}"}`</span> {"}"},
                {"\n"}             ConditionExpression: <span className="c-s">&quot;attribute_not_exists(PK)&quot;</span> {"}"},
                {"\n"}    {"}"})),
                {"\n"}  ],
                {"\n"}{"}"}));
              </code>
            </pre>
          </div>
        </section>

        <section className="seccion preguntas" aria-labelledby="t-preguntas">
          <p className="ceja ceja--num ceja--centro" data-reveal>
            <span>04</span> Preguntas
          </p>
          <h2 id="t-preguntas" className="titulo titulo--centro" data-reveal>
            Preguntas que <em>siempre hacen.</em>
          </h2>
          <div className="preguntas__lista">
            {PREGUNTAS.map((q) => (
              <details key={q.p} name="pregunta" className="pregunta" data-reveal>
                <summary>
                  {q.p}
                  <span className="pregunta__signo" aria-hidden="true" />
                </summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final" aria-labelledby="t-final">
          <div className="final__dentro" data-reveal>
            <h2 id="t-final">
              Tu próxima cita, <em>sin un solo mensaje.</em>
            </h2>
            <p>Abre la barbería de ejemplo, escoge un corte y aparta una hora. Toma menos de un minuto.</p>
            <div className="acciones">
              <Link className="boton boton--claro" href={EJEMPLO}>
                Reservar en El Parche
              </Link>
              <Link className="boton boton--vidrio" href="/panel">
                Ver el panel del dueño
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="pie__dentro">
          <div className="pie__marca">
            <Link className="marca" href="/">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="4" width="19" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <path d="m8 12.6 2.8 2.8L16.4 9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cupo
            </Link>
            <p>Reservas en línea para negocios que viven de su agenda.</p>
          </div>
          <nav aria-label="Producto">
            <p>Producto</p>
            <Link href={EJEMPLO}>Barbería de ejemplo</Link>
            <Link href="/panel">Panel del dueño</Link>
            <a href="#funciones">Lo que hace</a>
          </nav>
          <nav aria-label="Proyecto">
            <p>Proyecto</p>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              Código en GitHub
            </a>
            <a href="#tecnica">Arquitectura en AWS</a>
            <a href="https://orlandocastillo.vercel.app" target="_blank" rel="noopener noreferrer">
              Portafolio
            </a>
          </nav>
          <nav aria-label="Contacto">
            <p>Contacto</p>
            <a href="mailto:orlandocastillo0709@gmail.com">orlandocastillo0709@gmail.com</a>
            <a href="https://github.com/orlandocastillo-dev" target="_blank" rel="noopener noreferrer">
              orlandocastillo-dev
            </a>
          </nav>
        </div>
        <div className="pie__base">
          <p>Proyecto de portafolio de Orlando Castillo, Barranquilla, 2025 – 2026.</p>
          <p>Barbería El Parche es un negocio inventado.</p>
        </div>
      </footer>
    </div>
  );
}
