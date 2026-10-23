import type { Metadata } from "next";
import { BarraPublica } from "@/components/BarraPublica";
import { Reservar } from "@/components/Reservar";

export const metadata: Metadata = { title: "Reservar" };

export default async function PaginaNegocio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <BarraPublica />
      <main>
        <Reservar slug={slug} />
      </main>
    </>
  );
}
