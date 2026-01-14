import * as THREE from "three";
import type { Entity } from "../Entity";

export class ExperienceOrb implements Entity {
    public model: THREE.Group;
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public hasPhysics: boolean = false; // We handle movement ourselves (magnet effect)
    public isGrounded: boolean = true;
    public groundOffset: number = 0.5;

    private scene: THREE.Scene;
    private xpValue: number;
    private isCollected: boolean = false;

    constructor(scene: THREE.Scene, position: THREE.Vector3, xpValue: number = 10) {
        this.scene = scene;
        this.xpValue = xpValue;
        this.model = new THREE.Group();
        this.model.position.copy(position);
        this.model.position.y = 0.5; // Slightly above ground

        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Add a glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

        this.model.add(mesh);
        this.model.add(glowMesh);
        this.scene.add(this.model);
    }

    public update(delta: number, playerPosition: THREE.Vector3, pickupRange: number): boolean {
        if (this.isCollected) return false;

        const dist = this.model.position.distanceTo(playerPosition);

        // Magnet effect
        if (dist < pickupRange) {
            const direction = new THREE.Vector3().subVectors(playerPosition, this.model.position).normalize();
            const speed = 20 * delta;
            this.model.position.add(direction.multiplyScalar(speed));

            if (dist < 0.5) {
                this.isCollected = true;
                return true; // Collected!
            }
        }

        // Gentle float animation
        this.model.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;

        return false;
    }

    public dispose(): void {
        this.scene.remove(this.model);
    }

    public get value(): number {
        return this.xpValue;
    }
}
