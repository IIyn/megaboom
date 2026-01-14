import * as THREE from "three";

export interface Entity {
    model: THREE.Group;
    hasPhysics: boolean;
    velocity: THREE.Vector3;
    isGrounded: boolean;
    groundOffset?: number;
    update(delta: number, ...args: any[]): boolean | void;
    dispose(scene: THREE.Scene): void;
}