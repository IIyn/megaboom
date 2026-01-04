import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Entity } from "../Entity";

export class Enemy implements Entity {
    public model: THREE.Group;

    public hasPhysics: boolean = true;
    private speed: number = 3.5;
    private _hp: number = 1;
    private _damage: number = 5;

    constructor(scene: THREE.Scene, position: THREE.Vector3, scale: "Small" | "Medium" | "Large", hp: number) {
        let scaleValue: number = 0;

        switch (scale) {
            case "Small":
                scaleValue = 0.03;
                break;
            case "Medium":
                scaleValue = 0.05;
                break;
            case "Large":
                scaleValue = 0.07;
                break;
        }


        this.model = new THREE.Group();
        const loader = new GLTFLoader();
        loader.load("src/assets/Enemy/scene.gltf", (gltf) => {
            gltf.scene.scale.set(scaleValue, scaleValue, scaleValue);
            this.model.add(gltf.scene);
            this.model.position.copy(position);
            this.model.castShadow = true;
            scene.add(this.model);
        });

        this.hp = hp;
    }

    public update(delta: number, playerPosition: THREE.Vector3) {
        const direction = new THREE.Vector3().subVectors(playerPosition, this.model.position).normalize();
        this.model.position.add(direction.multiplyScalar(this.speed * delta));
        this.model.lookAt(playerPosition);
        // if (this.hasPhysics) {
        //     this.model.position.add(new THREE.Vector3(0, 0, 0).multiplyScalar(delta));
        // }
    }

    public takeDamage(amount: number, damagePosition: THREE.Vector3) {
        this.hp -= amount;
        // knockback enemy from damage asset position
        this.model.position.add(this.model.position.clone().sub(damagePosition).normalize().multiplyScalar(5));
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    public dispose(scene: THREE.Scene) {
        scene.remove(this.model);
    }

    public get damage(): number {
        return this._damage;
    }
    public set damage(value: number) {
        this._damage = value;
    }

    public get hp(): number {
        return this._hp;
    }
    public set hp(value: number) {
        this._hp = value;
    }
}
