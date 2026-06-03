"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// 1D Perlin-like Noise Helper (for cursor idle drift)
// ---------------------------------------------------------------------------
class Noise1D {
  MAX_VERTICES = 256;
  MAX_VERTICES_MASK = 255;
  amplitude = 1;
  scale = 1;
  r: number[] = [];

  constructor() {
    for (let i = 0; i < this.MAX_VERTICES; i++) {
      this.r.push(Math.random());
    }
  }

  getVal(e: number): number {
    const t = e * this.scale;
    const i = Math.floor(t);
    const r = t - i;
    const o = r * r * (3 - 2 * r);
    const s = i % this.MAX_VERTICES_MASK;
    const a = (s + 1) % this.MAX_VERTICES_MASK;
    const l = this.lerp(this.r[s], this.r[a], o);
    return l * this.amplitude;
  }

  lerp(e: number, t: number, i: number): number {
    return e * (1 - i) + t * i;
  }
}

// ---------------------------------------------------------------------------
// Bridson's O(N) 2D Poisson Disk Sampling
// ---------------------------------------------------------------------------
function runPoissonDisk(
  width: number,
  height: number,
  minDist: number,
  maxDist: number,
  k: number = 20
): [number, number][] {
  const cellSize = minDist / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (number | null)[] = new Array(gridWidth * gridHeight).fill(null);

  const points: [number, number][] = [];
  const activeQueue: number[] = [];

  function insertPoint(p: [number, number]): number {
    const idx = points.length;
    points.push(p);
    activeQueue.push(idx);
    const gx = Math.floor(p[0] / cellSize);
    const gy = Math.floor(p[1] / cellSize);
    grid[gx + gy * gridWidth] = idx;
    return idx;
  }

  insertPoint([Math.random() * width, Math.random() * height]);

  while (activeQueue.length > 0) {
    const randIdx = Math.floor(Math.random() * activeQueue.length);
    const pIdx = activeQueue[randIdx];
    const p = points[pIdx];

    let found = false;
    for (let i = 0; i < k; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const newX = p[0] + Math.cos(angle) * dist;
      const newY = p[1] + Math.sin(angle) * dist;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const gx = Math.floor(newX / cellSize);
        const gy = Math.floor(newY / cellSize);

        let farEnough = true;
        const startX = Math.max(0, gx - 2);
        const endX = Math.min(gridWidth - 1, gx + 2);
        const startY = Math.max(0, gy - 2);
        const endY = Math.min(gridHeight - 1, gy + 2);

        for (let cx = startX; cx <= endX && farEnough; cx++) {
          for (let cy = startY; cy <= endY && farEnough; cy++) {
            const neighborIdx = grid[cx + cy * gridWidth];
            if (neighborIdx !== null) {
              const neighbor = points[neighborIdx];
              const dx = neighbor[0] - newX;
              const dy = neighbor[1] - newY;
              if (dx * dx + dy * dy < minDist * minDist) {
                farEnough = false;
              }
            }
          }
        }

        if (farEnough) {
          insertPoint([newX, newY]);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      activeQueue.splice(randIdx, 1);
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// Simplex Noise GLSL Code (Ashima Arts)
// ---------------------------------------------------------------------------
const SIMPLEX_NOISE_GLSL = `
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}

  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }
`;

// ---------------------------------------------------------------------------
// GPGPU Simulation Vertex Shader
// ---------------------------------------------------------------------------
const SIMULATION_VERTEX_SHADER = `
  void main() {
      gl_Position = vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// GPGPU Simulation Fragment Shader
// ---------------------------------------------------------------------------
const SIMULATION_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D uPosition;
  uniform sampler2D uPosRefs;
  uniform vec2 uRingPos;
  uniform float uTime;
  uniform float uDeltaTime;
  uniform float uRingRadius;
  uniform float uRingWidth;
  uniform float uRingWidth2;
  uniform float uRingDisplacement;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
      vec2 simTexCoords = gl_FragCoord.xy / vec2(256.0, 256.0);
      vec4 pFrame = texture2D(uPosition, simTexCoords);

      float scale = pFrame.z;
      float velocity = pFrame.w;
      vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;

      float time = uTime * .5;
      vec2 curentPos = refPos;

      vec2 pos = pFrame.xy;
      pos *= .8;

      float dist = distance(curentPos.xy, uRingPos);
      float noise0 = snoise(vec3(curentPos.xy * .2 + vec2(18.4924, 72.9744), time * 0.5));
      float dist1 = distance(curentPos.xy + (noise0 * .005), uRingPos);

      float t = smoothstep(uRingRadius - (uRingWidth * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
      float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
      float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);

      t = pow(t, 2.);
      t2 = pow(t2, 3.);

      t += t2 * 3.;
      t += t3 * .2;
      t += snoise(vec3(curentPos.xy * 30. + vec2(11.4924, 12.9744), time * 0.5)) * t3 * .25;

      float nS = snoise(vec3(curentPos.xy * 2. + vec2(18.4924, 72.9744), time * 0.5));
      t += pow((nS + 1.5) * .5, 2.) * .3;

      float noise1 = snoise(vec3(curentPos.xy * 4. + vec2(88.494, 32.4397), time * 0.35));
      float noise2 = snoise(vec3(curentPos.xy * 4. + vec2(50.904, 120.947), time * 0.35));
      float noise3 = snoise(vec3(curentPos.xy * 20. + vec2(18.4924, 72.9744), time * .5));
      float noise4 = snoise(vec3(curentPos.xy * 20. + vec2(50.904, 120.947), time * .5));

      vec2 disp = vec2(noise1, noise2) * .03;
      disp += vec2(noise3, noise4) * .005;

      disp.x += sin((refPos.x * 20.) + (time * 4.)) * .02 * clamp(dist, 0., 1.);
      disp.y += cos((refPos.y * 20.) + (time * 3.)) * .02 * clamp(dist, 0., 1.);

      pos -= (uRingPos - (curentPos + disp)) * pow(t2, .75) * uRingDisplacement;

      float scaleDiff = t - scale;
      scaleDiff *= .2;
      scale += scaleDiff;

      vec2 finalPos = curentPos + disp + (pos * .25);

      velocity *= .5;
      velocity += scale * .25;

      vec4 frame = vec4(finalPos, scale, velocity);
      gl_FragColor = frame;
  }
`;

// ---------------------------------------------------------------------------
// Rendering Vertex Shader
// ---------------------------------------------------------------------------
const RENDER_VERTEX_SHADER = `
  precision highp float;
  attribute vec4 seeds;
  uniform sampler2D uPosition;
  uniform float uTime;
  uniform float uParticleScale;
  uniform float uPixelRatio;
  uniform int uColorScheme;

  varying vec4 vSeeds;
  varying float vVelocity;
  varying vec2 vLocalPos;
  varying vec2 vScreenPos;
  varying float vScale;

  void main() {
      vec4 pos = texture2D(uPosition, uv);
      vSeeds = seeds;

      vVelocity = pos.w;
      vScale = pos.z;
      vLocalPos = pos.xy;
      vec4 viewSpace  = modelViewMatrix * vec4(vec3(pos.xy, 0.), 1.0);

      gl_Position = projectionMatrix * viewSpace;
      vScreenPos = gl_Position.xy;

      // Make point sizing slightly more substantial and scale beautifully on screens
      gl_PointSize = ((vScale * 11.) * (uPixelRatio * 0.5) * uParticleScale) + (1.2 * uPixelRatio);
  }
`;

// ---------------------------------------------------------------------------
// Rendering Fragment Shader (Monochromatic Color)
// ---------------------------------------------------------------------------
const RENDER_FRAGMENT_SHADER = `
  precision highp float;

  varying vec4 vSeeds;
  varying vec2 vScreenPos;
  varying vec2 vLocalPos;
  varying float vScale;
  varying float vVelocity;

  uniform vec3 uColor;
  uniform vec2 uRingPos;
  uniform vec2 uRez;
  uniform float uAlpha;
  uniform float uTime;
  uniform int uColorScheme;

  ${SIMPLEX_NOISE_GLSL}

  #define PI 3.1415926535897932384626433832795

  float sdRoundBox( in vec2 p, in vec2 b, in vec4 r )
  {
      r.xy = (p.x>0.0)?r.xy : r.zw;
      r.x  = (p.y>0.0)?r.x  : r.y;
      vec2 q = abs(p)-b+r.x;
      return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
  }

  vec2 rotate(vec2 v, float a) {
      float s = sin(a);
      float c = cos(a);
      mat2 m = mat2(c, s, -s, c);
      return m * v;
  }

  void main() {
      float uBorderSize = 0.2;
      float ratio = uRez.x / uRez.y;

      float noiseAngle = snoise(vec3(vLocalPos * 10. + vec2(18.4924, 72.9744), uTime * .85));

      float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);

      vec2 uv = gl_PointCoord.xy;
      uv -= vec2(0.5);
      uv.y *= -1.;
      uv = rotate(uv, -angle + (noiseAngle * .5));

      // Monochromatic color from uniform
      vec3 color = uColor;

      float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(.25));
      rounded = smoothstep(.1, 0., rounded);

      float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale);

      if(a < 0.01){
          discard;
      }

      color = clamp(color, 0., 1.);
      color = mix(color, color * clamp(vVelocity, 0., 1.), float(uColorScheme));

      gl_FragColor = vec4(color, clamp(a, 0., 1.));

      #ifdef SRGB_TRANSFER
          gl_FragColor = sRGBTransferOETF( gl_FragColor );
      #endif
  }
`;

// ---------------------------------------------------------------------------
// <StarRing /> Component (Direct GPGPU Implementation)
// ---------------------------------------------------------------------------
interface StarRingProps {
  theme?: "light" | "dark";
  ringWidth?: number;
  ringWidth2?: number;
  ringDisplacement?: number;
  density?: number;
  particlesScale?: number;
}

function StarRing({
  theme = "light",
  ringWidth = 0.15,
  ringWidth2 = 0.05,
  ringDisplacement = 0.15,
  density = 200,
  particlesScale = 0.75,
}: StarRingProps) {
  const { gl, size, camera, viewport } = useThree();

  // Screen mouse tracker
  const cursor = useRef(new THREE.Vector2(0, 0));
  const isIntersecting = useRef(false);
  const ringPos = useRef(new THREE.Vector2(0, 0));
  const cursorPos = useRef(new THREE.Vector2(0, 0));

  // GPGPU Pipeline refs
  const sizeDim = 256;
  const numParticles = sizeDim * sizeDim;

  // Generate points using Poisson Disk
  const { pointsData, count } = useMemo(() => {
    // Mapping density from [0, 300] to minDistance [10, 2] and maxDistance [11, 3]
    const minDistance = ((density - 0) * (2 - 10)) / (300 - 0) + 10;
    const maxDistance = ((density - 0) * (3 - 11)) / (300 - 0) + 11;
    const samples = runPoissonDisk(500, 500, minDistance, maxDistance, 20);

    const data: number[] = [];
    for (let i = 0; i < samples.length; i++) {
      data.push(samples[i][0] - 250, samples[i][1] - 250);
    }
    return { pointsData: data, count: samples.length };
  }, [density]);

  // Setup initial position data texture
  const posTex = useMemo(() => {
    const data = new Float32Array(numParticles * 4);
    for (let i = 0; i < count; i++) {
      const idx = i * 4;
      data[idx + 0] = pointsData[i * 2 + 0] * (1 / 250);
      data[idx + 1] = pointsData[i * 2 + 1] * (1 / 250);
      data[idx + 2] = 0; // scale
      data[idx + 3] = 0; // velocity
    }
    const texture = new THREE.DataTexture(data, sizeDim, sizeDim, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
  }, [pointsData, count, numParticles]);

  // Create Ping-Pong Render Targets
  const rt1 = useRef<THREE.WebGLRenderTarget | null>(null);
  const rt2 = useRef<THREE.WebGLRenderTarget | null>(null);

  if (!rt1.current) {
    const createRT = () =>
      new THREE.WebGLRenderTarget(sizeDim, sizeDim, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
        stencilBuffer: false,
      });
    rt1.current = createRT();
    rt2.current = createRT();
  }

  // Simulation quad, scene, camera & material
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simScene = useMemo(() => new THREE.Scene(), []);

  const simUniforms = useMemo(
    () => ({
      uPosition: { value: null as THREE.Texture | null },
      uPosRefs: { value: posTex },
      uRingPos: { value: new THREE.Vector2(0, 0) },
      uRingRadius: { value: 0.2 },
      uDeltaTime: { value: 0 },
      uRingWidth: { value: ringWidth },
      uRingWidth2: { value: ringWidth2 },
      uRingDisplacement: { value: ringDisplacement },
      uTime: { value: 0 },
    }),
    [posTex, ringWidth, ringWidth2, ringDisplacement]
  );

  const simMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: simUniforms,
        vertexShader: SIMULATION_VERTEX_SHADER,
        fragmentShader: SIMULATION_FRAGMENT_SHADER,
        depthWrite: false,
        depthTest: false,
      }),
    [simUniforms]
  );

  useEffect(() => {
    const geom = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geom, simMaterial);
    simScene.add(mesh);
    return () => {
      simScene.remove(mesh);
      geom.dispose();
    };
  }, [simScene, simMaterial]);

  // Color scheme
  const colorScheme = theme === "dark" ? 0 : 1;

  // Single transitioned monochromatic color
  const renderUniforms = useMemo(
    () => ({
      uPosition: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#5BCEFA") }, // Set to transition dynamically
      uAlpha: { value: 1.0 },
      uRingPos: { value: new THREE.Vector2(0, 0) },
      uRez: { value: new THREE.Vector2(size.width, size.height) },
      uParticleScale: { value: 1.0 },
      uPixelRatio: { value: 1.0 },
      uColorScheme: { value: colorScheme },
    }),
    [colorScheme, size]
  );

  const renderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: renderUniforms,
        vertexShader: RENDER_VERTEX_SHADER,
        fragmentShader: RENDER_FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [renderUniforms]
  );

  // Setup render geometry
  const renderGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const seeds = new Float32Array(count * 4);

    for (let s = 0; s < count; s++) {
      const u = (s % sizeDim + 0.5) / sizeDim;
      const v = (Math.floor(s / sizeDim) + 0.5) / sizeDim;
      uvs[s * 2] = u;
      uvs[s * 2 + 1] = v;

      seeds[s * 4 + 0] = Math.random();
      seeds[s * 4 + 1] = Math.random();
      seeds[s * 4 + 2] = Math.random();
      seeds[s * 4 + 3] = Math.random();
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geom.setAttribute("seeds", new THREE.BufferAttribute(seeds, 4));
    return geom;
  }, [count, sizeDim]);

  const noise1D = useMemo(() => new Noise1D(), []);
  const lastTime = useRef(0);
  const everRendered = useRef(false);

  // Track global mouse & touch position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursor.current.x = e.clientX;
      cursor.current.y = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        cursor.current.x = e.touches[0].clientX;
        cursor.current.y = e.touches[0].clientY;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
    };
  }, []);

  // Update uniforms and render loop
  useFrame((state) => {
    const { clock } = state;
    const elapsed = clock.getElapsedTime();
    const dt = elapsed - lastTime.current;
    lastTime.current = elapsed;

    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();

    // Map screen cursor coordinates to NDC [-1, 1] relative to the canvas bounding rect
    const mouseX = ((cursor.current.x - rect.left) / rect.width) * 2 - 1;
    const mouseY = -(((cursor.current.y - rect.top) / rect.height) * 2 - 1);

    // Mouse intersection and mathematical unprojection on Z = 0 plane
    const mouseIsOver = mouseX >= -1 && mouseX <= 1 && mouseY >= -1 && mouseY <= 1;

    // Standard 1D drift noise offsets
    const driftX = (noise1D.getVal(elapsed * 0.66 + 94.234) - 0.5) * 2;
    const driftY = (noise1D.getVal(elapsed * 0.75 + 21.028) - 0.5) * 2;

    // Scale mesh uniformly by maxViewport to preserve aspect ratio and cover canvas completely
    const maxViewport = Math.max(viewport.width, viewport.height);

    if (mouseIsOver) {
      isIntersecting.current = true;
      const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distanceZ = -camera.position.z / dir.z;
      const intersectionPoint = camera.position.clone().add(dir.multiplyScalar(distanceZ));

      // Correct coordinate mapping based on uniform maxViewport scaling factor (no edge restrictions!)
      cursorPos.current.set(
        intersectionPoint.x * (2.0 / maxViewport) + driftX * 0.1,
        intersectionPoint.y * (2.0 / maxViewport) + driftY * 0.1
      );
      ringPos.current.set(
        ringPos.current.x + (cursorPos.current.x - ringPos.current.x) * 0.02,
        ringPos.current.y + (cursorPos.current.y - ringPos.current.y) * 0.02
      );
    } else {
      isIntersecting.current = false;
      cursorPos.current.set(driftX * 0.2, driftY * 0.1);
      ringPos.current.set(
        ringPos.current.x + (cursorPos.current.x - ringPos.current.x) * 0.01,
        ringPos.current.y + (cursorPos.current.y - ringPos.current.y) * 0.01
      );
    }

    const dpr = gl.getPixelRatio();
    const minViewportPixels = Math.min(gl.domElement.width, gl.domElement.height) / dpr;
    const particleScale = Math.max(0.4, minViewportPixels / 1000) * particlesScale;

    // Scale radius proportionally to min(width, height) to ensure it stays completely inside visible bounds on mobile
    const baseRadius = 0.35 * Math.min(viewport.width, viewport.height) / Math.max(viewport.width, viewport.height);

    // Simulation Pass (Ping-Pong FBO)
    if (rt1.current && rt2.current) {
      simUniforms.uPosition.value = everRendered.current ? rt1.current.texture : posTex;
      simUniforms.uTime.value = elapsed;
      simUniforms.uDeltaTime.value = dt;
      simUniforms.uRingRadius.value = baseRadius + Math.sin(elapsed * 1.2) * (baseRadius * 0.12) + Math.cos(elapsed * 2.8) * (baseRadius * 0.08);
      simUniforms.uRingPos.value.copy(ringPos.current);
      simUniforms.uRingWidth.value = ringWidth;
      simUniforms.uRingWidth2.value = ringWidth2;
      simUniforms.uRingDisplacement.value = ringDisplacement;

      gl.setRenderTarget(rt2.current);
      gl.render(simScene, simCamera);
      gl.setRenderTarget(null);

      // Swap FBOs
      const temp = rt1.current;
      rt1.current = rt2.current;
      rt2.current = temp;
      everRendered.current = true;

      // Cycle monochromatic color smoothly over time: Blue (#5BCEFA) -> White (#FFFFFF) -> Pink (#F5A9B8)
      const colors = [
        new THREE.Color("#5BCEFA"), // Blue
        new THREE.Color("#FFFFFF"), // White
        new THREE.Color("#F5A9B8"), // Pink
      ];
      const cycleTime = 8.0; // 8 seconds per full cycle loop
      const totalColors = colors.length;
      const cycle = (elapsed / cycleTime) % totalColors;
      const iA = Math.floor(cycle);
      const iB = (iA + 1) % totalColors;
      const blend = cycle - iA;
      renderUniforms.uColor.value.copy(colors[iA]).lerp(colors[iB], blend);

      // Update Render Uniforms
      renderUniforms.uPosition.value = rt1.current.texture;
      renderUniforms.uTime.value = elapsed;
      renderUniforms.uRingPos.value.copy(ringPos.current);
      renderUniforms.uParticleScale.value = particleScale;
      renderUniforms.uRez.value.set(gl.domElement.width, gl.domElement.height);
      renderUniforms.uPixelRatio.value = dpr;
    }
  });

  // Clean up WebGL resources
  useEffect(() => {
    return () => {
      posTex.dispose();
      renderGeometry.dispose();
      simMaterial.dispose();
      renderMaterial.dispose();
      if (rt1.current) rt1.current.dispose();
      if (rt2.current) rt2.current.dispose();
    };
  }, [posTex, renderGeometry, simMaterial, renderMaterial]);

  // Compute maxViewport once or dynamically in render
  const maxViewport = Math.max(viewport.width, viewport.height);

  return (
    <points
      geometry={renderGeometry}
      material={renderMaterial}
      position={[0, 0, 0]}
      scale={[maxViewport, maxViewport, maxViewport]}
    />
  );
}

// ---------------------------------------------------------------------------
// Parent ParticleRipple Component
// ---------------------------------------------------------------------------
interface ParticleRippleProps {
  theme?: "light" | "dark";
  ringWidth?: number;
  ringWidth2?: number;
  ringDisplacement?: number;
  density?: number;
  particlesScale?: number;
}

export function ParticleRipple({
  theme = "light",
  ringWidth = 0.15,
  ringWidth2 = 0.05,
  ringDisplacement = 0.15,
  density = 135,
  particlesScale = 0.75,
}: ParticleRippleProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          stencil: false,
          precision: "highp",
        }}
        dpr={[1, 2]}
      >
        <StarRing
          theme={theme}
          ringWidth={ringWidth}
          ringWidth2={ringWidth2}
          ringDisplacement={ringDisplacement}
          density={density}
          particlesScale={particlesScale}
        />
      </Canvas>
    </div>
  );
}