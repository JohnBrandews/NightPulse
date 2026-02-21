'use client';

import { useEffect, useRef } from 'react';

interface SplashCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  CAPTURE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLORFUL?: boolean;
  COLOR_UPDATE_SPEED?: number;
  PAUSED?: boolean;
  BACK_COLOR?: { r: number; g: number; b: number };
  TRANSPARENT?: boolean;
}

export default function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1024,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 1,
  VELOCITY_DISSIPATION = 0.2,
  PRESSURE = 0.8,
  PRESSURE_ITERATIONS = 20,
  CURL = 30,
  SPLAT_RADIUS = 0.25,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLORFUL = true,
  COLOR_UPDATE_SPEED = 10,
  PAUSED = false,
  BACK_COLOR = { r: 0, g: 0, b: 0 },
  TRANSPARENT = false,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true });
    if (!gl) {
      console.error('WebGL 2.0 is not supported');
      return;
    }

    /* -------------------------------------------------------------------------- */
    /*                               CONFIGURATION                                */
    /* -------------------------------------------------------------------------- */
    const config = {
      SIM_RESOLUTION,
      DYE_RESOLUTION,
      CAPTURE_RESOLUTION,
      DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION,
      PRESSURE,
      PRESSURE_ITERATIONS,
      CURL,
      SPLAT_RADIUS,
      SPLAT_FORCE,
      SHADING,
      COLORFUL,
      COLOR_UPDATE_SPEED,
      PAUSED,
      BACK_COLOR,
      TRANSPARENT,
    };

    /* -------------------------------------------------------------------------- */
    /*                                   SHADERS                                  */
    /* -------------------------------------------------------------------------- */
    function shaderSource(type: 'vertex' | 'fragment') {
      const baseVertexShader = `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `;

      const blurVertexShader = `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            float offset = 1.33333333;
            vL = vUv - texelSize * offset;
            vR = vUv + texelSize * offset;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `;

      const blurShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform sampler2D uTexture;

        void main () {
            vec4 sum = texture2D(uTexture, vUv) * 0.29411764705882354;
            sum += texture2D(uTexture, vL) * 0.35294117647058826;
            sum += texture2D(uTexture, vR) * 0.35294117647058826;
            gl_FragColor = sum;
        }
      `;

      const copyShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        uniform sampler2D uTexture;

        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
      `;

      const clearShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
      `;

      const colorShader = `
        precision mediump float;

        uniform vec4 color;

        void main () {
            gl_FragColor = color;
        }
      `;

      const checkerboardShader = `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float aspectRatio;

        #define SCALE 25.0

        void main () {
            vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
            float v = mod(uv.x + uv.y, 2.0);
            v = v * 0.1 + 0.8;
            gl_FragColor = vec4(vec3(v), 1.0);
        }
      `;

      const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uBloom;
        uniform sampler2D uSunrays;
        uniform sampler2D uDithering;
        uniform vec2 ditherScale;
        uniform vec2 texelSize;

        vec3 linearToGamma (vec3 color) {
            color = max(color, vec3(0));
            return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }

        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;

        #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;

            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);

            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);

            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
        #endif

        #ifdef BLOOM
            vec3 bloom = texture2D(uBloom, vUv).rgb;
        #endif

        #ifdef SUNRAYS
            float sunrays = texture2D(uSunrays, vUv).r;
            c *= sunrays;
        #ifdef BLOOM
            bloom *= sunrays;
        #endif
        #endif

        #ifdef BLOOM
            float noise = texture2D(uDithering, vUv * ditherScale).r;
            noise = noise * 2.0 - 1.0;
            bloom += noise / 255.0;
            bloom = linearToGamma(bloom);
            c += bloom;
        #endif

            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
        }
      `;

      const splatShader = `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
      `;

      const advectionShader = `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;

        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;

            vec2 iuv = floor(st);
            vec2 fuv = fract(st);

            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }

        void main () {
        #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
        #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
      `;

      const divergenceShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;

            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }

            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `;

      const curlShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
      `;

      const vorticityShader = `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;

            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;

            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `;

      const pressureShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `;

      const gradientSubtractShader = `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `;

      return {
        vertex: baseVertexShader,
        blurVertex: blurVertexShader,
        blur: blurShader,
        copy: copyShader,
        clear: clearShader,
        color: colorShader,
        checkerboard: checkerboardShader,
        display: displayShaderSource,
        splat: splatShader,
        advection: advectionShader,
        divergence: divergenceShader,
        curl: curlShader,
        vorticity: vorticityShader,
        pressure: pressureShader,
        gradientSubtract: gradientSubtractShader,
      };
    }

    const shaders = shaderSource('vertex'); // 'vertex' is ignored since we return an object

    /* -------------------------------------------------------------------------- */
    /*                                   CLASSES                                  */
    /* -------------------------------------------------------------------------- */
    class Material {
      vertexShader: WebGLShader;
      fragmentShaderSource: string;
      programs: { [key: number]: WebGLProgram };
      activeProgram: WebGLProgram | null;
      uniforms: { [key: string]: WebGLUniformLocation };

      constructor(vertexShader: WebGLShader, fragmentShaderSource: string) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = {};
      }

      setKeywords(keywords: string[]) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null) {
          const fragmentShader = compileShader(
            gl!.createShader(gl!.FRAGMENT_SHADER)!,
            this.fragmentShaderSource,
            keywords
          );
          program = createProgram(this.vertexShader, fragmentShader);
          this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }

      bind() {
        gl!.useProgram(this.activeProgram);
      }
    }

    class Program {
      uniforms: { [key: string]: WebGLUniformLocation };
      program: WebGLProgram;

      constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }

      bind() {
        gl!.useProgram(this.program);
      }
    }

    /* -------------------------------------------------------------------------- */
    /*                                  FUNCTIONS                                 */
    /* -------------------------------------------------------------------------- */
    function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = gl!.createProgram()!;
      gl!.attachShader(program, vertexShader);
      gl!.attachShader(program, fragmentShader);
      gl!.linkProgram(program);

      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS))
        console.error(gl!.getProgramInfoLog(program));

      return program;
    }

    function getUniforms(program: WebGLProgram) {
      const uniforms: { [key: string]: WebGLUniformLocation } = {};
      const uniformCount = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl!.getActiveUniform(program, i)!.name;
        uniforms[uniformName] = gl!.getUniformLocation(program, uniformName)!;
      }
      return uniforms;
    }

    function compileShader(shader: WebGLShader, source: string, keywords?: string[]) {
      source = keywords ? keywords.map((k) => '#define ' + k).join('\n') + '\n' + source : source;

      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);

      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS))
        console.error(gl!.getShaderInfoLog(shader));

      return shader;
    }

    function hashCode(s: string) {
      if (s.length == 0) return 0;
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    /* -------------------------------------------------------------------------- */
    /*                              TEXTURE MANAGEMENT                            */
    /* -------------------------------------------------------------------------- */
    let dye: any;
    let velocity: any;
    let divergence: any;
    let curl: any;
    let pressure: any;
    let bloom: any;
    let sunrays: any;
    let sunraysTemp: any;

    interface FBO {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      attach: (id: number) => number;
    }

    interface DoubleFBO {
      read: FBO;
      write: FBO;
      swap: () => void;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
    }

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);

      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl!.LINEAR : gl!.NEAREST;

      gl!.disable(gl!.BLEND);

      if (dye == null)
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else
        dye = resizeDoubleFBO(
          dye,
          dyeRes.width,
          dyeRes.height,
          rgba.internalFormat,
          rgba.format,
          texType,
          filtering
        );

      if (velocity == null)
        velocity = createDoubleFBO(
          simRes.width,
          simRes.height,
          rg.internalFormat,
          rg.format,
          texType,
          filtering
        );
      else
        velocity = resizeDoubleFBO(
          velocity,
          simRes.width,
          simRes.height,
          rg.internalFormat,
          rg.format,
          texType,
          filtering
        );

      divergence = createFBO(
        simRes.width,
        simRes.height,
        r.internalFormat,
        r.format,
        texType,
        gl!.NEAREST
      );
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl!.NEAREST);
      pressure = createDoubleFBO(
        simRes.width,
        simRes.height,
        r.internalFormat,
        r.format,
        texType,
        gl!.NEAREST
      );
    }

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0,
        gl!.TEXTURE_2D,
        texture,
        0
      );
      gl!.viewport(0, 0, w, h);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        attach(id: number) {
          gl!.activeTexture(gl!.TEXTURE0 + id);
          gl!.bindTexture(gl!.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ): DoubleFBO {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);

      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(value) {
          fbo1 = value;
        },
        get write() {
          return fbo2;
        },
        set write(value) {
          fbo2 = value;
        },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }

    function resizeFBO(
      target: FBO,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ) {
      const newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl!.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(
      target: DoubleFBO,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ) {
      if (target.width == w && target.height == h) return target;
      target.read = resizeFBO(
        target.read,
        w,
        h,
        internalFormat,
        format,
        type,
        param
      );
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1.0 / w;
      target.texelSizeY = 1.0 / h;
      return target;
    }

    function getResolution(resolution: number) {
      let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);

      if (gl!.drawingBufferWidth > gl!.drawingBufferHeight)
        return { width: max, height: min };
      else return { width: min, height: max };
    }

    /* -------------------------------------------------------------------------- */
    /*                                   HELPERS                                  */
    /* -------------------------------------------------------------------------- */
    const ext = {
      formatRGBA: null as any,
      formatRG: null as any,
      formatR: null as any,
      halfFloatTexType: null as any,
      supportLinearFiltering: null as any,
    };

    function supportRenderTextureFormat(
      internalFormat: number,
      format: number,
      type: number
    ) {
      const texture = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        internalFormat,
        4,
        4,
        0,
        format,
        type,
        null
      );
      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0,
        gl!.TEXTURE_2D,
        texture,
        0
      );
      const status = gl!.checkFramebufferStatus(gl!.FRAMEBUFFER);
      return status == gl!.FRAMEBUFFER_COMPLETE;
    }

    function initWebGL() {
      ext.supportLinearFiltering = gl!.getExtension('OES_texture_float_linear');

      gl!.getExtension('EXT_color_buffer_float');
      const p = gl!.getExtension('EXT_color_buffer_half_float'); // Watch out for casing

      ext.halfFloatTexType = gl!.HALF_FLOAT;

      gl!.clearColor(0.0, 0.0, 0.0, 1.0);

      const rgba = gl!.RGBA;
      const rgbaInternal = gl!.RGBA16F;
      const rg = gl!.RG;
      const rgInternal = gl!.RG16F;
      const r = gl!.RED;
      const rInternal = gl!.R16F;

      ext.formatRGBA = getSupportedFormat(rgbaInternal, rgba, ext.halfFloatTexType);
      ext.formatRG = getSupportedFormat(rgInternal, rg, ext.halfFloatTexType);
      ext.formatR = getSupportedFormat(rInternal, r, ext.halfFloatTexType);
    }

    function getSupportedFormat(
      internalFormat: number,
      format: number,
      type: number
    ) {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        switch (internalFormat) {
          case gl!.R16F:
            return getSupportedFormat(gl!.RG16F, gl!.RG, type);
          case gl!.RG16F:
            return getSupportedFormat(gl!.RGBA16F, gl!.RGBA, type);
          default:
            return null;
        }
      }
      return { internalFormat, format };
    }

    initWebGL();

    /* -------------------------------------------------------------------------- */
    /*                                   SHADERS INIT                             */
    /* -------------------------------------------------------------------------- */
    const baseVertexShader = compileShader(
      gl.createShader(gl.VERTEX_SHADER)!,
      shaders.vertex
    );
    const blurVertexShader = compileShader(
      gl.createShader(gl.VERTEX_SHADER)!,
      shaders.blurVertex
    );
    const blurShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.blur
    );
    const copyShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.copy
    );
    const clearShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.clear
    );
    const colorShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.color
    );
    const checkerboardShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.checkerboard
    );
    const displayShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.display
    );
    const splatShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.splat
    );
    const advectionShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.advection
    );
    const divergenceShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.divergence
    );
    const curlShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.curl
    );
    const vorticityShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.vorticity
    );
    const pressureShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.pressure
    );
    const gradientSubtractShader = compileShader(
      gl.createShader(gl.FRAGMENT_SHADER)!,
      shaders.gradientSubtract
    );

    const blurProgram = new Program(blurVertexShader, blurShader);
    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const colorProgram = new Program(baseVertexShader, colorShader);
    const checkerboardProgram = new Program(baseVertexShader, checkerboardShader);

    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new Program(
      baseVertexShader,
      gradientSubtractShader
    );
    const displayMaterial = new Material(baseVertexShader, shaders.display);

    function blit(target: FBO | null) {
      if (target == null) {
        gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      } else {
        gl!.viewport(0, 0, target.width, target.height);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
      }
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 SIMULATION LOOP                            */
    /* -------------------------------------------------------------------------- */
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;

    // We'll init framebuffers at first resize
    // We already call initFramebuffers() inside resizeCanvas which is called immediately

    function splat(x: number, y: number, dx: number, dy: number, color: { r: number, g: number, b: number }) {
      splatProgram.bind();
      gl!.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProgram.uniforms.aspectRatio, canvas!.width / canvas!.height);
      gl!.uniform2f(
        splatProgram.uniforms.point,
        x / canvas!.width,
        1.0 - y / canvas!.height
      );
      gl!.uniform3f(splatProgram.uniforms.color, dx, -dy, 0.0);
      gl!.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
      blit(velocity.write);
      velocity.swap();

      gl!.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function correctRadius(radius: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    }

    function updateKeywords() {
      const displayKeywords = [];
      if (config.SHADING) displayKeywords.push('SHADING');
      displayMaterial.setKeywords(displayKeywords);
    }

    updateKeywords();
    initFramebuffers();

    let animationId: number;

    function update() {
      const dt = Math.min((Date.now() - lastUpdateTime) / 1000, 0.016);
      lastUpdateTime = Date.now();

      if (!config.PAUSED) {
        if (config.COLORFUL) {
          colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
          if (colorUpdateTimer >= 1) {
            colorUpdateTimer = 0;
            pointers.forEach((p) => {
              p.color = generateColor();
            });
          }
        }

        // Advection
        advectionProgram.bind();
        gl!.uniform2f(advectionProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl!.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0));
        gl!.uniform1f(advectionProgram.uniforms.dt, dt);
        gl!.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        gl!.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl!.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl!.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();

        // Curl
        curlProgram.bind();
        gl!.uniform2f(curlProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        // Vorticity
        vorticityProgram.bind();
        gl!.uniform2f(vorticityProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl!.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl!.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl!.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        // Divergence
        divergenceProgram.bind();
        gl!.uniform2f(divergenceProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        // Clear pressure
        clearProgram.bind();
        gl!.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl!.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        // Pressure
        pressureProgram.bind();
        gl!.uniform2f(pressureProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
          gl!.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
          blit(pressure.write);
          pressure.swap();
        }

        // Gradient Subtract
        gradientSubtractProgram.bind();
        gl!.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.read.texelSizeX, velocity.read.texelSizeY);
        gl!.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl!.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        // Splats
        pointers.forEach((p) => {
          if (p.moved) {
            p.moved = false;
            splat(p.x, p.y, p.dx, p.dy, p.color);
          }
        });
      }

      // Display
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      displayMaterial.bind();
      gl!.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(null);

      animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);

    /* -------------------------------------------------------------------------- */
    /*                                INPUT HANDLING                              */
    /* -------------------------------------------------------------------------- */
    function generateColor() {
      const c = HSVtoRGB(Math.random(), 1.0, 1.0);
      c.r *= 0.15;
      c.g *= 0.15;
      c.b *= 0.15;
      return c;
    }

    function HSVtoRGB(h: number, s: number, v: number) {
      let r = 0, g = 0, b = 0, i, f, p, q, t;
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
      }
      return { r, g, b };
    }

    const pointers = [
      { x: 0, y: 0, dx: 0, dy: 0, moved: false, color: generateColor(), id: -1 }
    ];

    function resizeCanvas() {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        initFramebuffers();
      }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initial splash
    splat(canvas.width / 2, canvas.height / 2, 0, 200, generateColor());

    canvas.addEventListener('mousemove', (e) => {
      const p = pointers[0];
      p.moved = p.dx !== 0 || p.dy !== 0;
      p.dx = (e.offsetX - p.x) * config.SPLAT_FORCE;
      p.dy = (e.offsetY - p.y) * config.SPLAT_FORCE;
      p.x = e.offsetX;
      p.y = e.offsetY;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        const t = touches[i];
        let p = pointers.find((ptr) => ptr.id === t.identifier);
        if (!p) {
          p = { x: t.clientX, y: t.clientY, dx: 0, dy: 0, moved: false, color: generateColor(), id: t.identifier };
          pointers.push(p);
        }
        p.moved = p.dx !== 0 || p.dy !== 0;
        p.dx = (t.clientX - p.x) * config.SPLAT_FORCE;
        p.dy = (t.clientY - p.y) * config.SPLAT_FORCE;
        p.x = t.clientX;
        p.y = t.clientY;
      }
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [SIM_RESOLUTION, DYE_RESOLUTION, DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE, CURL, SPLAT_RADIUS, SPLAT_FORCE, SHADING, COLORFUL, COLOR_UPDATE_SPEED, PAUSED]);

  return <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />;
}
