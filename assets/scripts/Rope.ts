import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, UITransform, Color } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Rope')
export class Rope extends Component {
    @property({ type: SpriteFrame, tooltip: 'спрайт одного звена-кусочка (тонкая полоска)' })
    linkFrame: SpriteFrame = null;

    @property({ type: Node, tooltip: 'второй закреплённый конец (правый столб). Своя нода — левый столб' })
    endTarget: Node = null;

    @property({ tooltip: 'сколько звеньев во всей веревке (чётное — ровный разрез пополам)' })
    count = 24;

    @property({ tooltip: 'базовая длина одного звена (px)' })
    linkLength = 60;

    @property({ tooltip: 'толщина звена (px)' })
    thickness = 8;

    @property({ type: Color, tooltip: 'цвет веревки (белый = без тонировки)' })
    color = new Color(255, 255, 255, 255);

    @property gravity = 1600;

    @property({ tooltip: 'итерации релаксации ограничений (больше = жёстче)' })
    iterations = 6;

    private _nodes: Node[] = [];
    private _pos: Vec3[] = [];
    private _prev: Vec3[] = [];
    private _split = false;

    public get isSplit(): boolean { return this._split; }

    onLoad() {
        this._build();
        if (this.endTarget && !this._split) this._preBakeSag();
    }

    public cut() {
        if (this._split) return;
        this._split = true;
        const mid = this._mid();
        if (this._nodes[mid]) this._nodes[mid].active = false;
    }

    private _mid(): number {
        return Math.floor(this.count / 2);
    }

    private _endLocal(): Vec3 {
        const wp = this.endTarget.worldPosition;
        return this.node.inverseTransformPoint(new Vec3(), wp);
    }

    private _build() {
        const base = this.linkLength;
        for (let i = 0; i <= this.count; i++) {
            const p = new Vec3(i * base, 0, 0);
            this._pos.push(p);
            this._prev.push(p.clone());
        }
        for (let i = 0; i < this.count; i++) {
            const n = new Node('RopeSeg');
            n.layer = this.node.layer;
            const sp = n.addComponent(Sprite);
            sp.spriteFrame = this.linkFrame;
            sp.color = this.color;
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            const ui = n.addComponent(UITransform);
            ui.setContentSize(base, this.thickness);
            n.setPosition(0, -this.thickness, 0);
            this.node.addChild(n);
            this._nodes.push(n);
        }
    }

    update(dt: number) {
        const count = this.count;
        const dt2 = dt * dt;
        const damping = 0.98;

        for (let i = 1; i < count; i++) {
            const p = this._pos[i];
            const prev = this._prev[i];
            const vx = (p.x - prev.x) * damping;
            const vy = (p.y - prev.y) * damping;
            prev.set(p.x, p.y, p.z);
            p.x += vx;
            p.y += vy - this.gravity * dt2;
        }

        if (!this._split) {
            if (!this.endTarget) return;
            this._pos[0].set(0, 0, 0);
            const end = this._endLocal();
            this._pos[count].set(end.x, end.y, end.z);
            this._relaxRange(0, count - 1, true, true);
        } else {
            this._pos[0].set(0, 0, 0);
            const end = this._endLocal();
            this._pos[count].set(end.x, end.y, end.z);
            const mid = this._mid();
            this._relaxRange(0, mid - 1, true, false);
            this._relaxRange(mid + 1, count - 1, false, true);
        }

        this._layout();
    }

    private _preBakeSag() {
        const count = this.count;
        this._pos[0].set(0, 0, 0);
        const end = this._endLocal();
        this._pos[count].set(end.x, end.y, end.z);
        for (let k = 0; k < 40; k++) {
            for (let i = 1; i < count; i++) {
                this._pos[i].y -= 2;
            }
            this._relaxRange(0, count - 1, true, true);
        }
        this._layout();
    }

    private _relaxRange(aBase: number, bMax: number, fixedStart: boolean, fixedEnd: boolean) {
        const L = this.linkLength;
        if (aBase > bMax) return;
        for (let k = 0; k < this.iterations; k++) {
            for (let i = aBase; i <= bMax; i++) {
                const a = this._pos[i];
                const b = this._pos[i + 1];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.0001) dist = 0.0001;
                const diff = (dist - L) / dist;
                let amt = 0.5;
                let bmt = 0.5;
                if (i === aBase && fixedStart) { amt = 0; bmt = 1; }
                else if (i === bMax && fixedEnd) { amt = 1; bmt = 0; }
                a.x += dx * diff * amt;
                a.y += dy * diff * amt;
                b.x -= dx * diff * bmt;
                b.y -= dy * diff * bmt;
            }
        }
    }

    private _layout() {
        for (let i = 0; i < this._nodes.length; i++) {
            const a = this._pos[i];
            const b = this._pos[i + 1];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const n = this._nodes[i];
            n.setPosition(mx, my, 0);
            n.angle = Math.atan2(dy, dx) * 180 / Math.PI;
            n.setScale(dist > 0 ? dist / this.linkLength : 1, 1, 1);
        }
    }
}