// Inicio de sesión con el login de Cognito (código de autorización con PKCE). No hay secreto en el
// navegador: Cognito solo entrega los tokens a quien tenga el verificador que se generó aquí.

const DOMINIO = process.env.NEXT_PUBLIC_COGNITO_DOMINIO ?? "";
const CLIENTE = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
const LLAVE = "cupo:sesion";
const VERIFICADOR = "cupo:pkce";

interface Tokens {
  access: string;
  id: string;
  refresh: string;
  vence: number;
}

const volverA = () => `${location.origin}/panel/entrar`;

function base64url(bytes: ArrayBuffer | Uint8Array) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function iniciarSesion(registro = false) {
  const verificador = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const reto = base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador)));
  sessionStorage.setItem(VERIFICADOR, verificador);
  const url = new URL(`${DOMINIO}/${registro ? "signup" : "oauth2/authorize"}`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENTE,
    redirect_uri: volverA(),
    scope: "openid email profile",
    code_challenge_method: "S256",
    code_challenge: reto,
  }).toString();
  location.assign(url.toString());
}

async function pedirTokens(cuerpo: Record<string, string>): Promise<Tokens> {
  const r = await fetch(`${DOMINIO}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENTE, ...cuerpo }),
  });
  if (!r.ok) throw new Error("No se pudo iniciar sesión.");
  const t = (await r.json()) as { access_token: string; id_token: string; refresh_token?: string; expires_in: number };
  const previo = leerTokens();
  const tokens = { access: t.access_token, id: t.id_token, refresh: t.refresh_token ?? previo?.refresh ?? "", vence: Date.now() + t.expires_in * 1000 };
  localStorage.setItem(LLAVE, JSON.stringify(tokens));
  return tokens;
}

/** La página /panel/entrar llama esto con el ?code= que devuelve Cognito. */
export async function terminarInicio(codigo: string) {
  const verificador = sessionStorage.getItem(VERIFICADOR);
  if (!verificador) throw new Error("El inicio de sesión se venció. Inténtalo de nuevo.");
  sessionStorage.removeItem(VERIFICADOR);
  await pedirTokens({ grant_type: "authorization_code", code: codigo, redirect_uri: volverA(), code_verifier: verificador });
}

function leerTokens(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(LLAVE) ?? "null");
  } catch {
    return null;
  }
}

export function haySesion() {
  return leerTokens() !== null;
}

/** Token vigente para la API; si está por vencer, lo renueva con el refresh token. */
export async function token(): Promise<string | null> {
  const t = leerTokens();
  if (!t) return null;
  if (t.vence - Date.now() > 60_000) return t.access;
  if (!t.refresh) return null;
  try {
    return (await pedirTokens({ grant_type: "refresh_token", refresh_token: t.refresh })).access;
  } catch {
    localStorage.removeItem(LLAVE);
    return null;
  }
}

export function correoDeSesion(): string | null {
  const t = leerTokens();
  if (!t) return null;
  try {
    return JSON.parse(atob(t.id.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))).email ?? null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem(LLAVE);
  const url = new URL(`${DOMINIO}/logout`);
  url.search = new URLSearchParams({ client_id: CLIENTE, logout_uri: `${location.origin}/panel` }).toString();
  location.assign(url.toString());
}
