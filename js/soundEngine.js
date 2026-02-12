/**
 * Property Tycoon - Sound Engine
 * Web Audio API based sound effects for game events
 * No external audio files needed - all sounds are synthesized
 */

class SoundEngine {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
        this.volume = 0.3;
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called from user interaction)
     */
    init() {
        if (this.initialized) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available');
            this.enabled = false;
        }
    }

    /**
     * Ensure audio context is running
     */
    ensureContext() {
        if (!this.initialized) this.init();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /**
     * Play dice roll sound
     */
    playDiceRoll() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        // Multiple short clicks to simulate dice shaking
        for (let i = 0; i < 6; i++) {
            const time = ctx.currentTime + i * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.value = 300 + Math.random() * 400;
            gain.gain.setValueAtTime(this.volume * 0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            osc.start(time);
            osc.stop(time + 0.05);
        }

        // Final landing thud
        const thud = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thud.connect(thudGain);
        thudGain.connect(ctx.destination);
        thud.type = 'sine';
        thud.frequency.value = 100;
        thudGain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime + 0.5);
        thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        thud.start(ctx.currentTime + 0.5);
        thud.stop(ctx.currentTime + 0.7);
    }

    /**
     * Play coin/money sound
     */
    playMoney() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        const frequencies = [1200, 1400, 1600];
        frequencies.forEach((freq, i) => {
            const time = ctx.currentTime + i * 0.06;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.start(time);
            osc.stop(time + 0.15);
        });
    }

    /**
     * Play purchase/buy sound
     */
    playPurchase() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    /**
     * Play negative event sound (rent, tax, jail)
     */
    playNegative() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    /**
     * Play card draw sound
     */
    playCardDraw() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        // Swoosh effect
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    }

    /**
     * Play victory fanfare
     */
    playVictory() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const time = ctx.currentTime + i * 0.2;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            osc.start(time);
            osc.stop(time + 0.4);
        });
    }

    /**
     * Play build/construction sound
     */
    playBuild() {
        if (!this.enabled) return;
        this.ensureContext();
        const ctx = this.audioCtx;
        if (!ctx) return;

        for (let i = 0; i < 3; i++) {
            const time = ctx.currentTime + i * 0.1;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.value = 200 + i * 100;
            gain.gain.setValueAtTime(this.volume * 0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
            osc.start(time);
            osc.stop(time + 0.08);
        }
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set volume (0.0 - 1.0)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Global sound engine instance
const soundEngine = new SoundEngine();
