// Sin letras que se confunden al dictarlas por teléfono (0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoCodigo(largo = 6): string {
  const azar = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(azar, (n) => ALFABETO[n % ALFABETO.length]).join("");
}

export function nuevoId(): string {
  return crypto.randomUUID();
}
