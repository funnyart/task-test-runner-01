import { _decorator, Component, Node, Label, Vec3, v3, UIOpacity, tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property([Node])
    hearts: Node[] = [];

    @property({ type: Label, tooltip: 'лейбл монет в формате N$' })
    coinLabel: Label = null;

    @property({ type: Node, tooltip: 'стартовый экран (TAP TO START + палец)' })
    startPanel: Node = null;

    @property({ type: Node, tooltip: 'палец-подсказка «прыгни!»' })
    jumpHint: Node = null;

    @property({ type: Node, tooltip: 'экран победы' })
    victoryPanel: Node = null;

    @property({ type: Node, tooltip: 'экран проигрыша' })
    gameOverPanel: Node = null;

    @property({ type: Node, tooltip: 'первый экран проигрыша: затемнение + плашка (появляется анимированно)' })
    gameOverFirstPanel: Node = null;

    @property({ type: Node, tooltip: 'плашка внутри первого экрана проигрыша (пружинно выезжает)' })
    gameOverPlashka: Node = null;

    @property({ type: Node, tooltip: 'точка, к которой улетают монеты (обычно лейбл монет)' })
    coinTarget: Node = null;

    @property({ type: Node, tooltip: 'камера второго (UI) канваса — та, что не двигается за игроком' })
    uiCamera: Node = null;

    @property({ tooltip: 'скорость анимации счёта монет (+N$/сек)' })
    countSpeed = 14;

    private _coinsShown = 0;
    private _coinsTarget = 0;
    private _tickAccum = 0;

    public setup(lives: number, coins: number) {
        this.setLives(lives);
        this.setCoins(coins);
    }

    public setLives(n: number) {
        this.hearts.forEach((h, i) => {
            if (!h) return;
            h.active = true;
            let op = h.getComponent(UIOpacity);
            if (!op) op = h.addComponent(UIOpacity);
            op.opacity = i < n ? 255 : 128;
        });
    }

    public setCoins(n: number) {
        this._coinsTarget = n;
        this._applyCoins();
    }

    update(dt: number) {
        if (this._coinsShown >= this._coinsTarget) return;
        this._tickAccum += dt * this.countSpeed;
        let steps = Math.floor(this._tickAccum);
        this._tickAccum -= steps;
        this._coinsShown = Math.min(this._coinsShown + steps, this._coinsTarget);
        this._applyCoins();
    }

    private _applyCoins() {
        if (this.coinLabel) this.coinLabel.string = '$' + this._coinsShown;
    }

    public showMenu(v: boolean) {
        if (this.startPanel) this.startPanel.active = v;
    }

    public showJumpPrompt(v: boolean) {
        if (this.jumpHint) this.jumpHint.active = v;
    }

    public showVictory(v: boolean) {
        if (this.victoryPanel) this.victoryPanel.active = v;
    }

    public showGameOver(v: boolean) {
        if (this.gameOverPanel) this.gameOverPanel.active = v;
    }

    public showGameOverFirst(v: boolean) {
        if (!this.gameOverFirstPanel) return;
        if (!v) {
            this.gameOverFirstPanel.active = false;
            return;
        }
        const node = this.gameOverFirstPanel;
        node.active = true;
        let op = node.getComponent(UIOpacity);
        if (!op) op = node.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.3, { opacity: 255 }, { easing: 'quadOut' }).start();
        if (this.gameOverPlashka) {
            const pl = this.gameOverPlashka;
            pl.active = true;
            pl.setScale(0.7, 0.7, 1);
            tween(pl).delay(0.15).to(0.3, { scale: v3(1, 1, 1) }, { easing: 'backOut' }).start();
        }
    }

    public coinTargetWorldPosition(): Vec3 {
        return this.coinTarget ? this.coinTarget.worldPosition : v3(0, 0, 0);
    }

    public uiCameraWorldPosition(): Vec3 {
        return this.uiCamera ? this.uiCamera.worldPosition : v3(0, 0, 0);
    }
}