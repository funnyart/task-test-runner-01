import { _decorator, Component, AudioSource, AudioClip } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property({ type: AudioSource, tooltip: 'AudioSource (создастся сам, если пусто)' })
    source: AudioSource = null;

    @property({ type: AudioClip })
    sfxTap: AudioClip = null;

    @property({ type: AudioClip })
    sfxJump: AudioClip = null;

    @property({ type: AudioClip })
    sfxCoin: AudioClip = null;

    @property({ type: AudioClip })
    sfxHurt: AudioClip = null;

    @property({ type: AudioClip })
    sfxWin: AudioClip = null;

    @property({ type: AudioClip })
    sfxLose: AudioClip = null;

    @property({ type: AudioClip, tooltip: 'фоновая музыка (зациклится)' })
    bgm: AudioClip = null;

    onLoad() {
        if (!this.source) {
            this.source = this.getComponent(AudioSource) || this.addComponent(AudioSource);
        }
        if (this.bgm) {
            this.source.clip = this.bgm;
            this.source.loop = true;
            this.source.play();
        }
    }

    public playTap() { this._playOne(this.sfxTap); }
    public playJump() { this._playOne(this.sfxJump); }
    public playCoin() { this._playOne(this.sfxCoin); }
    public playHurt() { this._playOne(this.sfxHurt); }
    public playWin() { this._playOne(this.sfxWin); }
    public playLose() { this._playOne(this.sfxLose); }

    private _playOne(clip: AudioClip) {
        if (clip && this.source) this.source.playOneShot(clip, 1);
    }
}