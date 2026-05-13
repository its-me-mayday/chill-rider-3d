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

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85));

// 2. GAME OBJECTS
const world = setupWorld(scene);
const bike = new Bicycle(scene);

// 3. LOFI SYNTHESIZER (Web Audio API)
let audioCtx = null;
let isRadioOn = false;
let lofiInterval = null;
const radioBtn = document.getElementById('lofi-radio');

function playLofiBeat() {
  if (!audioCtx) return;
  const time = audioCtx.currentTime;
  
  // RUMORE VINILE / PIOGGIA (Hiss)
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 0.02; }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer; noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 1000;
  noise.connect(filter); filter.connect(audioCtx.destination);
  noise.start();

  // ACCORDI CHILL (Sintetizzati)
  const playChord = (freqs, startTime) => {
    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 4);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(startTime); osc.stop(startTime + 4);
    });
  };

  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [349.23, 440.00, 523.25, 659.25], // Fmaj7
    [293.66, 349.23, 440.00, 587.33]  // Dm7
  ];

  let step = 0;
  lofiInterval = setInterval(() => {
    if (!isRadioOn) return;
    const now = audioCtx.currentTime;
    if (step % 16 === 0) playChord(chords[Math.floor(Math.random() * chords.length)], now);
    
    // Kick & Snare (Semplificati)
    if (step % 8 === 0) { // Kick
      const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
      osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(g); g.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.1);
    }
    step++;
  }, 500);

  return noise;
}

let noiseSource = null;
radioBtn.addEventListener('click', () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  isRadioOn = !isRadioOn;
  radioBtn.innerText = isRadioOn ? '🎵 RADIO: CHILL BEATS (ON)' : '🎵 RADIO: CHILL BEATS (OFF)';
  
  if (isRadioOn) {
    audioCtx.resume();
    noiseSource = playLofiBeat();
  } else {
    if (noiseSource) noiseSource.stop();
    if (lofiInterval) clearInterval(lofiInterval);
  }
});

// 4. ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  bike.update(delta);

  // CAMERA FOLLOW (Smooth)
  const bikePos = bike.mesh.position;
  const targetCamPos = new THREE.Vector3(0, 5, -12).applyQuaternion(bike.mesh.quaternion).add(bikePos);
  camera.position.lerp(targetCamPos, 0.05);
  camera.lookAt(bikePos.x, bikePos.y + 2, bikePos.z + 5);

  // WORLD SYNC
  world.roadTex.offset.y -= (bike.speed * delta * 0.02);

  composer.render();
}

animate();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
});
