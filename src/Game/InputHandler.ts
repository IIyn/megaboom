export class InputHandler {
    public keys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    public isForward(): boolean {
        return this.keys['w'] || this.keys['z'] || this.keys['arrowup'];
    }

    public isBackward(): boolean {
        return this.keys['s'] || this.keys['arrowdown'];
    }

    public isLeft(): boolean {
        return this.keys['a'] || this.keys['q'] || this.keys['arrowleft'];
    }

    public isRight(): boolean {
        return this.keys['d'] || this.keys['arrowright'];
    }

    public isSpace(): boolean {
        return this.keys[' '];
    }
}
