import * as THREE from 'three';

export class Car {
  constructor(scene, curve) {
    this.scene = scene;
    this.curve = curve;
    this.mesh = new THREE.Group();
    
    // MATERIALI
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6666, metalness: 0.5, roughness: 0.2 });
    this.wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    this.glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
    this.lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.brakeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    this.buildCar();
    
    // FISICA SU BINARI
    this.progress = 0;
    this.laneOffset = 0; 
    this.speed = 0;
    this.maxSpeed = 0.08; // Leggermente più veloce della bici
    this.acceleration = 0.015; 
    this.friction = 0.97;
    
    this.scene.add(this.mesh);

    this.keys = { forward: false, backward: false, left: false, right: false, space: false };
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  buildCar() {
    // Carrozzeria
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 4), this.bodyMat);
    body.position.y = 0.8;
    this.mesh.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2), this.bodyMat);
    cabin.position.set(0, 1.6, -0.2);
    this.mesh.add(cabin);

    // Parabrezza
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), this.glassMat);
    glass.position.set(0, 1.6, 0.8);
    this.mesh.add(glass);

    // Fari anteriori
    const headlightGeo = new THREE.SphereGeometry(0.2, 16, 12);
    const lightL = new THREE.Mesh(headlightGeo, this.lightMat);
    lightL.position.set(-0.8, 0.8, 2.0);
    this.mesh.add(lightL);
    const lightR = lightL.clone(); lightR.position.x = 0.8;
    this.mesh.add(lightR);

    // Luci posteriori (Stop)
    this.brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), this.brakeMat);
    this.brakeL.position.set(-0.8, 0.8, -2.0);
    this.mesh.add(this.brakeL);
    this.brakeR = this.brakeL.clone(); this.brakeR.position.x = 0.8;
    this.mesh.add(this.brakeR);

    // RUOTE
    this.wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const createWheel = (x, z, isFront) => {
      const group = new THREE.Group();
      const wheel = new THREE.Mesh(wheelGeo, this.wheelMat);
      group.add(wheel);
      group.position.set(x, 0.5, z);
      this.mesh.add(group);
      return { group, wheel, isFront };
    };

    this.wheels.push(createWheel(-1.3, 1.4, true)); // Front L
    this.wheels.push(createWheel(1.3, 1.4, true));  // Front R
    this.wheels.push(createWheel(-1.3, -1.4, false)); // Back L
    this.wheels.push(createWheel(1.3, -1.4, false));  // Back R
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

    if (this.keys.forward) this.speed += this.acceleration * delta;
    if (this.keys.backward) this.speed -= this.acceleration * 0.5 * delta;
    if (this.keys.space) this.speed *= 0.92;
    this.speed *= this.friction;
    this.speed = THREE.MathUtils.clamp(this.speed, -0.005, this.maxSpeed);

    this.progress += this.speed * delta;
    if (this.progress > 1) this.progress -= 1;
    if (this.progress < 0) this.progress += 1;

    const targetLane = (this.keys.left ? 4 : 0) + (this.keys.right ? -4 : 0);
    this.laneOffset = THREE.MathUtils.lerp(this.laneOffset, targetLane, 2 * delta);

    // POSIZIONAMENTO
    const pos = this.curve.getPointAt(this.progress);
    const tangent = this.curve.getTangentAt(this.progress).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    this.mesh.position.set(pos.x + normal.x * this.laneOffset, 0.1, pos.z + normal.z * this.laneOffset);
    this.mesh.lookAt(pos.clone().add(tangent));
    
    // Inclinazione sospensioni (Roll)
    const turnIntensity = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -turnIntensity * 0.1, 0.1);

    // Animazioni Ruote
    const wheelRot = this.speed * 400;
    const steerAngle = turnIntensity * 0.4;
    
    this.wheels.forEach(w => {
      w.wheel.rotation.x += wheelRot;
      if (w.isFront) {
        w.group.rotation.y = THREE.MathUtils.lerp(w.group.rotation.y, steerAngle, 0.1);
      }
    });

    // Feedback Stop
    this.brakeL.material.emissiveIntensity = this.keys.space ? 2 : 0;
    this.brakeR.material.emissiveIntensity = this.keys.space ? 2 : 0;

    const speedEl = document.getElementById('speed');
    if (speedEl) speedEl.innerText = Math.round(this.speed * 2000);
  }
}
