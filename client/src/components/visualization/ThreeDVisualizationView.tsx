import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Box, Crosshair, Eye, EyeOff, Play, RotateCcw, Square, X, ZoomIn } from "lucide-react";
import { useNetworkStore, type WhamoEdge, type WhamoNode } from "@/lib/store";
import { DataList } from "@/components/TooltipWrapper";
import damIcon from "@assets/dam_1779522984604.png";
import yIntersectionIcon from "@assets/y-intersection_(1)_1779523210044.png";
import waterTankIcon from "@assets/water-tank_(2)_1779523360829.png";
import waterPumpIcon from "@assets/water-pump_1779523451215.png";
import pipeIcon from "@assets/pipe_1779523475650.png";
import windIcon from "@assets/wind_1779523398812.png";

interface ThreeDVisualizationViewProps {
  nodes: WhamoNode[];
  edges: WhamoEdge[];
  projectName?: string;
  onClose: () => void;
  className?: string;
}

type HydraulicNodeType = WhamoNode["type"];

const NODE_COLORS: Record<string, number> = {
  reservoir: 0x2563eb,
  node: 0x0f766e,
  junction: 0x7c3aed,
  surgeTank: 0xf59e0b,
  flowBoundary: 0x0891b2,
  pump: 0xdc2626,
  checkValve: 0x9333ea,
};

const NODE_LABELS: Record<string, string> = {
  reservoir: "Reservoir",
  node: "Node",
  junction: "Junction",
  surgeTank: "Surge tank",
  flowBoundary: "Flow boundary",
  pump: "Legacy element",
  checkValve: "Legacy element",
};

// Icon URL map — same PNGs as the 2D view
const ICON_URLS: Record<string, string> = {
  reservoir: damIcon,
  junction: yIntersectionIcon,
  surgeTank: waterTankIcon,
  flowBoundary: windIcon,
  pump: waterPumpIcon,
  checkValve: pipeIcon,
};

// Module-level texture cache so textures survive hot-reloads
const _textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Loads a PNG icon and returns a THREE.CanvasTexture with the icon
 * rendered in white (so it reads clearly on coloured spheres).
 */
function loadIconTexture(url: string): Promise<THREE.CanvasTexture> {
  const cached = _textureCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 128;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      // Draw the source icon
      ctx.drawImage(img, 8, 8, SIZE - 16, SIZE - 16);

      // Re-colour every non-transparent pixel to white
      const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 10) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      _textureCache.set(url, texture);
      resolve(texture);
    };
    img.src = url;
  });
}

function loadAllIconTextures(): Promise<Map<string, THREE.CanvasTexture>> {
  return Promise.all(
    Object.entries(ICON_URLS).map(async ([type, url]) => {
      const tex = await loadIconTexture(url);
      return [type, tex] as const;
    }),
  ).then((pairs) => new Map(pairs));
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const SPHERE_RADIUS = 1.1;

/** Creates a canvas-text sprite that always faces the camera, positioned above the sphere. */
function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const fontSize = 28;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const padding = 14;
  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding;

  // Re-apply font after resize (canvas reset clears it)
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(15,23,42,0.82)"; // dark bg
  const r = 8;
  const w = canvas.width;
  const h = canvas.height;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  // Scale to world units — keep aspect ratio
  const aspect = canvas.width / canvas.height;
  const spriteHeight = 0.55;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);
  sprite.position.set(0, SPHERE_RADIUS + 0.55, 0);
  return sprite;
}

function addNodeModel(
  node: WhamoNode,
  position: THREE.Vector3,
  group: THREE.Group,
  textures: Map<string, THREE.CanvasTexture>,
) {
  const type = (node.type as HydraulicNodeType | undefined) ?? "node";
  const color = NODE_COLORS[type] ?? 0x475569;

  // All nodes are uniform spheres — fully matte (roughness 1, metalness 0) so no specular highlight
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 32, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 1.0, metalness: 0.0 }),
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;

  // Overlay the 2D icon as a billboard sprite (or, for plain nodes, the label text)
  const iconTexture = textures.get(type);
  if (iconTexture) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: iconTexture,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true,
      }),
    );
    sprite.scale.set(SPHERE_RADIUS * 1.25, SPHERE_RADIUS * 1.25, 1);
    sphere.add(sprite);
  } else {
    // For node type (no PNG icon) render the short node ID (N1, N2 …) centred on the ball
    const nodeNum = node.data?.nodeNumber;
    const labelText = nodeNum != null ? `N${nodeNum}` : String(node.data?.label || node.id);
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    // Fit font size to canvas
    let fontSize = 96;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(labelText).width > 220 && fontSize > 24) {
      fontSize -= 4;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
    );
    sprite.scale.set(SPHERE_RADIUS * 1.3, SPHERE_RADIUS * 1.3, 1);
    sphere.add(sprite);
  }

  // Label sprite above the sphere
  const labelText = String(node.data?.label || node.id);
  sphere.add(createLabelSprite(labelText));

  sphere.position.copy(position);
  const nodeUserData = {
    label: labelText,
    type,
    elementId: node.id,
    elementType: "node",
    data: node.data,
  };
  sphere.userData = nodeUserData;

  // Copy userData to all sprite children so the raycaster finds elementId
  // regardless of which child is picked first
  sphere.children.forEach((child) => {
    child.userData = { ...nodeUserData };
  });

  group.add(sphere);
}

