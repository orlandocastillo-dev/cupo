import Link from "next/link";
import { Tablero } from "@/components/inicio/Tablero";
import { Movimiento } from "@/components/inicio/Movimiento";
import { Hojas } from "@/components/inicio/Hojas";
import { FragmentoReserva } from "@/components/inicio/Fragmentos";

const EJEMPLO = "/n/barberia-el-parche";
const GITHUB = "https://github.com/orlandocastillo-dev/cupo";
const CORREO = "orlandocastillo0709@gmail.com";

const PASOS = [
  { linea: "Primero pones tus horarios.", texto: "Qué servicios haces, cuánto duran, cuánto valen y a qué horas abres. Si cierras a almorzar, son dos franjas." },
  { linea: "Después compartes tu enlace.", texto: "En la biografía de Instagram, en el estado de WhatsApp o impreso en un código QR pegado en el espejo." },
  { linea: "Tu cliente escoge la hora.", texto: "Ve solo las horas que de verdad están libres, deja su nombre y su celular, y listo. No tiene que crear cuenta." },
  { linea: "Y tú solo atiendes.", texto: "La cita aparece en tu agenda. El día antes le llega un recordatorio y al final de la semana ves cuánto entró." },
];

const PIEZAS = [
  { nombre: "Next.js", dato: "La página de reservas y el panel" },
  { nombre: "Lambda", dato: "Cada operación de la API" },
  { nombre: "DynamoDB", dato: "Una tabla, cero reservas dobles" },
  { nombre: "Cognito", dato: "Las cuentas de los dueños" },
  { nombre: "CDK", dato: "La infraestructura, escrita en código" },
];

const PREGUNTAS = [
  { p: "¿Cuánto cuesta?", r: "Nada. Cupo es un proyecto de portafolio: el negocio del ejemplo es inventado y lo que hagas en él se guarda solo en tu navegador." },
  { p: "¿Mis clientes tienen que crear una cuenta?", r: "No. Escogen servicio, día y hora, dejan su nombre y su celular, y reciben un código para ver o cancelar la cita." },
  { p: "¿Qué pasa si dos personas escogen la misma hora?", r: "Solo una se queda con ella. Cada cita aparta sus bloques de 15 minutos en una sola transacción; si otro tomó uno de esos bloques un instante antes, la segunda reserva no entra y se le muestran las horas que siguen libres." },
  { p: "¿Puedo cerrar a la hora del almuerzo?", r: "Sí. Cada día puede tener varias franjas, por ejemplo de 8:00 a 12:00 y de 2:00 a 7:00. Entre una y otra no aparece ninguna hora." },
  { p: "¿Y los festivos o si me voy de vacaciones?", r: "Marcas esos días como cerrados y desaparecen de la página de reservas. Las citas que ya estaban siguen en tu agenda para que avises." },
  { p: "¿Se puede usar desde el celular?", r: "Toda la aplicación está pensada primero para el celular, que es donde la usan tanto el cliente como el dueño entre un corte y otro." },
  { p: "¿Cuándo sale el recordatorio?", r: "A las 6:00 p. m. del día anterior le llega un correo a cada persona con cita, con la hora y el enlace para cancelar si no puede ir." },
  { p: "¿Dónde quedan guardados los datos?", r: "En la versión desplegada, en DynamoDB dentro de AWS, con las fotos en S3. El panel solo lo abre el dueño, que entra con su cuenta de Cognito." },
];

function Nombre({ className }: { className: string }) {
  // El nombre va en SVG para que ocupe todo el ancho en una sola línea, sin importar la pantalla.
  return (
    <svg className={className} viewBox="0 0 1000 268" role="img" aria-label="Cupo">
      <text x="0" y="246" textLength="1000" lengthAdjust="spacingAndGlyphs">
        CUPO
      </text>
    </svg>
  );
}

