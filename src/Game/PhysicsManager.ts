import * as THREE from "three";
import type { Entity } from "./Entities/Entity";

export class PhysicsManager {
    private groundObjects: THREE.Object3D[] = [];
    private entities: Entity[] = [];
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private gravity: number = -25;
    private friction: number = 5.0; // Amortissement horizontal

    constructor() { }

    public addGround(object: THREE.Object3D) {
        this.groundObjects.push(object);
    }

    public addEntity(entity: Entity) {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
        }
    }

    public removeEntity(entity: Entity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    public update(delta: number) {
        this.entities.forEach(entity => {
            if (!entity.hasPhysics) return;

            // 1. Appliquer la gravité
            entity.velocity.y += this.gravity * delta;

            // 2. Appliquer la friction (amortissement horizontal uniquement)
            // On réduit progressivement la vélocité X et Z
            const damping = Math.exp(-this.friction * delta);
            entity.velocity.x *= damping;
            entity.velocity.z *= damping;

            // 3. Calculer le mouvement théorique
            const movement = entity.velocity.clone().multiplyScalar(delta);
            const nextPosition = entity.model.position.clone().add(movement);

            // 4. Détection de collision au sol via Raycasting
            // On lance le rayon depuis un peu plus haut pour être sûr de ne pas rater le sol
            const rayOrigin = nextPosition.clone();
            rayOrigin.y += 2.0;
            const rayDirection = new THREE.Vector3(0, -1, 0);

            this.raycaster.set(rayOrigin, rayDirection);
            const intersects = this.raycaster.intersectObjects(this.groundObjects);

            const offset = entity.groundOffset || 0.5;

            if (intersects.length > 0) {
                // On cherche l'intersection de sol la plus proche en dessous de nous
                const groundY = intersects[0].point.y;
                const minAllowedY = groundY + offset;

                if (nextPosition.y <= minAllowedY) {
                    // Collision détectée
                    entity.model.position.x = nextPosition.x;
                    entity.model.position.z = nextPosition.z;
                    entity.model.position.y = minAllowedY;
                    entity.isGrounded = true;

                    // On stoppe la chute
                    if (entity.velocity.y < 0) {
                        entity.velocity.y = 0;
                    }
                } else {
                    // Dans les airs
                    entity.model.position.copy(nextPosition);
                    entity.isGrounded = false;
                }
            } else {
                // Pas de sol détecté (bord de map ou chute dans le vide)
                entity.model.position.copy(nextPosition);
                entity.isGrounded = false;
            }
        });
    }
}
