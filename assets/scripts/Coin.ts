import { _decorator, Component, Vec3, v3, tween } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('Coin')
export class Coin extends Component {
    @property({ tooltip: 'ценность монеты (прибавится к счётчику N$)' })
    value = 5;

    @property({ tooltip: 'радиус сбора, когда игрок касается монеты (px)' })
    collectRadius = 70;

    @property({ tooltip: 'покачиваться на месте до сбора' })
    bob = true;

    @property({ tooltip: 'длительность полёта к счётчику (s)' })
    flyDuration = 0.45;

    private _collected = false;
    private _flying = false;
    private _bobTween = null;
    private _flyTime = 0;
    private _flyStart: Vec3 = null;

    onLoad() {
        if (this.bob) {
            this._bobTween = tween(this.node)
                .by(0.5, { position: v3(0, 14, 0) }, { easing: 'sineInOut' })
                .by(0.5, { position: v3(0, -14, 0) }, { easing: 'sineInOut' })
                .union()
                .repeatForever()
                .start();
        }
    }

    onDisable() {
        if (this._bobTween) {
            this._bobTween.stop();
            this._bobTween = null;
        }
    }

    update(dt: number) {
        if (this._collected && !this._flying) return;

        if (this._flying) {
            this._updateFlight(dt);
            return;
        }

        const gm = GameManager.instance;
        if (!gm || !gm.player || !gm.canPlay()) return;

        const p = gm.player.node.worldPosition;
        const c = this.node.worldPosition;
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        if (dx * dx + dy * dy <= this.collectRadius * this.collectRadius) {
            this._collect();
        }
    }

    private _collect() {
        if (this._collected) return;
        this._collected = true;
        if (this._bobTween) {
            this._bobTween.stop();
            this._bobTween = null;
        }

        const gm = GameManager.instance;
        if (gm) {
            if (gm.audio) gm.audio.playCoin();
        }

        this._flyStart = this.node.worldPosition.clone();
        this._flyTime = 0;
        this._flying = true;
    }

    private _updateFlight(dt: number) {
        this._flyTime += dt;
        const t = Math.min(1, this._flyTime / this.flyDuration);
        const eased = t * t;

        const target = this._currentTarget();
        const pos = v3(
            this._flyStart.x + (target.x - this._flyStart.x) * eased,
            this._flyStart.y + (target.y - this._flyStart.y) * eased,
            0,
        );
        this.node.setWorldPosition(pos);

        const scale = 1 - 0.7 * eased;
        this.node.setScale(scale, scale, 1);

        if (t >= 1) {
            this._flying = false;
            const g = GameManager.instance;
            if (g) g.addCoins(this.value);
            this.node.destroy();
        }
    }

    private _currentTarget(): Vec3 {
        const gm = GameManager.instance;
        if (!gm || !gm.ui) return this._flyStart;

        const base = gm.ui.coinTargetWorldPosition();
        const gameCam = gm.camera ? gm.camera.node.worldPosition : v3(0, 0, 0);
        const uiCam = gm.ui.uiCameraWorldPosition();

        return v3(
            base.x + gameCam.x - uiCam.x,
            base.y + gameCam.y - uiCam.y,
            base.z,
        );
    }
}