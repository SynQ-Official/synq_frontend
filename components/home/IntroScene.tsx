"use client";

import { motion, useReducedMotion, useTransform, type MotionStyle, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { BRAND } from "@/lib/config/brand";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SERIF } from "./typography";

/* ───────────────────────────── one clock for the whole intro ─────────────────────────────
 * The loader and the intro are two components but one scene: both read the same clock, so the colour field carries on
 * from exactly where it was when the first one hands over to the second. */
let origin = 0;
export function introClock() {
    const now = performance.now();
    if (!origin) origin = now;
    return (now - origin) / 1000;
}

const VERTEX = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * A field of colour, not shapes: domain-warped noise in the logo's palette — aqua, teal and deep teal on one side,
 * champagne and gold on the other — pooling and flowing into each other on white, like liquid light.
 * `uCalm` settles it into the hero's own light (pale aqua on one side, pale champagne on the other).
 */
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uCalm;
uniform float uPresence;

const vec3 WHITE = vec3(1.0);
const vec3 MIST = vec3(0.749, 0.867, 0.882);
const vec3 AQUA = vec3(0.525, 0.729, 0.737);
const vec3 TEAL = vec3(0.169, 0.439, 0.502);
const vec3 DEEP = vec3(0.067, 0.298, 0.380);
const vec3 CHAMP = vec3(0.902, 0.835, 0.667);
const vec3 GOLD = vec3(0.788, 0.686, 0.435);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + vec2(17.1, 9.7); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p /= 1.0 + uCalm * 0.55;

  float t = uTime * 0.16;
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.7 + 3.0 * q + vec2(1.7, 9.2) + t * 0.7), fbm(p * 1.7 + 3.0 * q + vec2(8.3, 2.8) - t * 0.6));
  float f = fbm(p * 1.2 + 3.0 * r);

  // Teal on the start side, gold on the end side — like the logo.
  float side = smoothstep(-0.55, 0.55, p.x + (q.x - 0.5) * 0.5);
  vec3 cool = mix(MIST, AQUA, smoothstep(0.25, 0.75, f));
  cool = mix(cool, TEAL, smoothstep(0.55, 0.9, f) * 0.85);
  cool = mix(cool, DEEP, smoothstep(0.78, 1.0, f) * 0.7);
  vec3 warm = mix(CHAMP, GOLD, smoothstep(0.45, 0.88, f));
  vec3 col = mix(cool, warm, side);

  // Colour gathers toward the edges and keeps the middle light, where the name will be.
  float edge = smoothstep(0.1, 0.75, length(p));
  float mass = smoothstep(0.3, 0.7, f + 0.2 * edge) * mix(0.35, 1.0, edge);
  vec3 rich = mix(WHITE, col, clamp(mass * uPresence, 0.0, 1.0));

  // The hero's own light.
  float gl = smoothstep(1.15, 0.0, distance(uv, vec2(0.0, 0.88)));
  float gr = smoothstep(1.05, 0.0, distance(uv, vec2(1.0, 0.84)));
  vec3 calm = mix(mix(WHITE, MIST, gl * 0.5), CHAMP, gr * 0.4);

  gl_FragColor = vec4(mix(rich, calm, smoothstep(0.0, 1.0, uCalm)), 1.0);
}
`;

/**
 * One WebGL program for the whole scene. The loader and the intro are two components, but a new canvas would mean a new
 * context and a stutter at the very moment they hand over — so the canvas and its compiled program outlive the swap.
 */
type Field = {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    buffer: WebGLBuffer;
    uniforms: { res: WebGLUniformLocation | null; time: WebGLUniformLocation | null; calm: WebGLUniformLocation | null; presence: WebGLUniformLocation | null };
};
let field: Field | null = null;
let failed = false;
let users = 0;

function acquireField(): Field | null {
    if (field) return field;
    if (failed) return null;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 size-full";
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    const compile = (type: number, source: string) => {
        const shader = gl?.createShader(type);
        if (!gl || !shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = gl ? compile(gl.VERTEX_SHADER, VERTEX) : null;
    const fragment = gl ? compile(gl.FRAGMENT_SHADER, FRAGMENT) : null;
    const program = gl?.createProgram();
    const buffer = gl?.createBuffer();
    if (!gl || !vertex || !fragment || !program || !buffer) {
        failed = true;
        return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        failed = true;
        return null;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    field = {
        canvas,
        gl,
        program,
        buffer,
        uniforms: {
            res: gl.getUniformLocation(program, "uRes"),
            time: gl.getUniformLocation(program, "uTime"),
            calm: gl.getUniformLocation(program, "uCalm"),
            presence: gl.getUniformLocation(program, "uPresence"),
        },
    };
    return field;
}

function releaseField() {
    // Give the next screen a moment to pick the canvas up before letting it go.
    window.setTimeout(() => {
        if (users > 0 || !field) return;
        field.canvas.remove();
        field.gl.deleteBuffer(field.buffer);
        field.gl.deleteProgram(field.program);
        field.gl.getExtension("WEBGL_lose_context")?.loseContext();
        field = null;
    }, 400);
}

type FieldProps = { calm: MotionValue<number>; presence: MotionValue<number>; className?: string };

/** The colour field, drawn at half resolution. Without WebGL the CSS wash underneath stays. */
export function IntroField({ calm, presence, className }: FieldProps) {
    const host = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = host.current;
        const current = acquireField();
        if (!container || !current) return;
        const { canvas, gl, uniforms } = current;
        container.appendChild(canvas);
        users += 1;

        let frame = 0;
        const draw = () => {
            frame = requestAnimationFrame(draw);
            if (document.hidden) return;
            const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
            const width = Math.max(2, Math.round(canvas.clientWidth * scale));
            const height = Math.max(2, Math.round(canvas.clientHeight * scale));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            gl.viewport(0, 0, width, height);
            gl.uniform2f(uniforms.res, width, height);
            gl.uniform1f(uniforms.time, introClock());
            gl.uniform1f(uniforms.calm, calm.get());
            gl.uniform1f(uniforms.presence, presence.get());
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        draw();

        return () => {
            cancelAnimationFrame(frame);
            users -= 1;
            if (users === 0) releaseField();
        };
    }, [calm, presence]);

    return (
        <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_0%_30%,#bfdde1,transparent_70%),radial-gradient(60%_50%_at_100%_30%,#e6d5aa,transparent_70%)]" />
            <div ref={host} className="absolute inset-0" />
        </div>
    );
}

/**
 * The mark comes up out of grey into colour, the name rises letter by letter, and one slow sweep of gold light crosses it.
 * `instant` shows the finished state at once (the second half of the scene, which continues the first).
 */
export function IntroBrand({ instant = false, className }: { instant?: boolean; className?: string }) {
    const reduce = useReducedMotion();
    const still = instant || !!reduce;
    const letters = Array.from(BRAND.name);
    const wordmark = cn(SERIF, "text-[clamp(3rem,10vw,7.5rem)] font-light leading-[1.05] tracking-[-0.04em]");

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <motion.div
                initial={still ? false : { opacity: 0, scale: 0.92, filter: "grayscale(1) brightness(1.3)" }}
                animate={{ opacity: 1, scale: 1, filter: "grayscale(0) brightness(1)" }}
                transition={{ duration: 1.2, ease: EASE_OUT }}
            >
                <Image src="/assets/vitamind-mark-3d.png" alt="" width={220} height={220} priority className="size-[clamp(5.5rem,15vw,8.5rem)] object-contain drop-shadow-[0_18px_24px_rgb(17_76_97/0.22)]" />
            </motion.div>

            {/* Not a heading: the intro now sits over the real page, whose own <h1> is the only one. */}
            <p role="img" className="relative mt-6 sm:mt-8" aria-label={BRAND.name} dir="ltr">
                <span aria-hidden className={cn("relative flex text-teal-900", wordmark)}>
                    {letters.map((letter, index) => (
                        <span key={index} className="inline-block overflow-hidden pb-[0.12em]">
                            <motion.span
                                className="inline-block"
                                initial={still ? false : { y: "115%" }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.9, delay: 0.45 + index * 0.05, ease: EASE_OUT }}
                            >
                                {letter}
                            </motion.span>
                        </span>
                    ))}
                </span>
                {still ? null : (
                    <motion.span
                        aria-hidden
                        className={cn("pointer-events-none absolute inset-0 flex bg-[linear-gradient(100deg,transparent_36%,#c9af6f_50%,transparent_64%)] bg-clip-text text-transparent [background-size:280%_100%]", wordmark)}
                        initial={{ backgroundPositionX: "125%" }}
                        animate={{ backgroundPositionX: "-25%" }}
                        transition={{ duration: 1.5, delay: 1.0, ease: "easeInOut" }}
                    >
                        {BRAND.name}
                    </motion.span>
                )}
            </p>
        </div>
    );
}

/** The percentage, in serif numerals that fill with colour from the bottom — teal rising into gold — instead of a bar. */
export function IntroCounter({ progress, className }: { progress: MotionValue<number>; className?: string }) {
    const count = useTransform(progress, (value) => String(Math.round(value)).padStart(2, "0"));
    const fill = useTransform(progress, (value) => `${value}%`);

    return (
        <p dir="ltr" className={cn(SERIF, "flex items-start leading-[0.8] tracking-[-0.05em] tabular-nums", className)}>
            <motion.span
                style={{ "--p": fill } as unknown as MotionStyle}
                className="bg-[linear-gradient(to_top,var(--color-teal-700)_0%,var(--color-gold)_var(--p),rgb(17_76_97/0.12)_var(--p))] bg-clip-text text-[clamp(4.5rem,13vw,10rem)] font-extralight text-transparent"
            >
                {count}
            </motion.span>
            <span className="mt-[0.35em] ps-2 text-[clamp(1rem,2.4vw,1.75rem)] font-light tracking-normal text-gold-600">%</span>
        </p>
    );
}
