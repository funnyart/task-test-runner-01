import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { TimeFrozen } from './TimeFrozen';

const { ccclass, property } = _decorator;

@ccclass('SpriteAnimClip')
export class SpriteAnimClip {
    @property({ tooltip: 'имя клипа, напр. idle / run / jump / hurt / default' })
    name = 'default';

    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    @property({ min: 1, max: 60 })
    fps = 10;

    @property
    loop = true;
}

@ccclass('SpriteAnimator')
export class SpriteAnimator extends Component {
    @property({ type: Sprite, tooltip: 'на какой спрайт ставить кадры (по умолчанию свой Sprite)' })
    sprite: Sprite = null;

    @property([SpriteAnimClip])
    clips: SpriteAnimClip[] = [];

    private _playback: SpriteAnimClip = null;
    private _key = '';
    private _frame = 0;
    private _timer = 0;
    private _looping = true;
    private _onDone: (() => void) = null;
    private _defaultKey = '';

    onLoad() {
        if (!this.sprite) {
            this.sprite = this.getComponent(Sprite);
        }
        if (this.clips.length > 0) {
            this._defaultKey = this.clips[0].name;
        }
    }

    onEnable() {
        if (!this._playback && this.clips.length > 0) {
            this.play(this._defaultKey, true);
        }
    }

    public get isPlaying(): boolean {
        return this._playback !== null;
    }

    public get currentKey(): string {
        return this._key;
    }

    public play(key: string, loop = true, onComplete?: () => void) {
        const clip = this.clips.find((c) => c.name === key);
        if (!clip || clip.frames.length === 0) {
            return;
        }
        if (key === this._key && this._playback) {
            this._looping = loop;
            if (onComplete) this._onDone = onComplete;
            return;
        }
        this._playback = clip;
        this._key = key;
        this._frame = 0;
        this._timer = 0;
        this._looping = loop;
        this._onDone = onComplete || null;
        this._applyFrame();
    }

    public playOnce(key: string, onComplete?: () => void) {
        this.play(key, false, onComplete);
    }

    public stop() {
        this._playback = null;
        this._onDone = null;
    }

    update(dt: number) {
        if (!this._playback || this._playback.frames.length === 0) return;
        if (TimeFrozen.value) return;
        this._timer += dt;
        const frameTime = 1 / this._playback.fps;
        let changed = false;
        while (this._timer >= frameTime) {
            this._timer -= frameTime;
            this._frame++;
            changed = true;
            if (this._frame >= this._playback.frames.length) {
                if (this._looping) {
                    this._frame = 0;
                } else {
                    this._frame = this._playback.frames.length - 1;
                    this._finishOnce();
                    break;
                }
            }
        }
        if (changed) this._applyFrame();
    }

    private _applyFrame() {
        if (this._playback && this.sprite) {
            this.sprite.spriteFrame = this._playback.frames[this._frame];
        }
    }

    private _finishOnce() {
        const cb = this._onDone;
        this._onDone = null;
        this._playback = null;
        this._key = '';
        if (cb) cb();
    }
}