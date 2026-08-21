import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Bubble')
export class Bubble extends Component {
    @property({ tooltip: 'амплитуда пульсации масштаба (часть базового)' })
    amp = 0.08;

    @property({ tooltip: 'скорость пульсации (циклов в секунду)' })
    speed = 1.5;

    @property({ tooltip: 'начальная фаза пульсации (радианы)' })
    phase = 0;

    @property({ tooltip: 'случайная фаза при старте (чтобы кнопки не пульсировали синхронно)' })
    randomPhase = true;

    private _time = 0;
    private _base = 1;

    onLoad() {
        this._base = this.node.scale.x || 1;
        if (this.randomPhase) this.phase = Math.random() * Math.PI * 2;
    }

    onDisable() {
        this._time = 0;
    }

    update(dt: number) {
        this._time += dt;
        const s = this._base * (1 + Math.sin(this._time * Math.PI * 2 * this.speed + this.phase) * this.amp);
        this.node.setScale(s, s, 1);
    }
}