import type { Metadata } from "next";
import { ProveedorPanel } from "@/components/panel/Contexto";
import { Marco } from "@/components/panel/Marco";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <ProveedorPanel>
      <Marco>{children}</Marco>
    </ProveedorPanel>
  );
}
