import { _decorator, Component, Node, Label, v3, tween } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('WinLoseScreen')
export class WinLoseScreen extends Component {
    @property({ type: Node, tooltip: 'заголовок — появляется бабл-анимацией' })
    title: Node = null;

    @property({ type: Node, tooltip: 'главная плашка — появляется бабл-анимацией' })
    plashka: Node = null;

    @property({ type: Node, tooltip: 'световые лучи позади плашки — постоянно крутятся по часовой' })
    rays: Node = null;

    @property({ type: Node, tooltip: 'кнопка — появляется бабл-анимацией + идл-пульсация' })
    button: Node = null;

    @property({ type: Label, tooltip: 'лейбл баланса монет, собранных за уровень' })
    coinLabel: Label = null;

    @property({ tooltip: 'скорость вращения лучей (град/сек, по часовой)' })
    raySpeed = 90;

    @property({ tooltip: 'длительность появления (s)' })
    appearDuration = 0.4;

    @property({ tooltip: 'амплитуда идл-пульсации кнопки' })
    buttonIdleAmp = 0.06;

    @property({ tooltip: 'скорость идл-пульсации кнопки (циклов/сек)' })
    buttonIdleSpeed = 1.6;

    @property({ tooltip: 'включить лейбл-таймер на этом экране' })
    useCountdown = false;

    @property({ type: Node, tooltip: 'нода лейбла-таймера (сама отключится в конце)' })
    countdownNode: Node = null;

    @property({ type: Label, tooltip: 'лейбл-таймер (формат ММ:СС)' })
    countdownLabel: Label = null;

    @property({ tooltip: 'стартовое значение таймера (сек), напр. 59 = 00:59' })
    countdownStart = 59;

    private _time = 0;
    private _buttonIdle = false;
    private _countdown = 0;
    private _countdownRunning = false;

    onEnable() {
        this._playEntrance();
        if (this.coinLabel && GameManager.instance) {
            this.coinLabel.string = '$' + GameManager.instance.coins;
        }
        if (this.useCountdown && this.countdownNode) {
            this._countdown = this.countdownStart;
            this._countdownRunning = true;
            this.countdownNode.active = true;
            this._applyCountdown();
        }
    }

    onDisable() {
        this._countdownRunning = false;
        this._buttonIdle = false;
    }

    update(dt: number) {
        this._time += dt;

        if (this.rays && this.raySpeed !== 0) {
            this.rays.angle -= this.raySpeed * dt;
        }

        if (this._buttonIdle && this.button) {
            const s = 1 + this.buttonIdleAmp * Math.sin(this._time * Math.PI * 2 * this.buttonIdleSpeed);
            this.button.setScale(s, s, 1);
        }

        if (this._countdownRunning && this.countdownNode) {
            this._countdown -= dt;
            if (this._countdown <= 0) {
                this._countdown = 0;
                this._countdownRunning = false;
                this.countdownNode.active = false;
            } else {
                this._applyCountdown();
            }
        }
    }

    private _playEntrance() {
        const dur = this.appearDuration;

        if (this.title) {
            this.title.setScale(0.3, 0.3, 1);
            tween(this.title).to(dur, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
        }

        if (this.plashka) {
            this.plashka.setScale(0.6, 0.6, 1);
            tween(this.plashka)
                .delay(dur * 0.3)
                .to(dur, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }

        if (this.button) {
            this._buttonIdle = false;
            this.button.setScale(0, 0, 1);
            tween(this.button)
                .delay(dur * 0.6)
                .to(dur, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                .call(() => { this._buttonIdle = true; })
                .start();
        }
    }

    private _applyCountdown() {
        if (!this.countdownLabel) return;
        const total = Math.max(0, Math.ceil(this._countdown));
        const m = Math.floor(total / 60);
        const s = total % 60;
        this.countdownLabel.string = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
}