import Link from "next/link";
import { Marca } from "./Marca";

export function BarraPublica() {
  return (
    <header className="barra">
      <div className="contenedor barra__dentro">
        <Marca />
        <nav aria-label="Principal">
          <Link className="opcional" href="/n/barberia-el-parche">
            Negocio de ejemplo
          </Link>
          <Link href="/panel">Soy dueño</Link>
        </nav>
      </div>
    </header>
  );
}