const INLINE_ELEMENT_TYPES = new Set(["pump", "checkValve"]);

function addPipeModel(
  edge: WhamoEdge,
  source: THREE.Vector3,
  target: THREE.Vector3,
  group: THREE.Group,
) {
  const edgeType = edge.data?.type as string | undefined;
  const direction = new THREE.Vector3().subVectors(target, source);
  const length = direction.length();
  if (length < 0.001) return;

  const isDummy = edgeType === "dummy";
  const isInline = INLINE_ELEMENT_TYPES.has(edgeType ?? "");
  const radius = isDummy ? 0.055 : 0.09;
  const pipeColor = isDummy ? 0x94a3b8 : 0x334155;
  const pipeNorm = direction.clone().normalize();

  const edgeUserData = {
    label: edge.data?.label || edge.id,
    type: edgeType || "conduit",
    length: numberValue(edge.data?.length, length),
    diameter: numberValue(edge.data?.diameter),
    elementId: edge.id,
    elementType: "edge",
    data: edge.data,
  };

  if (isInline) {
    // Split into two half-pipes so the inline-element ball sits between them
    const mid = source.clone().lerp(target, 0.5);
    const halfLen = length / 2;
    const halfGap = SPHERE_RADIUS * 0.9; // gap near the ball so pipe doesn't clip through

    [{ from: source, to: mid }, { from: mid, to: target }].forEach(({ from, to }) => {
      const segDir = new THREE.Vector3().subVectors(to, from);
      const segLen = segDir.length() - halfGap;
      if (segLen < 0.05) return;
      const segNorm = segDir.clone().normalize();
      // Centre the shortened segment between the node and the ball
      const segCenter = from.clone().add(segNorm.clone().multiplyScalar(halfGap / 2 + segLen / 2));
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, segLen, 16),
        new THREE.MeshStandardMaterial({ color: pipeColor, roughness: 0.5, metalness: 0.2 }),
      );
      seg.position.copy(segCenter);
      if (Math.abs(segNorm.dot(new THREE.Vector3(0, 1, 0))) < 0.999) {
        seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), segNorm);
      }
      seg.castShadow = true;
      seg.receiveShadow = true;
      seg.userData = { ...edgeUserData };
      group.add(seg);
    });
  } else {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 16),
      new THREE.MeshStandardMaterial({ color: pipeColor, roughness: 0.5, metalness: 0.2 }),
    );
    pipe.position.copy(source).add(target).multiplyScalar(0.5);
    pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pipeNorm);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    pipe.userData = { ...edgeUserData };
    group.add(pipe);
  }
}

// Sphere + icon ball placed at the midpoint of an inline-element edge (pump / checkValve)
function addInlineElementBall(
  edge: WhamoEdge,
  source: THREE.Vector3,
  target: THREE.Vector3,
  group: THREE.Group,
  textures: Map<string, THREE.CanvasTexture>,
) {
  const edgeType = edge.data?.type as string;
  const mid = source.clone().lerp(target, 0.5);
  const color = (NODE_COLORS[edgeType] ?? 0x475569);
  const labelText = String(edge.data?.label || edge.id);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 32, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 1.0, metalness: 0.0 }),
  );
  sphere.castShadow = true;

  // Icon sprite
  const iconTexture = textures.get(edgeType);
  if (iconTexture) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: iconTexture, transparent: true, depthTest: false, sizeAttenuation: true }),
    );
    sprite.scale.set(SPHERE_RADIUS * 1.25, SPHERE_RADIUS * 1.25, 1);
    sphere.add(sprite);
  }

  // Label pill above
  sphere.add(createLabelSprite(labelText));

  sphere.position.copy(mid);

  const ballUserData = {
    label: labelText,
    type: edgeType,
    elementId: edge.id,
    elementType: "edge",
    data: edge.data,
  };
  sphere.userData = ballUserData;
  sphere.children.forEach((child) => { child.userData = { ...ballUserData }; });

  group.add(sphere);
}

