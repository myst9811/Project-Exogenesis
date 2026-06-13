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
  uniform vec3 uLightDir;     // world-space direction toward the star

  varying vec3 vNormal;
  varying vec3 vObjectPos;

  void main() {
    // Latitude drives polar ice: |y| of the object-space surface direction.
    float lat = abs(vObjectPos.y);
    float iceEdge = 1.0 - uIceFraction;          // higher ice -> lower edge
    float ice = smoothstep(iceEdge - 0.05, iceEdge + 0.05, lat);

    vec3 surface = uSurfaceColor;
    surface = mix(surface, vec3(0.9, 0.94, 1.0), ice);          // ice caps
    surface = mix(surface, vec3(1.0, 0.35, 0.1), uMoltenFactor); // molten tint

    // Day/night Lambert from the star direction.
    float day = clamp(dot(normalize(vNormal), normalize(uLightDir)), 0.0, 1.0);
    float ambient = 0.06;
    vec3 lit = surface * (ambient + 0.95 * day) * uStarColor;

    // Molten worlds self-illuminate on the night side.
    lit += uSurfaceColor * uMoltenFactor * (1.0 - day) * vec3(1.0, 0.3, 0.08);

    gl_FragColor = vec4(lit, 1.0);
  }
`;
