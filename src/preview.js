import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js";

export function createPreview(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f18);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000);
  camera.position.set(180, 160, 180);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(120, 180, 80);
  scene.add(dir);

  let mesh = null;

  function renderLoop() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  }
  renderLoop();

  return {
    setGeometry(geometry) {
      if (mesh) scene.remove(mesh);
      const mat = new THREE.MeshStandardMaterial({ color: 0xb8c7dc, metalness: 0.1, roughness: 0.78 });
      mesh = new THREE.Mesh(geometry, mat);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      mesh.position.sub(center);
      scene.add(mesh);
    },
  };
}
