/* ========================================
   MATH ISLAND - Audio System
   Procedural sound generation using Web Audio API
   Zone-themed music, rich SFX, all procedural
   ======================================== */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.6;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicTimeouts = [];
        this.isPlayingMusic = false;
        this.currentZone = null;
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

    // ========================================
    //  Core note-playing utilities
    // ========================================

    // Play a single note into a given destination gain node
    playNote(freq, duration, type, gainNode) {
        if (!this.ctx || !this.sfxEnabled) return;
        type = type || 'sine';
        gainNode = gainNode || this.sfxGain;

        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Play a note at a specific future time (for precise scheduling)
    _schedNote(freq, startTime, duration, type, volume, dest) {
        if (!this.ctx) return;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        var vol = (volume !== undefined) ? volume : 0.15;
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration - 0.01);
        osc.connect(gain);
        gain.connect(dest || this.musicGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
        return osc;
    }

    // Play two notes simultaneously for a richer harmonic
    _playChord(freqs, duration, type, gainNode, volume) {
        if (!this.ctx || !this.sfxEnabled) return;
        gainNode = gainNode || this.sfxGain;
        type = type || 'sine';
        var vol = (volume !== undefined) ? volume : 0.2;
        var t = this.ctx.currentTime;

        for (var i = 0; i < freqs.length; i++) {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freqs[i];
            gain.gain.setValueAtTime(vol / freqs.length, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + duration);
            osc.connect(gain);
            gain.connect(gainNode);
            osc.start(t);
            osc.stop(t + duration);
        }
    }

    // Play a note with delay repeats (echo effect for cave music etc.)
    _playNoteWithDelay(freq, duration, type, delayTime, repeats, dest, volume) {
        if (!this.ctx) return;
        var t = this.ctx.currentTime;
        var vol = (volume !== undefined) ? volume : 0.15;
        dest = dest || this.musicGain;

        for (var r = 0; r <= repeats; r++) {
            var v = vol * Math.pow(0.45, r);
            if (v < 0.005) break;
            this._schedNote(freq, t + r * delayTime, duration, type, v, dest);
        }
    }

    // ========================================
    //  Sound Effects
    // ========================================

    // Correct answer - satisfying "ding" with richer harmonics
    playCorrect() {
        if (!this.ctx || !this.sfxEnabled) return;
        var t = this.ctx.currentTime;

        // Main bell tone (sine + triangle layered for "ding" quality)
        var bellNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        for (var i = 0; i < bellNotes.length; i++) {
            (function(self, freq, idx) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    // Sine fundamental
                    var osc1 = self.ctx.createOscillator();
                    var osc2 = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();

                    osc1.type = 'sine';
                    osc1.frequency.value = freq;
                    osc2.type = 'triangle';
                    osc2.frequency.value = freq * 2.0; // Octave harmonic for bell quality

                    var now = self.ctx.currentTime;
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(self.sfxGain);

                    osc1.start(now);
                    osc2.start(now);
                    osc1.stop(now + 0.3);
                    osc2.stop(now + 0.3);
                }, idx * 70);
            })(this, bellNotes[i], i);
        }

        // Final shimmer on the high note
        var self = this;
        setTimeout(function() {
            if (!self.ctx || !self.sfxEnabled) return;
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 2093;
            gain.gain.setValueAtTime(0.1, self.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, self.ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(self.sfxGain);
            osc.start();
            osc.stop(self.ctx.currentTime + 0.4);
        }, 280);
    }

    // Wrong answer - gentle "boop boop" instead of harsh buzz
    playWrong() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;

        // First boop - soft sine
        var osc1 = this.ctx.createOscillator();
        var gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.15);
        gain1.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start();
        osc1.stop(this.ctx.currentTime + 0.2);

        // Second boop - lower, slightly longer
        setTimeout(function() {
            if (!self.ctx || !self.sfxEnabled) return;
            var osc2 = self.ctx.createOscillator();
            var gain2 = self.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(350, self.ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(250, self.ctx.currentTime + 0.2);
            gain2.gain.setValueAtTime(0.22, self.ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, self.ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(self.sfxGain);
            osc2.start();
            osc2.stop(self.ctx.currentTime + 0.25);

            // Subtle triangle undertone for "sadness"
            var osc3 = self.ctx.createOscillator();
            var gain3 = self.ctx.createGain();
            osc3.type = 'triangle';
            osc3.frequency.value = 200;
            gain3.gain.setValueAtTime(0.08, self.ctx.currentTime);
            gain3.gain.exponentialRampToValueAtTime(0.005, self.ctx.currentTime + 0.3);
            osc3.connect(gain3);
            gain3.connect(self.sfxGain);
            osc3.start();
            osc3.stop(self.ctx.currentTime + 0.3);
        }, 180);
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
        var self = this;
        setTimeout(function() { self.playNote(880, 0.08, 'sine'); }, 50);
    }

    // Star earned - sparkling ascending
    playStar() {
        if (!this.ctx || !this.sfxEnabled) return;
        var notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6
        var self = this;
        for (var i = 0; i < notes.length; i++) {
            (function(idx) {
                setTimeout(function() {
                    self.playNote(notes[idx], 0.3, 'sine');
                    // Add triangle shimmer
                    self.playNote(notes[idx] * 2, 0.2, 'triangle');
                }, idx * 100);
            })(i);
        }
    }

    // Level complete fanfare - celebratory Mario-style
    playFanfare() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;

        // Main melody - triumphant progression
        var melody = [
            // Note, duration, delay-from-start
            [523.25, 0.12, 0],       // C5
            [523.25, 0.12, 0.13],    // C5
            [523.25, 0.12, 0.26],    // C5
            [523.25, 0.35, 0.40],    // C5 (held)
            [415.30, 0.35, 0.78],    // Ab4
            [466.16, 0.35, 1.16],    // Bb4
            [523.25, 0.18, 1.54],    // C5
            [466.16, 0.12, 1.74],    // Bb4
            [523.25, 0.15, 1.88],    // C5
            [659.25, 0.15, 2.06],    // E5
            [783.99, 0.15, 2.24],    // G5
            [1046.50, 0.50, 2.42],   // C6 (big finish)
            [783.99, 0.15, 2.60],    // G5
            [1046.50, 0.70, 2.78]    // C6 (final hold)
        ];

        for (var i = 0; i < melody.length; i++) {
            (function(note, dur, delay) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    // Main tone
                    var osc1 = self.ctx.createOscillator();
                    var osc2 = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.value = note;
                    osc2.type = 'triangle';
                    osc2.frequency.value = note;
                    var now = self.ctx.currentTime;
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(self.sfxGain);
                    osc1.start(now);
                    osc2.start(now);
                    osc1.stop(now + dur);
                    osc2.stop(now + dur);
                }, delay * 1000);
            })(melody[i][0], melody[i][1], melody[i][2]);
        }

        // Harmony layer - sustained chords underneath
        var chords = [
            [[261.63, 329.63, 392.00], 0.70, 0.40],  // C major
            [[349.23, 440.00, 523.25], 0.70, 1.16],   // F major
            [[392.00, 493.88, 587.33], 0.70, 1.88],   // G major
            [[523.25, 659.25, 783.99], 0.90, 2.42]    // C major (high)
        ];

        for (var c = 0; c < chords.length; c++) {
            (function(freqs, dur, delay) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    self._playChord(freqs, dur, 'sine', self.sfxGain, 0.12);
                }, delay * 1000);
            })(chords[c][0], chords[c][1], chords[c][2]);
        }
    }

    // Streak sound - dramatic escalation with each streak level
    playStreak(count) {
        if (!this.ctx || !this.sfxEnabled) return;
        count = count || 1;
        var self = this;

        // Base frequency rises with streak
        var baseFreq = 440 + (Math.min(count, 10) * 60);

        // Number of notes increases with streak (2 to 5 notes)
        var numNotes = Math.min(2 + Math.floor(count / 3), 5);

        // Speed increases with streak
        var noteGap = Math.max(40, 80 - count * 5);

        for (var i = 0; i < numNotes; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    var freq = baseFreq * (1 + idx * 0.25);
                    var now = self.ctx.currentTime;

                    // Main tone
                    var osc1 = self.ctx.createOscillator();
                    var gain1 = self.ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.value = freq;
                    gain1.gain.setValueAtTime(0.2, now);
                    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                    osc1.connect(gain1);
                    gain1.connect(self.sfxGain);
                    osc1.start(now);
                    osc1.stop(now + 0.18);

                    // Harmonic shimmer for high streaks
                    if (count >= 5) {
                        var osc2 = self.ctx.createOscillator();
                        var gain2 = self.ctx.createGain();
                        osc2.type = 'triangle';
                        osc2.frequency.value = freq * 2;
                        gain2.gain.setValueAtTime(0.08, now);
                        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
                        osc2.connect(gain2);
                        gain2.connect(self.sfxGain);
                        osc2.start(now);
                        osc2.stop(now + 0.15);
                    }
                }, idx * noteGap);
            })(i);
        }

        // At streak 10+, add a chord burst at the end
        if (count >= 10) {
            setTimeout(function() {
                self._playChord(
                    [baseFreq * 1.5, baseFreq * 2, baseFreq * 2.5],
                    0.3, 'sine', self.sfxGain, 0.15
                );
            }, numNotes * noteGap);
        }
    }

    // Hint - magical sparkle (ascending high notes with triangle wave)
    playHint() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;
        var sparkleNotes = [1318.5, 1568.0, 1760.0, 2093.0, 2637.0]; // E6, G6, A6, C7, E7

        for (var i = 0; i < sparkleNotes.length; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    var now = self.ctx.currentTime;

                    var osc = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = sparkleNotes[idx];
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
                    osc.connect(gain);
                    gain.connect(self.sfxGain);
                    osc.start(now);
                    osc.stop(now + 0.25);

                    // Slight detuned copy for shimmer
                    var osc2 = self.ctx.createOscillator();
                    var gain2 = self.ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.value = sparkleNotes[idx] * 1.005;
                    gain2.gain.setValueAtTime(0.10, now);
                    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
                    osc2.connect(gain2);
                    gain2.connect(self.sfxGain);
                    osc2.start(now);
                    osc2.stop(now + 0.3);
                }, idx * 65);
            })(i);
        }
    }

    // Pause - soft whoosh down
    playPause() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;

        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);

        // Breathy noise layer
        var osc2 = this.ctx.createOscillator();
        var gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain2.gain.setValueAtTime(0.08, now);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.35);
    }

    // Resume - soft whoosh up
    playResume() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;

        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);

        var osc2 = this.ctx.createOscillator();
        var gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(150, now);
        osc2.frequency.exponentialRampToValueAtTime(700, now + 0.28);
        gain2.gain.setValueAtTime(0.03, now);
        gain2.gain.linearRampToValueAtTime(0.08, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.35);
    }

    // Achievement - grand 6-note fanfare with harmony
    playAchievement() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;

        // Triumphant 6-note melody: C5, E5, G5, C6, E6, G6
        var notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        var durations = [0.15, 0.15, 0.15, 0.2, 0.2, 0.5];
        var delays = [0, 0.12, 0.24, 0.40, 0.56, 0.72];

        for (var i = 0; i < notes.length; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    var now = self.ctx.currentTime;

                    // Main note (sine)
                    var osc1 = self.ctx.createOscillator();
                    var g1 = self.ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.value = notes[idx];
                    g1.gain.setValueAtTime(0.22, now);
                    g1.gain.exponentialRampToValueAtTime(0.01, now + durations[idx] + 0.1);
                    osc1.connect(g1);
                    g1.connect(self.sfxGain);
                    osc1.start(now);
                    osc1.stop(now + durations[idx] + 0.1);

                    // Harmony - a fifth below
                    var osc2 = self.ctx.createOscillator();
                    var g2 = self.ctx.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.value = notes[idx] * 0.667; // ~fifth below
                    g2.gain.setValueAtTime(0.10, now);
                    g2.gain.exponentialRampToValueAtTime(0.005, now + durations[idx] + 0.1);
                    osc2.connect(g2);
                    g2.connect(self.sfxGain);
                    osc2.start(now);
                    osc2.stop(now + durations[idx] + 0.1);
                }, delays[idx] * 1000);
            })(i);
        }

        // Final sustained chord
        var self2 = this;
        setTimeout(function() {
            self2._playChord([523.25, 659.25, 783.99, 1046.50], 0.8, 'sine', self2.sfxGain, 0.18);
        }, 900);
    }

    // Combo - escalating excitement based on combo count
    playCombo(count) {
        if (!this.ctx || !this.sfxEnabled) return;
        count = Math.max(1, Math.min(count || 1, 20));
        var self = this;

        // Base pitch rises with combo
        var basePitch = 500 + (count * 40);
        // More notes as combo grows (2 to 6)
        var numNotes = Math.min(2 + Math.floor(count / 2), 6);
        // Faster tempo at higher combos
        var gap = Math.max(30, 70 - count * 4);

        for (var i = 0; i < numNotes; i++) {
            (function(idx) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    var freq = basePitch * Math.pow(1.15, idx);
                    var now = self.ctx.currentTime;

                    var osc = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc.type = (count >= 8) ? 'triangle' : 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    osc.connect(gain);
                    gain.connect(self.sfxGain);
                    osc.start(now);
                    osc.stop(now + 0.12);
                }, idx * gap);
            })(i);
        }

        // Big combos get a burst chord at the end
        if (count >= 5) {
            setTimeout(function() {
                var chord = [basePitch, basePitch * 1.25, basePitch * 1.5];
                if (count >= 10) chord.push(basePitch * 2);
                self._playChord(chord, 0.25, 'sine', self.sfxGain, 0.12);
            }, numNotes * gap + 20);
        }
    }

    // PowerUp - magical activation (chord + sweep)
    playPowerUp() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;

        // Rising sweep
        var sweep = this.ctx.createOscillator();
        var sweepGain = this.ctx.createGain();
        sweep.type = 'sine';
        sweep.frequency.setValueAtTime(300, now);
        sweep.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
        sweepGain.gain.setValueAtTime(0.15, now);
        sweepGain.gain.setValueAtTime(0.18, now + 0.15);
        sweepGain.gain.exponentialRampToValueAtTime(0.005, now + 0.5);
        sweep.connect(sweepGain);
        sweepGain.connect(this.sfxGain);
        sweep.start(now);
        sweep.stop(now + 0.5);

        // Shimmer sweep (triangle, slightly detuned)
        var shim = this.ctx.createOscillator();
        var shimGain = this.ctx.createGain();
        shim.type = 'triangle';
        shim.frequency.setValueAtTime(310, now);
        shim.frequency.exponentialRampToValueAtTime(1250, now + 0.35);
        shimGain.gain.setValueAtTime(0.08, now);
        shimGain.gain.exponentialRampToValueAtTime(0.005, now + 0.5);
        shim.connect(shimGain);
        shimGain.connect(this.sfxGain);
        shim.start(now);
        shim.stop(now + 0.5);

        // Chord burst at the top of the sweep
        var self = this;
        setTimeout(function() {
            self._playChord([783.99, 987.77, 1174.66, 1567.98], 0.4, 'sine', self.sfxGain, 0.15);
        }, 320);
    }

    // Countdown tick when timer < 5 seconds
    playCountdown() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;

        // Sharp tick
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.06);

        // Sub-tick resonance
        var osc2 = this.ctx.createOscillator();
        var gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 600;
        gain2.gain.setValueAtTime(0.1, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.1);
    }

    // Level start - "Ready go!" ascending three notes
    playLevelStart() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;

        // Three ascending notes: G4, C5, E5 (like "rea-dy-GO!")
        var notes = [
            { freq: 392.00, dur: 0.2,  delay: 0,    type: 'sine' },    // G4 - "rea"
            { freq: 523.25, dur: 0.2,  delay: 0.25, type: 'sine' },    // C5 - "dy"
            { freq: 659.25, dur: 0.35, delay: 0.50, type: 'triangle' } // E5 - "GO!"
        ];

        for (var i = 0; i < notes.length; i++) {
            (function(n) {
                setTimeout(function() {
                    if (!self.ctx || !self.sfxEnabled) return;
                    var now = self.ctx.currentTime;

                    var osc = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc.type = n.type;
                    osc.frequency.value = n.freq;
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + n.dur);
                    osc.connect(gain);
                    gain.connect(self.sfxGain);
                    osc.start(now);
                    osc.stop(now + n.dur);

                    // Last note gets harmony
                    if (n.freq === 659.25) {
                        var osc2 = self.ctx.createOscillator();
                        var gain2 = self.ctx.createGain();
                        osc2.type = 'sine';
                        osc2.frequency.value = 523.25; // C5 harmony
                        gain2.gain.setValueAtTime(0.12, now);
                        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
                        osc2.connect(gain2);
                        gain2.connect(self.sfxGain);
                        osc2.start(now);
                        osc2.stop(now + 0.35);
                    }
                }, n.delay * 1000);
            })(notes[i]);
        }
    }

    // Daily reward jingle - magical ascending with sparkle
    playDailyReward() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;
        var notes = [
            { freq: 523.25, dur: 0.2, delay: 0 },     // C5
            { freq: 659.25, dur: 0.2, delay: 0.15 },   // E5
            { freq: 783.99, dur: 0.2, delay: 0.3 },    // G5
            { freq: 1046.5, dur: 0.4, delay: 0.45 },   // C6
            { freq: 1318.5, dur: 0.5, delay: 0.6 }     // E6
        ];
        var self = this;
        notes.forEach(function(n) {
            setTimeout(function() {
                var osc = self.ctx.createOscillator();
                var gain = self.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = n.freq;
                gain.gain.setValueAtTime(0.25, self.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, self.ctx.currentTime + n.dur);
                osc.connect(gain);
                gain.connect(self.sfxGain);
                osc.start(self.ctx.currentTime);
                osc.stop(self.ctx.currentTime + n.dur);
            }, n.delay * 1000);
        });
    }

    // Sticker collect sound - sparkle chime
    playStickerCollect() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;
        var freqs = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6
        var self = this;
        freqs.forEach(function(f, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            var t = now + i * 0.08;
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.connect(gain);
            gain.connect(self.sfxGain);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    }

    // VS AI - player wins round: triumphant quick blast
    playVsAiPlayerWin() {
        if (!this.ctx || !this.sfxEnabled) return;
        var self = this;
        var notes = [659.25, 783.99, 1046.50]; // E5, G5, C6
        notes.forEach(function(f, i) {
            setTimeout(function() {
                self.playNote(f, 0.2, 'sine');
                self.playNote(f * 1.5, 0.15, 'triangle');
            }, i * 80);
        });
    }

    // VS AI - AI wins round: tension/urgency
    playVsAiAiWin() {
        if (!this.ctx || !this.sfxEnabled) return;
        var now = this.ctx.currentTime;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // VS AI - match won: big celebration
    playVsAiVictory() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.playFanfare();
    }

    // Navigation tick sound - subtle click for TV remote navigation
    playNavTick() {
        if (!this.ctx || !this.sfxEnabled) return;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        var now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // ========================================
    //  Zone-Themed Music System
    // ========================================

    // Get melody data for a specific zone
    _getZoneMelody(zone) {
        // Each zone returns: { notes, durations, waveType, tempo, bassNotes, bassDurations, bassWave }
        // Frequencies use standard tuning

        switch (zone) {
            case 'beach':
                // Cheerful tropical melody in C major, upbeat
                return {
                    notes: [
                        523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 880.00, 783.99,
                        698.46, 659.25, 587.33, 523.25, 587.33, 659.25, 523.25, 493.88
                    ],
                    durations: [
                        0.25, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.5,
                        0.25, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25
                    ],
                    waveType: 'sine',
                    volume: 0.14,
                    bass: [
                        261.63, null, 261.63, null, 349.23, null, 349.23, null,
                        293.66, null, 293.66, null, 261.63, null, 246.94, null
                    ],
                    bassDurations: [
                        0.5, 0.25, 0.25, 0.5, 0.5, 0.25, 0.25, 0.5,
                        0.5, 0.25, 0.25, 0.5, 0.5, 0.25, 0.5, 0.25
                    ],
                    bassWave: 'triangle',
                    bassVolume: 0.08
                };

            case 'jungle':
                // Mysterious rhythmic melody in A minor, syncopated
                return {
                    notes: [
                        440.00, 523.25, 493.88, 440.00, 392.00, 440.00, 523.25, 587.33,
                        523.25, 493.88, 440.00, 392.00, 349.23, 392.00, 440.00, 392.00
                    ],
                    durations: [
                        0.2, 0.15, 0.3, 0.2, 0.35, 0.15, 0.2, 0.15,
                        0.3, 0.15, 0.2, 0.35, 0.2, 0.15, 0.3, 0.35
                    ],
                    waveType: 'triangle',
                    volume: 0.13,
                    bass: [
                        220.00, null, 220.00, 261.63, null, 220.00, null, 233.08,
                        null, 220.00, null, 196.00, null, 196.00, 220.00, null
                    ],
                    bassDurations: [
                        0.35, 0.15, 0.35, 0.2, 0.35, 0.2, 0.15, 0.3,
                        0.15, 0.3, 0.2, 0.35, 0.15, 0.35, 0.3, 0.35
                    ],
                    bassWave: 'square',
                    bassVolume: 0.04
                };

            case 'cave':
                // Ethereal, echoey melody in E minor, slow with reverb-like delays
                return {
                    notes: [
                        329.63, 392.00, 369.99, 329.63, 293.66, 329.63, 392.00, 440.00,
                        392.00, 369.99, 329.63, 293.66, 261.63, 293.66, 329.63, 293.66
                    ],
                    durations: [
                        0.6, 0.5, 0.6, 0.5, 0.7, 0.5, 0.6, 0.5,
                        0.6, 0.5, 0.6, 0.5, 0.7, 0.5, 0.6, 0.6
                    ],
                    waveType: 'sine',
                    volume: 0.11,
                    useDelay: true,
                    delayTime: 0.35,
                    delayRepeats: 3,
                    bass: [
                        164.81, null, null, 164.81, null, null, 196.00, null,
                        null, 196.00, null, null, 130.81, null, null, 146.83
                    ],
                    bassDurations: [
                        0.9, 0.5, 0.6, 0.9, 0.5, 0.7, 0.9, 0.5,
                        0.6, 0.9, 0.5, 0.6, 0.9, 0.5, 0.6, 0.6
                    ],
                    bassWave: 'sine',
                    bassVolume: 0.06
                };

            case 'volcano':
                // Intense, driving melody in D minor, faster tempo
                return {
                    notes: [
                        587.33, 698.46, 659.25, 587.33, 523.25, 587.33, 698.46, 783.99,
                        698.46, 659.25, 587.33, 554.37, 523.25, 554.37, 587.33, 659.25
                    ],
                    durations: [
                        0.15, 0.15, 0.2, 0.15, 0.2, 0.15, 0.15, 0.2,
                        0.15, 0.15, 0.2, 0.15, 0.2, 0.15, 0.2, 0.2
                    ],
                    waveType: 'sawtooth',
                    volume: 0.07,
                    bass: [
                        293.66, 293.66, null, 293.66, null, 293.66, 293.66, null,
                        349.23, 349.23, null, 349.23, null, 261.63, 261.63, null
                    ],
                    bassDurations: [
                        0.15, 0.15, 0.2, 0.15, 0.2, 0.15, 0.15, 0.2,
                        0.15, 0.15, 0.2, 0.15, 0.2, 0.15, 0.2, 0.2
                    ],
                    bassWave: 'triangle',
                    bassVolume: 0.06
                };

            case 'sky':
                // Light, airy melody in G major, flowing
                return {
                    notes: [
                        783.99, 880.00, 987.77, 880.00, 783.99, 659.25, 783.99, 880.00,
                        987.77, 1046.50, 987.77, 880.00, 783.99, 880.00, 783.99, 659.25
                    ],
                    durations: [
                        0.35, 0.25, 0.35, 0.25, 0.35, 0.3, 0.35, 0.25,
                        0.35, 0.25, 0.35, 0.25, 0.35, 0.3, 0.35, 0.35
                    ],
                    waveType: 'sine',
                    volume: 0.12,
                    bass: [
                        392.00, null, 392.00, null, 329.63, null, 392.00, null,
                        440.00, null, 440.00, null, 392.00, null, 329.63, null
                    ],
                    bassDurations: [
                        0.6, 0.25, 0.6, 0.25, 0.65, 0.3, 0.6, 0.25,
                        0.6, 0.25, 0.6, 0.25, 0.65, 0.3, 0.6, 0.35
                    ],
                    bassWave: 'sine',
                    bassVolume: 0.06
                };

            case 'space':
                // Ambient, cosmic - Cmaj7 arpeggios, slow and dreamy
                return {
                    notes: [
                        261.63, 329.63, 392.00, 493.88, 523.25, 493.88, 392.00, 329.63,
                        349.23, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00, 329.63
                    ],
                    durations: [
                        0.5, 0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5,
                        0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5, 0.6
                    ],
                    waveType: 'sine',
                    volume: 0.10,
                    useDelay: true,
                    delayTime: 0.4,
                    delayRepeats: 2,
                    bass: [
                        130.81, null, null, null, 130.81, null, null, null,
                        174.61, null, null, null, 164.81, null, null, null
                    ],
                    bassDurations: [
                        0.5, 0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5,
                        0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5, 0.6
                    ],
                    bassWave: 'sine',
                    bassVolume: 0.05
                };

            case 'menu':
            default:
                // Cheerful menu melody in C major
                return {
                    notes: [
                        523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 523.25, 659.25,
                        783.99, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 523.25
                    ],
                    durations: [
                        0.3, 0.3, 0.3, 0.3, 0.3, 0.15, 0.15, 0.3,
                        0.3, 0.3, 0.3, 0.3, 0.15, 0.15, 0.3, 0.3
                    ],
                    waveType: 'sine',
                    volume: 0.12,
                    bass: [
                        261.63, null, 329.63, null, 261.63, null, null, 329.63,
                        392.00, null, 349.23, null, 246.94, null, 293.66, null
                    ],
                    bassDurations: [
                        0.6, 0.3, 0.6, 0.3, 0.45, 0.15, 0.15, 0.6,
                        0.6, 0.3, 0.6, 0.3, 0.3, 0.15, 0.6, 0.3
                    ],
                    bassWave: 'triangle',
                    bassVolume: 0.06
                };
        }
    }

    // Start music for a specific zone (defaults to menu if no zone given)
    startMusic(zone) {
        if (!this.ctx || !this.musicEnabled) return;

        zone = zone || 'menu';

        // If already playing the same zone, do nothing
        if (this.isPlayingMusic && this.currentZone === zone) return;

        // Stop any current music before starting new zone
        if (this.isPlayingMusic) {
            this.stopMusic();
        }

        this.currentZone = zone;
        this.isPlayingMusic = true;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.isPlayingMusic || !this.musicEnabled || !this.ctx) return;

        var melodyData = this._getZoneMelody(this.currentZone);
        var notes = melodyData.notes;
        var durations = melodyData.durations;
        var waveType = melodyData.waveType;
        var volume = melodyData.volume;
        var bass = melodyData.bass;
        var bassDurations = melodyData.bassDurations;
        var bassWave = melodyData.bassWave;
        var bassVolume = melodyData.bassVolume;
        var useDelay = melodyData.useDelay || false;
        var delayTime = melodyData.delayTime || 0;
        var delayRepeats = melodyData.delayRepeats || 0;

        var self = this;
        var currentZoneAtStart = this.currentZone;
        var t = this.ctx.currentTime + 0.05; // Small offset for scheduling
        var totalDuration = 0;

        // Schedule melody notes
        for (var i = 0; i < notes.length; i++) {
            if (notes[i]) {
                if (useDelay) {
                    // Schedule with delay echoes for cave/space
                    for (var r = 0; r <= delayRepeats; r++) {
                        var echoVol = volume * Math.pow(0.4, r);
                        if (echoVol < 0.005) break;
                        this._schedNote(
                            notes[i],
                            t + totalDuration + r * delayTime,
                            durations[i] * 0.9,
                            waveType,
                            echoVol,
                            this.musicGain
                        );
                    }
                } else {
                    this._schedNote(
                        notes[i],
                        t + totalDuration,
                        durations[i] * 0.9,
                        waveType,
                        volume,
                        this.musicGain
                    );
                }
            }
            totalDuration += durations[i];
        }

        // Schedule bass line
        var bassDuration = 0;
        for (var j = 0; j < bass.length; j++) {
            if (bass[j]) {
                this._schedNote(
                    bass[j],
                    t + bassDuration,
                    bassDurations[j] * 0.85,
                    bassWave,
                    bassVolume,
                    this.musicGain
                );
            }
            bassDuration += bassDurations[j];
        }

        // Use the longer of melody or bass duration for loop timing
        var loopDuration = Math.max(totalDuration, bassDuration);

        // Schedule the next loop
        var loopMs = loopDuration * 1000;
        var timeout = setTimeout(function() {
            // Only continue if we are still playing the same zone
            if (self.isPlayingMusic && self.currentZone === currentZoneAtStart) {
                self._playMusicLoop();
            }
        }, loopMs);

        this.musicTimeouts.push(timeout);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        this.currentZone = null;

        // Clear all pending music loop timeouts
        for (var i = 0; i < this.musicTimeouts.length; i++) {
            clearTimeout(this.musicTimeouts[i]);
        }
        this.musicTimeouts = [];

        // Fade out the music gain quickly to avoid abrupt cutoff
        if (this.musicGain && this.ctx) {
            try {
                this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
                this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);

                // Restore gain after fade
                var self = this;
                setTimeout(function() {
                    if (self.musicGain && self.ctx) {
                        self.musicGain.gain.setValueAtTime(0.3, self.ctx.currentTime);
                    }
                }, 200);
            } catch (e) {
                // Silently handle if audio context is in a bad state
                this.musicGain.gain.value = 0.3;
            }
        }
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
            this.startMusic(this.currentZone);
        }
        return this.musicEnabled;
    }
}

const audio = new AudioManager();
