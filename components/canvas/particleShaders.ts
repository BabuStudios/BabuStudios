/**
 * Dust-mote shaders. Each instance is a camera-facing quad with a soft round
 * falloff. Drift, cursor repel and fog all run on the GPU; the CPU only
 * updates a handful of uniforms per frame.
 */

export const particleVertex = /* glsl */ `
  attribute vec3 aOffset;   // rest position (world)
  attribute vec4 aSeed;     // x: phase 0..1, y: drift speed, z: size, w: unused
  attribute vec3 aColor;    // linear RGB, pre-mixed towards the background

  uniform float uTime;
  uniform float uMotion;      // 0 with prefers-reduced-motion, else 1
  uniform vec2  uPointer;     // damped pointer, NDC
  uniform float uTanHalfFov;  // tan(vertical fov / 2)
  uniform float uAspect;
  uniform float uFogDensity;
  uniform float uStreak;      // 0..1 during fly transitions
  uniform float uCameraY;     // camera height, for the vertical wrap
  uniform float uHalfHeight;  // half height of the particle volume
  uniform float uCameraZ;     // camera depth, for the depth wrap
  uniform float uZFar;        // far edge of the volume, relative to the camera (negative)
  uniform float uDepthRange;  // near edge − far edge

  varying vec2  vUv;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Slow Lissajous drift, out of phase per mote.
    float t = uTime * aSeed.y;
    float ph = aSeed.x * 6.2831;
    vec3 p = aOffset + uMotion * vec3(
      sin(t + ph) * 0.35,
      cos(t * 0.8 + ph * 1.7) * 0.25,
      sin(t * 0.6 + ph) * 0.20
    );

    // Endless field vertically: wrap each mote into a band of ±uHalfHeight
    // around the camera, so pages that scroll down never run out of dust.
    p.y = uCameraY + mod(p.y - uCameraY + uHalfHeight, 2.0 * uHalfHeight) - uHalfHeight;
    // …and endless in depth: wrap into [cam + zFar, cam + zNear], so long
    // corridors (Studios) never run out either. At camera z = 0 this is the
    // identity; the seams sit behind the camera and deep in the fog.
    float zBase = uCameraZ + uZFar;
    p.z = zBase + mod(p.z - zBase, uDepthRange);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = max(-mv.z, 0.001);

    // Where the cursor ray is at this mote's depth (view space): NDC scaled by
    // the half-extent of the view frustum at that depth.
    vec2 pointerView = uPointer * vec2(uTanHalfFov * uAspect, uTanHalfFov) * depth;

    // Faint repel: radius and push scale with depth so the effect looks the
    // same size on screen near and far (radius ≈ 9% of the half-height).
    vec2 away = mv.xy - pointerView;
    float dist = length(away);
    float radius = 0.2 * uTanHalfFov * depth;
    float push = (1.0 - smoothstep(0.0, radius, dist)) * radius * 0.35 * uMotion;
    mv.xy += (away / max(dist, 1e-4)) * push;

    // Parallax: near motes shift against the cursor more than far ones.
    mv.xy -= uPointer * uMotion * 0.35 / max(depth, 1.0);

    // Motion streaks while flying: the camera moves along its view axis, so
    // motion on screen is radial from the centre. Stretch the quad's top half
    // outward along that direction; nearer motes streak longer (1/depth).
    vec2 radial = normalize(mv.xy + vec2(1e-4));
    float stretch = uStreak * 2.4 / max(depth, 0.6);
    mv.xy += position.xy * aSeed.z + radial * (position.y + 0.5) * stretch * aSeed.z * 8.0;
    gl_Position = projectionMatrix * mv;

    vUv = uv;
    vColor = aColor;
    float fog = exp(-(uFogDensity * depth) * (uFogDensity * depth));
    // Fade motes very close to the lens so they never pop in front of it.
    vAlpha = fog * smoothstep(0.4, 1.6, depth);
  }
`;

export const particleFragment = /* glsl */ `
  uniform float uOpacity;
  uniform vec3  uTint;        // hovered brand colour (linear), pre-mixed toward the background
  uniform float uTintAmount;  // 0..1, damped on the CPU
  varying vec2  vUv;
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float soft = 1.0 - smoothstep(0.0, 1.0, r);
    gl_FragColor = vec4(mix(vColor, uTint, uTintAmount), soft * soft * uOpacity * vAlpha);
    #include <colorspace_fragment>
  }
`;
