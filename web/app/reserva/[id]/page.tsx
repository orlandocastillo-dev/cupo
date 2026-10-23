import type { Metadata } from "next";
import { Suspense } from "react";
import { BarraPublica } from "@/components/BarraPublica";
import { MiReserva } from "@/components/MiReserva";

export const metadata: Metadata = { title: "Mi reserva", robots: { index: false } };

export default async function PaginaReserva({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <BarraPublica />
      <main className="contenedor confirmacion">
        <Suspense fallback={<div className="cargando">Cargando…</div>}>
          <MiReserva id={id} />
        </Suspense>
      </main>
    </>
  );
}
