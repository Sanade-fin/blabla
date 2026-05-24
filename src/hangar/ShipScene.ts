import * as THREE from 'three';

/** 3D корабль в центре ангара с вращением и визуалом скина */
export class ShipScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private ship: THREE.Group;
  private raf = 0;
  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(0, 1.2, 5.5);
    this.camera.lookAt(0, 0, 0);

    const amb = new THREE.AmbientLight(0x4466aa, 0.6);
    const key = new THREE.DirectionalLight(0x88ccff, 1.2);
    key.position.set(4, 6, 5);
    const rim = new THREE.PointLight(0xa78bfa, 1.5, 20);
    rim.position.set(-3, 2, -2);
    this.scene.add(amb, key, rim);

    this.ship = this.buildShip();
    this.scene.add(this.ship);

    const floor = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.2, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    this.scene.add(floor);

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  private buildShip(): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.8, roughness: 0.25 }),
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);

    const wingGeo = new THREE.BoxGeometry(1.4, 0.05, 0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.4 });
    const w1 = new THREE.Mesh(wingGeo, wingMat);
    w1.position.set(0.7, 0, 0.2);
    const w2 = w1.clone();
    w2.position.x = -0.7;
    g.add(w1, w2);

    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x22d3ee, emissiveIntensity: 0.8 }),
    );
    cockpit.position.set(0, 0.15, 0.55);
    g.add(cockpit);

    g.userData.wingMat = wingMat;
    g.userData.bodyMat = body.material as THREE.MeshStandardMaterial;
    return g;
  }

  setSkin(skinId: string): void {
    const wingMat = this.ship.userData.wingMat as THREE.MeshStandardMaterial;
    const bodyMat = this.ship.userData.bodyMat as THREE.MeshStandardMaterial;
    const palettes: Record<string, { body: number; wing: number; emissive: number }> = {
      ship_default: { body: 0x1e3a5f, wing: 0x38bdf8, emissive: 0x0ea5e9 },
      ship_neon: { body: 0x0f172a, wing: 0xff00ff, emissive: 0xff44ff },
      ship_alien: { body: 0x14532d, wing: 0x4ade80, emissive: 0x22c55e },
      ship_crystal: { body: 0x312e81, wing: 0xc4b5fd, emissive: 0xa78bfa },
      ship_samurai: { body: 0x450a0a, wing: 0xfca5a5, emissive: 0xef4444 },
      ship_corrupted: { body: 0x1c1917, wing: 0xa855f7, emissive: 0x7c3aed },
      ship_blackhole: { body: 0x020617, wing: 0x67e8f9, emissive: 0x06b6d4 },
      ship_dragon: { body: 0x422006, wing: 0xfbbf24, emissive: 0xf59e0b },
      ship_pink: { body: 0x500724, wing: 0xf472b6, emissive: 0xec4899 },
    };
    const p = palettes[skinId] ?? palettes.ship_default;
    bodyMat.color.setHex(p.body);
    wingMat.color.setHex(p.wing);
    wingMat.emissive.setHex(p.emissive);
  }

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h || 1;
    this.camera.updateProjectionMatrix();
  }

  start(): void {
    const loop = () => {
      this.ship.rotation.y += 0.006;
      this.ship.position.y = Math.sin(Date.now() * 0.001) * 0.08;
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
  }
}
