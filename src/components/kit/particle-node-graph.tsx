"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";

/** Visual lifecycle only — domain meaning belongs in `data`. */
export type NodeStatus = "pending" | "active" | "selected" | "dim";

/** 1 = largest shell … 4 = smallest. */
export type SizeTier = 1 | 2 | 3 | 4;

export interface NodeVisualStyle {
  radius: number;
  dots: number;
  size: number;
  labelPad: number;
}

export interface GraphNode {
  id: string;
  status: NodeStatus;
  sizeTier?: SizeTier;
  radius?: number;
  dots?: number;
  pointSize?: number;
  labelPad?: number;
  parentId?: string;
  label?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  data?: unknown;
}

export interface LayoutVisual {
  id: string;
  anchor: THREE.Vector3;
  style: NodeVisualStyle;
}

export type LayoutStrategy = (
  node: GraphNode,
  ctx: {
    visuals: Map<string, LayoutVisual>;
    rootCount: number;
    childCounts: Map<string, number>;
  },
) => { anchor: THREE.Vector3; linkParentId: string | null };

export interface ParticleNodeGraphProps {
  nodes?: GraphNode[];
  layout?: LayoutStrategy;
  className?: string;
  ariaLabel?: string;
  onNodeClick?: (id: string, data: unknown) => void;
  ink?: string;
  accent?: string;
}

type ParticleGraphCssProperties = CSSProperties &
  Record<
    "--particle-node-graph-ink" | "--particle-node-graph-accent",
    string
  >;

const IDLE_ROTATION_SPEED = 0.0011;
const CONVERGE_SECONDS = 0.9;
const CAMERA_IDLE_Z = 6;
const CAMERA_MIN_Z = 2.5;
const CAMERA_MAX_Z = 18;
const ZOOM_SPEED = 0.0015;
const FLOW_DOTS = 5;
const DUST_COUNT = 150;
const DRAG_SPEED = 0.008;
const DRAG_THRESHOLD_PX = 4;
const RESUME_DELAY_MS = 2500;

const TIER: Record<SizeTier, NodeVisualStyle> = {
  1: { radius: 0.44, dots: 150, size: 7, labelPad: 30 },
  2: { radius: 0.34, dots: 120, size: 6.6, labelPad: 25 },
  3: { radius: 0.26, dots: 95, size: 6.2, labelPad: 21 },
  4: { radius: 0.2, dots: 72, size: 5.6, labelPad: 19 },
};

const CLUSTER_VERTEX_SHADER = `
  attribute vec3 aStart;
  attribute float aStagger;
  uniform float uProgress;
  uniform float uPulse;
  uniform float uSize;
  uniform float uTime;
  varying float vAlpha;
  varying float vStagger;

  float easeOutBack(float t) {
    float c1 = 1.70158;
    float c3 = c1 + 1.0;
    float u = t - 1.0;
    return 1.0 + c3 * u * u * u + c1 * u * u;
  }

  void main() {
    float p = clamp((uProgress - aStagger * 0.3) / 0.7, 0.0, 1.0);
    float e = easeOutBack(p);
    vec3 pos = mix(aStart, position, e);
    float ph = aStagger * 6.2831853;
    pos += p * 0.02 * vec3(
      sin(uTime * 1.6 + ph),
      cos(uTime * 1.4 + ph * 1.7),
      sin(uTime * 1.9 + ph * 0.6)
    );
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (6.0 / -mvPosition.z) * (0.6 + 0.4 * p) * (1.0 + uPulse * 0.25);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = smoothstep(0.0, 0.2, p);
    vStagger = aStagger;
  }
`;

const CLUSTER_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform vec3 uAccentColor;
  uniform float uAccent;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vStagger;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float edge = 1.0 - smoothstep(0.44, 0.5, length(coord));
    if (edge < 0.01) discard;
    float ignite = smoothstep(vStagger, vStagger + 0.25, uAccent);
    vec3 col = mix(uColor, uAccentColor, ignite);
    gl_FragColor = vec4(col, uOpacity * vAlpha * edge);
  }
`;

const TINY_VERTEX_SHADER = `
  uniform float uSize;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (6.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const TINY_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float edge = 1.0 - smoothstep(0.4, 0.5, length(coord));
    if (edge < 0.01) discard;
    gl_FragColor = vec4(uColor, uOpacity * edge);
  }
