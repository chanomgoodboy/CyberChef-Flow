import { useEffect, useRef, type RefObject } from 'react';

/* ------------------------------------------------------------------ */
/*  Shaders                                                            */
/* ------------------------------------------------------------------ */

const VERT = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform int u_mode;
in vec2 v_texCoord;
out vec4 fragColor;
void main() {
    vec4 c = texture(u_image, v_texCoord);
    if (u_mode == 0) { fragColor = c; return; }
    if (u_mode == 1) { fragColor = vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, 1.0); return; }
    int r = int(c.r * 255.0 + 0.5);
    int g = int(c.g * 255.0 + 0.5);
    int b = int(c.b * 255.0 + 0.5);
    int a = int(c.a * 255.0 + 0.5);
    if (u_mode >= 2 && u_mode <= 33) {
        int ch, bit;
        if      (u_mode <= 9)  { ch = a; bit = 9  - u_mode; }
        else if (u_mode <= 17) { ch = r; bit = 17 - u_mode; }
        else if (u_mode <= 25) { ch = g; bit = 25 - u_mode; }
        else                   { ch = b; bit = 33 - u_mode; }
        float v = float((ch >> bit) & 1);
        fragColor = vec4(v, v, v, 1.0);
        return;
    }
    if (u_mode == 34) { fragColor = vec4(vec3(c.a), 1.0); return; }
    if (u_mode == 35) { fragColor = vec4(c.r, 0.0, 0.0, 1.0); return; }
    if (u_mode == 36) { fragColor = vec4(0.0, c.g, 0.0, 1.0); return; }
    if (u_mode == 37) { fragColor = vec4(0.0, 0.0, c.b, 1.0); return; }
    if (u_mode == 38) {
        float v = (r == g && g == b) ? 1.0 : 0.0;
        fragColor = vec4(v, v, v, 1.0);
        return;
    }
    fragColor = c;
}`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile error: ${info}`);
  }
  return s;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
) {
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`Program link error: ${info}`);
  }
  return p;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

interface StegGLResult {
  naturalWidth: number;
  naturalHeight: number;
  webglSupported: boolean;
}

/**
 * WebGL2 hook that renders an image onto a canvas with a stegsolve mode.
 *
 * - Effect 1: Init GL context, compile shaders, create quad VAO (once per canvas)
 * - Effect 2: Load image, upload texture, resize canvas backing store
 * - Effect 3: Set u_mode uniform, draw
 */
export function useStegGL(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  imageSrc: string | undefined,
  mode: number,
): StegGLResult {
  // Persistent GL objects across renders
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const vaoRef = useRef<WebGLVertexArrayObject | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const modeLoc = useRef<WebGLUniformLocation | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const supportedRef = useRef(true);
  // Keep shaders for cleanup
  const vsRef = useRef<WebGLShader | null>(null);
  const fsRef = useRef<WebGLShader | null>(null);

  /* Effect 1: Init WebGL2 context + shaders + quad (once) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      supportedRef.current = false;
      return;
    }
    glRef.current = gl;

    // Compile & link
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = linkProgram(gl, vs, fs);
    vsRef.current = vs;
    fsRef.current = fs;
    programRef.current = prog;
    modeLoc.current = gl.getUniformLocation(prog, 'u_mode');

    // Full-screen quad
    // prettier-ignore
    const verts = new Float32Array([
      // pos        texcoord
      -1, -1,       0, 1,
       1, -1,       1, 1,
      -1,  1,       0, 0,
       1,  1,       1, 0,
    ]);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_position');
    const aTex = gl.getAttribLocation(prog, 'a_texCoord');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    vaoRef.current = vao;

    return () => {
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      if (textureRef.current) gl.deleteTexture(textureRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      glRef.current = null;
      programRef.current = null;
      vaoRef.current = null;
      textureRef.current = null;
      vsRef.current = null;
      fsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Effect 2: Load image, upload texture */
  useEffect(() => {
    if (!imageSrc) return;
    const gl = glRef.current;
    if (!gl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const gl2 = glRef.current;
      if (!gl2) return;

      // Resize canvas backing store
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      sizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };

      // Upload texture
      if (textureRef.current) gl2.deleteTexture(textureRef.current);
      const tex = gl2.createTexture()!;
      textureRef.current = tex;
      gl2.bindTexture(gl2.TEXTURE_2D, tex);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.NEAREST);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.NEAREST);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
      gl2.texImage2D(
        gl2.TEXTURE_2D,
        0,
        gl2.RGBA,
        gl2.RGBA,
        gl2.UNSIGNED_BYTE,
        img,
      );

      // Draw immediately after upload
      draw(gl2);
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  /* Effect 3: Set mode + draw */
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !textureRef.current) return;
    draw(gl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function draw(gl: WebGL2RenderingContext) {
    const prog = programRef.current;
    const vao = vaoRef.current;
    const tex = textureRef.current;
    if (!prog || !vao || !tex) return;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform1i(modeLoc.current, mode);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  return {
    naturalWidth: sizeRef.current.w,
    naturalHeight: sizeRef.current.h,
    webglSupported: supportedRef.current,
  };
}
