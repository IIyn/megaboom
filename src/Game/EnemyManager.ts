import * as THREE from "three";
import { Player } from "./Player";
import { Enemy } from "./Entities/Enemies/Enemy";
import { Fireball } from "./Entities/Weapons/Fireball";
import type { PhysicsManager } from "./PhysicsManager";
import { ExperienceOrb } from "./Entities/Collectibles/ExperienceOrb";

export class EnemyManager {
    private enemies: Enemy[] = [];
    private scene: THREE.Scene;
    private player: Player;
    private physicsManager: PhysicsManager;
    private orbs: ExperienceOrb[] = [];
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private enemyDensity: number = 5;

    constructor(scene: THREE.Scene, player: Player, physicsManager: PhysicsManager) {
        this.scene = scene;
        this.player = player;
        this.physicsManager = physicsManager;
    }

    public update(delta: number) {
        this.handleEnemyDensity(delta);
        this.handleEnemyPathing(delta);
        this.handleFireballDamage();
        this.handleEnemyRemoval();
        this.handleOrbs(delta);
    }

    private handleEnemyDensity(delta: number) {
        this.spawnTimer += delta;
        this.enemyDensity += delta * 0.1;

        if (this.spawnTimer >= this.spawnInterval) {
            const maxEnemies = Math.floor(this.enemyDensity);
            if (this.enemies.length < maxEnemies) {
                const numToSpawn = Math.min(maxEnemies - this.enemies.length, 3);
                for (let i = 0; i < numToSpawn; i++) {
                    this.spawnEnemy();
                }
            }
            this.spawnTimer = 0;
        }
    }

    private handleEnemyPathing(delta: number) {
        const playerPos = this.player.getPosition();
        this.enemies.forEach((enemy) => {
            enemy.update(delta, playerPos);

            if (enemy.model.position.distanceTo(playerPos) < 1.5) {
                this.player.takeDamage(enemy.damage, enemy.model.position);
            }
        });
    }

    private handleFireballDamage() {
        const fireballs = this.player.getFireballs();
        fireballs.forEach((fireball: Fireball) => {
            this.enemies.forEach((enemy) => {
                // create an impact zone
                const impactZone = new THREE.Sphere(fireball.model.position, 2.0);
                if (impactZone.containsPoint(enemy.model.position)) {
                    enemy.takeDamage(10, fireball.model.position);
                    fireball.markedForRemoval = true;
                }
            });
        });
    }

    private handleEnemyRemoval() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead()) {
                this.spawnOrb(enemy.model.position);
                enemy.dispose(this.scene);
                this.physicsManager.removeEntity(enemy);
                return false;
            }
            return true;
        });
    }

    private spawnOrb(position: THREE.Vector3) {
        const orb = new ExperienceOrb(this.scene, position.clone());
        this.orbs.push(orb);
    }

    private handleOrbs(delta: number) {
        const playerPos = this.player.getPosition();
        const pickupRange = this.player.getPickupRange();

        this.orbs = this.orbs.filter(orb => {
            const collected = orb.update(delta, playerPos, pickupRange);
            if (collected) {
                this.player.addXp(orb.value);
                orb.dispose();
                return false;
            }
            return true;
        });
    }

    private spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const playerPos = this.player.getPosition();
        const x = playerPos.x + Math.cos(angle) * distance;
        const z = playerPos.z + Math.sin(angle) * distance;
        const enemyScale = "Small";
        const enemyHp = 10;

        const enemy = new Enemy(this.scene, new THREE.Vector3(x, 0.5, z), enemyScale, enemyHp);
        this.enemies.push(enemy);
        this.physicsManager.addEntity(enemy);
    }

    public getEnemies(): Enemy[] {
        return this.enemies;
    }
}
