import * as THREE from 'three';

export function setupWorld(scene) {
  // 1. ATMOSFERA
  scene.background = new THREE.Color(0xffaa88);
  scene.fog = new THREE.Fog(0xffaa88, 50, 800);

  // 2. LUCI
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sunLight = new THREE.DirectionalLight(0xffcc88, 1.0);
  sunLight.position.set(0, 100, 0);
  scene.add(sunLight);

  // 3. IL SOLE
  const sunGeo = new THREE.CircleGeometry(100, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.8 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(0, 40, -1200);
  scene.add(sun);

  // 4. GENERAZIONE PERCORSO CIRCOLARE (Anello naturale)
  const points = [];
  const radius = 400;
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const r = radius + Math.sin(i * 1.8) * 60;
    points.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(points, true);

  // 5. SENTIERO (Cobblestone / Path Style)
  const roadWidth = 10;
  const tubeGeo = new THREE.TubeGeometry(curve, 300, roadWidth / 2, 8, true);
  const posAttr = tubeGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    if (y < 0) posAttr.setY(i, 0.05);
    else posAttr.setY(i, 0.1);
  }

  const pathCanvas = document.createElement('canvas');
  pathCanvas.width = 256; pathCanvas.height = 256;
  const ctx = pathCanvas.getContext('2d');
  ctx.fillStyle = '#554433'; ctx.fillRect(0, 0, 256, 256);
  // Pietre del sentiero
  ctx.fillStyle = '#665544';
  for(let i=0; i<50; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*256, Math.random()*256, 10+Math.random()*20, 0, Math.PI*2);
    ctx.fill();
  }
  const roadTex = new THREE.CanvasTexture(pathCanvas);
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 150);

  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 1 });
  const road = new THREE.Mesh(tubeGeo, roadMat);
  scene.add(road);

  // 6. LAMPIONI LUNGO LA STRADA
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 8);
  const lampHeadGeo = new THREE.SphereGeometry(0.4, 16, 12);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    const lamp = new THREE.Group();
    lamp.add(new THREE.Mesh(lampGeo, lampMat));
    const head = new THREE.Mesh(lampHeadGeo, lightMat);
    head.position.y = 4;
    lamp.add(head);
    
    // Luce puntiforme reale per l'effetto
    const pointLight = new THREE.PointLight(0xffaa00, 20, 40);
    pointLight.position.y = 4;
    lamp.add(pointLight);

    lamp.position.set(p.x + normal.x * 8, 4, p.z + normal.z * 8);
    scene.add(lamp);
  }

  // 7. ALBERI E DETTAGLI
  const trees = [];
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xcc6644 });
  for (let i = 0; i < 400; i++) {
    const t = i / 400;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const treeGroup = new THREE.Group();
    treeGroup.add(new THREE.Mesh(new THREE.ConeGeometry(2.5, 8, 6), treeMat));
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 18 + Math.random() * 60;
    treeGroup.position.set(p.x + normal.x * side * dist, 4, p.z + normal.z * side * dist);
    treeGroup.scale.setScalar(0.6 + Math.random() * 2);
    scene.add(treeGroup);
    trees.push(treeGroup);
  }

  return { road, roadTex, trees, sun, curve };
}
