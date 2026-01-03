import * as THREE from "three";

export interface Entity {
    model: THREE.Group;
    hasPhysics: boolean;
    update(delta: number, ...args: any[]): boolean | void;
    dispose(scene: THREE.Scene): void;
}