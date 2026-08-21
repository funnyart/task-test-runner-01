import { _decorator, Component } from 'cc';
import { GameManager } from './GameManager';

const { ccclass } = _decorator;

@ccclass('FinishLine')
export class FinishLine extends Component {
    update() {
        const gm = GameManager.instance;
        if (!gm || !gm.player || !gm.canPlay()) return;
        if (gm.player.node.worldPosition.x >= this.node.worldPosition.x) {
            gm.victory();
        }
    }
}