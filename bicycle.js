import * as THREE from 'three';

export class Bicycle {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    
    // MATERIALI
    this.frameMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8, roughness: 0.2 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    this.clothMat = new THREE.MeshStandardMaterial({ color: 0x4466aa });

    this.buildBicycle();
    this.buildRider();
    
    this.mesh.position.y = 0.05;
    this.scene.add(this.mesh);

    // FISICA
    this.speed = 0;
    this.maxSpeed = 25;
    this.acceleration = 0.2;
    this.friction = 0.98;
    this.turnSpeed = 0.03;
    this.leanAmount = 0;

    // INPUT
    this.keys = { forward: false, backward: false, left: false, right: false, space: false };
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  buildBicycle() {
    // Ruote
    const wheelGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
    this.wheelF = new THREE.Mesh(wheelGeo, this.tireMat);
    this.wheelF.position.set(0, 0.8, 1.2);
    this.mesh.add(this.wheelF);

    this.wheelB = new THREE.Mesh(wheelGeo, this.tireMat);
    this.wheelB.position.set(0, 0.8, -1.2);
    this.mesh.add(this.wheelB);

    // Telaio (Semplificato)
    const frameGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.4);
    const frameMain = new THREE.Mesh(frameGeo, this.frameMat);
    frameMain.rotation.x = Math.PI / 2;
    frameMain.position.y = 1.0;
    this.mesh.add(frameMain);

    const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), this.frameMat);
    seatPost.position.set(0, 1.4, -0.4);
    seatPost.rotation.x = -0.2;
    this.mesh.add(seatPost);

    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.5), this.tireMat);
    saddle.position.set(0, 1.8, -0.5);
    this.mesh.add(saddle);

    // Manubrio
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), this.frameMat);
    handlebar.position.set(0, 2.0, 1.0);
    this.mesh.add(handlebar);
  }

  buildRider() {
    this.rider = new THREE.Group();
    
    // Tronco
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), this.clothMat);
    body.position.set(0, 2.4, -0.3);
    body.rotation.x = 0.2;
    this.rider.add(body);

    // Testa
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), this.skinMat);
    head.position.set(0, 3.0, -0.1);
    this.rider.add(head);

    // Braccia
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
    const armL = new THREE.Mesh(armGeo, this.skinMat);
    armL.position.set(-0.4, 2.6, 0.4);
    armL.rotation.z = Math.PI / 2; armL.rotation.y = 0.5;
    this.rider.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.4; armR.rotation.y = -0.5;
    this.rider.add(armR);

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
    // Accelerazione
    if (this.keys.forward) this.speed += this.acceleration;
    if (this.keys.backward) this.speed -= this.acceleration * 0.5;
    if (this.keys.space) this.speed *= 0.9; // Freno

    this.speed *= this.friction;
    this.speed = THREE.MathUtils.clamp(this.speed, -5, this.maxSpeed);

    // Sterzo
    if (Math.abs(this.speed) > 0.1) {
      const turnDir = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
      this.mesh.rotation.y += turnDir * this.turnSpeed * (this.speed / 10);
      
      // Lean (Inclinazione)
      const targetLean = turnDir * 0.3 * (this.speed / 20);
      this.leanAmount = THREE.MathUtils.lerp(this.leanAmount, targetLean, 0.1);
      this.mesh.rotation.z = -this.leanAmount;
    }

    // Movimento avanti
    this.mesh.translateX(0);
    this.mesh.translateZ(this.speed * delta);

    // Animazione ruote
    const rotationAmount = (this.speed * delta) / 0.8;
    this.wheelF.rotation.x += rotationAmount;
    this.wheelB.rotation.x += rotationAmount;

    // UI Speed
    const speedEl = document.getElementById('speed');
    if (speedEl) speedEl.innerText = Math.abs(Math.round(this.speed));
  }
}
