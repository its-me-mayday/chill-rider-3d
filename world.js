import * as THREE from 'three';

export function setupWorld(scene) {
  // 1. ATMOSFERA
  scene.background = new THREE.Color(0xffaa88);
  scene.fog = new THREE.Fog(0xffaa88, 50, 600);

  // 2. LUCI
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffcc88, 1.2);
  sunLight.position.set(50, 20, 500);
  scene.add(sunLight);

  // 3. IL SOLE
  const sunGeo = new THREE.CircleGeometry(60, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.9 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(0, 30, 800); // Messo in fondo alla strada
  scene.add(sun);

  // 4. GENERAZIONE CURVA DELLA STRADA
  const points = [];
  for (let i = 0; i < 100; i++) {
    points.push(new THREE.Vector3(
      Math.sin(i * 0.2) * 15, // Curva sinusoidale (X)
      0,
      i * 20 // Distanza (Z)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);

  // 5. GEOMETRIA STRADA (Tube / Extrude)
  const roadWidth = 10;
  const roadGeo = new THREE.PlaneGeometry(roadWidth, 2000, 1, 200);
  
  // Modifichiamo i vertici della PlaneGeometry per seguire la curva
  const vertices = roadGeo.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const z = vertices[i + 1] + 1000; // Offset per centrare
    const xOffset = vertices[i]; // -5 o 5
    const curvePoint = curve.getPointAt(z / 2000);
    const tangent = curve.getTangentAt(z / 2000);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    vertices[i] = curvePoint.x + normal.x * xOffset;
    vertices[i+1] = 0.05; // Altezza strada
    vertices[i+2] = curvePoint.z;
  }
  roadGeo.computeVertexNormals();

  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 128; roadCanvas.height = 512;
  const ctx = roadCanvas.getContext('2d');
  ctx.fillStyle = '#332211'; ctx.fillRect(0, 0, 128, 512);
  ctx.strokeStyle = '#ffcc88'; ctx.lineWidth = 6;
  ctx.setLineDash([40, 60]);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 512); ctx.stroke();
  const roadTex = new THREE.CanvasTexture(roadCanvas);
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 40);

  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  scene.add(road);

  // 6. TERRENO (Erba/Terra)
  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, roughness: 1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  // 7. DECORAZIONI LUNGO LA CURVA
  const trees = [];
  const treeGeo = new THREE.ConeGeometry(2, 6, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.4, 2);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xcc6644 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x442211 });

  for (let i = 0; i < 150; i++) {
    const t = i / 150;
    const curvePoint = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    const treeGroup = new THREE.Group();
    treeGroup.add(new THREE.Mesh(treeGeo, treeMat));
    const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.y = -2.5;
    treeGroup.add(trunk);
    treeGroup.position.y = 3;

    const side = Math.random() > 0.5 ? 1 : -1;
    const distFromRoad = 12 + Math.random() * 30;
    treeGroup.position.x = curvePoint.x + normal.x * side * distFromRoad;
    treeGroup.position.z = curvePoint.z + normal.z * side * distFromRoad;
    treeGroup.scale.setScalar(0.8 + Math.random() * 1.5);
    scene.add(treeGroup);
    trees.push(treeGroup);
  }

  return { road, roadTex, trees, sun, curve };
}
