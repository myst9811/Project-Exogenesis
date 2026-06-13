/**
 * @module renderer/scene/planetShaders
 *
 * GLSL source for the physics-derived planet. Stage 1: surface palette,
 * temperature ice caps, molten glow, day/night Lambert lighting. Procedural
 * geography (Stage 2) and clouds/atmosphere (Stage 3) extend the fragment
 * shader. WebGL-only; not unit-tested (see the implementation plan).
 */

export const PLANET_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;     // world-space surface normal (for lighting)
  varying vec3 vObjectPos;  // object-space direction (fixed surface features)
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vObjectPos = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const PLANET_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uSurfaceColor;
  uniform vec3 uStarColor;
  uniform float uIceFraction;
  uniform float uMoltenFactor;
  uniform float uOceanLevel;
  uniform float uTerrainSeed;
  uniform float uTerrainRoughness;
  uniform vec3 uLightDir;     // world-space direction toward the star
  uniform float uCloudDensity; // cloud cover, 0 → 1, from water vapor × pressure
  uniform vec3 uSkyColor;      // Rayleigh limb tint of the stellar spectrum
  uniform float uAtmThickness; // atmospheric column depth, 0 → 1
  uniform float uTime;         // seconds, for cloud drift

  varying vec3 vNormal;
  varying vec3 vObjectPos;

  // Hash + 3D value noise (deterministic; seeded by uTerrainSeed).
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + uTerrainSeed);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                   mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
               mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                   mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return s;
  }

  void main() {
    vec3 dir = normalize(vObjectPos);
    float height = fbm(dir * 2.5);

    bool isOcean = uOceanLevel > 0.0 && height < uOceanLevel;
    vec3 land = mix(uSurfaceColor * 0.8, uSurfaceColor * 1.15,
                    smoothstep(uOceanLevel, 1.0, height));
    vec3 ocean = vec3(0.04, 0.16, 0.34);
    vec3 base = isOcean ? ocean : land;

    // Mountain shading: brighten high land by roughness.
    if (!isOcean) {
      base += uTerrainRoughness * (height - uOceanLevel) * 0.4;
    }

    // Polar ice over everything.
    float lat = abs(dir.y);
    float iceEdge = 1.0 - uIceFraction;
    float ice = smoothstep(iceEdge - 0.05, iceEdge + 0.05, lat);
    base = mix(base, vec3(0.9, 0.94, 1.0), ice);

    // Molten override.
    base = mix(base, vec3(1.0, 0.35, 0.1), uMoltenFactor);

    // Day/night Lambert from the star direction, with a soft day ramp so the
    // terminator is gradual; ambient gives the night side faint earthshine.
    float ndl = dot(normalize(vNormal), normalize(uLightDir));
    float day = smoothstep(-0.2, 0.3, ndl);
    vec3 lit = base * (0.12 + 0.95 * day) * uStarColor;
    lit += uSurfaceColor * uMoltenFactor * (1.0 - day) * vec3(1.0, 0.3, 0.08);

    // Drifting clouds (lit by day), only where the atmosphere holds water.
    if (uCloudDensity > 0.0) {
      float c = fbm(dir * 3.5 + vec3(uTime * 0.01, 0.0, 0.0));
      float cloud = smoothstep(1.0 - uCloudDensity, 1.0, c) * uCloudDensity;
      lit = mix(lit, vec3(1.0) * (0.1 + 0.9 * day) * uStarColor, cloud * 0.8);
    }

    // Fresnel atmospheric limb: brightens the disc edge facing the viewer,
    // tinted by the sky color and stronger on the day side.
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    lit += uSkyColor * fresnel * uAtmThickness * (0.3 + 0.7 * day);

    gl_FragColor = vec4(lit, 1.0);
  }
`;
