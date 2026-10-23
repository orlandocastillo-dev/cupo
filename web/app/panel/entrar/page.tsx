import { Suspense } from "react";
import { VolverDeCognito } from "@/components/panel/VolverDeCognito";

export default function PaginaEntrar() {
  return (
    <Suspense fallback={<div className="cargando">Entrando…</div>}>
      <VolverDeCognito />
    </Suspense>
  );
}
