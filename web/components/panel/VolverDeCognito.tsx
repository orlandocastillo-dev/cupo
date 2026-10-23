"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { terminarInicio } from "@/lib/sesion";
import { usePanel } from "./Contexto";

/** Cognito manda aquí con ?code=… después de iniciar sesión. */
export function VolverDeCognito() {
  const codigo = useSearchParams().get("code");
  const router = useRouter();
  const { recargar } = usePanel();
  const [error, setError] = useState<string | null>(null);
  const hecho = useRef(false);

  useEffect(() => {
    // El código sirve una sola vez; en desarrollo React monta dos veces el efecto.
    if (hecho.current) return;
    hecho.current = true;
    if (!codigo) return setError("Cognito no devolvió el código de acceso.");
    terminarInicio(codigo)
      .then(recargar)
      .then(() => router.replace("/panel"))
      .catch((e: Error) => setError(e.message));
  }, [codigo, recargar, router]);

  if (!error) return <div className="cargando">Entrando…</div>;
  return (
    <div className="panel-entrar">
      <div className="tarjeta panel-entrar__tarjeta">
        <p className="error">{error}</p>
        <Link className="btn" href="/panel">
          Volver a intentar
        </Link>
      </div>
    </div>
  );
}
