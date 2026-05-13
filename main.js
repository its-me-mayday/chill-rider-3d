import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { setupWorld } from './world.js';
import { Bicycle } from './bicycle.js';

// 1. SCENE SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('app').appendChild(renderer.domElement);

// 2. POST PROCESSING (Per il bagliore del tramonto)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
composer.addPass(bloomPass);

// 3. GAME OBJECTS
const world = setupWorld(scene);
const bike = new Bicycle(scene);

// 4. LOFI RADIO (Audio Context)
let audioCtx = null;
let isRadioOn = false;
const radioBtn = document.getElementById('lofi-radio');

radioBtn.addEventListener('click', () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  isRadioOn = !isRadioOn;
  radioBtn.innerText = isRadioOn ? '🎵 RADIO: CHILL BEATS (ON)' : '🎵 RADIO: CHILL BEATS (OFF)';
  
  if (isRadioOn) {
    audioCtx.resume();
    // Qui si potrebbe aggiungere un loop audio vero, 
    // per ora simuliamo lo stato attivo.
  }
});

// 5. ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  bike.update(delta);

  // CAMERA FOLLOW (Smooth)
  const bikePos = bike.mesh.position;
  const targetCamPos = new THREE.Vector3(0, 5, -12);
  targetCamPos.applyQuaternion(bike.mesh.quaternion);
  targetCamPos.add(bikePos);
  
  camera.position.lerp(targetCamPos, 0.05);
  camera.lookAt(bikePos.x, bikePos.y + 2, bikePos.z + 5);

  // INFINITE WORLD (Riposizionamento strada e alberi)
  world.roadTex.offset.y -= (bike.speed * delta * 0.02);
  
  world.trees.forEach(tree => {
    if (bikePos.distanceTo(tree.position) > 200 && tree.position.z < bikePos.z - 20) {
      tree.position.z = bikePos.z + 200 + Math.random() * 100;
    }
  });

  // Movimento sole per atmosfera dinamica
  world.sun.position.x = Math.sin(Date.now() * 0.0001) * 10;

  composer.render();
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
