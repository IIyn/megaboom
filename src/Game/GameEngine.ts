import * as THREE from "three";
import { InputHandler } from "./InputHandler";
import { Player } from "./Player";
import { EnemyManager } from "./EnemyManager";

export class GameEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private input: InputHandler;
    private player: Player;
    private enemyManager: EnemyManager;
    private clock: THREE.Clock;
    private onStateUpdate: (state: { hp: number; isGameOver: boolean }) => void;

    constructor(container: HTMLElement, onStateUpdate: (state: { hp: number; isGameOver: boolean }) => void) {
        this.onStateUpdate = onStateUpdate;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        this.input = new InputHandler();
        this.player = new Player(this.scene, this.camera, this.input);
        this.enemyManager = new EnemyManager(this.scene, this.player);

        this.clock = new THREE.Clock();

        this.setupLights();
        this.setupEnvironment();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    private setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    private setupEnvironment() {
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        // collide on gridHelper
        this.scene.add(gridHelper);

        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        if (this.player.isDead()) return;

        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();

        this.player.update(delta, this.enemyManager.getEnemies());
        this.enemyManager.update(delta);

        this.onStateUpdate({
            hp: this.player.getHp(),
            isGameOver: this.player.isDead(),
        });

        this.renderer.render(this.scene, this.camera);
    }

    public dispose() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
    }
}
