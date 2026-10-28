"use client";

import { useEffect, useRef } from "react";

// Seda líquida en WebGL: una onda deformada con ruido fractal, iluminada como tela satinada.
// Sin WebGL queda el degradado que pone el CSS detrás del lienzo.

const VERTICE = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

const FRAGMENTO = `
  precision highp float;
  uniform vec2 r; uniform float t; uniform vec2 m; uniform vec2 centro; uniform float giro;
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float ruido(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 g = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++){ v += a * ruido(p); p = g * p; a *= 0.5; } return v; }
  float tela(vec2 p){
    vec2 q = vec2(fbm(p + vec2(0.0, t*0.06)), fbm(p + vec2(5.2, 1.3) - t*0.05));
    float w = fbm(p + 2.2*q + vec2(1.7, 9.2) + t*0.03);
    return sin(dot(p, vec2(1.0, giro)) * 1.7 + 4.2*w + t*0.18);
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / r;
    vec2 p = (gl_FragCoord.xy - 0.5*r) / r.y;
    p = p * 0.85 + m * 0.06 + vec2(0.4, 0.0);
    float e = 0.006;
    float h = tela(p);
    float hx = tela(p + vec2(e, 0.0)) - h;
    float hy = tela(p + vec2(0.0, e)) - h;
    vec3 n = normalize(vec3(-hx, -hy, e * 5.0));
    vec3 luz = normalize(vec3(-0.45, 0.55, 0.7));
    float dif = clamp(dot(n, luz), 0.0, 1.0);
    float bri = pow(max(dot(reflect(-luz, n), vec3(0.0, 0.0, 1.0)), 0.0), 22.0);
    float bor = pow(1.0 - n.z, 1.6);
    vec3 hondo = vec3(0.03, 0.025, 0.11);
    vec3 violeta = vec3(0.34, 0.2, 0.92);
    vec3 rosa = vec3(0.78, 0.4, 0.86);
    vec3 cian = vec3(0.35, 0.7, 1.0);
    vec3 tinte = mix(violeta, rosa, smoothstep(-0.2, 0.9, n.x + 0.3*h));
    tinte = mix(tinte, cian, smoothstep(0.35, 1.0, -n.y) * 0.55);
    vec3 c = hondo + tinte * (0.15 + 0.85 * dif * dif) * (0.55 + 0.45 * h);
    c += bri * vec3(1.0, 0.92, 1.0) * 0.7 + bor * tinte * 0.45;
    c *= smoothstep(1.25, 0.25, length((uv - centro) * vec2(1.0, 1.25)));
    gl_FragColor = vec4(pow(c, vec3(0.9)), 1.0);
  }`;

interface Props {
  className?: string;
  /** Dónde se concentra la luz, de 0 a 1 en cada eje. */
  centro?: [number, number];
  /** Inclinación de los pliegues. */
  giro?: number;
}

export function Seda({ className, centro = [0.55, 0.45], giro = 0.42 }: Props) {
  const [cx, cy] = centro;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    const gl = lienzo.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compilar = (tipo: number, fuente: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, fuente);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compilar(gl.VERTEX_SHADER, VERTICE);
    const fs = compilar(gl.FRAGMENT_SHADER, FRAGMENTO);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");
    gl.uniform2f(gl.getUniformLocation(prog, "centro"), cx, cy);
    gl.uniform1f(gl.getUniformLocation(prog, "giro"), giro);

    // Se dibuja a menos resolución que la pantalla: la seda es suave y así no calienta el celular.
    const escala = 0.55;
    const medir = () => {
      lienzo.width = Math.max(1, Math.round(lienzo.clientWidth * escala));
      lienzo.height = Math.max(1, Math.round(lienzo.clientHeight * escala));
      gl.viewport(0, 0, lienzo.width, lienzo.height);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(lienzo);

    const raton = { x: 0, y: 0 };
    const meta = { x: 0, y: 0 };
    const mover = (e: PointerEvent) => {
      meta.x = e.clientX / innerWidth - 0.5;
      meta.y = 0.5 - e.clientY / innerHeight;
    };
    addEventListener("pointermove", mover);

    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const io = new IntersectionObserver(([x]) => {
      visible = x?.isIntersecting ?? true;
    });
    io.observe(lienzo);
    const inicio = performance.now();
    let pedido = 0;

    const cuadro = (ahora: number) => {
      raton.x += (meta.x - raton.x) * 0.04;
      raton.y += (meta.y - raton.y) * 0.04;
      gl.uniform2f(uR, lienzo.width, lienzo.height);
      gl.uniform1f(uT, quieto ? 12 : (ahora - inicio) / 1000);
      gl.uniform2f(uM, raton.x, raton.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const bucle = (ahora: number) => {
      if (visible && !document.hidden) cuadro(ahora);
      pedido = requestAnimationFrame(bucle);
    };
    if (quieto) cuadro(0);
    else pedido = requestAnimationFrame(bucle);
    lienzo.classList.add("is-lista");

    return () => {
      cancelAnimationFrame(pedido);
      ro.disconnect();
      io.disconnect();
      removeEventListener("pointermove", mover);
    };
  }, [cx, cy, giro]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
