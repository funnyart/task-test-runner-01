import { _decorator, Component, Node, Button, input, Input, EventTouch } from 'cc';
import type { Obstacle } from './Obstacle';
import { Rope } from './Rope';
import { PlayerController } from './PlayerController';
import { UIManager } from './UIManager';
import { CameraFollow } from './CameraFollow';
import { FloatingTextSpawner } from './FloatingTextSpawner';
import { AudioManager } from './AudioManager';
import { GameState } from './GameState';
import { TimeFrozen } from './TimeFrozen';
import { SuperHtmlPlayable } from './super_html_playable';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null;

    @property({ type: Node, tooltip: 'нода игрока (с компонентом PlayerController)' })
    playerNode: Node = null;

    @property(UIManager)
    ui: UIManager = null;

    @property(CameraFollow)
    camera: CameraFollow = null;

    @property(FloatingTextSpawner)
    floating: FloatingTextSpawner = null;

    @property(AudioManager)
    audio: AudioManager = null;

    @property({ type: Node, tooltip: 'нода, которая отключается при открытии любого экрана победы/проигрыша' })
    disableOnEnd: Node = null;

    @property({ type: [Rope], tooltip: 'половинки финишной ленты/веревки — разрезаются при победе' })
    ropes: Rope[] = [];

    @property({ tooltip: 'сколько жизней (сердечек) у игрока' })
    maxLives = 3;

    @property({ tooltip: 'задержка перед показом первого экрана проигрыша после потери последней жизни (s)' })
    gameOverDelay = 1;

    @property({ tooltip: 'задержка перед сменой первого экрана проигрыша на второй (s)' })
    gameOverFirstDelay = 1;

    @property({ tooltip: 'Google Play ссылка (для super_html_playable)' })
    googlePlayUrl: string = 'https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded';

    @property({ tooltip: 'App Store ссылка (опционально)' })
    appStoreUrl: string = '';

    @property({ tooltip: 'Unity-режим: переход в стор только через CTA-кнопки, не по клику по экрану' })
    enableUnity = false;

    @property({ tooltip: 'One-Click: автоматический переход в стор после открытия финального экрана' })
    enableOneClick = false;

    @property({ type: [Node], tooltip: 'CTA-кнопки (клик = download через super-html)' })
    ctaButtons: Node[] = [];

    @property({ type: Button, tooltip: 'кнопка Unity-режима (разрез, если enableUnity)' })
    unityButton: Button = null;

    private _player: PlayerController = null;
    private _state: GameState = GameState.Menu;
    private _lives = 3;
    private _coins = 0;
    private _deathLocked = false;
    private _sentGameEnd = false;
    private _endReady = false;
    private _ctaFired = false;

    public get state(): GameState { return this._state; }
    public get player(): PlayerController { return this._player; }
    public get lives(): number { return this._lives; }
    public get coins(): number { return this._coins; }

    public get allowsMovement(): boolean {
        return this._state === GameState.Running;
    }

    public canPlay(): boolean {
        return this._state === GameState.Running || this._state === GameState.JumpPrompt;
    }

    onLoad() {
        GameManager.instance = this;
        if (this.playerNode) {
            this._player = this.playerNode.getComponent(PlayerController);
            if (this._player) this._player.setGame(this);
        }
        if (this.googlePlayUrl) SuperHtmlPlayable.set_google_play_url(this.googlePlayUrl);
        if (this.appStoreUrl) SuperHtmlPlayable.set_app_store_url(this.appStoreUrl);
        this._bindCtaButtons();
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        if (GameManager.instance === this) GameManager.instance = null;
    }

    start() {
        TimeFrozen.value = false;
        this._lives = this.maxLives;
        this._coins = 0;
        if (this.ui) {
            this.ui.setup(this._lives, this._coins);
            this.ui.showMenu(true);
            this.ui.showJumpPrompt(false);
            this.ui.showVictory(false);
            this.ui.showGameOver(false);
            this.ui.showGameOverFirst(false);
        }
        if (this._player) this._player.toIdle();
        if (this.camera) this.camera.snapToTarget();
    }

    private _onTouchStart(e: EventTouch) {
        switch (this._state) {
            case GameState.Menu:
                this.startGame();
                break;
            case GameState.Running:
                this._tryJump();
                break;
            case GameState.JumpPrompt:
                this._state = GameState.Running;
                TimeFrozen.value = false;
                if (this.ui) this.ui.showJumpPrompt(false);
                this._tryJump();
                break;
            case GameState.Victory:
            case GameState.GameOver:
                if (this._endReady && !this.enableUnity) this._openCta();
                break;
            default:
                break;
        }
    }

    private _bindCtaButtons() {
        for (const n of this.ctaButtons) {
            if (!n) continue;
            const btn = n.getComponent(Button);
            if (btn) btn.node.on(Button.EventType.CLICK, this._openCta, this);
            else n.on(Node.EventType.TOUCH_END, this._openCta, this);
        }
        if (this.unityButton) {
            this.unityButton.node.on(Button.EventType.CLICK, this._openCta, this);
        }
    }

    private _gameEnd() {
        if (this._sentGameEnd) return;
        this._sentGameEnd = true;
        SuperHtmlPlayable.game_end();
    }

    private _openCta() {
        SuperHtmlPlayable.download();
    }

    private _maybeOneClick() {
        if (this.enableOneClick && !this._ctaFired && (this.googlePlayUrl || this.appStoreUrl)) {
            this._ctaFired = true;
            this.scheduleOnce(() => this._openCta(), 0.5);
        }
    }

    private _tryJump() {
        if (this._player) {
            this._player.jump();
            if (this.audio) this.audio.playJump();
        }
    }

    public startGame() {
        this._state = GameState.Running;
        TimeFrozen.value = false;
        if (this.ui) this.ui.showMenu(false);
        if (this._player) this._player.toRun();
        if (this.audio) this.audio.playTap();
    }

    public requestJumpPrompt(obstacle: Obstacle) {
        if (this._state !== GameState.Running) return;
        this._state = GameState.JumpPrompt;
        TimeFrozen.value = true;
        if (this.ui) this.ui.showJumpPrompt(true);
    }

    public playerJumpSucceeded() {
        if (this.floating) this.floating.showSuccess();
    }

    public playerHit(obstacle: Obstacle) {
        if (!this.canPlay() || !this._player) return;
        this._lives--;
        if (this.ui) this.ui.setLives(this._lives);
        if (this.audio) this.audio.playHurt();
        if (this._player) this._player.hurt();
        if (this._lives <= 0) this.gameOver();
    }

    public addCoins(value: number) {
        this._coins += value;
        if (this.ui) this.ui.setCoins(this._coins);
    }

    private _disableEndUI() {
        if (this.disableOnEnd && this.disableOnEnd.isValid) this.disableOnEnd.active = false;
    }

    public victory() {
        if (this._state !== GameState.Running) return;
        this._state = GameState.Victory;
        this._disableEndUI();
        for (const r of this.ropes) if (r) r.cut();
        if (this._player) this._player.stopAll();
        if (this.ui) {
            this.ui.showJumpPrompt(false);
            this.ui.showVictory(true);
        }
        if (this.audio) this.audio.playWin();
        this._gameEnd();
        this._endReady = true;
        this._maybeOneClick();
    }

    public gameOver() {
        if (this._deathLocked) return;
        this._deathLocked = true;
        if (this.ui) this.ui.showJumpPrompt(false);
        if (this.audio) this.audio.playLose();
        this.scheduleOnce(() => {
            if (this._state === GameState.Victory || this._state === GameState.GameOver) return;
            this._state = GameState.GameOver;
            this._disableEndUI();
            if (this._player) this._player.stopAll();
            if (this.ui) this.ui.showGameOverFirst(true);
            this.scheduleOnce(() => {
                if (this._state !== GameState.GameOver) return;
                if (this.ui) {
                    this.ui.showGameOverFirst(false);
                    this.ui.showGameOver(true);
                }
                this._gameEnd();
                this._endReady = true;
                this._maybeOneClick();
            }, this.gameOverFirstDelay);
        }, this.gameOverDelay);
    }
}