"use client";

import { useEffect } from "react";

/**
 * Las partes de cada sección entran una vez al aparecer, y las tarjetas con brillo siguen el puntero.
 * Sin JavaScript todo se ve desde el principio.
 */
export function Movimiento() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const brillo = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".brillo");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - r.left}px`);
      el.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", brillo);

    return () => {
      io.disconnect();
      document.removeEventListener("pointermove", brillo);
    };
  }, []);
  return null;
}
