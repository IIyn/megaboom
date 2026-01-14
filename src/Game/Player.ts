import * as THREE from "three";
import { InputHandler } from "./InputHandler";
import { Fireball } from "./Entities/Weapons/Fireball";
import { Enemy } from "./Entities/Enemies/Enemy";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Entity } from "./Entities/Entity";

/**
 * Player class that handles player movement, combat, and fireballs
 */
export class Player implements Entity {
    // player data
    public model: THREE.Group;
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public hasPhysics: boolean = true;
    public isGrounded: boolean = false;
    public groundOffset: number = 0.5;

    private camera: THREE.PerspectiveCamera;
    private input: InputHandler;
    private scene: THREE.Scene;

    // stats
    private hp: number = 100;
    private speed: number = 10;
    private rotationSpeed: number = 8;
    private jumpForce: number = 12;

    // progression stats
    private xp: number = 0;
    private level: number = 1;
    private xpToNextLevel: number = 100;
    private pickupRange: number = 5;

    // combat & invulnerability
    private damageCooldown: number = 0.5; // demi-seconde d'immunité
    private damageTimer: number = 0;

    // fireball stats
    private fireballs: Fireball[] = [];
    private fireballBuffer: number = 1;
    private fireCooldown: number = 1.5;
    private fireTimer: number = 0;
    private range: number = 15;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, input: InputHandler) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.model = new THREE.Group();

        const loader = new GLTFLoader();
        loader.load('src/assets/Player/scene.gltf', (gltf) => {
            gltf.scene.scale.set(0.1, 0.1, 0.1);
            this.model.add(gltf.scene);
            this.model.position.y = 0.75;
            this.model.castShadow = true;
            this.scene.add(this.model);
        });
    }

    public dispose(scene: THREE.Scene): void {
        scene.remove(this.model);
    }

    public update(delta: number, enemies: Enemy[] = []) {
        if (this.damageTimer > 0) this.damageTimer -= delta;

        this.handleMovement(delta);
        this.updateCamera();
        this.handleCombat(delta, enemies);
        this.updateFireballs(delta);
    }

    private handleMovement(delta: number) {
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (this.input.isForward()) moveDir.z -= 1;
        if (this.input.isBackward()) moveDir.z += 1;
        if (this.input.isLeft()) moveDir.x -= 1;
        if (this.input.isRight()) moveDir.x += 1;

        // On n'écrase pas la vélocité X/Z que si on a un input, pour laisser le knockback agir
        if (moveDir.length() > 0) {
            moveDir.normalize();
            // On utilise un lerp pour un mouvement plus fluide
            this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * this.speed, 10 * delta);
            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * this.speed, 10 * delta);

            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetRotation, this.rotationSpeed * delta);
        }

        // Saut (seulement si on est au sol)
        if (this.input.isSpace() && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }

    private updateCamera() {
        const offset = new THREE.Vector3(0, 8, 12);
        const targetPosition = this.model.position.clone().add(offset);
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.model.position);
    }

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

    private fireFireball(targetPos: THREE.Vector3) {
        const fireball = new Fireball(this.scene, this.model.position.clone(), targetPos);
        this.fireballs.push(fireball);
    }

    private updateFireballs(delta: number) {
        this.fireballs = this.fireballs.filter(fb => {
            const hasLifetime = fb.update(delta);
            const active = hasLifetime && !fb.markedForRemoval;
            if (!active) fb.dispose(this.scene);
            return active;
        });
    }

    public takeDamage(amount: number, enemyPos: THREE.Vector3) {
        if (this.damageTimer > 0) return; // Toujours invulnérable

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.damageTimer = this.damageCooldown;

        // Knockback (impulsion)
        const knockbackDir = this.model.position.clone().sub(enemyPos).normalize();
        knockbackDir.y = 0.2; // Petit bond vers le haut
        this.velocity.add(knockbackDir.multiplyScalar(15));
    }

    public addXp(amount: number) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    private levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        // Bonus for leveling up (optional but nice)
        this.hp = Math.min(100, this.hp + 20);
        this.range += 0.5;
        this.fireCooldown *= 0.95;

        // Check for double level up if xp is high
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    public getPosition(): THREE.Vector3 { return this.model.position; }
    public getHp(): number { return Math.ceil(this.hp); }
    public isDead(): boolean { return this.hp <= 0; }
    public getFireballs(): Fireball[] { return this.fireballs; }
    public getXp(): number { return this.xp; }
    public getXpToNextLevel(): number { return this.xpToNextLevel; }
    public getLevel(): number { return this.level; }
    public getPickupRange(): number { return this.pickupRange; }
}
