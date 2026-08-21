import { _decorator, Component, Node, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property({ type: Node, tooltip: 'нода игрока' })
    target: Node = null;

    @property({ tooltip: 'скорость сглаживания (больше = быстрее)' })
    lerpSpeed = 5;

    @property({ tooltip: 'минимальная координата X камеры' })
    minX = 0;

    @property({ tooltip: 'максимальная координата X камеры' })
    maxX = 2000;

    @property({ tooltip: 'отступ камеры от игрока по X (px)' })
    offsetX = 120;

    @property({ tooltip: 'ширина дизайн-резолюции (портрет 9:16)' })
    designWidth = 720;

    @property({ tooltip: 'высота дизайн-резолюции (портрет 9:16)' })
    designHeight = 1280;

    private _curX = 0;

    onLoad() {
        this._curX = this.node.position.x;
    }

    private _effectiveOffset(): number {
        const v = view.getVisibleSize();
        const designAspect = this.designWidth / this.designHeight;
        const screenAspect = v.width / v.height;
        let k = designAspect > 0 ? screenAspect / designAspect : 1;
        if (k < 1) k = 1;
        return this.offsetX * k;
    }

    public snapToTarget() {
        if (!this.target) return;
        const x = this._clamp(this.target.worldPosition.x - this._effectiveOffset());
        this._curX = x;
        this._apply(x);
    }

    update(dt: number) {
        if (!this.target) return;
        const desired = this._clamp(this.target.worldPosition.x - this._effectiveOffset());
        const k = 1 - Math.exp(-this.lerpSpeed * dt);
        this._curX += (desired - this._curX) * k;
        this._apply(this._curX);
    }

    private _clamp(x: number): number {
        return Math.max(this.minX, Math.min(this.maxX, x));
    }

    private _apply(x: number) {
        this.node.setPosition(x, this.node.position.y, this.node.position.z);
    }
}