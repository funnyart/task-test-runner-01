import { _decorator, Component, UITransform, Rect, UIOpacity, Sprite, Color } from 'cc';
import type { GameManager } from './GameManager';
import { SpriteAnimator } from './SpriteAnimator';

const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property({ tooltip: 'скорость бега вправо (px/s)' })
    runSpeed = 340;

    @property({ tooltip: 'толчок вверх при старте прыжка (px/s)' })
    jumpVelocity = 800;

    @property({ tooltip: 'гравитация (px/s^2) — меньше = выше и дольше прыжок' })
    gravity = 1400;

    @property({ tooltip: 'длительность неуязвимости после урона (s)' })
    invulnerableTime = 0.5;

    @property({ tooltip: 'частота мигания во время неуязвимости (s)' })
    blinkInterval = 0.08;

    @property({ type: Color, tooltip: 'цвет мигания при уроне' })
    hitFlashColor = new Color(255, 70, 70, 255);

    @property({ tooltip: 'полуширина хитбокса для столкновений (px)' })
    hitHalfWidth = 30;

    @property({ tooltip: 'полувысота хитбокса, отсчитывается от центра вниз (px)' })
    hitHalfHeight = 80;

    public game: GameManager = null;

    private _animator: SpriteAnimator = null;
    private _ui: UITransform = null;
    private _opacity: UIOpacity = null;
    private _sprite: Sprite = null;
    private _spriteColor: Color = null;
    private _groundY = 0;
    private _curY = 0;
    private _vy = 0;
    private _airborne = false;
    private _invulnerable = false;
    private _invulnTimer = 0;
    private _blinkTimer = 0;
    private _blinkOn = true;

    public get isAirborne(): boolean { return this._airborne; }
    public get isInvulnerable(): boolean { return this._invulnerable; }

    onLoad() {
        this._animator = this.getComponent(SpriteAnimator);
        this._ui = this.getComponent(UITransform);
        if (!this._ui) this._ui = this.addComponent(UITransform);
        this._opacity = this.getComponent(UIOpacity);
        if (!this._opacity) this._opacity = this.addComponent(UIOpacity);
        this._groundY = this.node.position.y;
        this._curY = this._groundY;
    }

    public setGame(g: GameManager) {
        this.game = g;
    }

    public getBounds(): Rect {
        if (this._ui) {
            return this._ui.getBoundingBoxToWorld();
        }
        return new Rect(0, 0, 0, 0);
    }

    update(dt: number) {
        const gm = this.game;
        const move = !!gm && gm.allowsMovement;

        if (move) {
            const x = this.node.position.x + this.runSpeed * dt;
            if (this._airborne) {
                this._curY += this._vy * dt;
                this._vy -= this.gravity * dt;
                if (this._curY <= this._groundY) {
                    this._curY = this._groundY;
                    this._vy = 0;
                    this._airborne = false;
                    if (this._animator) this._animator.play('run', true);
                }
            }
            this.node.setPosition(x, this._curY, 0);
        }

        this._resolveSprite();
        this._updateInvulnerability(dt);
        if (!this._invulnerable) this._restoreColor();
    }

    private _resolveSprite() {
        if (this._sprite) return;
        this._sprite = this._animator && this._animator.sprite
            ? this._animator.sprite
            : this.getComponent(Sprite);
        if (this._sprite && !this._spriteColor) this._spriteColor = this._sprite.color.clone();
    }

    public jump() {
        if (this._airborne) return;
        const gm = this.game;
        if (gm && !gm.canPlay()) return;
        this._airborne = true;
        this._curY = this._groundY;
        this._vy = this.jumpVelocity;
        if (this._animator) this._animator.play('jump', false);
    }

    public hurt() {
        if (this._invulnerable) return;
        this._invulnerable = true;
        this._invulnTimer = this.invulnerableTime;
        this._blinkTimer = 0;
        this._blinkOn = true;
        if (this._animator) {
            this._animator.play('hurt', false, () => {
                if (this._animator && !this._airborne) this._animator.play('run', true);
            });
        }
    }

    public toIdle() {
        if (this._animator) this._animator.play('idle', true);
    }

    public toRun() {
        if (this._animator) this._animator.play('run', true);
    }

    public stopAll() {
        if (this._animator) this._animator.play('idle', true);
    }

    private _updateInvulnerability(dt: number) {
        if (!this._invulnerable) return;
        this._invulnTimer -= dt;
        this._blinkTimer -= dt;
        if (this._blinkTimer <= 0) {
            this._blinkTimer = this.blinkInterval;
            this._blinkOn = !this._blinkOn;
            this._applyFlash();
        }
        if (this._invulnTimer <= 0) {
            this._invulnerable = false;
            this._restoreColor();
        }
    }

    private _restoreColor() {
        if (this._opacity) this._opacity.opacity = 255;
        if (this._sprite && this._spriteColor) this._sprite.color = this._spriteColor;
    }

    private _applyFlash() {
        if (this._opacity) this._opacity.opacity = 255;
        if (this._sprite && this._spriteColor) {
            this._sprite.color = this._blinkOn ? this.hitFlashColor : this._spriteColor;
        }
    }
}