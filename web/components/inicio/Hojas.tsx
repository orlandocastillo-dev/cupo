import { FragmentoCancelar, FragmentoChoque, FragmentoCorreo, FragmentoSemana } from "./Fragmentos";

const HOJAS = [
  {
    nombre: "Nadie te pisa la hora",
    texto: "Si dos clientes tocan las 10:00 al mismo tiempo, solo uno se la queda. Al otro se le avisa y se le ofrece la hora libre que sigue.",
    fragmento: <FragmentoChoque />,
  },
  {
    nombre: "El recordatorio sale solo",
    texto: "A las 6 de la tarde del día antes le llega un correo a cada persona con cita. Tú no tienes que escribirle a nadie.",
    fragmento: <FragmentoCorreo />,
  },
  {
    nombre: "Cancelan sin llamarte",
    texto: "Con el código de su reserva, el cliente cancela desde el celular y la hora vuelve a quedar libre para otro.",
    fragmento: <FragmentoCancelar />,
  },
  {
    nombre: "La semana en un vistazo",
    texto: "Cuántas citas hubo, cuánto entró, qué tanto estuvo ocupada la silla y cuánta gente no llegó.",
    fragmento: <FragmentoSemana />,
  },
];

export function Hojas() {
  return (
    <section className="hojas" aria-labelledby="t-hojas">
      <h2 id="t-hojas" className="hojas__titulo" data-reveal>
        Lo que se encarga solo
      </h2>
      <div className="hojas__pila">
        {HOJAS.map((h, i) => (
          <article key={h.nombre} className={`hoja hoja--${i + 1}`} style={{ "--i": i } as React.CSSProperties}>
            <h3 className="hoja__nombre">{h.nombre}</h3>
            <p className="hoja__texto">{h.texto}</p>
            <div className="hoja__muestra">{h.fragmento}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
