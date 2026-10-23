import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "./globals.css";
import "./reservar.css";
import "./panel.css";
import "./inicio.css";

export const metadata: Metadata = {
  title: { default: "Cupo | Reservas en línea para tu negocio", template: "%s | Cupo" },
  description: "Tus clientes ven tus horarios libres y reservan solos. Para barberías, consultorios, canchas y spas.",
  icons: { icon: "/icono.svg" },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
