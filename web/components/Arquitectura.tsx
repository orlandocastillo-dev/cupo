/** Cómo se conectan las piezas en AWS. Las flechas van en el sentido de las llamadas. */

const COL = { a: 10, b: 262, c: 520, d: 772 };
const ANCHO = { a: 180, b: 190, c: 190, d: 178 };
const FILA = [30, 150, 270];

function Caja({ col, fila, titulo, detalle, tono = "aws" }: { col: keyof typeof COL; fila: number; titulo: string; detalle: string; tono?: "web" | "aws" | "datos" }) {
  const w = ANCHO[col];
  return (
    <g transform={`translate(${COL[col]} ${FILA[fila]})`}>
      <rect width={w} height="62" rx="8" className={`arq__caja arq__caja--${tono}`} />
      <text x={w / 2} y="27" textAnchor="middle" className="arq__titulo">
        {titulo}
      </text>
      <text x={w / 2} y="46" textAnchor="middle" className="arq__detalle">
        {detalle}
      </text>
    </g>
  );
}

function Etiqueta({ x, y, children, centro = false }: { x: number; y: number; children: string; centro?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={centro ? "middle" : "start"} className="arq__etiqueta">
      {children}
    </text>
  );
}

export function Arquitectura() {
  return (
    <figure className="arq">
      <svg viewBox="0 0 960 345" role="img" aria-labelledby="arq-titulo arq-desc">
        <title id="arq-titulo">Arquitectura de Cupo en AWS</title>
        <desc id="arq-desc">
          El navegador carga la app de Next.js desde Vercel y llama a API Gateway. El dueño inicia sesión con Cognito y API Gateway valida su
          token antes de llamar a la Lambda. La Lambda guarda en DynamoDB, firma la subida de fotos a S3 y manda la confirmación por SES.
          EventBridge corre cada tarde la Lambda de recordatorios.
        </desc>
        <defs>
          <marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" className="arq__punta" />
          </marker>
        </defs>

        <g className="arq__lineas" markerEnd="url(#flecha)">
          <path d="M190 61 H260" />
          <path d="M452 61 H518" />
          <path d="M710 61 H770" />
          <path d="M100 92 V181 H260" />
          <path d="M357 92 V148" />
          <path d="M615 92 V148" />
          <path d="M710 76 H741 V170 H770" />
          <path d="M190 301 H518" />
          <path d="M710 301 H756 V196 H770" />
        </g>
        <Etiqueta x={225} y={52} centro>
          HTTPS
        </Etiqueta>
        <Etiqueta x={108} y={140}>
          inicia sesión
        </Etiqueta>
        <Etiqueta x={365} y={126}>
          valida el token
        </Etiqueta>
        <Etiqueta x={623} y={126}>
          firma la subida
        </Etiqueta>
        <Etiqueta x={354} y={292} centro>
          todos los días, 6 p. m.
        </Etiqueta>

        <Caja col="a" fila={0} titulo="Navegador" detalle="Next.js en Vercel" tono="web" />
        <Caja col="b" fila={0} titulo="API Gateway" detalle="HTTP API con límite" />
        <Caja col="c" fila={0} titulo="Lambda" detalle="rutas públicas y panel" />
        <Caja col="d" fila={0} titulo="DynamoDB" detalle="una tabla, 2 índices" tono="datos" />
        <Caja col="b" fila={1} titulo="Cognito" detalle="cuentas de los dueños" />
        <Caja col="c" fila={1} titulo="S3 y CloudFront" detalle="fotos de los negocios" tono="datos" />
        <Caja col="d" fila={1} titulo="SES" detalle="correos a los clientes" />
        <Caja col="a" fila={2} titulo="EventBridge" detalle="regla diaria" />
        <Caja col="c" fila={2} titulo="Lambda" detalle="recordatorios" />
      </svg>
    </figure>
  );
}
