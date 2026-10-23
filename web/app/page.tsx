import Link from "next/link";
import { Arquitectura } from "@/components/Arquitectura";
import { BarraPublica } from "@/components/BarraPublica";

const HORAS = ["9:00 a. m.", "9:30 a. m.", "10:30 a. m.", "11:00 a. m.", "2:00 p. m.", "3:30 p. m.", "4:00 p. m.", "5:30 p. m."];

export default function Inicio() {
  return (
    <>
      <BarraPublica />
      <main>
        <section className="portada">
          <div className="contenedor portada__dentro">
            <div className="portada__texto">
              <h1>Que tus clientes reserven solos, a cualquier hora.</h1>
              <p className="portada__lead">
                Cupo le da a tu negocio una página con tus horarios libres. El cliente elige servicio, día y hora, y tú lo ves en tu agenda. Sin
                contestar el WhatsApp a cada rato y sin dos personas en la misma hora.
              </p>
              <div className="portada__acciones">
                <Link className="btn btn--primario" href="/n/barberia-el-parche">
                  Reservar en el negocio de ejemplo
                </Link>
                <Link className="btn" href="/panel">
                  Ver el panel del dueño
                </Link>
              </div>
              <p className="pequeno muted">El ejemplo funciona sin crear cuenta: lo que hagas se guarda en tu navegador.</p>
            </div>

            <div className="maqueta tarjeta" aria-hidden="true">
              <div className="maqueta__cabeza">
                <div className="maqueta__foto">BP</div>
                <div>
                  <p className="maqueta__nombre">Barbería El Parche</p>
                  <p className="muted pequeno">Corte clásico, 30 min, $ 25.000</p>
                </div>
              </div>
              <p className="maqueta__dia">Sábado 24 de octubre</p>
              <div className="maqueta__horas">
                {HORAS.map((h, i) => (
                  <span key={h} className={i === 3 ? "is-elegida" : ""}>
                    {h}
                  </span>
                ))}
              </div>
              <div className="maqueta__boton">Reservar a las 11:00 a. m.</div>
            </div>
          </div>
        </section>

        <section className="seccion">
          <div className="contenedor">
            <h2 className="seccion__titulo">Cómo funciona</h2>
            <ol className="pasos">
              <li>
                <h3>Pones tus servicios y tu horario</h3>
                <p className="muted">Cuánto dura cada servicio, cuánto vale y a qué horas atiendes. Si cierras a almorzar, se ponen dos franjas.</p>
              </li>
              <li>
                <h3>Compartes tu enlace</h3>
                <p className="muted">En tu Instagram, en el estado de WhatsApp o en un código QR en el local.</p>
              </li>
              <li>
                <h3>Tus clientes reservan y tú atiendes</h3>
                <p className="muted">Ves la agenda del día, marcas quién llegó y quién no, y al final de la semana cuánto entró.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="seccion seccion--blanca">
          <div className="contenedor">
            <h2 className="seccion__titulo">Lo que se encarga solo</h2>
            <dl className="ventajas">
              <div>
                <dt>Nadie reserva la misma hora</dt>
                <dd>Si dos personas eligen las 10:00 al mismo tiempo, solo una queda. A la otra se le muestran las horas que siguen libres.</dd>
              </div>
              <div>
                <dt>Recordatorio el día antes</dt>
                <dd>A las 6 de la tarde le llega un correo a quien tiene cita al otro día, con el enlace para cancelar si no puede ir.</dd>
              </div>
              <div>
                <dt>El cliente cancela solo</dt>
                <dd>Con el código de su reserva, sin crear cuenta. La hora vuelve a quedar libre para otro.</dd>
              </div>
              <div>
                <dt>Festivos y vacaciones</dt>
                <dd>Marcas los días que no abres y esos días no aparecen para reservar.</dd>
              </div>
              <div>
                <dt>Aviso mínimo</dt>
                <dd>Decides con cuánta anticipación se puede reservar: que nadie te caiga en cinco minutos.</dd>
              </div>
              <div>
                <dt>Resumen de la semana</dt>
                <dd>Citas, lo cobrado, cuánto de tu tiempo estuvo ocupado y cuánta gente no llegó.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="seccion">
          <div className="contenedor tecnica">
            <div className="tecnica__texto">
              <h2 className="seccion__titulo">Cómo está hecho</h2>
              <p className="muted">
                El frontend es Next.js con TypeScript. El backend corre en AWS sin servidores que mantener: Lambda detrás de API Gateway, DynamoDB
                con una sola tabla, Cognito para las cuentas y la infraestructura escrita en código con CDK.
              </p>
              <p className="muted">
                Para que no haya reservas dobles, cada cita toma sus bloques de 15 minutos en una transacción con escritura condicional. Si otro
                tomó cualquiera de esos bloques un instante antes, DynamoDB cancela todo.
              </p>
              <a className="btn" href="https://github.com/orlandocastillo-dev/cupo" target="_blank" rel="noopener noreferrer">
                Ver el código en GitHub
              </a>
            </div>
            <Arquitectura />
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="contenedor">
          <p>Cupo es un proyecto de portafolio de Orlando Castillo. El negocio del ejemplo es inventado.</p>
          <a href="https://github.com/orlandocastillo-dev/cupo">Código en GitHub</a>
        </div>
      </footer>
    </>
  );
}