`;

interface ClusterUniforms {
  [name: string]: THREE.IUniform<number | THREE.Color>;
  uProgress: { value: number };
  uPulse: { value: number };
  uSize: { value: number };
  uTime: { value: number };
  uColor: { value: THREE.Color };
  uAccentColor: { value: THREE.Color };
  uAccent: { value: number };
  uOpacity: { value: number };
}

interface TinyUniforms {
  [name: string]: THREE.IUniform<number | THREE.Color>;
  uSize: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
}

interface LabelParts {
  root: HTMLButtonElement;
  primary: HTMLSpanElement;
  secondary: HTMLSpanElement;
  tertiary: HTMLSpanElement;
  handleClick: () => void;
  handlePointerEnter: () => void;
  handlePointerLeave: () => void;
  handleFocus: () => void;
  handleBlur: () => void;
  setDetailsExpanded: (expanded: boolean) => void;
  isDetailsExpanded: () => boolean;
}

interface LinkVisual {
  parentId: string;
  from: THREE.Vector3;
  to: THREE.Vector3;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  linePositions: Float32Array;
  flow: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  flowPositions: Float32Array;
  flowUniforms: TinyUniforms;
  color: THREE.Color;
  opacity: number;
  flowOpacity: number;
}

interface RuntimeVisual {
  id: string;
  node: GraphNode;
  data: unknown;
  anchor: THREE.Vector3;
  style: NodeVisualStyle;
  seed: number;
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  uniforms: ClusterUniforms;
  label: LabelParts;
  link: LinkVisual | null;
  progress: number;
  accent: number;
  opacity: number;
  pulse: number;
  worldPosition: THREE.Vector3;
  projectedPosition: THREE.Vector3;
}

export function resolveStyle(node: GraphNode): NodeVisualStyle {
  const base = TIER[node.sizeTier ?? 3];
  return {
    radius: node.radius ?? base.radius,
    dots: node.dots ?? base.dots,
    size: node.pointSize ?? base.size,
    labelPad: node.labelPad ?? base.labelPad,
  };
}

export function fibonacciSpherePoints(count: number, radius: number): Float32Array {
  const points = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = goldenAngle * index;
    points[index * 3] = Math.cos(theta) * radiusAtY * radius;
    points[index * 3 + 1] = y * radius;
    points[index * 3 + 2] = Math.sin(theta) * radiusAtY * radius;
  }
  return points;
}

/** Deterministic RNG — scene replays must never depend on Math.random(). */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHierarchicalRadialLayout({
  levelOneYSpread = 1.1,
  evenlySpreadLevelOne = false,
}: {
  levelOneYSpread?: number;
  evenlySpreadLevelOne?: boolean;
} = {}): LayoutStrategy {
  return (node, ctx) => {
    const parent = node.parentId ? ctx.visuals.get(node.parentId) ?? null : null;

    if (!parent) {
      if (ctx.rootCount === 0) {
        return { anchor: new THREE.Vector3(0, 0, 0), linkParentId: null };
      }
    }

    if (parent && parent.anchor.lengthSq() > 0.01) {
      const index = ctx.childCounts.get(parent.id) ?? 0;
      ctx.childCounts.set(parent.id, index + 1);
      const direction = parent.anchor.clone().normalize();
      const up =
        Math.abs(direction.y) > 0.9
          ? new THREE.Vector3(1, 0, 0)
          : new THREE.Vector3(0, 1, 0);
      const u = new THREE.Vector3().crossVectors(direction, up).normalize();
      const v = new THREE.Vector3().crossVectors(direction, u).normalize();
      const around = index * 2.1 + 1.3;
      const cone = 0.8;
      const offset = direction
        .clone()
        .multiplyScalar(Math.cos(cone))
        .add(u.multiplyScalar(Math.sin(cone) * Math.cos(around)))
        .add(v.multiplyScalar(Math.sin(cone) * Math.sin(around)))
        .normalize();
      return {
        anchor: parent.anchor.clone().add(offset.multiplyScalar(2.1)),
        linkParentId: parent.id,
      };
    }

    const ringKey = parent ? parent.id : "__roots__";
    const index = ctx.childCounts.get(ringKey) ?? 0;
    ctx.childCounts.set(ringKey, index + 1);
    const angle = index * 2.39996 + 0.5;
    const normalizedY = evenlySpreadLevelOne
      ? (((index * 0.61803398875 + 0.5) % 1) * 2 - 1)
      : Math.sin(index * 2.1 + 0.7);
    const y = normalizedY * levelOneYSpread;
    const horizontal = Math.sqrt(Math.max(3 ** 2 - y ** 2, 0.25));
    return {
      anchor: new THREE.Vector3(
        Math.cos(angle) * horizontal,
        y,
        Math.sin(angle) * horizontal,
      ),
      linkParentId: parent?.id ?? null,
    };
  };
}

export const hierarchicalRadial = createHierarchicalRadialLayout();

function createClusterGeometry(
  style: NodeVisualStyle,
  seed: number,
  anchor: THREE.Vector3,
  parentAnchor: THREE.Vector3 | null,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(fibonacciSpherePoints(style.dots, style.radius), 3),
  );

  const starts = new Float32Array(style.dots * 3);
  const staggers = new Float32Array(style.dots);
  const random = mulberry32(seed * 9973 + 1);
  const origin = parentAnchor
    ? parentAnchor.clone().sub(anchor)
    : new THREE.Vector3(0, 0, 0);
  const jitter = parentAnchor ? 0.45 : 0.9;

  for (let index = 0; index < style.dots; index += 1) {
    const along = parentAnchor ? 0.15 + random() * 0.85 : 0;
    starts[index * 3] = origin.x * along + (random() - 0.5) * jitter;
    starts[index * 3 + 1] = origin.y * along + (random() - 0.5) * jitter;
    starts[index * 3 + 2] = origin.z * along + (random() - 0.5) * jitter;
    staggers[index] = random();
  }

  geometry.setAttribute("aStart", new THREE.BufferAttribute(starts, 3));
  geometry.setAttribute("aStagger", new THREE.BufferAttribute(staggers, 1));
  return geometry;
}

function createTinyMaterial(
  color: THREE.Color,
  size: number,
  opacity = 0,
): { material: THREE.ShaderMaterial; uniforms: TinyUniforms } {
  const uniforms: TinyUniforms = {
    uSize: { value: size },
    uColor: { value: color.clone() },
    uOpacity: { value: opacity },
  };
  return {
    material: new THREE.ShaderMaterial({
      uniforms,
      vertexShader: TINY_VERTEX_SHADER,
      fragmentShader: TINY_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    }),
    uniforms,
  };
}

function linkEndpoints(
  parent: LayoutVisual,
  ownAnchor: THREE.Vector3,
  ownStyle: NodeVisualStyle,
): { from: THREE.Vector3; to: THREE.Vector3 } {
  const direction = ownAnchor.clone().sub(parent.anchor);
  if (direction.lengthSq() < 0.0001) {
    direction.set(1, 0, 0);
  } else {
    direction.normalize();
  }
  return {
    from: parent.anchor.clone().addScaledVector(direction, parent.style.radius * 1.35),
    to: ownAnchor.clone().addScaledVector(direction, -ownStyle.radius * 1.35),
  };
}

function resolveCssColor(value: string, element: HTMLElement): string {
  const match = value.trim().match(/^var\((--[^),\s]+)(?:,[^)]+)?\)$/);
  if (!match) return value;
  const resolved = getComputedStyle(element).getPropertyValue(match[1]).trim();
  return resolved || "#111111";
}

function statusOpacity(status: NodeStatus): number {
  switch (status) {
    case "pending":
      return 0.3;
    case "active":
      return 0.85;
    case "selected":
      return 1;
    case "dim":
      return 0.22;
  }
}

function statusLinkOpacity(status: NodeStatus): number {
  switch (status) {
    case "pending":
      return 0.14;
    case "active":
      return 0.28;
    case "selected":
      return 0.85;
    case "dim":
      return 0.08;
  }
}

function sameStyle(left: NodeVisualStyle, right: NodeVisualStyle): boolean {
  return (
    left.radius === right.radius &&
    left.dots === right.dots &&
    left.size === right.size &&
    left.labelPad === right.labelPad
  );
}

function createWebglFallback(): HTMLDivElement {
  const fallback = document.createElement("div");
  fallback.setAttribute("role", "status");
  fallback.className =
    "absolute inset-0 grid place-items-center px-6 text-center text-sm text-[var(--particle-node-graph-ink)]/70";
  fallback.textContent = "Interactive 3D view unavailable.";
  return fallback;
}

export function ParticleNodeGraph({
  nodes,
  layout = hierarchicalRadial,
  className,
  ariaLabel = "Interactive 3D node graph",
  onNodeClick,
  ink = "#111111",
  accent = "#FF6500",
}: ParticleNodeGraphProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>(nodes ?? []);
  const nodesVersionRef = useRef(0);
  const layoutRef = useRef<LayoutStrategy>(layout);
  const onNodeClickRef = useRef(onNodeClick);
  const inkRef = useRef(ink);
  const accentRef = useRef(accent);
  const paletteVersionRef = useRef(0);

  useEffect(() => {
    nodesRef.current = nodes ?? [];
    nodesVersionRef.current += 1;
  }, [nodes]);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    inkRef.current = ink;
    accentRef.current = accent;
    paletteVersionRef.current += 1;
  }, [accent, ink]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const mountElement: HTMLDivElement = mount;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const fallback = createWebglFallback();
      mountElement.appendChild(fallback);
      return () => fallback.remove();
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "pan-y";
    mountElement.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = CAMERA_IDLE_Z;
    const world = new THREE.Group();
    scene.add(world);

    let inkColor = new THREE.Color(resolveCssColor(inkRef.current, mountElement));
    let accentColor = new THREE.Color(
      resolveCssColor(accentRef.current, mountElement),
    );

    const labelLayer = document.createElement("div");
    labelLayer.className = "pointer-events-none absolute inset-0 overflow-hidden";
    labelLayer.setAttribute("aria-label", "Graph nodes");
    mountElement.appendChild(labelLayer);

    const fallback = createWebglFallback();
    fallback.style.display = "none";
    mountElement.appendChild(fallback);

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustRandom = mulberry32(7351);
    for (let index = 0; index < DUST_COUNT; index += 1) {
      const radius = 0.8 + dustRandom() ** 0.6 * 2.2;
      const angle = dustRandom() * Math.PI * 2;
      dustPositions[index * 3] = Math.cos(angle) * radius;
      dustPositions[index * 3 + 1] = (dustRandom() - 0.5) * 2.6;
      dustPositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterialResult = createTinyMaterial(accentColor, 2.1);
    const dust = new THREE.Points(dustGeometry, dustMaterialResult.material);
    dust.frustumCulled = false;
    world.add(dust);

    const visuals = new Map<string, RuntimeVisual>();
    const layoutVisuals = new Map<string, LayoutVisual>();
    const childCounts = new Map<string, number>();
    let rootCount = 0;
    let spawnCounter = 0;
    let seenNodesVersion = -1;
    let seenPaletteVersion = -1;
    let width = 1;
    let height = 1;
    let yaw = 0;
    let pitch = 0;
    let zoomOffset = 0;
    let lastInteractionAt = performance.now();
    let activePointerId: number | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartYaw = 0;
    let dragStartPitch = 0;
    let dragging = false;
    const activeLabelInteractions = new Set<string>();
    let frameId = 0;
    let contextLost = false;
    let disposed = false;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;

    function updateLabel(visual: RuntimeVisual) {
      const { node, label } = visual;
      label.primary.textContent = node.label ?? "";
      label.secondary.textContent = node.secondaryLabel ?? "";
      label.tertiary.textContent = node.tertiaryLabel ?? "";
      const showDetails =
        node.status === "selected" || label.isDetailsExpanded();
      label.secondary.hidden = !node.secondaryLabel || !showDetails;
      label.tertiary.hidden = !node.tertiaryLabel || !showDetails;
      label.root.setAttribute(
        "aria-label",
        [node.label, node.secondaryLabel, node.tertiaryLabel]
          .filter((part): part is string => Boolean(part))
          .join(", ") || node.id,
      );
      label.root.setAttribute("aria-pressed", String(node.status === "selected"));
      label.primary.style.color = inkColor.getStyle();
      label.secondary.style.color = inkColor.getStyle();
      label.tertiary.style.color = inkColor.getStyle();
    }

    function createLabel(node: GraphNode): LabelParts {
      const root = document.createElement("button");
      root.type = "button";
      root.dataset.nodeLabel = "";
      root.className =
        "pointer-events-auto absolute flex min-w-max -translate-x-1/2 flex-col items-center rounded-md px-2 py-1 text-center outline-none transition-[background-color] duration-200 hover:bg-white/70 focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[var(--particle-node-graph-ink)] motion-reduce:transition-none";

      const primary = document.createElement("span");
      primary.className = "text-xs font-semibold leading-tight drop-shadow-[0_1px_0_rgba(250,246,239,0.9)]";
      const secondary = document.createElement("span");
      secondary.className = "mt-0.5 max-w-44 truncate text-[10px] leading-tight opacity-70";
      const tertiary = document.createElement("span");
      tertiary.className = "mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em]";
      root.append(primary, secondary, tertiary);

      let detailsExpanded = false;
      let pointerInside = false;
      let focused = false;
      const setDetailsExpanded = (expanded: boolean) => {
        detailsExpanded = expanded;
        const current = visuals.get(node.id)?.node ?? node;
        const showDetails = expanded || current.status === "selected";
        secondary.hidden = !current.secondaryLabel || !showDetails;
        tertiary.hidden = !current.tertiaryLabel || !showDetails;
      };
      const isDetailsExpanded = () => detailsExpanded;
      const handleClick = () => {
        const current = visuals.get(node.id);
        if (current) onNodeClickRef.current?.(current.id, current.data);
      };
      const syncInteraction = () => {
        const active = pointerInside || focused;
        if (active) activeLabelInteractions.add(node.id);
        else activeLabelInteractions.delete(node.id);
        lastInteractionAt = performance.now();
        setDetailsExpanded(active);
      };
      const handlePointerEnter = () => {
        pointerInside = true;
        syncInteraction();
      };
      const handlePointerLeave = () => {
        pointerInside = false;
        syncInteraction();
      };
      const handleFocus = () => {
        focused = true;
        syncInteraction();
      };
      const handleBlur = () => {
        focused = false;
        syncInteraction();
      };
      root.addEventListener("click", handleClick);
      root.addEventListener("pointerenter", handlePointerEnter);
      root.addEventListener("pointerleave", handlePointerLeave);
      root.addEventListener("focus", handleFocus);
      root.addEventListener("blur", handleBlur);
      labelLayer.appendChild(root);
      return {
        root,
        primary,
        secondary,
        tertiary,
        handleClick,
        handlePointerEnter,
        handlePointerLeave,
        handleFocus,
        handleBlur,
        setDetailsExpanded,
        isDetailsExpanded,
      };
    }

    function disposeLink(link: LinkVisual) {
      world.remove(link.line, link.flow);
      link.line.geometry.dispose();
      link.line.material.dispose();
      link.flow.geometry.dispose();
      link.flow.material.dispose();
    }

    function disposeVisual(visual: RuntimeVisual) {
      activeLabelInteractions.delete(visual.id);
      world.remove(visual.points);
      visual.points.geometry.dispose();
      visual.points.material.dispose();
      if (visual.link) disposeLink(visual.link);
      visual.label.root.removeEventListener("click", visual.label.handleClick);
      visual.label.root.removeEventListener(
        "pointerenter",
        visual.label.handlePointerEnter,
      );
      visual.label.root.removeEventListener(
        "pointerleave",
        visual.label.handlePointerLeave,
      );
      visual.label.root.removeEventListener("focus", visual.label.handleFocus);
      visual.label.root.removeEventListener("blur", visual.label.handleBlur);
      visual.label.root.remove();
      visuals.delete(visual.id);
      layoutVisuals.delete(visual.id);

      for (const child of visuals.values()) {
        if (child.link?.parentId === visual.id) {
          disposeLink(child.link);
          child.link = null;
        }
      }

      if (visuals.size === 0) {
        rootCount = 0;
        childCounts.clear();
      }
    }

    function createLink(
      parent: LayoutVisual,
      anchor: THREE.Vector3,
      style: NodeVisualStyle,
    ): LinkVisual {
      const endpoints = linkEndpoints(parent, anchor, style);
      const linePositions = new Float32Array([
        endpoints.from.x,
        endpoints.from.y,
        endpoints.from.z,
        endpoints.from.x,
        endpoints.from.y,
        endpoints.from.z,
      ]);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: inkColor,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.frustumCulled = false;
      world.add(line);

      const flowPositions = new Float32Array(FLOW_DOTS * 3);
      const flowGeometry = new THREE.BufferGeometry();
      flowGeometry.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
      const flowMaterialResult = createTinyMaterial(accentColor, 2.6);
      const flow = new THREE.Points(flowGeometry, flowMaterialResult.material);
      flow.frustumCulled = false;
      world.add(flow);

      return {
        parentId: parent.id,
        from: endpoints.from,
        to: endpoints.to,
        line,
        linePositions,
        flow,
        flowPositions,
        flowUniforms: flowMaterialResult.uniforms,
        color: inkColor.clone(),
        opacity: 0,
        flowOpacity: 0,
      };
    }

    function spawnNode(node: GraphNode) {
      const style = resolveStyle(node);
      const layoutResult = layoutRef.current(node, {
        visuals: layoutVisuals,
        rootCount,
        childCounts,
      });
      if (!node.parentId || !layoutVisuals.has(node.parentId)) rootCount += 1;

      const parent = layoutResult.linkParentId
        ? layoutVisuals.get(layoutResult.linkParentId) ?? null
        : null;
      const seed = spawnCounter;
      spawnCounter += 1;
      const geometry = createClusterGeometry(
        style,
        seed,
        layoutResult.anchor,
        parent?.anchor ?? null,
      );
      const uniforms: ClusterUniforms = {
        uProgress: { value: reducedMotion ? 1 : 0 },
        uPulse: { value: 0 },
        uSize: { value: style.size },
        uTime: { value: 0 },
        uColor: { value: inkColor.clone() },
        uAccentColor: { value: accentColor.clone() },
        uAccent: { value: node.status === "selected" && reducedMotion ? 1.25 : 0 },
        uOpacity: { value: reducedMotion ? statusOpacity(node.status) : 0 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: CLUSTER_VERTEX_SHADER,
        fragmentShader: CLUSTER_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      points.position.copy(layoutResult.anchor);
      points.frustumCulled = false;
      world.add(points);

      const visual: RuntimeVisual = {
        id: node.id,
        node,
        data: node.data,
        anchor: layoutResult.anchor,
        style,
        seed,
        points,
        uniforms,
        label: createLabel(node),
        link: parent ? createLink(parent, layoutResult.anchor, style) : null,
        progress: reducedMotion ? 1 : 0,
        accent: node.status === "selected" && reducedMotion ? 1.25 : 0,
        opacity: reducedMotion ? statusOpacity(node.status) : 0,
        pulse: 0,
        worldPosition: new THREE.Vector3(),
        projectedPosition: new THREE.Vector3(),
      };
      visuals.set(node.id, visual);
      layoutVisuals.set(node.id, {
        id: node.id,
        anchor: layoutResult.anchor,
        style,
      });
      updateLabel(visual);
    }

    function refreshLinkEndpoints() {
      for (const visual of visuals.values()) {
        if (!visual.link) continue;
        const parent = layoutVisuals.get(visual.link.parentId);
        if (!parent) continue;
        const endpoints = linkEndpoints(parent, visual.anchor, visual.style);
        visual.link.from.copy(endpoints.from);
        visual.link.to.copy(endpoints.to);
      }
    }

    function syncNodes() {
      const desiredNodes = nodesRef.current;
      const desiredIds = new Set<string>(desiredNodes.map((node) => node.id));

      for (const visual of [...visuals.values()]) {
        if (!desiredIds.has(visual.id)) disposeVisual(visual);
      }

      for (const node of desiredNodes) {
        const visual = visuals.get(node.id);
        if (!visual) {
          spawnNode(node);
          continue;
        }

        visual.node = node;
        visual.data = node.data;
        const nextStyle = resolveStyle(node);
        if (!sameStyle(visual.style, nextStyle)) {
          const parentAnchor = visual.link
            ? layoutVisuals.get(visual.link.parentId)?.anchor ?? null
            : null;
          const nextGeometry = createClusterGeometry(
            nextStyle,
            visual.seed,
            visual.anchor,
            parentAnchor,
          );
          const previousGeometry = visual.points.geometry;
          visual.points.geometry = nextGeometry;
          previousGeometry.dispose();
          visual.style = nextStyle;
          visual.uniforms.uSize.value = nextStyle.size;
          const layoutVisual = layoutVisuals.get(visual.id);
          if (layoutVisual) layoutVisual.style = nextStyle;
        }
        updateLabel(visual);
      }
      refreshLinkEndpoints();
    }

    function refreshPalette() {
      inkColor = new THREE.Color(resolveCssColor(inkRef.current, mountElement));
      accentColor = new THREE.Color(
        resolveCssColor(accentRef.current, mountElement),
      );
      dustMaterialResult.uniforms.uColor.value.copy(accentColor);
      for (const visual of visuals.values()) {
        visual.uniforms.uColor.value.copy(inkColor);
        visual.uniforms.uAccentColor.value.copy(accentColor);
        if (visual.link) visual.link.flowUniforms.uColor.value.copy(accentColor);
        updateLabel(visual);
      }
    }

    function resize() {
      width = Math.max(mountElement.clientWidth, 1);
      height = Math.max(mountElement.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mountElement);
    resize();

    const clock = new THREE.Clock();
    let elapsed = 0;
    let shaderTime = 0;

    function tick() {
      if (disposed) return;
      frameId = requestAnimationFrame(tick);
      if (contextLost) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      elapsed += delta;
      if (!reducedMotion) shaderTime += delta;
      const smoothing = 1 - Math.exp(-delta * 6);
      const smoothingSlow = 1 - Math.exp(-delta * 2.5);

      if (seenNodesVersion !== nodesVersionRef.current) {
        syncNodes();
        seenNodesVersion = nodesVersionRef.current;
      }
      if (seenPaletteVersion !== paletteVersionRef.current) {
        refreshPalette();
        seenPaletteVersion = paletteVersionRef.current;
      }

      const hasNodes = visuals.size > 0;
      if (
        !reducedMotion &&
        activePointerId === null &&
        activeLabelInteractions.size === 0 &&
        performance.now() - lastInteractionAt > RESUME_DELAY_MS
      ) {
        yaw += IDLE_ROTATION_SPEED * (hasNodes ? 0.45 : 1) * (delta * 60);
        pitch = Math.sin(elapsed * 0.05) * 0.15;
      }
      world.rotation.set(pitch, yaw, 0);
      world.updateMatrixWorld(true);

      let maxY = 0.8;
      let maxHorizontal = 1.2;
      for (const visual of visuals.values()) {
        maxY = Math.max(maxY, Math.abs(visual.anchor.y) + visual.style.radius + 0.8);
        maxHorizontal = Math.max(
          maxHorizontal,
          Math.hypot(visual.anchor.x, visual.anchor.z) + visual.style.radius + 1,
        );
      }
      const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const neededZ =
        Math.max(maxY / halfTan, maxHorizontal / (halfTan * camera.aspect)) * 1.15 + 1;
      const fitZ = hasNodes
        ? THREE.MathUtils.clamp(neededZ, CAMERA_IDLE_Z, CAMERA_MAX_Z)
        : CAMERA_IDLE_Z;
      const cameraTarget = THREE.MathUtils.clamp(
        fitZ + zoomOffset,
        CAMERA_MIN_Z,
        CAMERA_MAX_Z,
      );
      camera.position.z +=
        (cameraTarget - camera.position.z) * (1 - Math.exp(-delta * 2.2));
      camera.updateMatrixWorld(true);

      const dustTarget = hasNodes ? 0 : 0.28;
      dustMaterialResult.uniforms.uOpacity.value +=
        (dustTarget - dustMaterialResult.uniforms.uOpacity.value) * smoothingSlow;

      for (const visual of visuals.values()) {
        const status = visual.node.status;
        if (reducedMotion) {
          visual.progress = 1;
          visual.opacity = statusOpacity(status);
          visual.pulse = 0;
          visual.accent = status === "selected" ? 1.25 : 0;
        } else {
          visual.progress = Math.min(
            visual.progress + delta / CONVERGE_SECONDS,
            1,
          );
          visual.opacity += (statusOpacity(status) - visual.opacity) * smoothing;
          const pulseTarget =
            status === "selected" ? 0.5 + Math.sin(elapsed * 4) * 0.5 : 0;
          visual.pulse += (pulseTarget - visual.pulse) * smoothing;
          const accentTarget = status === "selected" ? 1.25 : 0;
          const accentRate = status === "selected" ? delta / 1.1 : delta / 0.45;
          const accentDifference = accentTarget - visual.accent;
          visual.accent +=
            Math.sign(accentDifference) *
            Math.min(Math.abs(accentDifference), accentRate * 1.25);
        }

        visual.uniforms.uProgress.value = visual.progress;
        visual.uniforms.uOpacity.value = visual.opacity;
        visual.uniforms.uPulse.value = visual.pulse;
        visual.uniforms.uAccent.value = visual.accent;
        visual.uniforms.uTime.value = shaderTime;

        if (visual.link) {
          const draw = reducedMotion
            ? 1
            : THREE.MathUtils.clamp((visual.progress - 0.1) / 0.55, 0, 1);
          const drawEased = 1 - (1 - draw) ** 3;
          const { from, to } = visual.link;
          visual.link.linePositions[0] = from.x;
          visual.link.linePositions[1] = from.y;
          visual.link.linePositions[2] = from.z;
          visual.link.linePositions[3] = from.x + (to.x - from.x) * drawEased;
          visual.link.linePositions[4] = from.y + (to.y - from.y) * drawEased;
          visual.link.linePositions[5] = from.z + (to.z - from.z) * drawEased;
          const lineAttribute = visual.link.line.geometry.getAttribute("position");
          lineAttribute.needsUpdate = true;

          const linkOpacityTarget = statusLinkOpacity(status) * drawEased;
          visual.link.opacity +=
            (linkOpacityTarget - visual.link.opacity) * smoothingSlow;
          visual.link.line.material.opacity = visual.link.opacity;
          const linkColorTarget = status === "selected" ? accentColor : inkColor;
          visual.link.color.lerp(linkColorTarget, smoothingSlow);
          visual.link.line.material.color.copy(visual.link.color);

          const flowTarget =
            !reducedMotion &&
            status === "selected" &&
            visual.progress > 0.85 &&
            visual.accent > 0.5
              ? 0.95
              : 0;
          visual.link.flowOpacity +=
            (flowTarget - visual.link.flowOpacity) * smoothing;
          visual.link.flowUniforms.uOpacity.value = visual.link.flowOpacity;
          for (let index = 0; index < FLOW_DOTS; index += 1) {
            const travel = (elapsed * 0.28 + index / FLOW_DOTS) % 1;
            visual.link.flowPositions[index * 3] =
              from.x + (to.x - from.x) * travel;
            visual.link.flowPositions[index * 3 + 1] =
              from.y + (to.y - from.y) * travel;
            visual.link.flowPositions[index * 3 + 2] =
              from.z + (to.z - from.z) * travel;
          }
          const flowAttribute = visual.link.flow.geometry.getAttribute("position");
          flowAttribute.needsUpdate = true;
        }

        visual.worldPosition
          .copy(visual.anchor)
          .applyMatrix4(world.matrixWorld);
        visual.projectedPosition.copy(visual.worldPosition).project(camera);
        if (visual.projectedPosition.z > 1) {
          visual.label.root.style.visibility = "hidden";
        } else {
          visual.label.root.style.visibility = "visible";
          visual.label.root.style.left = `${
            ((visual.projectedPosition.x + 1) / 2) * width
          }px`;
          visual.label.root.style.top = `${
            ((1 - visual.projectedPosition.y) / 2) * height +
            visual.style.labelPad
          }px`;
          visual.label.root.style.opacity = "1";
        }
      }

      renderer.render(scene, camera);
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-node-label]")
      ) {
        return;
      }
      activePointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartYaw = yaw;
      dragStartPitch = pitch;
      dragging = false;
      lastInteractionAt = performance.now();
    }

    function handlePointerMove(event: PointerEvent) {
      if (activePointerId !== event.pointerId) return;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD_PX) dragging = true;
      if (!dragging) return;
      yaw = dragStartYaw + deltaX * DRAG_SPEED;
      pitch = THREE.MathUtils.clamp(
        dragStartPitch + deltaY * DRAG_SPEED,
        -1.2,
        1.2,
      );
      renderer.domElement.style.cursor = "grabbing";
    }

    function handlePointerUp(event: PointerEvent) {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      dragging = false;
      lastInteractionAt = performance.now();
      renderer.domElement.style.cursor = "grab";
    }

    function handleWheel(event: WheelEvent) {
      zoomOffset = THREE.MathUtils.clamp(
        zoomOffset + event.deltaY * ZOOM_SPEED,
        -3.2,
        6,
      );
      lastInteractionAt = performance.now();
    }

    function handleReducedMotion(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
    }

    function handleContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
      fallback.style.display = "grid";
    }

    function handleContextRestored() {
      contextLost = false;
      fallback.style.display = "none";
      clock.start();
    }

    mountElement.addEventListener("pointerdown", handlePointerDown);
    mountElement.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    reducedMotionQuery.addEventListener("change", handleReducedMotion);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mountElement.removeEventListener("pointerdown", handlePointerDown);
      mountElement.removeEventListener("wheel", handleWheel);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      reducedMotionQuery.removeEventListener("change", handleReducedMotion);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      for (const visual of [...visuals.values()]) disposeVisual(visual);
      world.remove(dust);
      dustGeometry.dispose();
      dustMaterialResult.material.dispose();
      labelLayer.remove();
      fallback.remove();
      renderer.domElement.remove();
      renderer.dispose();
    };
  }, []);

  const graphStyle: ParticleGraphCssProperties = {
    "--particle-node-graph-ink": ink,
    "--particle-node-graph-accent": accent,
  };

  return (
    <div
      className={`relative isolate overflow-hidden ${className ?? ""}`}
      role="group"
      aria-label={ariaLabel}
      style={graphStyle}
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
