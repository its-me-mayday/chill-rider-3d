import * as THREE from 'three';

export class Bicycle {
  constructor(scene, curve) {
    this.scene = scene;
    this.curve = curve;
    this.mesh = new THREE.Group();
    
    // MATERIALI
    this.frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    this.clothMat = new THREE.MeshStandardMaterial({ color: 0x4466aa });
    this.accentMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });

    this.pedalAngle = 0;
    this.buildBicycle();
    this.buildRider();
    
    // FISICA SU BINARI
    this.progress = 0; // Da 0 a 1 lungo la curva
    this.laneOffset = 0; // Spostamento laterale (-4 a 4)
    this.speed = 0;
    this.maxSpeed = 0.02; // Velocità in termini di progresso curva
    this.acceleration = 0.0002;
    this.friction = 0.98;
    this.laneSpeed = 5; // Velocità di cambio corsia

    this.scene.add(this.mesh);

    this.keys = { forward: false, backward: false, left: false, right: false, space: false };
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  buildBicycle() {
    const createWheel = (pos) => {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 12, 24), this.tireMat));
      for (let i = 0; i < 8; i++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.6), this.frameMat);
        spoke.rotation.z = (i / 8) * Math.PI;
        group.add(spoke);
      }
      group.position.set(pos.x, pos.y, pos.z);
      return group;
    };
    this.wheelF = createWheel({ x: 0, y: 0.8, z: 1.4 });
    this.wheelB = createWheel({ x: 0, y: 0.8, z: -1.4 });
    this.mesh.add(this.wheelF); this.mesh.add(this.wheelB);

    const frame = new THREE.Group();
    const pipe = (h, rot, pos) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h), this.frameMat);
      m.rotation.x = rot.x; m.position.set(pos.x, pos.y, pos.z);
      frame.add(m);
    };
    pipe(1.8, { x: Math.PI/2.4 }, { x: 0, y: 1.2, z: 0.4 });
    pipe(1.6, { x: -Math.PI/2.5 }, { x: 0, y: 1.2, z: -0.6 });
    pipe(1.4, { x: Math.PI/2 }, { x: 0, y: 1.7, z: -0.1 });
    this.mesh.add(frame);

    this.pedals = new THREE.Group();
    this.pedals.position.set(0, 0.8, -0.4);
    this.mesh.add(this.pedals);
    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.15), this.frameMat);
    pL.position.x = -0.4; this.pedals.add(pL);
    const pR = pL.clone(); pR.position.x = 0.4; this.pedals.add(pR);

    const handlebars = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), this.frameMat);
    handlebars.rotation.z = Math.PI/2; handlebars.position.set(0, 2.3, 0.9);
    this.mesh.add(handlebars);
  }

  buildRider() {
    this.rider = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.4), this.clothMat);
    torso.position.set(0, 2.6, -0.5); torso.rotation.x = 0.3;
    this.rider.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), this.skinMat);
    head.position.set(0, 3.3, -0.2); this.rider.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), this.accentMat);
    cap.position.set(0, 3.5, -0.2); this.rider.add(cap);

    this.legL = new THREE.Group(); this.legL.position.set(-0.25, 2.2, -0.6);
    this.legL.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), this.clothMat));
    this.rider.add(this.legL);
    this.legR = this.legL.clone(); this.legR.position.x = 0.25;
    this.rider.add(this.legR);
    this.mesh.add(this.rider);
  }

  handleKey(e, isDown) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = isDown; break;
      case 'KeyS': this.keys.backward = isDown; break;
      case 'KeyA': this.keys.left = isDown; break;
      case 'KeyD': this.keys.right = isDown; break;
      case 'Space': this.keys.space = isDown; break;
    }
  }

  update(delta) {
    if (!this.curve) return;

    // ACCELERAZIONE LUNGO IL PROGRESSO
    if (this.keys.forward) this.speed += this.acceleration * delta * 60;
    if (this.keys.backward) this.speed -= this.acceleration * 0.5 * delta * 60;
    if (this.keys.space) this.speed *= 0.9;
    
    this.speed *= this.friction;
    this.speed = THREE.MathUtils.clamp(this.speed, -0.002, this.maxSpeed);

    this.progress += this.speed * delta * 60;
    if (this.progress > 1) this.progress -= 1;
    if (this.progress < 0) this.progress += 1;

    // SPOSTAMENTO LATERALE (LANE OFFSET)
    const targetLane = (this.keys.left ? 4 : 0) + (this.keys.right ? -4 : 0);
    this.laneOffset = THREE.MathUtils.lerp(this.laneOffset, targetLane, 0.05 * delta * 60);

    // POSIZIONAMENTO SULLA CURVA
    const pos = this.curve.getPointAt(this.progress);
    const tangent = this.curve.getTangentAt(this.progress).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Applichiamo la posizione + l'offset laterale
    this.mesh.position.set(
      pos.x + normal.x * this.laneOffset,
      0.1,
      pos.z + normal.z * this.laneOffset
    );

    // ORIENTAMENTO
    this.mesh.lookAt(pos.clone().add(tangent));
    
    // Inclinazione estetica basata su curva e sterzata
    const turnIntensity = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
    this.mesh.rotation.z = -turnIntensity * 0.2 - (this.speed * 50 * Math.sin(this.progress * Math.PI * 4) * 0.1);

    // ANIMAZIONI
    const animSpeed = this.speed * 5000 * delta;
    this.wheelF.rotation.x += animSpeed;
    this.wheelB.rotation.x += animSpeed;
    this.pedalAngle += animSpeed * 2.5;
    this.pedals.rotation.x = this.pedalAngle;
    this.legL.rotation.x = Math.sin(this.pedalAngle) * 0.5;
    this.legR.rotation.x = Math.sin(this.pedalAngle + Math.PI) * 0.5;

    const speedEl = document.getElementById('speed');
    if (speedEl) speedEl.innerText = Math.round(this.speed * 2000);
  }
}
