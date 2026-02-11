/* ========================================
   MATH ISLAND - Audio System
   Procedural sound generation using Web Audio API
   ======================================== */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.6;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicOscillators = [];
        this.isPlayingMusic = false;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play a note
    playNote(freq, duration, type = 'sine', gainNode = null) {
        if (!this.ctx || !this.sfxEnabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gainNode || this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Correct answer sound - happy ascending arpeggio
    playCorrect() {
        if (!this.ctx || !this.sfxEnabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.2, 'sine'), i * 80);
        });
    }

    // Wrong answer sound - descending
    playWrong() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.playNote(300, 0.3, 'square');
        setTimeout(() => this.playNote(200, 0.4, 'square'), 150);
    }

    // Button navigate sound
    playNavigate() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.playNote(880, 0.05, 'sine');
    }

    // Button select sound
    playSelect() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.playNote(660, 0.08, 'sine');
        setTimeout(() => this.playNote(880, 0.08, 'sine'), 50);
    }

    // Star earned
    playStar() {
        if (!this.ctx || !this.sfxEnabled) return;
        const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.3, 'sine'), i * 100);
        });
    }

    // Level complete fanfare
    playFanfare() {
        if (!this.ctx || !this.sfxEnabled) return;
        const melody = [
            [523, 0.15], [523, 0.15], [523, 0.15], [523, 0.4],
            [415, 0.4], [466, 0.4], [523, 0.2], [466, 0.15], [523, 0.6]
        ];
        let time = 0;
        melody.forEach(([freq, dur]) => {
            setTimeout(() => this.playNote(freq, dur, 'sine'), time * 1000);
            time += dur;
        });
    }

    // Streak sound
    playStreak(count) {
        if (!this.ctx || !this.sfxEnabled) return;
        const baseFreq = 440 + (count * 50);
        this.playNote(baseFreq, 0.15, 'sine');
        setTimeout(() => this.playNote(baseFreq * 1.5, 0.15, 'sine'), 60);
    }

    // Background music - simple procedural loop
    startMusic() {
        if (!this.ctx || !this.musicEnabled || this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.isPlayingMusic || !this.musicEnabled) return;

        const scale = [262, 294, 330, 349, 392, 440, 494, 523]; // C major scale
        const rhythm = [0.4, 0.4, 0.2, 0.4, 0.2, 0.4, 0.4, 0.4];
        const melody = [0, 2, 4, 5, 4, 2, 3, 0].map(i => scale[i]);

        let time = 0;
        melody.forEach((freq, i) => {
            setTimeout(() => {
                if (!this.isPlayingMusic) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + rhythm[i]);
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.start();
                osc.stop(this.ctx.currentTime + rhythm[i]);
            }, time * 1000);
            time += rhythm[i];
        });

        // Loop
        setTimeout(() => this._playMusicLoop(), time * 1000);
    }

    stopMusic() {
        this.isPlayingMusic = false;
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.musicEnabled;
    }
}

const audio = new AudioManager();
