import * as THREE from "three";
import { InputHandler } from "./InputHandler";
import { Fireball } from "./Weapons/Fireball";
import { Enemy } from "./Enemies/Enemy";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Entity } from "./Entity";

/**
 * Player class that handles player movement, combat, and fireballs
 */
export class Player implements Entity {
    // player data
    public model: THREE.Group;
    private camera: THREE.PerspectiveCamera;
    private input: InputHandler;
    private scene: THREE.Scene;
    public hasPhysics: boolean = true;

    // stats
    private hp: number = 100;
    private speed: number = 10;
    private rotationSpeed: number = 5;

    // fireball stats
    private fireballs: Fireball[] = [];
    private fireballBuffer: number = 1;
    private fireCooldown: number = 1.5; // seconds
    private fireTimer: number = 0;
    private range: number = 15;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, input: InputHandler) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.model = new THREE.Group();

        // load player model
        const loader = new GLTFLoader();
        loader.load('src/assets/Player/scene.gltf', (gltf) => {
            gltf.scene.scale.set(0.1, 0.1, 0.1);
            this.model.add(gltf.scene);
            this.model.position.y = 0.75;
            this.model.castShadow = true;
            this.scene.add(this.model);
        });
    }
    dispose(scene: THREE.Scene): void {
        scene.remove(this.model);
    }

    public update(delta: number, enemies: Enemy[] = []) {
        this.handleMovement(delta);
        this.updateCamera();
        this.handleCombat(delta, enemies);
        this.updateFireballs(delta);
        this.handlePhysics(delta);
    }

    private handlePhysics(delta: number) {
        // if (this.hasPhysics) {
        //     this.model.position.add(new THREE.Vector3(0, -10, 0).clone().multiplyScalar(delta));
        // }
    }

    /**
     * Handles player movement
     * @param delta time since last frame
     */
    private handleMovement(delta: number) {
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (this.input.isForward()) moveDir.z -= this.speed;
        if (this.input.isBackward()) moveDir.z += this.speed;
        if (this.input.isLeft()) moveDir.x -= this.speed;
        if (this.input.isRight()) moveDir.x += this.speed;
        if (this.input.isSpace()) moveDir.y += this.speed;

        if (moveDir.length() > 0) {
            moveDir.normalize();
            this.model.position.add(moveDir.multiplyScalar(this.speed * delta));

            // Rotate mesh towards movement direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetRotation, this.rotationSpeed * delta);
        }
    }

    /**
     * Handles camera movement relative to player
     */
    private updateCamera() {
        const offset = new THREE.Vector3(0, 8, 12); // Steady height and distance
        const targetPosition = this.model.position.clone().add(offset);

        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.model.position);
    }

    /**
     * Handles combat logic
     * @param delta time since last frame
     * @param enemies list of enemies
     */
    private handleCombat(delta: number, enemies: Enemy[]) {
        this.fireTimer += delta;
        if (this.fireTimer >= this.fireCooldown && this.fireballs.length < this.fireballBuffer) {
            const nearestEnemy = this.findNearestEnemy(enemies);
            if (nearestEnemy && this.model.position.distanceTo(nearestEnemy.model.position) <= this.range) {
                this.fireFireball(nearestEnemy.model.position);
                this.fireTimer = 0;
            }
        }
    }

    /**
     * Finds the nearest enemy to the player
     * @param enemies list of enemies
     * @returns nearest enemy or null
     */
    private findNearestEnemy(enemies: Enemy[]): Enemy | null {
        let nearest = null;
        let minDistance = Infinity;

        enemies.forEach(enemy => {
            const dist = this.model.position.distanceTo(enemy.model.position);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    /**
     * Fires a fireball at the target position
     * @param targetPos target position
     */
    private fireFireball(targetPos: THREE.Vector3) {
        const fireball = new Fireball(this.scene, this.model.position.clone(), targetPos);
        this.fireballs.push(fireball);
    }

    /**
     * Updates fireballs
     * @param delta time since last frame
     */
    private updateFireballs(delta: number) {
        this.fireballs = this.fireballs.filter(fb => {
            const hasLifetime = fb.update(delta);
            const active = hasLifetime && !fb.markedForRemoval;
            if (!active) {
                fb.dispose(this.scene);
            }
            return active;
        });
    }

    /**
     * Deals damage to the player
     * @param amount damage amount
     */
    public takeDamage(amount: number, enemyPos: THREE.Vector3) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        // knockback player from enemy position
        this.model.position.add(this.model.position.clone().sub(enemyPos).normalize().multiplyScalar(5));
    }

    /**
     * Returns the player's position
     * @returns player's position
     */
    public getPosition(): THREE.Vector3 {
        return this.model.position;
    }

    public getHp(): number {
        return Math.ceil(this.hp);
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    public getFireballs(): Fireball[] {
        return this.fireballs;
    }
}
