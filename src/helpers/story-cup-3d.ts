import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const WIDTH = 700;
const HEIGHT = 949;
const SEGMENTS = 96;

const bodyRadius = (y: number) => 0.62 + (y + 1.12) * (0.25 / 2.12);

function lathe(points: Array<[number, number]>, material: THREE.Material) {
  return new THREE.Mesh(
    new THREE.LatheGeometry(
      points.map(([x, y]) => new THREE.Vector2(x, y)),
      SEGMENTS,
      Math.PI
    ),
    material
  );
}

function sleeveTexture(logo: HTMLImageElement | null, initial: string, sleeveColor: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 380;
  const g = canvas.getContext("2d")!;
  g.fillStyle = sleeveColor;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.globalAlpha = 0.06;
  g.fillStyle = "#000";
  for (let x = 0; x < canvas.width; x += 22) g.fillRect(x, 0, 3, canvas.height);
  g.globalAlpha = 1;

  const cx = 1024;
  const cy = 190;
  const r = 150;
  g.beginPath();
  g.arc(cx, cy, r + 12, 0, Math.PI * 2);
  g.fillStyle = "#fff";
  g.fill();
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();
  if (logo) {
    const scale = Math.max((2 * r) / logo.naturalWidth, (2 * r) / logo.naturalHeight);
    const w = logo.naturalWidth * scale;
    const h = logo.naturalHeight * scale;
    g.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
  } else {
    g.fillStyle = "#8d0b41";
    g.font = "800 190px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(initial, cx, cy + 8);
  }
  g.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function renderStoryCup(
  logo: HTMLImageElement | null,
  initial: string,
  sleeveColor: string
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(2);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 5, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(4, 2, -3);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(26, WIDTH / HEIGHT, 0.1, 50);
  camera.position.set(0, 1.55, 6.5);
  camera.lookAt(0, 0.05, 0);

  const paper = new THREE.MeshStandardMaterial({
    color: 0xf7f5f2,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });
  const lid = new THREE.MeshPhysicalMaterial({
    color: 0x151315,
    roughness: 0.38,
    clearcoat: 0.4,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
  const texture = sleeveTexture(logo, initial, sleeveColor);
  const sleeve = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 1,
    transparent: true,
    opacity: 0.18,
  });

  const cup = new THREE.Group();
  cup.add(
    lathe(
      [
        [0, -1.2],
        [0.57, -1.2],
        [0.605, -1.18],
        [0.62, -1.12],
        [0.87, 1.0],
        [0.89, 1.02],
        [0.895, 1.05],
        [0.875, 1.07],
        [0.85, 1.06],
      ],
      paper
    )
  );

  const sleevePoints: Array<[number, number]> = [];
  for (let i = 0; i <= 24; i++) {
    const y = -0.5 + i * (0.95 / 24);
    sleevePoints.push([bodyRadius(y) + 0.024, y]);
  }
  cup.add(lathe(sleevePoints, sleeve));
  for (const y of [-0.5, 0.45]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(bodyRadius(y) + 0.012, 0.014, 8, SEGMENTS), edge);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    cup.add(ring);
  }

  cup.add(
    lathe(
      [
        [0.905, 0.95],
        [0.945, 0.97],
        [0.955, 1.06],
        [0.93, 1.11],
        [0.8, 1.13],
        [0.74, 1.27],
        [0.69, 1.3],
        [0.62, 1.29],
        [0.57, 1.23],
        [0, 1.23],
      ],
      lid
    )
  );
  const sip = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x050505 })
  );
  sip.scale.set(0.13, 0.012, 0.045);
  sip.position.set(0, 1.298, 0.655);
  cup.add(sip);

  cup.rotation.set(0, -0.28, 0.2);
  scene.add(cup);

  renderer.render(scene, camera);

  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  out.getContext("2d")!.drawImage(canvas, 0, 0);

  scene.traverse((node) => {
    if (node instanceof THREE.Mesh) node.geometry.dispose();
  });
  [paper, lid, sleeve, edge].forEach((m) => m.dispose());
  texture.dispose();
  scene.environment?.dispose();
  pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss();

  return out;
}
