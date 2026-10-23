import Link from "next/link";

/** El logo: una hoja de calendario con un cupo marcado. */
export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="26" height="24" rx="5" fill="#0f6e64" />
      <rect x="9" y="2" width="3" height="6" rx="1.5" fill="#0b554d" />
      <rect x="20" y="2" width="3" height="6" rx="1.5" fill="#0b554d" />
      <path d="m10.5 18 3.8 3.8 7.4-7.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link className="marca" href={href} aria-label="Cupo, inicio">
      <Logo />
      Cupo
    </Link>
  );
}
