import { _decorator, Component, Node, v3, instantiate, Color, UIOpacity, UITransform, Label, tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FloatingTextSpawner')
export class FloatingTextSpawner extends Component {
    @property({ type: Node, tooltip: 'шаблон-нода с Label (клонируется в пул). Пусто = создаётся на лету' })
    templateNode: Node = null;

    @property({ tooltip: 'размер шрифта всплывающих надписей (если шаблон пуст)' })
    fontSize = 44;

    @property({ tooltip: 'насколько поднимается надпись (px)' })
    riseDistance = 80;

    @property
    duration = 0.9;

    @property({ type: Color, tooltip: 'цвет похвалы (Great!/Awesome!)' })
    color = new Color(130, 255, 130, 255);

    @property({ type: Color, tooltip: 'цвет текста про монеты (+N$)' })
    coinColor = new Color(255, 213, 70, 255);

    @property([String])
    words: string[] = ['Great!', 'Awesome!'];

    private _pool: Label[] = [];

    public show(text: string, color?: Color) {
        if (this._isShowing()) return;

        const label = this._spawn();
        label.string = text;
        label.color = color || Color.WHITE;

        const node = label.node;
        const op = node.getComponent(UIOpacity);

        node.active = true;
        node.setScale(1, 1, 1);
        node.setPosition(0, 0, 0);
        op.opacity = 255;

        tween(node)
            .to(this.duration, { position: v3(0, this.riseDistance, 0) }, { easing: 'quadOut' })
            .call(() => {
                node.active = false;
            })
            .start();

        tween(op)
            .delay(this.duration * 0.25)
            .to(this.duration * 0.75, { opacity: 0 }, { easing: 'quadIn' })
            .start();
    }

    public showCoins(value: number) {
        this.show('+' + value + '$', this.coinColor);
    }

    public showSuccess() {
        const arr = this.words && this.words.length ? this.words : ['Great!', 'Awesome!'];
        const word = arr[Math.floor(Math.random() * arr.length)];
        this.show(word, this.color);
    }

    private _isShowing(): boolean {
        for (const l of this._pool) {
            if (l && l.isValid && l.node.active) return true;
        }
        return false;
    }

    private _spawn(): Label {
        const existing = this._pool.find((l) => l && l.isValid && !l.node.active);
        if (existing) return existing;

        let node: Node;
        if (this.templateNode) {
            node = instantiate(this.templateNode);
        } else {
            node = new Node('FloatText');
            const ui = node.addComponent(UITransform);
            ui.setContentSize(360, 80);
            const label = node.addComponent(Label);
            label.fontSize = this.fontSize;
            label.lineHeight = this.fontSize + 6;
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
        }

        node.layer = this.node.layer;
        if (!node.getComponent(UIOpacity)) {
            node.addComponent(UIOpacity);
        }

        const label = node.getComponent(Label);
        if (!label) {
            node.destroy();
            return this._spawnFallback();
        }

        this.node.addChild(node);
        node.active = false;
        this._pool.push(label);
        return label;
    }

    private _spawnFallback(): Label {
        const node = new Node('FloatText');
        node.layer = this.node.layer;
        const ui = node.addComponent(UITransform);
        ui.setContentSize(360, 80);
        const label = node.addComponent(Label);
        label.fontSize = this.fontSize;
        label.lineHeight = this.fontSize + 6;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        node.addComponent(UIOpacity);
        node.active = false;
        this.node.addChild(node);
        this._pool.push(label);
        return label;
    }
}