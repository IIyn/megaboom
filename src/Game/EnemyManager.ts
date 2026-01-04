import * as THREE from "three";
import { Player } from "./Player";
import { Enemy } from "./Entities/Enemies/Enemy";
import { Fireball } from "./Entities/Weapons/Fireball";

export class EnemyManager {
    private enemies: Enemy[] = [];
    private scene: THREE.Scene;
    private player: Player;
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private enemyDensity: number = 5;

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    public update(delta: number) {
        this.handleEnemyDensity(delta);
        this.handleEnemyPathing(delta);
        this.handleFireballDamage();
        this.handleEnemyRemoval();
    }

    private handleEnemyDensity(delta: number) {
        this.spawnTimer += delta;
        this.enemyDensity += delta * 0.01;
        const maxDensity = this.enemyDensity * 1.5;
        if (this.spawnTimer >= this.spawnInterval && this.enemyDensity < maxDensity) {
            for (let i = 0; i < this.enemyDensity; i++) {
                this.spawnEnemy(delta);
            }
            this.spawnTimer = 0;
        }
    }

    private handleEnemyPathing(delta: number) {
        const playerPos = this.player.getPosition();
        this.enemies.forEach((enemy) => {
            enemy.update(delta, playerPos);
            enemy.model.lookAt(playerPos);

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
                    enemy.takeDamage(1, fireball.model.position);
                    fireball.markedForRemoval = true;
                }
            });
        });
    }

    private handleEnemyRemoval() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDead()) {
                enemy.dispose(this.scene);
                return false;
            }
            return true;
        });
    }

    private spawnEnemy(delta: number) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const playerPos = this.player.getPosition();
        const x = playerPos.x + Math.cos(angle) * distance;
        const z = playerPos.z + Math.sin(angle) * distance;
        const enemyScale = "Small";
        const enemyHp = delta * 0.5;

        this.enemies.push(new Enemy(this.scene, new THREE.Vector3(x, 0.5, z), enemyScale, enemyHp));
    }

    public getEnemies(): Enemy[] {
        return this.enemies;
    }
}
