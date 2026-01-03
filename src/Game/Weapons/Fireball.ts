import * as THREE from "three";
import type { Entity } from "../Entity";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Fireball implements Entity {
    public model: THREE.Group;
    public hasPhysics: boolean = false;
    public velocity: THREE.Vector3;
    private lifetime: number = 3; // seconds
    private speed: number = 20;
    public markedForRemoval: boolean = false;

    constructor(scene: THREE.Scene, position: THREE.Vector3, target: THREE.Vector3) {
        this.model = new THREE.Group();
        const loader = new GLTFLoader();
        loader.load("src/assets/Fireball/scene.gltf", (gltf) => {
            this.model.add(gltf.scene);
            this.model.position.copy(position);
            scene.add(this.model);
        });

        const direction = new THREE.Vector3().subVectors(target, position).normalize();
        this.velocity = direction.multiplyScalar(this.speed);
    }

    public update(delta: number): boolean {
        this.model.position.add(this.velocity.clone().multiplyScalar(delta));
        this.lifetime -= delta;
        return this.lifetime > 0;
    }

    public dispose(scene: THREE.Scene) {
        scene.remove(this.model);
    }
}
