import * as THREE from "three";
import { Player } from "./Player";
import { Enemy } from "./Enemies/Enemy";
import { Fireball } from "./Weapons/Fireball";

export class EnemyManager {
    private enemies: Enemy[] = [];
    private scene: THREE.Scene;
    private player: Player;
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private enemyDensity: number = 5;
    private enemyMaxDensity: number = 10;

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    public update(delta: number) {
        this.spawnTimer += delta;
        this.enemyDensity += delta * 0.1;
        if (this.spawnTimer >= this.spawnInterval) {
            for (let i = 0; i < this.enemyDensity; i++) {
                this.spawnEnemy(delta);
            }
            this.spawnTimer = 0;
        }

        const playerPos = this.player.getPosition();
        this.enemies.forEach((enemy) => {
            enemy.update(delta, playerPos);
            enemy.model.lookAt(playerPos);

            if (enemy.model.position.distanceTo(playerPos) < 1.5) {
                this.player.takeDamage(enemy.damage, enemy.model.position);
            }
        });

        const fireballs = this.player.getFireballs();
        fireballs.forEach((fireball: Fireball) => {
            this.enemies.forEach((enemy) => {
                if (fireball.model.position.distanceTo(enemy.model.position) < 1.0) {
                    enemy.takeDamage(1, fireball.model.position);
                    fireball.markedForRemoval = true;
                }
            });
        });

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