export default function Inicio() {
  return (
    <>
      <Movimiento />
      <header className="portada">
        <div className="portada__arriba">
          <div className="portada__frase" data-reveal>
            <p className="portada__lema">Reservas en línea para barberías y consultorios de barrio. Tus clientes apartan la hora solos.</p>
            <Link className="boton" href={EJEMPLO}>
              Probar una reserva
            </Link>
          </div>
          <nav className="portada__menu" aria-label="Secciones" data-reveal>
            <a href="#como">Cómo funciona</a>
            <a href="#preguntas">Preguntas</a>
            <Link href="/panel">Panel del dueño</Link>
          </nav>
        </div>

        <h1 className="portada__nombre">
          <Nombre className="nombre nombre--portada" />
        </h1>

        <div className="portada__muestra" aria-hidden="true">
          <FragmentoReserva />
        </div>

        <div className="portada__abajo">
          <p data-reveal>Hecho en Barranquilla para negocios que atienden con cita</p>
          <p className="portada__enlaces" data-reveal>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              Código en GitHub
            </a>
            <Link href="/panel">Ver la agenda de ejemplo</Link>
          </p>
        </div>
      </header>

      <main>
        <section className="seccion-tablero" aria-labelledby="t-tablero">
          <h2 id="t-tablero" className="tablero__titulo" data-reveal>
            El viernes en El Parche
          </h2>
          <Tablero />
        </section>

        <section className="escalera" id="como" aria-labelledby="t-como">
          {PASOS.map((p, i) => (
            <div key={p.linea} className={`escalon escalon--${i + 1}`} data-reveal>
              {i === 0 ? (
                <h2 id="t-como" className="escalon__linea">
                  {p.linea}
                </h2>
              ) : (
                <p className="escalon__linea">{p.linea}</p>
              )}
              <p className="escalon__texto">{p.texto}</p>
            </div>
          ))}
        </section>

        <Hojas />

        <section className="piezas" aria-labelledby="t-piezas">
          <div className="piezas__cabeza" data-reveal>
            <h2 id="t-piezas">Cómo está hecho</h2>
            <p>
              El backend corre en AWS sin servidores que mantener. Cada pieza hace una sola cosa, y todo se despliega con un comando.
            </p>
          </div>
          <ul className="piezas__lista">
            {PIEZAS.map((p) => (
              <li key={p.nombre} data-reveal>
                <span className="piezas__nombre">{p.nombre}</span>
                <span className="piezas__dato">{p.dato}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="preguntas" id="preguntas" aria-labelledby="t-preguntas">
          <h2 id="t-preguntas" className="preguntas__titulo" data-reveal>
            Preguntas
          </h2>
          <div className="preguntas__lista">
            {PREGUNTAS.map((q, i) => (
              <details key={q.p} name="pregunta" className="pregunta" open={i === 2} data-reveal>
                <summary>
                  <span>{q.p}</span>
                  <span className="pregunta__signo" aria-hidden="true" />
                </summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="llamado" aria-labelledby="t-llamado">
          <Link href={EJEMPLO} className="llamado__enlace">
            <span className="llamado__frase">Abre la barbería de ejemplo, escoge un corte y aparta una hora. Toma menos de un minuto.</span>
            <svg className="llamado__flecha" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M12 36 36 12M16 12h20v20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" />
            </svg>
            <h2 id="t-llamado" className="llamado__palabra">
              Reserva
            </h2>
          </Link>
        </section>
      </main>

      <footer className="pie">
        <div className="pie__arriba">
          <div className="pie__notas">
            <p className="pie__marca">Cupo</p>
            <p>Un proyecto de portafolio de Orlando Castillo, desarrollador en Barranquilla.</p>
            <p>Busco trabajo como desarrollador full stack. Si tienes una vacante o un proyecto, escríbeme.</p>
          </div>
          <a href="#" className="pie__subir">
            Volver arriba
          </a>
        </div>
        <h2 className="pie__titulo">Escríbeme</h2>
        <a className="pie__correo" href={`mailto:${CORREO}`}>
          <span>orlandocastillo0709</span>
          <span>@gmail.com</span>
        </a>
        <div className="pie__meta">
          <p>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link href="/panel">Panel</Link>
          </p>
          <p>El negocio del ejemplo es inventado.</p>
          <p>Barranquilla, 2026</p>
        </div>
        <div className="pie__nombre" aria-hidden="true">
          <Nombre className="nombre nombre--pie" />
        </div>
      </footer>
    </>
  );
}
