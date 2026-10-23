"use client";

import type { Horario, Negocio, Servicio } from "@cupo/core";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { api } from "@/lib/cliente";
import { haySesion } from "@/lib/sesion";

export interface DatosPanel {
  negocio: Negocio;
  servicios: Servicio[];
  horario: Horario;
}

type Estado =
  | { tipo: "cargando" }
  | { tipo: "sin-sesion" }
  | { tipo: "sin-negocio" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; datos: DatosPanel };

interface Valor {
  estado: Estado;
  recargar: () => Promise<void>;
  actualizar: (cambio: Partial<DatosPanel>) => void;
}

const Contexto = createContext<Valor | null>(null);

export function ProveedorPanel({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  const recargar = useCallback(async () => {
    if (api.modo === "aws" && !haySesion()) return setEstado({ tipo: "sin-sesion" });
    try {
      const datos = await api.miNegocio();
      setEstado(datos ? { tipo: "listo", datos } : { tipo: "sin-negocio" });
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === "no_autenticado") return setEstado({ tipo: "sin-sesion" });
      setEstado({ tipo: "error", mensaje: e instanceof ErrorApi ? e.message : "No pudimos cargar tu negocio." });
    }
  }, []);

  const actualizar = useCallback((cambio: Partial<DatosPanel>) => {
    setEstado((e) => (e.tipo === "listo" ? { tipo: "listo", datos: { ...e.datos, ...cambio } } : e));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return <Contexto.Provider value={{ estado, recargar, actualizar }}>{children}</Contexto.Provider>;
}

export function usePanel() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("usePanel va dentro de ProveedorPanel");
  return valor;
}

/** Para las vistas del panel, que solo se muestran cuando el negocio ya cargó. */
export function useNegocio() {
  const { estado, actualizar, recargar } = usePanel();
  if (estado.tipo !== "listo") throw new Error("El negocio todavía no cargó");
  return { ...estado.datos, actualizar, recargar };
}
