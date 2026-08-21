import { _decorator, Component, Node, view } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
import { SpriteAnimator } from './SpriteAnimator';
import { TimeFrozen } from './TimeFrozen';

const { ccclass, property } = _decorator;

@ccclass('Obstacle')
export class Obstacle extends Component {
    @property({ tooltip: 'обучающий: при подлёте ставит игру на паузу и показывает подсказку прыжка' })
    teach = false;

    @property({ tooltip: 'дистанция срабатывания подсказки прыжка (px)' })
    promptDistance = 320;

    @property({ tooltip: 'хвалить (Great!/Awesome!) при успешном перепрыгивании' })
    praiseOnClear = true;

    @property({ tooltip: 'полуширина хитбокса препятствия (px)' })
    hitHalfWidth = 35;

    @property({ tooltip: 'полувысота хитбокса препятствия (px)' })
    hitHalfHeight = 70;

    @property({ tooltip: 'двигается на игрока (враг, бегущий влево)' })
    moving = false;

    @property({ tooltip: 'начинать движение, только когда объект появился в камере игрока' })
    activateOnVisible = true;

    @property({ tooltip: 'скорость движения к игроку (px/s)' })
    moveSpeed = 180;

    @property({ tooltip: 'смещение центра хитбокса по Y (px), если препятствие стоит не центром' })
    hitOffsetY = 0;

    @property({ type: [Node], tooltip: 'декоративные ноды-пузыри (дочерние): пульсируют скейлом, прячутся при прохождении, корень остаётся' })
    bubbleNodes: Node[] = [];

    @property({ tooltip: 'амплитуда пульсации пузырей (± масштаб)' })
    bubblePulseAmp = 0.12;

    @property({ tooltip: 'скорость пульсации пузырей (раз/сек)' })
    bubblePulseSpeed = 2.5;

    @property({ tooltip: 'сдвиг фазы пульсации пузырей' })
    bubblePulsePhase = 0;

    @property({ tooltip: 'прятать пузыри, когда препятствие осталось позади (корень не трогаем)' })
    hideBubblesOnPass = true;

    private _animator: SpriteAnimator = null;
    private _pulseTime = 0;
    private _hit = false;
    private _cleared = false;
    private _movingActive = false;
    private _done = false;
    private _prompted = false;
    private _praised = false;

    onLoad() {
        this._animator = this.getComponent(SpriteAnimator);
    }

    public get isHit(): boolean { return this._hit; }

    private _pulseBubbles(dt: number) {
        if (TimeFrozen.value || this.bubbleNodes.length === 0) return;
        this._pulseTime += dt;
        const amp = this.bubblePulseAmp;
        const spd = this.bubblePulseSpeed;
        const basePhase = this.bubblePulsePhase;
        for (let i = 0; i < this.bubbleNodes.length; i++) {
            const b = this.bubbleNodes[i];
            if (!b || !b.isValid) continue;
            const s = 1 + amp * Math.sin(this._pulseTime * spd + basePhase + i * Math.PI * 0.5);
            b.setScale(s, s, 1);
        }
    }

    private _hideBubbles() {
        if (!this.hideBubblesOnPass) return;
        for (const b of this.bubbleNodes) {
            if (b && b.isValid) b.active = false;
        }
    }

    update(dt: number) {
        const gm = GameManager.instance;
        if (!gm || !gm.player || !gm.canPlay()) return;

        const player = gm.player;
        const p = player.node.worldPosition;

        this._pulseBubbles(dt);

        if (this._hit) {
            if (this.moving && gm.allowsMovement) {
                if (p.x - this.node.worldPosition.x > 1200) return;
                const pos = this.node.position;
                this.node.setPosition(pos.x - this.moveSpeed * dt, pos.y, pos.z);
            }
            return;
        }

        if (this.moving && !this._movingActive) {
            if (this.activateOnVisible) {
                const camX = gm.camera ? gm.camera.node.worldPosition.x : p.x;
                const half = view.getVisibleSize().width / 2;
                this._movingActive = this.node.worldPosition.x <= camX + half;
            } else {
                this._movingActive = true;
            }
        }

        if (this.moving && this._movingActive && gm.allowsMovement) {
            const pos = this.node.position;
            this.node.setPosition(pos.x - this.moveSpeed * dt, pos.y, pos.z);
        }

        const o = this.node.worldPosition;

        if (o.x + 80 < p.x) {
            this._hideBubbles();
            if (this._cleared && !this._praised && this.praiseOnClear) {
                this._praised = true;
                gm.playerJumpSucceeded();
            }
            this._done = true;
            return;
        }
        if (this._done) return;

        if (this.teach && !this._prompted && !player.isAirborne && gm.state === GameState.Running
            && p.x < o.x && (o.x - p.x) <= this.promptDistance) {
            this._prompted = true;
            gm.requestJumpPrompt(this);
        }

        const pxc = p.x;
        const pyc = p.y;
        const oxc = o.x;
        const oyc = o.y + this.hitOffsetY;

        const xOverlap = Math.abs(pxc - oxc) < player.hitHalfWidth + this.hitHalfWidth;
        if (xOverlap) {
            const feetY = pyc - player.hitHalfHeight;
            const topY = oyc + this.hitHalfHeight;
            if (feetY >= topY) {
                this._cleared = true;
            } else if (!player.isInvulnerable) {
                this._hit = true;
                this._hideBubbles();
                gm.playerHit(this);
                return;
            }
        }
    }
}