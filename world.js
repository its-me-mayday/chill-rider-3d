import * as THREE from 'three';

export function setupWorld(scene) {
  // 1. NEBBIA E SFONDO (Atmosfera Sunset)
  scene.background = new THREE.Color(0xffaa88);
  scene.fog = new THREE.Fog(0xffaa88, 50, 400);

  // 2. ILLUMINAZIONE
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffcc88, 1.2);
  sunLight.position.set(50, 20, -100);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // 3. IL SOLE (Un grande cerchio luminoso)
  const sunGeo = new THREE.CircleGeometry(40, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.8 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(0, 40, -500);
  scene.add(sun);

  // 4. TERRENO E STRADA
  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, roughness: 1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Strada (Texture procedurale)
  const roadGeo = new THREE.PlaneGeometry(12, 1000);
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 128; roadCanvas.height = 512;
  const ctx = roadCanvas.getContext('2d');
  ctx.fillStyle = '#443322'; ctx.fillRect(0, 0, 128, 512);
  ctx.strokeStyle = '#ffcc88'; ctx.lineWidth = 4;
  ctx.setLineDash([40, 40]);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 512); ctx.stroke();
  const roadTex = new THREE.CanvasTexture(roadCanvas);
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 20);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.05;
  scene.add(road);

  // 5. DECORAZIONI (Alberi e Lampioni)
  const trees = [];
  const treeGeo = new THREE.ConeGeometry(2, 6, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.4, 2);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xcc6644 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x442211 });

  for (let i = 0; i < 50; i++) {
    const treeGroup = new THREE.Group();
    const leaf = new THREE.Mesh(treeGeo, treeMat);
    leaf.position.y = 4;
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    treeGroup.add(leaf); treeGroup.add(trunk);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    treeGroup.position.set(side * (12 + Math.random() * 20), 0, -Math.random() * 800);
    treeGroup.scale.setScalar(0.8 + Math.random() * 1);
    scene.add(treeGroup);
    trees.push(treeGroup);
  }

  return { road, roadTex, trees, sun };
}
