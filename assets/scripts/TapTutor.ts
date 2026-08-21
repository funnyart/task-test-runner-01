import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TapTutor')
export class TapTutor extends Component {
    @property({ tooltip: 'насколько «продавливается» при нажатии (часть масштаба)' })
    pressAmount = 0.28;

    @property({ tooltip: 'длительность цикла «нажал — отпустил» (сек)' })
    period = 1.1;

    private _time = 0;
    private _base = 1;

    onLoad() {
        this._base = this.node.scale.x || 1;
    }

    update(dt: number) {
        this._time += dt;
        if (this.period <= 0) return;
        const pulse = Math.max(0, Math.sin((this._time / this.period) * Math.PI * 2));
        const s = this._base * (1 - pulse * this.pressAmount);
        this.node.setScale(s, s, 1);
    }
}