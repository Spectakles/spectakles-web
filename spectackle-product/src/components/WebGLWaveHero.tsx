"use client";

import { useEffect, useRef } from "react";
import "./WebGLWaveHero.css";

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec2 pointer;

  float wave(vec2 p, float frequency, float phase) {
    return sin(p.x * frequency + time * phase) * 0.5 +
      cos(p.y * frequency * 0.72 - time * phase * 0.8) * 0.5;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 centered = uv - 0.5;
    centered.x *= resolution.x / resolution.y;
    vec2 mouse = pointer - 0.5;

    float distanceFromMouse = length(centered - mouse * 0.35);
    float influence = smoothstep(0.9, 0.0, distanceFromMouse);
    float field = wave(centered + mouse * influence * 0.12, 5.2, 0.22);
    field += wave(centered * 1.6 - mouse * influence * 0.08, 9.0, 0.12) * 0.35;

    vec3 ink = vec3(0.125, 0.125, 0.173);
    vec3 green = vec3(0.235, 0.608, 0.357);
    vec3 warm = vec3(0.988, 0.894, 0.545);
    float ridge = smoothstep(0.56, 0.9, field * 0.5 + 0.5);
    float glow = smoothstep(0.8, 0.0, distanceFromMouse) * 0.08;
    vec3 color = mix(ink, mix(green, warm, ridge * 0.34), ridge * 0.28 + glow);
    float vignette = smoothstep(0.86, 0.18, length(centered) * 0.72);

    gl_FragColor = vec4(color * (0.55 + vignette * 0.4), 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export default function WebGLWaveHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return undefined;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return undefined;

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return undefined;

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "position");
    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const pointer = gl.getUniformLocation(program, "pointer");
    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    let frame = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      mouse.targetY = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const draw = (now: number) => {
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, width, height);
      gl.uniform1f(time, reducedMotion ? 0 : now * 0.001);
      gl.uniform2f(pointer, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    canvas.addEventListener("pointermove", move);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <canvas className="webgl-wave-hero" ref={canvasRef} aria-hidden="true" />
  );
}