function getPickRoot(object: THREE.Object3D | undefined) {
  let current = object;
  while (current && !current.userData.elementId) current = current.parent ?? undefined;
  return current;
}

function setHighlight(object: THREE.Object3D | undefined, active: boolean, selected = false) {
  if (!object) return;
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      material.emissive.set(active || selected ? (selected ? 0x38bdf8 : 0xfde047) : 0x000000);
      material.emissiveIntensity = selected ? 0.85 : active ? 0.55 : 0;
    });
  });
}

// ------ Flow particle geometry ------
const PARTICLE_COLOR_CORE  = 0xffffff; // bright white core
const PARTICLE_COLOR_MAIN  = 0x00cfff; // vivid cyan body
const PARTICLE_COLOR_TRAIL = 0x0077cc; // deeper blue trail
const PARTICLE_COUNT = 4; // per edge

function createFlowParticle(direction: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();

  // ---- Arrowhead (leading) ----
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.45, 10),
    new THREE.MeshBasicMaterial({ color: PARTICLE_COLOR_CORE }),
  );
  cone.position.set(0, 0.38, 0);
  g.add(cone);

  // ---- Main orb ----
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    new THREE.MeshBasicMaterial({ color: PARTICLE_COLOR_MAIN }),
  );
  g.add(orb);

  // ---- Outer glow halo ----
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshBasicMaterial({ color: PARTICLE_COLOR_MAIN, transparent: true, opacity: 0.18 }),
  );
  g.add(halo);

  // ---- Comet tail (3 fading spheres trailing behind) ----
  const trailOffsets = [0.55, 1.0, 1.55];
  const trailOpacity = [0.55, 0.3, 0.12];
  const trailRadii   = [0.13, 0.09, 0.06];
  for (let i = 0; i < trailOffsets.length; i++) {
    const t = new THREE.Mesh(
      new THREE.SphereGeometry(trailRadii[i], 8, 8),
      new THREE.MeshBasicMaterial({ color: PARTICLE_COLOR_TRAIL, transparent: true, opacity: trailOpacity[i] }),
    );
    t.position.set(0, -trailOffsets[i], 0); // negative Y = behind in local space
    g.add(t);
  }

  // Orient along edge direction
  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(direction.dot(up)) < 0.999) {
    g.quaternion.setFromUnitVectors(up, direction);
  }

  return g;
}

interface FlowEdgeData {
  source: THREE.Vector3;
  target: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  particles: THREE.Group[];
}

// ---- Component ----

