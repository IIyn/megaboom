import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Entity } from "../Entity";

export class Enemy implements Entity {
    public model: THREE.Group;
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public hasPhysics: boolean = true;
    public isGrounded: boolean = false;
    public groundOffset: number = 0.5;

    private speed: number = 3.5;
    private _hp: number = 10;
    private _damage: number = 5;
    private damageTimer: number = 0;
    private damageCooldown: number = 0.2;

    constructor(scene: THREE.Scene, position: THREE.Vector3, scale: "Small" | "Medium" | "Large", hp: number) {
        let scaleValue: number = 0;
        switch (scale) {
            case "Small": scaleValue = 0.03; break;
            case "Medium": scaleValue = 0.05; break;
            case "Large": scaleValue = 0.07; break;
        }

        this.model = new THREE.Group();
        this.model.position.copy(position);
        scene.add(this.model);

        const loader = new GLTFLoader();
        loader.load("src/assets/Enemy/scene.gltf", (gltf) => {
            gltf.scene.scale.set(scaleValue, scaleValue, scaleValue);
            this.model.add(gltf.scene);
            this.model.castShadow = true;
        });

        this.hp = hp;
    }

    public update(delta: number, playerPosition: THREE.Vector3) {
        if (this.damageTimer > 0) this.damageTimer -= delta;

        // Horizontal movement intent
        const direction = new THREE.Vector3().subVectors(playerPosition, this.model.position);
        direction.y = 0;

        if (direction.length() > 0.1) {
            direction.normalize();
            // On utilise lerp pour ne pas annuler brutalement le knockback
            this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, direction.x * this.speed, 5 * delta);
            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, direction.z * this.speed, 5 * delta);
            this.model.lookAt(playerPosition.x, this.model.position.y, playerPosition.z);
        }
    }

    public takeDamage(amount: number, damagePosition: THREE.Vector3) {
        if (this.damageTimer > 0) return;

        this.hp -= amount;
        this.damageTimer = this.damageCooldown;

        // knockback
        const knockbackDir = this.model.position.clone().sub(damagePosition).normalize();
        knockbackDir.y = 0.1;
        this.velocity.add(knockbackDir.multiplyScalar(10));
    }

    public isDead(): boolean { return this.hp <= 0; }
    public dispose(scene: THREE.Scene) { scene.remove(this.model); }

    public get damage(): number { return this._damage; }
    public set damage(value: number) { this._damage = value; }
    public get hp(): number { return this._hp; }
    public set hp(value: number) { this._hp = value; }
}
