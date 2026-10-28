import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "./globals.css";
import "./reservar.css";
import "./panel.css";
import "./inicio.css";

export const metadata: Metadata = {
  title: { default: "Cupo | Reservas en línea para tu negocio", template: "%s | Cupo" },
  description: "Tus clientes ven tus horarios libres y reservan solos. Para barberías, consultorios, canchas y spas.",
  icons: { icon: "/icono.svg" },
};

export const viewport: Viewport = { themeColor: "#f5f0e6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
