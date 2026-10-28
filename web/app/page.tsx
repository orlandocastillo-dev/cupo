import Link from "next/link";
import { Seda } from "@/components/inicio/Seda";
import { Movimiento } from "@/components/inicio/Movimiento";
import { DemoReserva } from "@/components/inicio/DemoReserva";

const EJEMPLO = "/n/barberia-el-parche";
const GITHUB = "https://github.com/orlandocastillo-dev/cupo";

const CITAS = [
  { hora: "9:00 a. m.", quien: "Sebastián Molina", que: "Corte clásico, 30 min", estado: "Atendido", tono: "lista" },
  { hora: "9:30 a. m.", quien: "Kevin Mendoza", que: "Corte y barba, 1 h", estado: "Atendido", tono: "lista" },
  { hora: "11:00 a. m.", quien: "Andrés Pérez", que: "Barba con toalla caliente, 30 min", estado: "En la silla", tono: "ahora" },
  { hora: "11:30 a. m.", quien: "Juan David Torres", que: "Corte para niño, 30 min", estado: "Confirmado", tono: "viene" },
  { hora: "2:00 p. m.", quien: "Camilo Rojas", que: "Corte y barba, 1 h", estado: "Confirmado", tono: "viene" },
];

const PASOS = [
  { t: "Pones tus servicios y tu horario", d: "Cuánto dura cada cosa, cuánto vale y a qué horas abres. Si cierras a almorzar, son dos franjas." },
  { t: "Compartes tu enlace", d: "En la biografía de Instagram, en el estado de WhatsApp o en un código QR pegado en el espejo." },
  { t: "Tus clientes reservan solos", d: "Ven solo las horas que de verdad están libres. No tienen que crear cuenta ni escribirte." },
];

const PREGUNTAS = [
  { p: "¿Cuánto cuesta?", r: "Nada. Cupo es un proyecto de portafolio: la barbería del ejemplo es inventada y lo que hagas en ella se guarda solo en tu navegador." },
  { p: "¿Mis clientes tienen que crear una cuenta?", r: "No. Escogen servicio, día y hora, dejan su nombre y su celular, y reciben un código para ver o cancelar la cita." },
  { p: "¿Qué pasa si dos personas escogen la misma hora?", r: "Solo una se queda con ella. Cada cita aparta sus bloques de 15 minutos en una sola transacción; si otro tomó uno de esos bloques un instante antes, la segunda no entra y se le muestran las horas que siguen libres." },
  { p: "¿Puedo cerrar a la hora del almuerzo o en festivos?", r: "Sí. Cada día puede tener varias franjas, y los días que marques como cerrados desaparecen de la página de reservas." },
  { p: "¿Se puede usar desde el celular?", r: "Toda la aplicación está pensada primero para el celular, que es donde la usan el cliente y el dueño entre un corte y otro." },
  { p: "¿Dónde quedan guardados los datos?", r: "En la versión desplegada, en DynamoDB dentro de AWS, con las fotos en S3. El panel solo lo abre el dueño, que entra con su cuenta de Cognito." },
];

function Icono({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

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
        <Link className="boton boton--claro" href="/panel">
          Entrar
        </Link>
      </header>

      <div className="escena">
        <Seda className="seda" />
        <div className="grano" aria-hidden="true" />

        <section className="portada">
          <span className="etiqueta" data-reveal>
            <b>Nuevo</b> Recordatorio automático el día antes
          </span>
          <h1 data-reveal>
            Tu agenda llena, <em>sin contestar mensajes.</em>
          </h1>
          <p className="lead" data-reveal>
            Tus clientes ven tus horas libres y reservan solos, a cualquier hora. Tú abres la app y ya sabes quién viene hoy.
          </p>
          <div className="acciones" data-reveal>
            <Link className="boton boton--claro" href={EJEMPLO}>
              Probar con una barbería de ejemplo
            </Link>
            <Link className="boton boton--vidrio" href="/panel">
              Ver el panel del dueño
            </Link>
          </div>
        </section>

        <div className="vitrina" aria-label="Así se ve la agenda del dueño">
          <div className="ventana">
            <div className="ventana__barra">
              <i />
              <i />
              <i />
              <span>cupo.app/panel</span>
            </div>
            <div className="ventana__cuerpo">
              <nav className="lado" aria-label="Panel de ejemplo">
                <span aria-current="page">
                  <Icono d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM3 10h18M8 3v4M16 3v4" />
                  Agenda
                </span>
                <span>
                  <Icono d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                  Resumen
                </span>
                <span>
                  <Icono d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 4 8.1 15.9M14.5 14.5 20 20" />
                  Servicios
                </span>
                <span>
                  <Icono d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2" />
                  Horario
                </span>
              </nav>
              <div className="agenda">
                <div className="agenda__cabeza">
                  <div>
                    <p className="agenda__dia">Viernes 23 de octubre</p>
                    <p className="agenda__lugar">Barbería El Parche, Barranquilla</p>
                  </div>
                  <div className="cifras">
                    <span>
                      <b>9</b>citas hoy
                    </span>
                    <span>
                      <b>$286.000</b>por cobrar
                    </span>
                    <span>
                      <b>78 %</b>agenda ocupada
                    </span>
                  </div>
                </div>
                <ol className="citas">
                  {CITAS.map((c) => (
                    <li key={c.quien} className={`cita cita--${c.tono}`}>
                      <span className="cita__hora">{c.hora}</span>
                      <span className="cita__quien">
                        <b>{c.quien}</b>
                        <span>{c.que}</span>
                      </span>
                      <span className={`estado estado--${c.tono}`}>{c.estado}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main>
        <section className="seccion probar" id="probar" aria-labelledby="t-probar">
          <div className="probar__texto">
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
              <a className="boton boton--vidrio" href={GITHUB} target="_blank" rel="noopener noreferrer">
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
          <Seda className="seda" centro={[0.5, 0.2]} giro={-0.3} />
          <div className="final__velo" aria-hidden="true" />
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
          <p>
            Cupo es un proyecto de portafolio de <b>Orlando Castillo</b>, desarrollador en Barranquilla. Barbería El Parche es un negocio inventado.
          </p>
          <nav aria-label="Enlaces">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="mailto:orlandocastillo0709@gmail.com">orlandocastillo0709@gmail.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