export function ThreeDVisualizationView({
  nodes,
  edges,
  projectName,
  onClose,
  className = "",
}: ThreeDVisualizationViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const graphGroupRef = useRef<THREE.Group | null>(null);
  const animGroupRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const flowEdgesRef = useRef<FlowEdgeData[]>([]);
  const isAnimatingRef = useRef(false);
  const animTimeRef = useRef(0);
  const cameraFitRef = useRef<{ center: THREE.Vector3; position: THREE.Vector3; distance: number }>({
    center: new THREE.Vector3(),
    position: new THREE.Vector3(18, 15, 20),
    distance: 30,
  });
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const hoveredObjectRef = useRef<THREE.Object3D>();
  const selectElement = useNetworkStore((state) => state.selectElement);
  const selectedElementId = useNetworkStore((state) => state.selectedElementId);
  const selectedElementIdRef = useRef(selectedElementId);
  useEffect(() => { selectedElementIdRef.current = selectedElementId; }, [selectedElementId]);
  const showHoverData = useNetworkStore((state) => state.showHoverData);
  const setShowHoverData = useNetworkStore((state) => state.setShowHoverData);
  const [hovered, setHovered] = useState<{
    label: string;
    type: string;
    data: Record<string, unknown>;
    x: number;
    y: number;
  } | null>(null);
  const [modelStats, setModelStats] = useState({ nodes: nodes.length, pipes: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  useEffect(() => {
    if (gridRef.current)   gridRef.current.visible   = showGrid;
    if (groundRef.current) groundRef.current.visible  = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (axesRef.current) axesRef.current.visible = showAxes;
  }, [showAxes]);

  const resetCamera = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const { center, position } = cameraFitRef.current;
    camera.position.copy(position);
    controls.target.copy(center);
    controls.update();
  }, []);

  // Toggle flow animation on/off
  const toggleAnimation = useCallback(() => {
    const animGroup = animGroupRef.current;
    const scene = sceneRef.current;
    if (!animGroup || !scene) return;

    if (!isAnimatingRef.current) {
      // Build particles
      animGroup.clear();
      flowEdgesRef.current.forEach((edgeData) => {
        edgeData.particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const particle = createFlowParticle(edgeData.direction);
          // Start each particle at an offset along the edge
          const t = i / PARTICLE_COUNT;
          particle.position.lerpVectors(edgeData.source, edgeData.target, t);
          animGroup.add(particle);
          edgeData.particles.push(particle);
        }
      });
      animTimeRef.current = 0;
      isAnimatingRef.current = true;
      setIsAnimating(true);
    } else {
      // Clear particles
      animGroup.clear();
      flowEdgesRef.current.forEach((e) => { e.particles = []; });
      isAnimatingRef.current = false;
      setIsAnimating(false);
    }
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;

    (async () => {
      // Load all icon textures before building the scene
      const textures = await loadAllIconTextures();
      if (cancelled || !mountRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf1f5f9);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
      camera.position.set(18, 15, 20);
      cameraRef.current = camera;
      sceneRef.current = scene;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 4;
      controls.maxDistance = 10000;
      controlsRef.current = controls;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2.2));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
      keyLight.position.set(10, 25, 14);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const graphGroup = new THREE.Group();
      graphGroupRef.current = graphGroup;
      scene.add(graphGroup);

      // Separate group for flow animation particles
      const animGroup = new THREE.Group();
      animGroupRef.current = animGroup;
      scene.add(animGroup);

      const rawPositions = nodes.map((node) => ({
        node,
        x: numberValue(node.position?.x),
        y: numberValue(node.position?.y),
        elevation: numberValue(node.data?.elevation ?? node.data?.reservoirElevation),
      }));
      const centerX = rawPositions.reduce((sum, item) => sum + item.x, 0) / Math.max(rawPositions.length, 1);
      const centerY = rawPositions.reduce((sum, item) => sum + item.y, 0) / Math.max(rawPositions.length, 1);
      const centerElevation =
        rawPositions.reduce((sum, item) => sum + item.elevation, 0) / Math.max(rawPositions.length, 1);
      const graphScale = 0.055;
      const elevationScale = 0.035;
      const modelPositions = new Map<string, THREE.Vector3>();

      rawPositions.forEach(({ node, x, y, elevation }) => {
        const position = new THREE.Vector3(
          (x - centerX) * graphScale,
          (elevation - centerElevation) * elevationScale,
          -(y - centerY) * graphScale,
        );
        modelPositions.set(node.id, position);
        addNodeModel(node, position, graphGroup, textures);
      });

      let pipeCount = 0;
      const flowEdges: FlowEdgeData[] = [];
      edges.forEach((edge) => {
        // Stringify IDs to handle old files where source/target are numbers
        const source = modelPositions.get(String(edge.source));
        const target = modelPositions.get(String(edge.target));
        if (source && target) {
          addPipeModel(edge, source, target, graphGroup);
          // Add inline element ball for pump / checkValve edges
          if (INLINE_ELEMENT_TYPES.has((edge.data?.type as string) ?? "")) {
            addInlineElementBall(edge, source, target, graphGroup, textures);
          }
          const dir = new THREE.Vector3().subVectors(target, source);
          const len = dir.length();
          if (len > 0.001) {
            flowEdges.push({
              source: source.clone(),
              target: target.clone(),
              direction: dir.normalize(),
              length: len,
              particles: [],
            });
          }
          pipeCount += 1;
        }
      });
      flowEdgesRef.current = flowEdges;
      setModelStats({ nodes: nodes.length, pipes: pipeCount });

      const extents = rawPositions.reduce(
        (largest, item) => Math.max(largest, Math.abs(item.x - centerX), Math.abs(item.y - centerY)),
        8,
      ) * graphScale;
      const bounds = new THREE.Box3().setFromPoints(Array.from(modelPositions.values()));
      const bSphere = bounds.getBoundingSphere(new THREE.Sphere());
      const modelCenter = bSphere.center.clone();
      const fitDistance = Math.max(18, bSphere.radius * 2.8);
      const fitPosition = modelCenter.clone().add(new THREE.Vector3(1, 0.78, 1).normalize().multiplyScalar(fitDistance));
      camera.far = Math.max(1000, bSphere.radius * 30);
      camera.updateProjectionMatrix();
      cameraFitRef.current = { center: modelCenter, position: fitPosition, distance: fitDistance };
      camera.position.copy(fitPosition);
      controls.target.copy(modelCenter);
      controls.maxDistance = Math.max(1000, bSphere.radius * 30);
      controls.update();

      const gridSize = Math.max(30, Math.min(100, extents * 4));
      const grid = new THREE.GridHelper(gridSize, Math.round(gridSize / 2), 0x94a3b8, 0xcbd5e1);
      grid.position.y = -Math.max(2.5, extents * 0.3);
      scene.add(grid);
      gridRef.current = grid;

      const axes = new THREE.AxesHelper(Math.max(3, extents * 0.35));
      scene.add(axes);
      axesRef.current = axes;

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(gridSize, gridSize),
        new THREE.ShadowMaterial({ opacity: 0.12 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = grid.position.y - 0.02;
      ground.receiveShadow = true;
      scene.add(ground);
      groundRef.current = ground;

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer!.setSize(width, height, false);
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);

      const pickObject = (event: MouseEvent | PointerEvent) => {
        const rect = renderer!.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = raycasterRef.current;
        raycaster.setFromCamera(pointer, camera);
        const intersections = raycaster.intersectObjects(graphGroup.children, true);
        return getPickRoot(intersections[0]?.object);
      };

      const onPointerDown = (event: PointerEvent) => {
        pointerDownRef.current = { x: event.clientX, y: event.clientY };
      };

      const onPointerMove = (event: PointerEvent) => {
        const object = pickObject(event);
        if (object !== hoveredObjectRef.current) {
          setHighlight(hoveredObjectRef.current, false, hoveredObjectRef.current?.userData.elementId === selectedElementIdRef.current);
          hoveredObjectRef.current = object;
          setHighlight(object, true, object?.userData.elementId === selectedElementIdRef.current);
        }
        if (object && showHoverData) {
          setHovered({
            label: String(object.userData.label || object.userData.elementId),
            type: String(object.userData.type || "element"),
            data: (object.userData.data || {}) as Record<string, unknown>,
            x: event.clientX,
            y: event.clientY,
          });
        } else {
          setHovered(null);
        }
      };

      const onPointerLeave = () => {
        setHighlight(hoveredObjectRef.current, false, hoveredObjectRef.current?.userData.elementId === selectedElementIdRef.current);
        hoveredObjectRef.current = undefined;
        setHovered(null);
      };

      const onClick = (event: MouseEvent) => {
        const distance = Math.hypot(
          event.clientX - pointerDownRef.current.x,
          event.clientY - pointerDownRef.current.y,
        );
        if (distance > 5) return;
        const object = pickObject(event);
        if (object?.userData.elementId) {
          selectElement(object.userData.elementId, object.userData.elementType);
        } else {
          selectElement(null, null);
        }
      };

      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerleave", onPointerLeave);
      renderer.domElement.addEventListener("click", onClick);

      // Animation SPEED: each particle crosses its pipe in ~2.5 s regardless of pipe length
      const FLOW_SPEED = 2.2;
      let lastTime = performance.now();

      const animate = () => {
        if (cancelled) return;
        frame = requestAnimationFrame(animate);
        controls.update();

        // Update flow particles
        if (isAnimatingRef.current) {
          const now = performance.now();
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;
          animTimeRef.current += dt;
          const T = animTimeRef.current;

          flowEdgesRef.current.forEach((edgeData) => {
            edgeData.particles.forEach((particle, idx) => {
              const offset = idx / PARTICLE_COUNT;
              const t = ((T * FLOW_SPEED / Math.max(edgeData.length, 0.1)) + offset) % 1;
              particle.position.lerpVectors(edgeData.source, edgeData.target, t);

              // Strong pulsing scale — orb breathes noticeably
              const pulse = 0.85 + 0.25 * Math.sin(T * 8 + idx * 1.8);
              particle.scale.setScalar(pulse);
            });
          });
        } else {
          lastTime = performance.now();
        }

        renderer!.render(scene, camera);
      };
      animate();

      // Cleanup captured in outer scope via refs, executed by return below
      (mountRef as any)._cleanup = () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        renderer!.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer!.domElement.removeEventListener("pointermove", onPointerMove);
        renderer!.domElement.removeEventListener("pointerleave", onPointerLeave);
        renderer!.domElement.removeEventListener("click", onClick);
        controls.dispose();
        renderer!.dispose();
        graphGroup.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
            else object.material.dispose();
          }
        });
        if (mount.contains(renderer!.domElement)) mount.removeChild(renderer!.domElement);
        sceneRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
        graphGroupRef.current = null;
        animGroupRef.current = null;
        isAnimatingRef.current = false;
      };
    })();

    return () => {
      cancelled = true;
      const cleanup = (mountRef as any)._cleanup;
      if (cleanup) {
        cleanup();
        delete (mountRef as any)._cleanup;
      } else {
        // Texture loading still in-flight; just cancel
      }
    };
  }, [edges, nodes, selectElement, showHoverData]);

  useEffect(() => {
    const group = graphGroupRef.current;
    if (!group) return;
    group.traverse((object) => {
      if (object.userData.elementId) {
        setHighlight(object, false, object.userData.elementId === selectedElementId);
      }
    });
  }, [selectedElementId]);

  return (
    <div className={`absolute inset-0 z-[40] flex flex-col bg-slate-950 ${className}`}>
      <header className="flex items-center gap-3 border-b border-slate-700 bg-slate-900 px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="text-sm font-semibold">3D Network Visualization</h2>
            <p className="text-[11px] text-slate-400">
              {projectName || "Current WHAMO network"} · live hydraulic model
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-md bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-300 sm:inline-flex">
            {modelStats.nodes} components · {modelStats.pipes} links
          </span>

          {/* Flow animation toggle */}
          <button
            type="button"
            onClick={toggleAnimation}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isAnimating
                ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {isAnimating ? (
              <>
                <Square className="h-3.5 w-3.5" />
                Stop flow
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Animate flow
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowHoverData(!showHoverData)}
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            {showHoverData ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showHoverData ? "Labels on" : "Labels off"}
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${showGrid ? "bg-slate-600 text-slate-100 hover:bg-slate-500" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {showGrid ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Grid
          </button>
          <button
            type="button"
            onClick={() => setShowAxes(!showAxes)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${showAxes ? "bg-slate-600 text-slate-100 hover:bg-slate-500" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            {showAxes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Axes
          </button>
          <button
            type="button"
            onClick={resetCamera}
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset view
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={mountRef} className="absolute inset-0" />

        {/* Hover tooltip */}
        {hovered && showHoverData && (
          <div
            className="pointer-events-none fixed z-[80] min-w-[150px] max-w-[260px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm"
            style={{
              left: Math.min(hovered.x + 14, window.innerWidth - 280),
              top: Math.min(hovered.y + 14, window.innerHeight - 100),
            }}
          >
            <div className="font-bold text-slate-900">{hovered.label}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {NODE_LABELS[hovered.type] || hovered.type}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <DataList
                data={hovered.data}
                title={`${NODE_LABELS[hovered.type] || hovered.type} Properties`}
              />
            </div>
            <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
              Click to open editable properties
            </div>
          </div>
        )}

        {/* Animation legend */}
        {isAnimating && (
          <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-slate-900/90 px-3 py-2 text-[11px] text-cyan-300 shadow-lg backdrop-blur-sm">
            <span
              className="inline-block h-2 w-2 rounded-full bg-cyan-400"
              style={{ animation: "pulse 1s infinite" }}
            />
            Flow direction animation active
          </div>
        )}

        {/* Navigate hint */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-700/80 bg-slate-900/85 p-3 text-[11px] text-slate-200 shadow-lg backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-white">
            <Crosshair className="h-3.5 w-3.5 text-cyan-300" />
            Navigate model
          </div>
          <p className="text-slate-400">Drag to orbit · Shift-drag to pan</p>
          <p className="mt-1 flex items-center gap-1 text-slate-400">
            <ZoomIn className="h-3 w-3" /> Scroll to zoom
          </p>
        </div>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-slate-700/80 bg-slate-900/85 p-3 text-[10px] text-slate-300 shadow-lg backdrop-blur-sm sm:grid-cols-4">
          {Object.entries(NODE_LABELS).map(([type, label]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `#${(NODE_COLORS[type] ?? 0x475569).toString(16).padStart(6, "0")}` }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
